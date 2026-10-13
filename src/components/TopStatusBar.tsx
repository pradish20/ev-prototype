import React from 'react';
import { Wifi, WifiOff, Zap, BatteryCharging, AlertOctagon, Settings } from 'lucide-react';
import { ConnectionStatus, TelemetryData } from '../types';

interface TopStatusBarProps {
  status: ConnectionStatus;
  telemetry: TelemetryData | null;
  ssid: string;
  isConnecting: boolean;
  demoHarnessMode: boolean;
  onToggleConnection: () => void;
  onEmergencyStop: () => void;
  onOpenSettings: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  status,
  telemetry,
  ssid,
  isConnecting,
  demoHarnessMode,
  onToggleConnection,
  onEmergencyStop,
  onOpenSettings,
}) => {
  const isConnected = status === 'CONNECTED';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080B10]/95 backdrop-blur-md border-b border-[#1E293B] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5A1F] to-[#D93800] flex items-center justify-center shadow-lg shadow-[#FF5A1F]/20 border border-[#FF7A45]">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-racing text-lg sm:text-xl font-bold tracking-wider text-white uppercase leading-none">
                WATTNEXT
              </span>
              <span className="font-racing text-xs font-bold text-[#FF5A1F] tracking-widest px-1 py-0.5 rounded bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 uppercase">
                EV
              </span>
            </div>
            <p className="text-[10px] text-[#929BA8] font-telemetry tracking-tight leading-none mt-0.5 hidden xs:block">
              {demoHarnessMode ? 'SIMULATOR HARNESS' : ssid}
            </p>
          </div>
        </div>

        {/* Center Telemetry & Connection Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111720] border border-[#1E293B]">
            {isConnecting ? (
              <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-ping" />
            ) : isConnected ? (
              <span className="w-2 h-2 rounded-full bg-[#36D982] shadow-[0_0_8px_#36D982]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#FF3B45]" />
            )}
            <span className="text-[11px] font-telemetry font-semibold uppercase tracking-wider text-white">
              {isConnecting ? 'CONNECTING' : isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          {/* Battery Status (Only when real hardware telemetry is available) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111720] border border-[#1E293B]">
            <BatteryCharging className={`w-3.5 h-3.5 ${telemetry?.batteryVoltage ? 'text-[#36D982]' : 'text-[#929BA8]'}`} />
            <span className="text-[11px] font-telemetry text-[#929BA8]">
              {telemetry?.batteryVoltage !== null && telemetry?.batteryVoltage !== undefined
                ? `${telemetry.batteryVoltage.toFixed(1)}V`
                : '-- V'}
            </span>
          </div>

          {/* Connect / Disconnect Action Button */}
          <button
            onClick={onToggleConnection}
            disabled={isConnecting}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-telemetry font-semibold tracking-wider transition-all flex items-center gap-1.5 border whitespace-nowrap active:scale-95 ${
              isConnected
                ? 'bg-[#19212C] text-[#929BA8] border-[#2D3748] hover:text-white hover:border-[#FF3B45]'
                : 'bg-[#FF5A1F] text-white border-[#FF7A45] hover:bg-[#E04B14] shadow-md shadow-[#FF5A1F]/20'
            }`}
          >
            {isConnected ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#FF3B45]" />
                <span className="hidden xs:inline">DISCONNECT</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'LINKING...' : 'CONNECT'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Action Icons: E-STOP & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick E-Stop Trigger */}
          <button
            onClick={onEmergencyStop}
            title="Emergency Motor Stop"
            className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#FF3B45]/20 hover:bg-[#FF3B45] text-[#FF3B45] hover:text-white border border-[#FF3B45]/40 transition-colors flex items-center gap-1 text-xs font-racing font-bold tracking-wider active:scale-90"
          >
            <AlertOctagon className="w-4 h-4" />
            <span className="hidden sm:inline">E-STOP</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-lg bg-[#111720] hover:bg-[#19212C] text-[#929BA8] hover:text-white border border-[#1E293B] flex items-center justify-center transition-colors active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
