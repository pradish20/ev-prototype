import { AppSettings, CommandType, SafetyStatus, TelemetryData } from '../types';

export interface CommandResult {
  success: boolean;
  command: CommandType;
  latencyMs: number;
  message?: string;
}

export class ESP32ApiService {
  private settings: AppSettings;
  private isSendingCommand = false;
  private activeHoldCommand: CommandType | null = null;
  private keepAliveTimer: number | null = null;
  private abortController: AbortController | null = null;

  // Bench simulator state (used ONLY when demoHarnessMode is enabled by the user)
  private simFrontDist = 45; // cm
  private simRearDist = 60; // cm
  private simMoving = false;
  private simSpeed = 0;
  private simDirection: CommandType = 'S';

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  public updateSettings(newSettings: AppSettings) {
    this.settings = newSettings;
  }

  /**
   * Test reachability of the ESP32 access point server
   */
  public async checkConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    if (this.settings.demoHarnessMode) {
      await new Promise(r => setTimeout(r, 40));
      return { connected: true, latencyMs: 24 };
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const targetUrl = `${this.settings.esp32BaseUrl}${this.settings.statusEndpoint}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        return { connected: true, latencyMs };
      } else {
        return {
          connected: false,
          latencyMs,
          error: `ESP32 returned HTTP status ${response.status} (${response.statusText})`
        };
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMsg = err instanceof Error ? err.message : String(err);

      let friendlyMsg = errorMsg;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        friendlyMsg = 'Cannot reach ESP32 at ' + this.settings.esp32BaseUrl + '. Ensure phone Wi-Fi is connected to SSID: ' + this.settings.ssid + ' and CORS is enabled on the ESP32 server.';
      } else if (errorMsg.includes('aborted')) {
        friendlyMsg = 'Connection timed out (2.5s). ESP32 server did not respond at ' + targetUrl;
      }

      return { connected: false, latencyMs, error: friendlyMsg };
    }
  }

  /**
   * Send a single driving or control command to the ESP32
   */
  public async sendCommand(command: CommandType): Promise<CommandResult> {
    const startTime = performance.now();

    // Bench simulator mode handling
    if (this.settings.demoHarnessMode) {
      this.handleSimCommand(command);
      return {
        success: true,
        command,
        latencyMs: Math.round(15 + Math.random() * 15),
      };
    }

    const baseUrl = this.settings.esp32BaseUrl.replace(/\/$/, '');
    let url = '';
    let method = 'POST';
    let body: string | undefined = undefined;

    switch (this.settings.commandProtocol) {
      case 'REST_JSON':
        url = `${baseUrl}${this.settings.commandEndpoint}`;
        method = 'POST';
        body = JSON.stringify({ command });
        break;
      case 'QUERY_PARAM':
        url = `${baseUrl}${this.settings.commandEndpoint}?val=${encodeURIComponent(command)}`;
        method = 'GET';
        break;
      case 'PATH_VERB':
        url = `${baseUrl}/${encodeURIComponent(command)}`;
        method = 'POST';
        break;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body,
        mode: 'cors',
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        return { success: true, command, latencyMs };
      } else {
        return {
          success: false,
          command,
          latencyMs,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - startTime);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        command,
        latencyMs,
        message: msg,
      };
    }
  }

  /**
   * Start press-and-hold keepalive loop for directional commands
   */
  public startHoldCommand(command: CommandType, onSent?: (result: CommandResult) => void) {
    if (this.activeHoldCommand === command) return;

    this.stopHoldCommand(); // stop any previous hold
    this.activeHoldCommand = command;

    // Send immediate first command
    this.isSendingCommand = true;
    this.sendCommand(command).then((res) => {
      this.isSendingCommand = false;
      onSent?.(res);
    });

    // Start keep-alive loop
    const interval = Math.max(50, this.settings.keepAliveIntervalMs);
    this.keepAliveTimer = window.setInterval(async () => {
      if (!this.activeHoldCommand || this.isSendingCommand) return;
      this.isSendingCommand = true;
      const res = await this.sendCommand(this.activeHoldCommand);
      this.isSendingCommand = false;
      onSent?.(res);
    }, interval);
  }

  /**
   * Stop press-and-hold and immediately dispatch STOP command ('S')
   */
  public stopHoldCommand(onSent?: (result: CommandResult) => void): Promise<CommandResult> {
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.activeHoldCommand = null;

    // Immediately send STOP 'S'
    return this.sendCommand('S').then((res) => {
      onSent?.(res);
      return res;
    });
  }

  /**
   * Emergency stop: clears all loops and forces stop
   */
  public async emergencyStop(): Promise<CommandResult> {
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.activeHoldCommand = null;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.settings.demoHarnessMode) {
      this.simMoving = false;
      this.simDirection = 'S';
    }

    return this.sendCommand('S');
  }

  public getActiveHoldCommand(): CommandType | null {
    return this.activeHoldCommand;
  }

  /**
   * Fetch live telemetry / distance readings from ESP32
   */
  public async fetchTelemetry(): Promise<{ telemetry: TelemetryData | null; error?: string }> {
    if (this.settings.demoHarnessMode) {
      return { telemetry: this.getSimTelemetry() };
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const baseUrl = this.settings.esp32BaseUrl.replace(/\/$/, '');
    const url = `${baseUrl}${this.settings.distanceEndpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          telemetry: null,
          error: `HTTP ${response.status} when fetching telemetry`,
        };
      }

