import React from 'react';
import { DistanceHistoryPoint, LogEvent, TelemetryData } from '../types';
import { Activity, Clock, Zap, Shield, Radio, Server, AlertCircle } from 'lucide-react';

interface TelemetryViewProps {
  telemetry: TelemetryData | null;
  history: DistanceHistoryPoint[];
  logs: LogEvent[];
  isConnected: boolean;
  frontStopThreshold: number;
  rearStopThreshold: number;
  onClearLogs: () => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  telemetry,
  history,
  logs,
  isConnected,
  frontStopThreshold,
  rearStopThreshold,
  onClearLogs,
}) => {
  // Format uptime into mm:ss or hh:mm:ss
  const formatUptime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Format relative last update
  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'NO DATA';
    const diffMs = Date.now() - timestamp;
    if (diffMs < 1000) return 'JUST NOW';
    return `${(diffMs / 1000).toFixed(1)}s AGO`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 pb-8">
      
      {/* Top Banner: Telemetry Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Latency RTT */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[#929BA8] mb-1">
            <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="text-[11px] font-telemetry tracking-wide uppercase">LINK RTT</span>
          </div>
          <span className="text-xl sm:text-2xl font-telemetry font-bold text-white tabular-nums">
            {isConnected && telemetry?.latencyMs !== null ? `${telemetry?.latencyMs} ms` : '--'}
          </span>
          <span className="text-[10px] font-telemetry text-[#929BA8] mt-1">
            {isConnected ? 'Round-trip latency' : 'No connection'}
          </span>
        </div>

        {/* Sync freshness */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[#929BA8] mb-1">
            <Clock className="w-3.5 h-3.5 text-[#36D982]" />
            <span className="text-[11px] font-telemetry tracking-wide uppercase">LAST SYNC</span>
          </div>
          <span className="text-xl sm:text-2xl font-telemetry font-bold text-white tabular-nums">
            {isConnected ? formatLastSync(telemetry?.lastUpdateTimestamp ?? null) : '--'}
          </span>
          <span className="text-[10px] font-telemetry text-[#929BA8] mt-1">
            ESP32 telemetry poll
          </span>
        </div>

        {/* Vehicle Uptime */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[#929BA8] mb-1">
            <Server className="w-3.5 h-3.5 text-[#FFB020]" />
            <span className="text-[11px] font-telemetry tracking-wide uppercase">ESP32 UPTIME</span>
          </div>
          <span className="text-xl sm:text-2xl font-telemetry font-bold text-white tabular-nums">
            {isConnected ? formatUptime(telemetry?.uptimeSec ?? null) : '--'}
          </span>
          <span className="text-[10px] font-telemetry text-[#929BA8] mt-1">
            Microcontroller clock
          </span>
        </div>

        {/* Battery Voltage */}
        <div className="bg-[#111720] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[#929BA8] mb-1">
            <Zap className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span className="text-[11px] font-telemetry tracking-wide uppercase">PACK VOLTAGE</span>
          </div>
          <span className="text-xl sm:text-2xl font-telemetry font-bold text-white tabular-nums">
            {isConnected && telemetry?.batteryVoltage !== null && telemetry?.batteryVoltage !== undefined
              ? `${telemetry.batteryVoltage.toFixed(2)} V`
              : '-- V'}
          </span>
          <span className="text-[10px] font-telemetry text-[#929BA8] mt-1">
            {telemetry?.batteryVoltage ? '2S LiPo pack' : 'No voltage sensor'}
          </span>
        </div>

      </div>

      {/* Primary Ultrasonic Radar Readings Card */}
      <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#FF5A1F]" />
            <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
              HC-SR04 SONAR DISTANCE SENSORS
            </h3>
          </div>
          <span className="text-xs font-telemetry text-[#929BA8]">
            FRONT STOP: {frontStopThreshold}cm · REAR STOP: {rearStopThreshold}cm
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front Sensor Card */}
          <div className="p-4 rounded-xl bg-[#19212C] border border-[#2D3748] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-telemetry font-semibold text-[#929BA8] uppercase">
                FRONT ULTRASONIC SENSOR
              </span>
              <span className={`text-[10px] font-telemetry font-bold px-2 py-0.5 rounded border ${
                telemetry?.frontStatus === 'STOP_ZONE'
                  ? 'bg-[#FF3B45]/20 text-[#FF3B45] border-[#FF3B45]/40 animate-pulse'
                  : telemetry?.frontStatus === 'CAUTION'
                    ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40'
                    : isConnected
                      ? 'bg-[#36D982]/20 text-[#36D982] border-[#36D982]/40'
                      : 'bg-[#111720] text-[#929BA8] border-[#1E293B]'
              }`}>
                {isConnected ? (telemetry?.frontStatus || 'SENSOR UNAVAILABLE') : 'DISCONNECTED'}
              </span>
            </div>

            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-telemetry font-extrabold text-white tabular-nums">
                {isConnected && telemetry?.frontDistance !== null && telemetry?.frontDistance !== undefined
                  ? `${telemetry.frontDistance.toFixed(1)} cm`
                  : '-- cm'}
              </span>
            </div>

            {/* Visual proximity bar */}
            <div className="w-full mt-2">
              <div className="w-full h-2.5 bg-[#111720] rounded-full overflow-hidden border border-[#2D3748] relative">
                {isConnected && telemetry?.frontDistance !== null && telemetry?.frontDistance !== undefined && (
                  <div
                    className={`h-full transition-all duration-200 ${
                      telemetry.frontDistance <= frontStopThreshold
                        ? 'bg-[#FF3B45]'
                        : telemetry.frontDistance <= frontStopThreshold * 1.8
                          ? 'bg-[#FFB020]'
                          : 'bg-[#36D982]'
                    }`}
                    style={{
                      width: `${Math.min(100, (telemetry.frontDistance / 150) * 100)}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-telemetry text-[#929BA8] mt-1">
                <span>0 cm (Collision)</span>
                <span className="text-[#FF3B45]">Threshold: {frontStopThreshold}cm</span>
                <span>150+ cm</span>
              </div>
            </div>
          </div>

          {/* Rear Sensor Card */}
          <div className="p-4 rounded-xl bg-[#19212C] border border-[#2D3748] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-telemetry font-semibold text-[#929BA8] uppercase">
                REAR ULTRASONIC SENSOR
              </span>
              <span className={`text-[10px] font-telemetry font-bold px-2 py-0.5 rounded border ${
                telemetry?.rearStatus === 'STOP_ZONE'
                  ? 'bg-[#FF3B45]/20 text-[#FF3B45] border-[#FF3B45]/40 animate-pulse'
                  : telemetry?.rearStatus === 'CAUTION'
                    ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40'
                    : isConnected
                      ? 'bg-[#36D982]/20 text-[#36D982] border-[#36D982]/40'
                      : 'bg-[#111720] text-[#929BA8] border-[#1E293B]'
              }`}>
                {isConnected ? (telemetry?.rearStatus || 'SENSOR UNAVAILABLE') : 'DISCONNECTED'}
              </span>
            </div>

            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-telemetry font-extrabold text-white tabular-nums">
                {isConnected && telemetry?.rearDistance !== null && telemetry?.rearDistance !== undefined
                  ? `${telemetry.rearDistance.toFixed(1)} cm`
                  : '-- cm'}
              </span>
            </div>

            {/* Visual proximity bar */}
            <div className="w-full mt-2">
              <div className="w-full h-2.5 bg-[#111720] rounded-full overflow-hidden border border-[#2D3748] relative">
                {isConnected && telemetry?.rearDistance !== null && telemetry?.rearDistance !== undefined && (
                  <div
                    className={`h-full transition-all duration-200 ${
                      telemetry.rearDistance <= rearStopThreshold
                        ? 'bg-[#FF3B45]'
                        : telemetry.rearDistance <= rearStopThreshold * 1.8
                          ? 'bg-[#FFB020]'
                          : 'bg-[#36D982]'
                    }`}
                    style={{
                      width: `${Math.min(100, (telemetry.rearDistance / 150) * 100)}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-telemetry text-[#929BA8] mt-1">
                <span>0 cm (Collision)</span>
                <span className="text-[#FF3B45]">Threshold: {rearStopThreshold}cm</span>
                <span>150+ cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Distance History Graph */}
      <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
              DISTANCE TELEMETRY HISTORY (LAST 30 POLLS)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-telemetry">
            <span className="flex items-center gap-1.5 text-[#FF5A1F]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" /> Front
            </span>
            <span className="flex items-center gap-1.5 text-[#00E5FF]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]" /> Rear
            </span>
          </div>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="w-full h-36 bg-[#0B0F15] rounded-xl border border-[#1E293B] p-2 relative overflow-hidden flex items-end">
          {history.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs font-telemetry text-[#929BA8]">
              {isConnected ? 'Gathering telemetry data...' : 'Waiting for connection to plot telemetry...'}
            </div>
          ) : (
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Threshold guidelines */}
              <line x1="0" y1="80" x2="300" y2="80" stroke="#FF3B45" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#FFB020" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

              {/* Front distance line (Orange) */}
              <polyline
                fill="none"
                stroke="#FF5A1F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={history
                  .map((pt, idx) => {
                    const x = (idx / Math.max(1, history.length - 1)) * 300;
                    const val = pt.front !== null ? Math.min(150, Math.max(0, pt.front)) : 150;
                    const y = 100 - (val / 150) * 90;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Rear distance line (Cyan) */}
              <polyline
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={history
                  .map((pt, idx) => {
                    const x = (idx / Math.max(1, history.length - 1)) * 300;
                    const val = pt.rear !== null ? Math.min(150, Math.max(0, pt.rear)) : 150;
                    const y = 100 - (val / 150) * 90;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Driving Event Log */}
      <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#36D982]" />
            <h3 className="font-racing text-base sm:text-lg tracking-wider text-white uppercase">
              DRIVING & SAFETY EVENT LOG
            </h3>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[11px] font-telemetry text-[#929BA8] hover:text-white px-2 py-1 rounded bg-[#19212C] border border-[#2D3748] transition-colors"
          >
            CLEAR LOGS
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-xs font-telemetry text-[#929BA8]">
              No events recorded yet. Connect and initiate movement to view live logs.
            </div>
          ) : (
            logs.slice(0, 40).map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const badgeColor =
                log.level === 'DANGER'
                  ? 'bg-[#FF3B45]/15 text-[#FF3B45] border-[#FF3B45]/30'
                  : log.level === 'WARN'
                    ? 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                    : log.level === 'SUCCESS'
                      ? 'bg-[#36D982]/15 text-[#36D982] border-[#36D982]/30'
                      : 'bg-[#1E293B] text-[#929BA8] border-[#334155]';

              return (
                <div
                  key={log.id}
                  className="p-2 sm:p-2.5 rounded-lg bg-[#0C1017] border border-[#1E293B] flex items-center justify-between gap-3 text-xs font-telemetry"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                      {log.type}
                    </span>
                    <span className="text-[#F5F7FA] truncate">{log.message}</span>
                  </div>
                  <span className="text-[10px] text-[#929BA8] shrink-0 tabular-nums">
                    {dateStr}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
