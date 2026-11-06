# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Smallholder Farmers & Field Operators**: Need a clear, low-complexity, accessible dashboard on mobile web and desktop to quickly inspect real-time soil health, monitor power/battery status, and receive actionable alerts.
- **Academic & Thesis Evaluators / Agritech Researchers**: Require rigorous scientific telemetry (NPK, CO₂, soil moisture, pH, temperature), verification of Sugeno fuzzy logic autonomous actuation decisions, auditable valve/pump switching logs, and real-time sensor node diagnostics.

## Product Purpose

NanoAgriSense provides real-time telemetry monitoring and precision automated fertigation (irrigation and nanofertilizer/nutrient dosing) for agricultural research and field management. It eliminates manual guess-work and inefficient water/nutrient usage by coupling ESP32-based edge sensor nodes with a Sugeno Fuzzy Logic Controller to maintain optimal soil conditions.

Success means:
- Zero crop stress through timely autonomous irrigation and nutrient delivery.
- Reliable telemetry streaming from edge nodes to cloud Firestore with low latency and clear offline/dropout handling.
- Instant, unambiguous triage of critical alerts (e.g., moisture falling below thresholds, power failure, sensor disconnection).
- High transparency for thesis evaluation through structured telemetry tables, 24-hour trend visualizations, and historical actuation audit trails.

## Positioning

Unlike generic IoT dashboards or consumer smart-garden monitors, NanoAgriSense is engineered specifically for closed-loop precision agriculture combining multi-parameter soil sensing (CO₂, pH, VWC moisture %, NPK in mg/kg) with an intelligent Sugeno Fuzzy Logic expert control system driving multi-reservoir solenoid valves (water vs. NPK/silica nanofertilizer) and PWM pump actuators with manual operator override.

## Operating Context

- **Field Environment**: Outdoor and greenhouse agricultural plots (e.g., tomato test plots in Tarlac, mushroom and nanofertilizer experimental plots).
- **Physical Hardware**: Solar-powered ESP32 sensor nodes transmitting telemetry over LoRaWAN or Wi-Fi; solenoid valves selecting between Reservoir A (Water) and Reservoir B (NPK/Silica); PWM-controlled dosing pump; mixing chamber agitators.
- **Operator Context**: Accessed on field mobile devices under direct sunlight as well as desktop/laptop workstations in evaluation and research settings.

## Capabilities and Constraints

- **Live Sensor Telemetry**: Continuous streaming and tracking of Volumetric Water Content (%), Soil Temperature (°C), Soil pH (0–14 scale), CO₂ (ppm), and NPK macronutrients (Nitrogen, Phosphorus, Potassium in mg/kg).
- **Power & Connectivity Monitoring**: Node battery voltage tracking, solar charging status, and transmission intervals (real-time vs power-save modes).
- **Irrigation & Nutrient Control**: Solenoid valve routing (Reservoir A vs B) and pump speed calculation via Sugeno Fuzzy Logic, with instant manual toggle overrides.
- **Tiered Notification System**: Three-tier alert architecture (Critical Alerts, System Warnings, Operational Logs) paired with push notifications and in-app resolution actions.
- **Authentication**: Operator login via Firebase Phone Auth with 6-digit OTP verification.
- **Technical Architecture**: Vanilla HTML5/CSS3/JavaScript frontend with Firebase client SDK; Node.js/Express bridge (`nanoagrisense-bridge`); Cloud Firestore document-oriented NoSQL database with nested node telemetry and actuator log subcollections.

## Brand Commitments

- **Name**: NanoAgriSense
- **Visual Identity**: Professional agritech aesthetic rooted in natural earth and botanical greens (`--leaf`, `--moss`, `--sand`, `--ink`), high contrast data visualization, and utilitarian readability.
- **Voice**: Factual, precise, mission-critical, and reassuring without fluff or generic SaaS filler.

## Evidence on Hand

- **Frontend Codebase**: Complete vanilla web app under `front-end/UPDATED NOTIF PANEL/` containing `index.html` (Soil Dashboard & Live Feed), `irrigation.html` (Control Center), `login.html` (Phone Auth), and corresponding CSS/JS modules.
- **Backend Bridge & Schema**: `backend/nanoagrisense-bridge` (Express server) and `backend/Database/FIREBASE SEEDER` containing `firebase-nosql-schema.json`, `seed.js`, and Firestore configuration.
- **Visual Assets**: Brand logo located at `front-end/UPDATED NOTIF PANEL/assets/logo.png`.

## Product Principles

1. **Clarity Over Clutter**: Agricultural operators need to know current soil status at a glance; critical alerts and status must be immediately distinguishable from routine operational logs.
2. **Transparent Autonomy**: When the Sugeno Fuzzy Controller actuates pumps or switches valves, the reasoning (inputs, calculated PWM duty cycle, and reservoir target) must be visible and easily overridden by operators.
3. **Resilience in the Field**: Gracefully communicate edge device connectivity drops, low battery warnings, and network latency without breaking the user experience.
4. **Data Rigor for Evaluation**: Telemetry, chart ranges, units (ppm, mg/kg, %, °C), and time-stamped actuation logs must satisfy technical academic scrutiny and scientific reproducibility.

## Accessibility & Inclusion

- High contrast text and semantic color coding (accessible critical, warning, and normal states) readable in high ambient outdoor light.
- Large, reliable tap targets on mobile devices for field workers wearing gloves or operating under outdoor conditions.
- Strict WCAG 2.1 AA compliant color contrast and semantic ARIA labeling for sensor tables and notification controls.
