const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// 1. Initialize Firebase Admin SDK using your service account key
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

try {
  // 2. Read and parse the structured database schema
  const rawData = fs.readFileSync('firebase-nosql-schema.json', 'utf8');
  const schema = JSON.parse(rawData);

  // Safely extract the collections map from the NoSQL architecture
  const collections = schema.firebase_nosql_architecture.collections;

  async function seedDatabase() {
    console.log("🛰️ Accessing Cloud Firestore and preparing database seed...");

    // ==========================================
    // SEED 1: "nodes" Collection & nested "telemetry"
    // ==========================================
    if (collections.nodes) {
      const nodeData = collections.nodes.mock_document_example;
      const nodeId = nodeData.node_id; // "NODE-001"

      // Write the main node metadata
      await db.collection('nodes').doc(nodeId).set({
        node_id: nodeData.node_id,
        last_update: new Date(nodeData.last_update),
        battery_voltage: nodeData.battery_voltage,
        signal_strength_rssi: nodeData.signal_strength_rssi,
        location: nodeData.location,
        calibration_offsets: nodeData.calibration_offsets
      });
      console.log(`✅ Seeded Root Collection: nodes -> Document: ${nodeId}`);

      // Write the nested telemetry subcollection
      if (collections.nodes.subcollections && collections.nodes.subcollections.telemetry) {
        const telemetryData = collections.nodes.subcollections.telemetry.mock_document_example;
        
        await db.collection('nodes')
                .doc(nodeId)
                .collection('telemetry')
                .add({
                  timestamp: new Date(telemetryData.timestamp),
                  soil_moisture: telemetryData.soil_moisture,
                  soil_temperature: telemetryData.soil_temperature,
                  soil_ph: telemetryData.soil_ph,
                  carbon_dioxide: telemetryData.carbon_dioxide,
                  nutrients_npk: telemetryData.nutrients_npk
                });
        console.log(`   └─ ✅ Seeded Subcollection: telemetry`);
      }
    }

    // ==========================================
    // SEED 2: "actuators" Collection & nested "actuation_logs"
    // ==========================================
    if (collections.actuators) {
      const actuatorData = collections.actuators.mock_document_example;
      const actuatorId = actuatorData.actuator_id; // "ACT-001"

      await db.collection('actuators').doc(actuatorId).set({
        actuator_id: actuatorData.actuator_id,
        type: actuatorData.type,
        location_hub: actuatorData.location_hub,
        target_node: actuatorData.target_node,
        current_state: actuatorData.current_state,
        control_override_active: actuatorData.control_override_active,
        fuzzy_outputs: actuatorData.fuzzy_outputs
      });
      console.log(`✅ Seeded Root Collection: actuators -> Document: ${actuatorId}`);

      // Write nested actuation logs
      if (collections.actuators.subcollections && collections.actuators.subcollections.actuation_logs) {
        const logData = collections.actuators.subcollections.actuation_logs.mock_document_example;
        const logId = logData.log_id; // "LOG_984729104"

        await db.collection('actuators')
                .doc(actuatorId)
                .collection('actuation_logs')
                .doc(logId)
                .set({
                  log_id: logData.log_id,
                  timestamp: new Date(logData.timestamp),
                  duration_seconds: logData.duration_seconds,
                  triggered_by: logData.triggered_by,
                  execution_parameters: logData.execution_parameters
                });
        console.log(`   └─ ✅ Seeded Subcollection: actuation_logs -> Document: ${logId}`);
      }
    }

    // ==========================================
    // SEED 3: "system_alerts" Collection
    // ==========================================
    if (collections.system_alerts) {
      const alertData = collections.system_alerts.mock_document_example;
      const alertId = alertData.alert_id; // "ALT_382910"

      await db.collection('system_alerts').doc(alertId).set({
        alert_id: alertData.alert_id,
        timestamp: new Date(alertData.timestamp),
        source_id: alertData.source_id,
        severity_tier: alertData.severity_tier,
        alert_message: alertData.alert_message,
        is_resolved: alertData.is_resolved
      });
      console.log(`✅ Seeded Root Collection: system_alerts -> Document: ${alertId}`);
    }

    console.log("\n🚀 Database successfully populated! All configurations verified.");
  }

  seedDatabase();

} catch (error) {
  console.error("❌ Error running seeding script:", error.message);
}