import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AppSettings, 
  CommandType, 
  ConnectionStatus, 
  DistanceHistoryPoint, 
  LogEvent, 
  TelemetryData 
} from './types';
import { ESP32ApiService } from './services/esp32Api';
import { TopStatusBar } from './components/TopStatusBar';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { VehicleVisualization } from './components/VehicleVisualization';
import { DriveControls } from './components/DriveControls';
import { TelemetryView } from './components/TelemetryView';
import { AutoParkingView } from './components/AutoParkingView';
import { SettingsView } from './components/SettingsView';
import { AlertTriangle, Wifi, Cpu, ShieldCheck } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  esp32BaseUrl: 'http://192.168.4.1',
  ssid: 'WATTNEXT_EV',
  frontStopThreshold: 20,
  rearStopThreshold: 15,
  keepAliveIntervalMs: 120,
  telemetryPollIntervalMs: 300,
  vibrationEnabled: true,
  speedPercentage: 60,
  speedPreset: 'MED',
  commandProtocol: 'REST_JSON',
  statusEndpoint: '/status',
  commandEndpoint: '/command',
  distanceEndpoint: '/distance',
  telemetryEndpoint: '/telemetry',
  demoHarnessMode: false,
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabType>('DRIVE');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState<CommandType>('S');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [distanceHistory, setDistanceHistory] = useState<DistanceHistoryPoint[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);

  // Persistent API client instance
  const apiRef = useRef<ESP32ApiService>(new ESP32ApiService(DEFAULT_SETTINGS));
  const pollTimerRef = useRef<number | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  // Sync settings changes to API instance
  useEffect(() => {
    apiRef.current.updateSettings(settings);
  }, [settings]);

  // Helper to add timestamped event log
  const addLog = useCallback((
    type: 'COMMAND' | 'SAFETY' | 'NETWORK' | 'SYSTEM',
    message: string,
    level: 'INFO' | 'WARN' | 'DANGER' | 'SUCCESS' = 'INFO'
  ) => {
    const newLog: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type,
      message,
      level,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 50)]);
  }, []);

  // Handle connection toggling
  const handleToggleConnection = async () => {
    if (connectionStatus === 'CONNECTED') {
      // Disconnect
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      await apiRef.current.emergencyStop();
      setConnectionStatus('DISCONNECTED');
      setActiveCommand('S');
      addLog('NETWORK', 'Disconnected from ESP32 vehicle', 'WARN');
      return;
    }

    // Connect
    setIsConnecting(true);
    setLastError(null);
    addLog('NETWORK', `Initiating link to ${settings.esp32BaseUrl}...`, 'INFO');

    const result = await apiRef.current.checkConnection();
    setIsConnecting(false);

    if (result.connected) {
      setConnectionStatus('CONNECTED');
      consecutiveErrorsRef.current = 0;
      addLog('NETWORK', `Link established (RTT ${result.latencyMs}ms)`, 'SUCCESS');
      startTelemetryPolling();
    } else {
      setConnectionStatus('ERROR');
      setLastError(result.error || 'Connection failed');
      addLog('NETWORK', result.error || 'Connection failed', 'DANGER');
    }
  };

  // Telemetry Polling Loop
  const startTelemetryPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = window.setInterval(async () => {
      const res = await apiRef.current.fetchTelemetry();
      if (res.telemetry) {
        consecutiveErrorsRef.current = 0;
        setTelemetry(res.telemetry);

        // Append to sparkline history (max 30 points)
        setDistanceHistory((prev) => {
          const next = [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              front: res.telemetry?.frontDistance ?? null,
              rear: res.telemetry?.rearDistance ?? null,
            },
          ];
          return next.slice(-30);
        });

        // Trigger safety alert log if inside stop zone
        if (res.telemetry.frontStatus === 'STOP_ZONE') {
          addLog('SAFETY', `FRONT OBSTACLE CRITICAL: ${res.telemetry.frontDistance?.toFixed(1)}cm <= ${settings.frontStopThreshold}cm`, 'DANGER');
        } else if (res.telemetry.rearStatus === 'STOP_ZONE') {
          addLog('SAFETY', `REAR OBSTACLE CRITICAL: ${res.telemetry.rearDistance?.toFixed(1)}cm <= ${settings.rearStopThreshold}cm`, 'DANGER');
        }
      } else {
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 4) {
          // Automatic disconnect if 4 consecutive polls fail
          if (pollTimerRef.current !== null) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setConnectionStatus('ERROR');
          setLastError('Telemetry link lost. ESP32 unresponsive.');
          addLog('NETWORK', 'Telemetry link lost. Halting motors.', 'DANGER');
          apiRef.current.emergencyStop();
        }
      }
    }, Math.max(150, settings.telemetryPollIntervalMs));
  }, [addLog, settings.frontStopThreshold, settings.rearStopThreshold, settings.telemetryPollIntervalMs]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Directional Hold Commands
  const handleStartMove = (cmd: CommandType) => {
    setActiveCommand(cmd);
    addLog('COMMAND', `HOLD ENGAGED: ${cmd}`, 'INFO');
    apiRef.current.startHoldCommand(cmd, (res) => {
      if (!res.success && res.message) {
        addLog('NETWORK', `Command ${cmd} dispatch error: ${res.message}`, 'WARN');
      }
    });
  };

  const handleStopMove = () => {
    setActiveCommand('S');
    addLog('COMMAND', 'HOLD RELEASED -> STOP (S)', 'INFO');
    apiRef.current.stopHoldCommand((res) => {
      if (!res.success && res.message) {
        addLog('NETWORK', `Stop command error: ${res.message}`, 'WARN');
      }
    });
  };

  const handleEmergencyStop = () => {
    setActiveCommand('S');
    addLog('SAFETY', 'EMERGENCY STOP (S) TRIGGERED', 'DANGER');
    apiRef.current.emergencyStop();
  };

  // Speed handlers
  const handleSpeedPresetChange = (preset: 'LOW' | 'MED' | 'HIGH', pct: number) => {
    setSettings((prev) => ({ ...prev, speedPreset: preset, speedPercentage: pct }));
    addLog('SYSTEM', `Throttle preset changed to ${preset} (${pct}%)`, 'INFO');
  };

  const handleSpeedSliderChange = (pct: number) => {
    setSettings((prev) => ({ ...prev, speedPercentage: pct }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    // If simulator mode was toggled on and we were disconnected, connect automatically for convenience
    if (newSettings.demoHarnessMode === true && connectionStatus !== 'CONNECTED') {
      setTimeout(() => {
        handleToggleConnection();
      }, 50);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    addLog('SYSTEM', 'Reset app configuration to factory defaults', 'INFO');
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F5F7FA] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white pb-20">
      
      {/* Top Status Bar (Sticky) */}
      <TopStatusBar
        status={connectionStatus}
        telemetry={telemetry}
        ssid={settings.ssid}
        isConnecting={isConnecting}
        demoHarnessMode={settings.demoHarnessMode}
        onToggleConnection={handleToggleConnection}
        onEmergencyStop={handleEmergencyStop}
        onOpenSettings={() => setActiveTab('SETTINGS')}
      />

      {/* Simulator Mode Diagnostic Ribbon */}
      {settings.demoHarnessMode && (
        <div className="w-full bg-[#36D982]/15 border-b border-[#36D982]/40 py-1.5 px-3 text-center flex items-center justify-center gap-2 text-xs font-telemetry text-[#36D982]">
          <Cpu className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>BENCH TEST HARNESS ACTIVE</strong> — Simulating motor responses and ultrasonic sensors for offline UI testing.
          </span>
          <button
            onClick={() => handleUpdateSettings({ demoHarnessMode: false })}
            className="underline ml-2 text-white hover:text-[#36D982] cursor-pointer"
          >
            Switch to Real Hardware
          </button>
        </div>
      )}

      {/* Offline Hardware Notice (When disconnected and simulator is off) */}
      {connectionStatus !== 'CONNECTED' && !settings.demoHarnessMode && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3">
          <div className="p-3 rounded-xl bg-[#111720] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-telemetry">
            <div className="flex items-center gap-2 text-[#929BA8]">
              <Wifi className="w-4 h-4 text-[#FF5A1F]" />
              <span>
                Not connected to <strong className="text-white">{settings.ssid}</strong> ({settings.esp32BaseUrl}).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateSettings({ demoHarnessMode: true })}
                className="py-1 px-2.5 rounded-lg bg-[#36D982]/15 text-[#36D982] hover:bg-[#36D982]/25 border border-[#36D982]/30 text-[11px] font-bold"
              >
                Enable Simulator for Dev Test
              </button>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className="py-1 px-2.5 rounded-lg bg-[#19212C] text-white hover:bg-[#232D3B] border border-[#2D3748] text-[11px]"
              >
                Wi-Fi Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3 sm:pt-5">
        
        {/* ================= TAB 1: DRIVE (COCKPIT) ================= */}
        {activeTab === 'DRIVE' && (
          <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column (Desktop) / Top Section (Mobile): Vehicle & Ultrasonic Radar */}
            <div className="w-full lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
              <VehicleVisualization
                telemetry={telemetry}
                activeCommand={activeCommand}
                frontStopThreshold={settings.frontStopThreshold}
                rearStopThreshold={settings.rearStopThreshold}
                isConnected={connectionStatus === 'CONNECTED'}
              />
            </div>

            {/* Right Column (Desktop) / Bottom Section (Mobile): Hold-to-Drive Controls & Throttle */}
            <div className="w-full lg:col-span-6 xl:col-span-5 flex flex-col items-center gap-4">
              <DriveControls
                activeCommand={activeCommand}
                isConnected={connectionStatus === 'CONNECTED'}
                vibrationEnabled={settings.vibrationEnabled}
                speedPercentage={settings.speedPercentage}
                speedPreset={settings.speedPreset}
                onStartMove={handleStartMove}
                onStopMove={handleStopMove}
                onSpeedPresetChange={handleSpeedPresetChange}
                onSpeedSliderChange={handleSpeedSliderChange}
              />
            </div>

          </div>
        )}

        {/* ================= TAB 2: TELEMETRY ================= */}
        {activeTab === 'TELEMETRY' && (
          <TelemetryView
            telemetry={telemetry}
            history={distanceHistory}
            logs={logs}
            isConnected={connectionStatus === 'CONNECTED'}
            frontStopThreshold={settings.frontStopThreshold}
            rearStopThreshold={settings.rearStopThreshold}
            onClearLogs={() => setLogs([])}
          />
        )}

        {/* ================= TAB 3: PARKING ================= */}
        {activeTab === 'PARKING' && (
          <AutoParkingView
            telemetry={telemetry}
            activeCommand={activeCommand}
            isConnected={connectionStatus === 'CONNECTED'}
            onExecuteCommand={(cmd) => {
              setActiveCommand(cmd);
              addLog('COMMAND', `AUTOPARK MANEUVER DISPATCHED: ${cmd}`, 'WARN');
              apiRef.current.sendCommand(cmd);
            }}
            onEmergencyStop={handleEmergencyStop}
          />
        )}

        {/* ================= TAB 4: SETTINGS ================= */}
        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={settings}
            connectionStatus={connectionStatus}
            lastError={lastError}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
            onTestConnection={handleToggleConnection}
          />
        )}

      </main>

      {/* Bottom Mobile Tab Bar (Fixed) */}
      <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

    </div>
  );
}
