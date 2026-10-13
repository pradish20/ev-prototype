import React, { useState } from 'react';
import { AppSettings, ConnectionStatus } from '../types';
import { 
  Wifi, 
  Server, 
  Shield, 
  Code, 
  Smartphone, 
  Vibrate, 
  Clock, 
  Check, 
  Copy, 
  RotateCcw, 
  AlertCircle,
  Cpu
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  connectionStatus: ConnectionStatus;
  lastError: string | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDefaults: () => void;
  onTestConnection: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  connectionStatus,
  lastError,
  onUpdateSettings,
  onResetDefaults,
  onTestConnection,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'THRESHOLDS' | 'FIRMWARE'>('NETWORK');

  const esp32SampleCode = `// WATTNEXT EV COMMAND - ESP32 Complete Wi-Fi Firmware Template
// Board: ESP32 Dev Module / NodeMCU-32S
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "WATTNEXT_EV";
const char* password = ""; // Open AP or set WPA2 password
IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

WebServer server(80);

// Motor Pins (adjust to your H-Bridge L298N / TB6612FNG)
const int IN1 = 26, IN2 = 27, IN3 = 14, IN4 = 12;
// Ultrasonic Pins
const int TRIG_FRONT = 5, ECHO_FRONT = 18;
const int TRIG_REAR = 19, ECHO_REAR = 21;

// Fail-safe Watchdog Timer
unsigned long lastCommandTime = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 400; // Auto-stop if no keepalive!

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(TRIG_FRONT, OUTPUT); pinMode(ECHO_FRONT, INPUT);
  pinMode(TRIG_REAR, OUTPUT); pinMode(ECHO_REAR, INPUT);
  stopMotors();

  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(ssid, password);
  Serial.println("WATTNEXT_EV AP started at 192.168.4.1");

  // Enable CORS Headers for Web App
  server.enableCORS(true);

  // Routes
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/command", HTTP_POST, handleCommand);
  server.on("/distance", HTTP_GET, handleDistance);
  server.on("/cmd", HTTP_GET, handleQueryCommand); // fallback query param ?val=F
  server.begin();
}

void loop() {
  server.handleClient();
  // Fail-Safe: Stop motors if command keepalive drops!
  if (millis() - lastCommandTime > WATCHDOG_TIMEOUT_MS) {
    stopMotors();
  }
}

void stopMotors() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\\"status\\":\\"ONLINE\\",\\"battery\\":7.4,\\"uptime\\":" + String(millis()/1000) + "}");
}

void handleCommand() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (!server.hasArg("plain")) { server.send(400, "text/plain", "Body missing"); return; }
  StaticJsonDocument<128> doc;
  deserializeJson(doc, server.arg("plain"));
  const char* cmd = doc["command"];
  executeCommand(cmd);
  server.send(200, "application/json", "{\\"success\\":true}");
}

void handleQueryCommand() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("val")) {
    executeCommand(server.arg("val").c_str());
    server.send(200, "application/json", "{\\"success\\":true}");
  } else { server.send(400, "text/plain", "Missing val"); }
}

void executeCommand(const char* cmd) {
  lastCommandTime = millis();
  if (strcmp(cmd, "F") == 0) {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  } else if (strcmp(cmd, "B") == 0) {
    digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH); digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
  } else if (strcmp(cmd, "L") == 0) {
    digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH); digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  } else if (strcmp(cmd, "R") == 0) {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
  } else {
    stopMotors();
  }
}

float readDistance(int trig, int echo) {
  digitalWrite(trig, LOW); delayMicroseconds(2);
  digitalWrite(trig, HIGH); delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long dur = pulseIn(echo, HIGH, 25000);
  if (dur == 0) return -1.0;
  return dur * 0.034 / 2.0;
}

void handleDistance() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  float f = readDistance(TRIG_FRONT, ECHO_FRONT);
  float r = readDistance(TRIG_REAR, ECHO_REAR);
  String json = "{\\"front\\":" + String(f) + ",\\"rear\\":" + String(r) + "}";
  server.send(200, "application/json", json);
}`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(esp32SampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 pb-8">
      
      {/* Sub-tabs header */}
      <div className="flex items-center gap-2 p-1 bg-[#111720] rounded-xl border border-[#1E293B]">
        <button
          onClick={() => setActiveTab('NETWORK')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-racing font-bold tracking-wider transition-colors uppercase ${
            activeTab === 'NETWORK'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20'
              : 'text-[#929BA8] hover:text-white'
          }`}
        >
          NETWORK & API
        </button>
        <button
          onClick={() => setActiveTab('THRESHOLDS')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-racing font-bold tracking-wider transition-colors uppercase ${
            activeTab === 'THRESHOLDS'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20'
              : 'text-[#929BA8] hover:text-white'
          }`}
        >
          SAFETY & TIMINGS
        </button>
        <button
          onClick={() => setActiveTab('FIRMWARE')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-racing font-bold tracking-wider transition-colors uppercase ${
            activeTab === 'FIRMWARE'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20'
              : 'text-[#929BA8] hover:text-white'
          }`}
        >
          ESP32 FIRMWARE SPEC
        </button>
      </div>

      {/* ================= TAB 1: NETWORK & API ================= */}
      {activeTab === 'NETWORK' && (
        <div className="flex flex-col gap-4">
          
          {/* Quick Wi-Fi Connection Guide */}
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-[#FF5A1F]" />
              <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
                ANDROID / iOS WI-FI CONNECTIVITY GUIDE
              </h3>
            </div>
            
            <div className="space-y-2.5 text-xs font-telemetry text-[#929BA8]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#19212C] text-white font-bold flex items-center justify-center shrink-0 border border-[#2D3748]">
                  1
                </span>
                <p>
                  Open phone Wi-Fi settings and connect to SSID: <strong className="text-white">{settings.ssid}</strong> (default password is blank or as set on ESP32).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#19212C] text-white font-bold flex items-center justify-center shrink-0 border border-[#2D3748]">
                  2
                </span>
                <p>
                  <strong className="text-[#FFB020]">Crucial Android step:</strong> When your phone notifies <em>"Wi-Fi has no internet access"</em>, tap the notification and choose <strong className="text-white">"Stay connected" / "Yes"</strong>. Otherwise Android automatically disables the local Wi-Fi link.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#19212C] text-white font-bold flex items-center justify-center shrink-0 border border-[#2D3748]">
                  3
                </span>
                <p>
                  Return to this app and tap <strong className="text-[#FF5A1F]">CONNECT</strong> in the top header.
                </p>
              </div>
            </div>
          </div>

          {/* ESP32 IP & Protocol Configuration */}
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#FF5A1F]" />
                <h3 className="font-racing text-base tracking-wider text-white uppercase">
                  ESP32 SERVER ADDRESS & PROTOCOL
                </h3>
              </div>
              <button
                onClick={onTestConnection}
                className="py-1 px-2.5 rounded-lg text-xs font-telemetry font-semibold bg-[#19212C] border border-[#2D3748] text-white hover:border-[#FF5A1F] transition-colors"
              >
                PING / TEST
              </button>
            </div>

            {/* Base URL */}
            <div>
              <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                ESP32 BASE URL (DEFAULT: http://192.168.4.1)
              </label>
              <input
                type="text"
                value={settings.esp32BaseUrl}
                onChange={(e) => onUpdateSettings({ esp32BaseUrl: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#080B10] border border-[#2D3748] text-white font-telemetry text-sm focus:border-[#FF5A1F] focus:outline-none"
                placeholder="http://192.168.4.1"
              />
            </div>

            {/* Protocol format */}
            <div>
              <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                COMMAND DISPATCH PROTOCOL
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateSettings({ commandProtocol: 'REST_JSON' })}
                  className={`py-2 px-3 rounded-lg text-xs font-telemetry font-bold border transition-colors ${
                    settings.commandProtocol === 'REST_JSON'
                      ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border-[#FF5A1F]'
                      : 'bg-[#19212C] text-[#929BA8] border-[#2D3748]'
                  }`}
                >
                  REST POST JSON
                  <span className="block text-[10px] font-normal text-[#929BA8] mt-0.5">POST /command</span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ commandProtocol: 'QUERY_PARAM' })}
                  className={`py-2 px-3 rounded-lg text-xs font-telemetry font-bold border transition-colors ${
                    settings.commandProtocol === 'QUERY_PARAM'
                      ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border-[#FF5A1F]'
                      : 'bg-[#19212C] text-[#929BA8] border-[#2D3748]'
                  }`}
                >
                  GET QUERY PARAM
                  <span className="block text-[10px] font-normal text-[#929BA8] mt-0.5">GET /cmd?val=F</span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ commandProtocol: 'PATH_VERB' })}
                  className={`py-2 px-3 rounded-lg text-xs font-telemetry font-bold border transition-colors ${
                    settings.commandProtocol === 'PATH_VERB'
                      ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border-[#FF5A1F]'
                      : 'bg-[#19212C] text-[#929BA8] border-[#2D3748]'
                  }`}
                >
                  DIRECT PATH
                  <span className="block text-[10px] font-normal text-[#929BA8] mt-0.5">POST /F</span>
                </button>
              </div>
            </div>

            {/* Custom Endpoints Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-telemetry text-[#929BA8] block mb-1">
                  STATUS ROUTE
                </label>
                <input
                  type="text"
                  value={settings.statusEndpoint}
                  onChange={(e) => onUpdateSettings({ statusEndpoint: e.target.value })}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#080B10] border border-[#2D3748] text-white font-telemetry text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-telemetry text-[#929BA8] block mb-1">
                  DISTANCE ROUTE
                </label>
                <input
                  type="text"
                  value={settings.distanceEndpoint}
                  onChange={(e) => onUpdateSettings({ distanceEndpoint: e.target.value })}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#080B10] border border-[#2D3748] text-white font-telemetry text-xs"
                />
              </div>
            </div>

            {/* Last Error banner */}
            {lastError && (
              <div className="p-3 rounded-xl bg-[#FF3B45]/15 border border-[#FF3B45]/40 flex items-start gap-2 text-xs font-telemetry text-[#FF6B72]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{lastError}</span>
              </div>
            )}

          </div>

          {/* Bench Simulator / Test Harness Toggle */}
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-[#36D982] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-racing text-base tracking-wider text-white uppercase">
                  BENCH TEST HARNESS / SIMULATOR MODE
                </h4>
                <p className="text-xs font-telemetry text-[#929BA8]">
                  Enables an offline ESP32 emulator for testing buttons, obstacle radar cones, and telemetry graphing when disconnected from the physical car.
                </p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ demoHarnessMode: !settings.demoHarnessMode })}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl font-telemetry text-xs font-bold transition-all border shrink-0 ${
                settings.demoHarnessMode
                  ? 'bg-[#36D982] text-black border-[#5EEAA0] shadow-md shadow-[#36D982]/20'
                  : 'bg-[#19212C] text-[#929BA8] border-[#2D3748] hover:text-white'
              }`}
            >
              {settings.demoHarnessMode ? 'SIMULATOR ON' : 'ENABLE SIM'}
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 2: THRESHOLDS & TIMINGS ================= */}
      {activeTab === 'THRESHOLDS' && (
        <div className="flex flex-col gap-4">
          
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-[#FF5A1F]" />
              <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
                ULTRASONIC SAFETY STOP THRESHOLDS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                  FRONT STOP THRESHOLD: <span className="text-white font-bold">{settings.frontStopThreshold} cm</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={settings.frontStopThreshold}
                  onChange={(e) => onUpdateSettings({ frontStopThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-[#19212C] rounded-lg appearance-none cursor-pointer accent-[#FF5A1F]"
                />
                <span className="text-[10px] font-telemetry text-[#929BA8]">Default: 20 cm</span>
              </div>

              <div>
                <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                  REAR STOP THRESHOLD: <span className="text-white font-bold">{settings.rearStopThreshold} cm</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={settings.rearStopThreshold}
                  onChange={(e) => onUpdateSettings({ rearStopThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-[#19212C] rounded-lg appearance-none cursor-pointer accent-[#FF5A1F]"
                />
                <span className="text-[10px] font-telemetry text-[#929BA8]">Default: 15 cm</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-[#36D982]" />
              <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
                NETWORK TIMINGS & RATE LIMITING
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                  KEEPALIVE HEARTBEAT: <span className="text-white font-bold">{settings.keepAliveIntervalMs} ms</span>
                </label>
                <input
                  type="range"
                  min="60"
                  max="250"
                  step="10"
                  value={settings.keepAliveIntervalMs}
                  onChange={(e) => onUpdateSettings({ keepAliveIntervalMs: Number(e.target.value) })}
                  className="w-full h-2 bg-[#19212C] rounded-lg appearance-none cursor-pointer accent-[#36D982]"
                />
                <span className="text-[10px] font-telemetry text-[#929BA8]">
                  Frequency during continuous hold: {(1000 / settings.keepAliveIntervalMs).toFixed(1)} Hz
                </span>
              </div>

              <div>
                <label className="text-xs font-telemetry text-[#929BA8] block mb-1">
                  TELEMETRY POLL INTERVAL: <span className="text-white font-bold">{settings.telemetryPollIntervalMs} ms</span>
                </label>
                <input
                  type="range"
                  min="150"
                  max="1000"
                  step="50"
                  value={settings.telemetryPollIntervalMs}
                  onChange={(e) => onUpdateSettings({ telemetryPollIntervalMs: Number(e.target.value) })}
                  className="w-full h-2 bg-[#19212C] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
                <span className="text-[10px] font-telemetry text-[#929BA8]">
                  Telemetry refresh rate: {(1000 / settings.telemetryPollIntervalMs).toFixed(1)} Hz
                </span>
              </div>
            </div>

            {/* Vibration haptic toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-[#FF5A1F]" />
                <span className="text-xs font-telemetry text-white">VIBRATION HAPTIC FEEDBACK</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                className={`py-1 px-3 rounded-lg text-xs font-telemetry font-bold border transition-colors ${
                  settings.vibrationEnabled
                    ? 'bg-[#36D982]/20 text-[#36D982] border-[#36D982]'
                    : 'bg-[#19212C] text-[#929BA8] border-[#2D3748]'
                }`}
              >
                {settings.vibrationEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#19212C] text-[#929BA8] hover:text-white border border-[#2D3748] text-xs font-telemetry transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET DEFAULT SETTINGS
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 3: FIRMWARE SPECIFICATION ================= */}
      {activeTab === 'FIRMWARE' && (
        <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-[#FF5A1F]" />
              <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
                COMPLETE ESP32 ARDUINO FIRMWARE (CORS + WATCHDOG)
              </h3>
            </div>
            <button
              onClick={copyCodeToClipboard}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-telemetry text-xs font-bold transition-all border border-[#FF7A45] shadow-sm shadow-[#FF5A1F]/30"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>

          <p className="text-xs font-telemetry text-[#929BA8] leading-relaxed">
            This ready-to-flash C++ sketch enables the ESP32 Wi-Fi SoftAP, establishes CORS headers, handles all REST and query endpoints, and runs a 400ms fail-safe watchdog timer that automatically halts the motors if Wi-Fi packets drop.
          </p>

          <pre className="p-3 bg-[#080B10] border border-[#1E293B] rounded-xl text-[11px] font-mono text-[#36D982] overflow-x-auto max-h-96">
            {esp32SampleCode}
          </pre>
        </div>
      )}

    </div>
  );
};
