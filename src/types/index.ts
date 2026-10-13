export type CommandType = 'F' | 'B' | 'L' | 'R' | 'S' | 'AL' | 'AR' | 'D';

export type ActiveDirection = 'FORWARD' | 'REVERSE' | 'LEFT' | 'RIGHT' | 'STOP' | 'AUTO_PARK_LEFT' | 'AUTO_PARK_RIGHT';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type SafetyStatus = 'CLEAR' | 'CAUTION' | 'STOP_ZONE' | 'SENSOR_UNAVAILABLE';

export interface TelemetryData {
  frontDistance: number | null; // cm, null if unavailable
  rearDistance: number | null;  // cm, null if unavailable
  frontStatus: SafetyStatus;
  rearStatus: SafetyStatus;
  activeCommand: CommandType;
  latencyMs: number | null;
  lastUpdateTimestamp: number | null;
  uptimeSec: number | null;
  batteryVoltage: number | null; // V, null if no sensor
  batteryCurrent: number | null; // A, null if no sensor
  batteryPower: number | null;   // W, null if no sensor
  batteryEnergy: number | null;  // Wh, null if no sensor
  rssi: number | null;           // dBm, null if unavailable
}

export type CommandProtocol = 'REST_JSON' | 'QUERY_PARAM' | 'PATH_VERB';

export interface AppSettings {
  esp32BaseUrl: string;
  ssid: string;
  frontStopThreshold: number; // cm (default 20)
  rearStopThreshold: number;  // cm (default 15)
  keepAliveIntervalMs: number; // ms (default 120)
  telemetryPollIntervalMs: number; // ms (default 300)
  vibrationEnabled: boolean;
  speedPercentage: number;
  speedPreset: 'LOW' | 'MED' | 'HIGH';
  commandProtocol: CommandProtocol;
  statusEndpoint: string;
  commandEndpoint: string;
  distanceEndpoint: string;
  telemetryEndpoint: string;
  demoHarnessMode: boolean; // Bench Simulator for offline testing
}

export type LogLevel = 'INFO' | 'WARN' | 'DANGER' | 'SUCCESS';

export interface LogEvent {
  id: string;
  timestamp: number;
  type: 'COMMAND' | 'SAFETY' | 'NETWORK' | 'SYSTEM';
  message: string;
  level: LogLevel;
}

export interface DistanceHistoryPoint {
  time: string;
  front: number | null;
  rear: number | null;
}
