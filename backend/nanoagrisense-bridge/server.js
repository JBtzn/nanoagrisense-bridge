const express = require('express');
const cors = require('cors');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// Auth Middleware: verifies Firebase ID token
// Client must send: Authorization: Bearer <token>
// ==========================================
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token Verification Error:', error);
    return res.status(403).json({ success: false, error: 'Unauthorized: Invalid token.' });
  }
};

// ==========================================
// TELEMETRY THRESHOLD CHECK HELPER
// ==========================================
async function checkTelemetryThresholds(nodeId, payload) {
  try {
    const { moisture, pH } = payload;
    const alertsCollection = db.collection('system_alerts');

    // 1. Soil Moisture Check (< 40.0%) - Sugeno Lower Limit
    if (moisture !== undefined && moisture < 40.0) {
      const alertId = `ALT_MOIST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await alertsCollection.doc(alertId).set({
        alert_id: alertId,
        node_id: nodeId,
        type: 'CRITICAL',
        parameter: 'moisture',
        value: moisture,
        alert_message: `Critical: Soil moisture has dropped below Sugeno lower limit (${moisture}% < 40.0%) on Node ${nodeId}`,
        is_resolved: false,
        timestamp: FieldValue.serverTimestamp()
      });
      console.log(`⚠️ CRITICAL Alert generated for Node ${nodeId}: Moisture is low (${moisture}%)`);
    }

    // 2. Soil pH Check (< 5.5 Acidic or > 7.0 Alkaline)
    if (pH !== undefined) {
      if (pH < 5.5) {
        const alertId = `ALT_PH_LOW_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await alertsCollection.doc(alertId).set({
          alert_id: alertId,
          node_id: nodeId,
          type: 'WARNING',
          parameter: 'pH',
          value: pH,
          alert_message: `Acidic Soil Warning: Soil pH is too low (${pH} < 5.5) on Node ${nodeId}. Crops require buffering.`,
          is_resolved: false,
          timestamp: FieldValue.serverTimestamp()
        });
        console.log(`⚠️ WARNING Alert generated for Node ${nodeId}: Low pH (${pH})`);
      } else if (pH > 7.0) {
        const alertId = `ALT_PH_HIGH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await alertsCollection.doc(alertId).set({
          alert_id: alertId,
          node_id: nodeId,
          type: 'WARNING',
          parameter: 'pH',
          value: pH,
          alert_message: `Alkaline Soil Warning: Soil pH is too high (${pH} > 7.0) on Node ${nodeId}`,
          is_resolved: false,
          timestamp: FieldValue.serverTimestamp()
        });
        console.log(`⚠️ WARNING Alert generated for Node ${nodeId}: High pH (${pH})`);
      }
    }
  } catch (error) {
    console.error('❌ Error in checkTelemetryThresholds helper:', error);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. POST /api/telemetry - Ingest Modbus/RS485 sensor data from field nodes
app.post('/api/telemetry', async (req, res) => {
  try {
    const { node_id, telemetry_data } = req.body;
    if (!node_id || !telemetry_data) {
      return res.status(400).json({ success: false, error: 'Missing node_id or telemetry_data.' });
    }

    // Write telemetry log to Firestore
    await db.collection('telemetry').add({
      node_id,
      ...telemetry_data,
      timestamp: FieldValue.serverTimestamp()
    });

    // Automatically check thresholds and trigger alerts
    await checkTelemetryThresholds(node_id, telemetry_data);

    return res.status(200).json({ success: true, message: 'Telemetry logged and evaluated.' });
  } catch (error) {
    console.error('❌ Telemetry Ingestion Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/actuators/commands - Gateway downlink route for hardware polling
app.get('/api/actuators/commands', async (req, res) => {
  try {
    const targetNode = req.query.target_node || 'NODE-001';
    const snapshot = await db.collection('actuators').doc(targetNode).get();

    if (!snapshot.exists) {
      return res.status(404).json({ success: false, error: `No actuator profile found for ${targetNode}` });
    }

    return res.status(200).json({ success: true, node_id: targetNode, data: snapshot.data() });
  } catch (error) {
    console.error('❌ GET Commands Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/actuators/override - Manual override for pumps/agitators (Auth Protected)
app.post('/api/actuators/override', authenticateUser, async (req, res) => {
  try {
    const { node_id, actuator_type, state, duration_sec } = req.body;
    const operator = req.user?.email || req.user?.phone_number || 'Authorized Operator';

    await db.collection('actuators').doc(node_id || 'NODE-001').set({
      manual_override: true,
      override_by: operator,
      actuator_states: {
        [actuator_type]: state
      },
      override_duration: duration_sec || 300,
      updated_at: FieldValue.serverTimestamp()
    }, { merge: true });

    // Log the actuation event
    await db.collection('actuation_logs').add({
      node_id: node_id || 'NODE-001',
      actuator_type,
      action: 'MANUAL_OVERRIDE',
      state,
      triggered_by: operator,
      timestamp: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, message: `Manual override engaged for ${actuator_type}.` });
  } catch (error) {
    console.error('❌ Actuator Override Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST /api/actuators/release - Release manual override back to Sugeno auto mode (Auth Protected)
app.post('/api/actuators/release', authenticateUser, async (req, res) => {
  try {
    const { node_id } = req.body;
    const operator = req.user?.email || req.user?.phone_number || 'Authorized Operator';

    await db.collection('actuators').doc(node_id || 'NODE-001').set({
      manual_override: false,
      released_by: operator,
      updated_at: FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Control released back to Sugeno Auto Mode.' });
  } catch (error) {
    console.error('❌ Actuator Release Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. GET /api/alerts - Fetch active unresolved system alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const limitVal = parseInt(req.query.limit) || 20;
    const snapshot = await db.collection('system_alerts')
                             .where('is_resolved', '==', false)
                             .orderBy('timestamp', 'desc')
                             .limit(limitVal)
                             .get();

    const alerts = [];
    snapshot.forEach(doc => {
      alerts.push(doc.data());
    });

    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    console.error('❌ GET Alerts Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. PATCH /api/alerts/:alert_id/resolve - Mark a specific alert as resolved (Auth Protected)
app.patch('/api/alerts/:alert_id/resolve', authenticateUser, async (req, res) => {
  try {
    const { alert_id } = req.params;
    const operator = req.user?.email || req.user?.phone_number || 'Authorized Operator';

    const alertRef = db.collection('system_alerts').doc(alert_id);
    const doc = await alertRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    await alertRef.update({
      is_resolved: true,
      resolved_by: operator,
      resolved_at: FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      message: `Alert ${alert_id} has been marked as resolved.`
    });
  } catch (error) {
    console.error('❌ PATCH Resolve Alert Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('🌱 NanoAgriSense Bridge API is running.');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NanoAgriSense server running on port ${PORT}`);
});