      const json = await response.json();

      // Parse distance fields safely from ESP32 JSON schema:
      // Typically: { front: 42.5, rear: 80.0, uptime: 120, battery: 7.4 }
      // or { frontDistance: 42, rearDistance: 80 }
      const frontDist = typeof json.front === 'number'
        ? json.front
        : typeof json.frontDistance === 'number'
          ? json.frontDistance
          : null;

      const rearDist = typeof json.rear === 'number'
        ? json.rear
        : typeof json.rearDistance === 'number'
          ? json.rearDistance
          : null;

      const frontStatus = this.calculateSafetyStatus(frontDist, this.settings.frontStopThreshold);
      const rearStatus = this.calculateSafetyStatus(rearDist, this.settings.rearStopThreshold);

      const telemetry: TelemetryData = {
        frontDistance: frontDist,
        rearDistance: rearDist,
        frontStatus,
        rearStatus,
        activeCommand: this.activeHoldCommand || 'S',
        latencyMs,
        lastUpdateTimestamp: Date.now(),
        uptimeSec: typeof json.uptime === 'number' ? json.uptime : null,
        batteryVoltage: typeof json.batteryVoltage === 'number' ? json.batteryVoltage : (typeof json.battery === 'number' ? json.battery : null),
        batteryCurrent: typeof json.batteryCurrent === 'number' ? json.batteryCurrent : null,
        batteryPower: typeof json.batteryPower === 'number' ? json.batteryPower : null,
        batteryEnergy: typeof json.batteryEnergy === 'number' ? json.batteryEnergy : null,
        rssi: typeof json.rssi === 'number' ? json.rssi : null,
      };

      return { telemetry };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        telemetry: null,
        error: msg,
      };
    }
  }

  private calculateSafetyStatus(dist: number | null, stopThreshold: number): SafetyStatus {
    if (dist === null || dist < 0 || isNaN(dist)) {
      return 'SENSOR_UNAVAILABLE';
    }
    if (dist <= stopThreshold) {
      return 'STOP_ZONE';
    }
    if (dist <= stopThreshold * 1.8) {
      return 'CAUTION';
    }
    return 'CLEAR';
  }

  // --- Bench Simulator Logic (Only when user explicitly enables demoHarnessMode) ---
  private handleSimCommand(cmd: CommandType) {
    this.simDirection = cmd;
    if (cmd === 'S') {
      this.simMoving = false;
      this.simSpeed = 0;
    } else {
      this.simMoving = true;
      this.simSpeed = 60;
      // Adjust simulated distances slightly to simulate car approaching or moving
      if (cmd === 'F') {
        this.simFrontDist = Math.max(12, this.simFrontDist - (1.5 + Math.random()));
        this.simRearDist = Math.min(180, this.simRearDist + 1.2);
      } else if (cmd === 'B') {
        this.simRearDist = Math.max(8, this.simRearDist - (1.5 + Math.random()));
        this.simFrontDist = Math.min(180, this.simFrontDist + 1.2);
      } else if (cmd === 'AL' || cmd === 'AR') {
        this.simFrontDist = Math.max(16, this.simFrontDist - 0.8);
        this.simRearDist = Math.max(14, this.simRearDist - 0.6);
      }
    }
  }

  private getSimTelemetry(): TelemetryData {
    // Add natural ultrasonic jitter (0.2cm)
    const jitter = (Math.random() - 0.5) * 0.4;
    const front = Math.round((this.simFrontDist + jitter) * 10) / 10;
    const rear = Math.round((this.simRearDist + jitter) * 10) / 10;

    return {
      frontDistance: front,
      rearDistance: rear,
      frontStatus: this.calculateSafetyStatus(front, this.settings.frontStopThreshold),
      rearStatus: this.calculateSafetyStatus(rear, this.settings.rearStopThreshold),
      activeCommand: this.activeHoldCommand || this.simDirection,
      latencyMs: Math.round(18 + Math.random() * 8),
      lastUpdateTimestamp: Date.now(),
      uptimeSec: Math.floor(performance.now() / 1000),
      batteryVoltage: 7.42, // Simulated 2S LiPo for bench mode
      batteryCurrent: this.simMoving ? 1.85 : 0.22,
      batteryPower: this.simMoving ? 13.7 : 1.63,
      batteryEnergy: null,
      rssi: -58,
    };
  }

  public resetSimDistances() {
    this.simFrontDist = 55;
    this.simRearDist = 75;
  }
}
