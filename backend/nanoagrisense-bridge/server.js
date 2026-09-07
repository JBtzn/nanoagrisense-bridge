const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin || !admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const app = express();
app.use(express.json());
app.use(cors()); // I-enable kung kinakailangan ng React dashboard ninyo


// Enable Cross-Origin Resource Sharing (CORS) and JSON payload parsing
app.use(cors());
app.use(express.json());

// ==========================================
// Firebase Admin SDK Security Initialization
// ==========================================
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production Environment: Parse the credentials from Railway's environment variable
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("🔒 Firebase Admin initialized successfully using production environment variables.");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
    process.exit(1);
  }
} else {
  // Local Development: Fall back to your local downloaded key file
  try {
    serviceAccount = require('./serviceAccountKey.json');
    console.log("⚙️ Firebase Admin initialized successfully using local serviceAccountKey.json.");
  } catch (err) {
    console.error("❌ Error: Missing serviceAccountKey.json for local testing. See Step 4.");
    process.exit(1);
  }
}

initializeApp({
  credential: cert(serviceAccount)
});

// ==========================================
// REST API Bridge Endpoint: POST /api/telemetry
// ==========================================
app.post('/api/telemetry', async (req, res) => {
  try {
    const payload = req.body;

    // 1. Schema Validation
    if (!payload.node_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required 'node_id' field in payload root." 
      });
    }
    if (!payload.decoded_payload) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing 'decoded_payload' object containing telemetry metrics." 
      });
    }

    const { decoded_payload } = payload;

    // 2. Sanitize and Map Incoming Payload to Firestore Schema
    const telemetryData = {
      timestamp: FieldValue.serverTimestamp(), // Google Server-side timestamp
      soil_moisture: parseFloat(decoded_payload.soil_moisture),
      soil_temperature: parseFloat(decoded_payload.soil_temperature),
      soil_ph: parseFloat(decoded_payload.soil_ph),
      carbon_dioxide: parseFloat(decoded_payload.carbon_dioxide),
      nutrients_npk: {
        nitrogen_n: parseFloat(decoded_payload.nitrogen_n),
        phosphorus_p: parseFloat(decoded_payload.phosphorus_p),
        potassium_k: parseFloat(decoded_payload.potassium_k)
      }
    };

    // 3. Write securely to subcollection: nodes/{node_id}/telemetry
    const docRef = await db
      .collection('nodes')
      .doc(payload.node_id)
      .collection('telemetry')
      .add(telemetryData);

    console.log(`✅ Telemetry written for ${payload.node_id}. Doc ID: ${docRef.id}`);

    return res.status(201).json({
      success: true,
      message: "Telemetry structured and written successfully.",
      document_id: docRef.id
    });

  } catch (error) {
    console.error("❌ API Bridge Endpoint Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// =======================================================
// COMMANDS API: POST /api/actuators/override
// Triggers a manual override of water/nutrient pumps or agitators
// =======================================================
app.post('/api/actuators/override', authenticateUser, async (req, res) => {
  try {
    const { actuator_id, state, duration_seconds, pwm_duty_cycle } = req.body;

    // 1. Core Validations
    if (!actuator_id) {
      return res.status(400).json({ success: false, message: "Missing 'actuator_id'." });
    }
    if (state !== 'ON' && state !== 'OFF') {
      return res.status(400).json({ success: false, message: "State must be 'ON' or 'OFF'." });
    }

    // 2. Reference the Actuator Document in Firestore
    const actuatorRef = db.collection('actuators').doc(actuator_id);
    const doc = await actuatorRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Actuator not found." });
    }

    // 3. Update the Actuator Document State
    // Set control_override_active to true to suppress the Sugeno Fuzzy controller loops
    await actuatorRef.update({
      current_state: state,
      control_override_active: true,
      "fuzzy_outputs.sugeno_calculated_speed": state === 'ON' ? (pwm_duty_cycle || 100.0) : 0.0
    });

    // 4. Transactional Logging: Append to 'actuation_logs' subcollection
    const logData = {
      log_id: `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: FieldValue.serverTimestamp(),
      duration_seconds: duration_seconds ? parseInt(duration_seconds) : 0,
      triggered_by: 'Manual Override',
      execution_parameters: {
        pump_pwm_duty_cycle: state === 'ON' ? (pwm_duty_cycle || 255) : 0,
        dosed_volume_liters: state === 'ON' ? (duration_seconds ? (duration_seconds * 0.05) : 0.0) : 0.0 // Automated calibration fallback
      }
    };

    await actuatorRef.collection('actuation_logs').add(logData);

    console.log(`🔧 Manual Override executed for ${actuator_id} -> ${state} by operator ${req.user.email || req.user.phone_number}`);

    return res.status(200).json({
      success: true,
      message: `Manual override set to ${state} for ${actuator_id}. Transaction logged.`,
      log_details: logData
    });

  } catch (error) {
    console.error("❌ Commands API Override Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// =======================================================
// COMMANDS API: POST /api/actuators/release
// Releases manual override to return control to Sugeno Fuzzy Logic Auto Loops
// =======================================================
app.post('/api/actuators/release', authenticateUser, async (req, res) => {
  try {
    const { actuator_id } = req.body;

    if (!actuator_id) {
      return res.status(400).json({ success: false, message: "Missing 'actuator_id'." });
    }

    const actuatorRef = db.collection('actuators').doc(actuator_id);
    const doc = await actuatorRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Actuator not found." });
    }

    // Turn control_override_active off
    await actuatorRef.update({
      control_override_active: false
    });

    console.log(`🍃 Override released for ${actuator_id}. Sugeno Fuzzy Auto-Control resumed.`);

    return res.status(200).json({
      success: true,
      message: `Override released. Actuator ${actuator_id} is now under Sugeno Auto-Control.`
    });

  } catch (error) {
    console.error("❌ Commands API Release Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// =======================================================
// HARDWARE GATEWAY DOWNLINK: GET /api/actuators/commands
// Fetches active commands so the physical LoRa Gateway can pull and execute them
// =======================================================
app.get('/api/actuators/commands', async (req, res) => {
  try {
    const { target_node } = req.query; // e.g., ?target_node=NODE-001

    if (!target_node) {
      return res.status(400).json({ success: false, message: "Missing target_node." });
    }

    const snapshot = await db.collection('actuators')
                             .where('target_node', '==', target_node)
                             .get();

    const activeCommands = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      activeCommands.push({
        actuator_id: doc.id,
        type: data.type,
        current_state: data.current_state,
        control_override_active: data.control_override_active,
        pwm_speed: data.fuzzy_outputs?.sugeno_calculated_speed || 0
      });
    });

    return res.status(200).json({ success: true, actuators: activeCommands });
  } catch (error) {
    console.error("❌ GET Commands Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// Start Server (Railway automatically injects the PORT variable)
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛰️ Express Bridge Server listening on port ${PORT}`);
});

// =======================================================
// COMMANDS API: POST /api/actuators/override
// Triggers a manual override of water/nutrient pumps or agitators
// =======================================================
app.post('/api/actuators/override', async (req, res) => {
  try {
    const { actuator_id, state, duration_seconds, pwm_duty_cycle } = req.body;

    // 1. Core Validations
    if (!actuator_id) {
      return res.status(400).json({ success: false, message: "Missing 'actuator_id'." });
    }
    if (state !== 'ON' && state !== 'OFF') {
      return res.status(400).json({ success: false, message: "State must be 'ON' or 'OFF'." });
    }

    // 2. Reference the Actuator Document in Firestore
    const actuatorRef = db.collection('actuators').doc(actuator_id);
    const doc = await actuatorRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Actuator not found." });
    }

    // 3. Update the Actuator Document State
    // Set control_override_active to true to suppress the Sugeno Fuzzy controller loops
    await actuatorRef.update({
      current_state: state,
      control_override_active: true,
      "fuzzy_outputs.sugeno_calculated_speed": state === 'ON' ? (pwm_duty_cycle || 100.0) : 0.0
    });

    // 4. Transactional Logging: Append to 'actuation_logs' subcollection
    const logData = {
      log_id: `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: FieldValue.serverTimestamp(),
      duration_seconds: duration_seconds ? parseInt(duration_seconds) : 0,
      triggered_by: 'Manual Override',
      execution_parameters: {
        pump_pwm_duty_cycle: state === 'ON' ? (pwm_duty_cycle || 255) : 0,
        dosed_volume_liters: state === 'ON' ? (duration_seconds ? (duration_seconds * 0.05) : 0.0) : 0.0 // Mock dose calc
      }
    };

    await actuatorRef.collection('actuation_logs').add(logData);

    console.log(`🔧 Manual Override executed for ${actuator_id} -> ${state}`);

    return res.status(200).json({
      success: true,
      message: `Manual override set to ${state} for ${actuator_id}. Transaction logged.`,
      log_details: logData
    });

  } catch (error) {
    console.error("❌ Commands API Override Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// =======================================================
// COMMANDS API: POST /api/actuators/release
// Releases manual override to return control to Sugeno Fuzzy Logic Auto Loops
// =======================================================
app.post('/api/actuators/release', async (req, res) => {
  try {
    const { actuator_id } = req.body;

    if (!actuator_id) {
      return res.status(400).json({ success: false, message: "Missing 'actuator_id'." });
    }

    const actuatorRef = db.collection('actuators').doc(actuator_id);
    const doc = await actuatorRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Actuator not found." });
    }

    // Turn control_override_active off
    await actuatorRef.update({
      control_override_active: false
    });

    console.log(`🍃 Override released for ${actuator_id}. Sugeno Fuzzy Auto-Control resumed.`);

    return res.status(200).json({
      success: true,
      message: `Override released. Actuator ${actuator_id} is now under Sugeno Auto-Control.`
    });

  } catch (error) {
    console.error("❌ Commands API Release Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});