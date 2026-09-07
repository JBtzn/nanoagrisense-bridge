/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Initialize the Admin SDK inside the cloud environment
initializeApp();
const db = getFirestore();

/**
 * REST API Endpoint: POST /api/telemetry
 * Receives decoded sensor telemetry from the LoRaWAN gateway server
 */
exports.addTelemetry = onRequest({ cors: true }, async (req, res) => {
  // 1. Only allow HTTP POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Method Not Allowed. Use POST." 
    });
  }

  try {
    const payload = req.body;

    // 2. Schema Validation (Ensure critical keys exist)
    if (!payload.node_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing 'node_id' in payload." 
      });
    }
    if (!payload.decoded_payload) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing 'decoded_payload' object." 
      });
    }

    const { decoded_payload } = payload;

    // 3. Extract and sanitize parameters
    const telemetryData = {
      // Use Firebase ServerTimestamp to prevent local device clock errors
      timestamp: FieldValue.serverTimestamp(),
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

    // 4. Write data to nested subcollection: nodes/{nodeId}/telemetry
    const docRef = await db
      .collection("nodes")
      .doc(payload.node_id)
      .collection("telemetry")
      .add(telemetryData);

    console.log(`Successfully bridged telemetry for ${payload.node_id}. Doc ID: ${docRef.id}`);

    // 5. Send success response back to the LoRaWAN network server
    return res.status(201).json({
      success: true,
      message: "Telemetry structured and written successfully.",
      document_id: docRef.id
    });

  } catch (error) {
    console.error("API Bridge Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});