import React from 'react';
import { CommandType, SafetyStatus, TelemetryData } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Radio } from 'lucide-react';

interface VehicleVisualizationProps {
  telemetry: TelemetryData | null;
  activeCommand: CommandType;
  frontStopThreshold: number;
  rearStopThreshold: number;
  isConnected: boolean;
}

export const VehicleVisualization: React.FC<VehicleVisualizationProps> = ({
  telemetry,
  activeCommand,
  frontStopThreshold,
  rearStopThreshold,
  isConnected,
}) => {
  const frontDist = isConnected ? telemetry?.frontDistance : null;
  const rearDist = isConnected ? telemetry?.rearDistance : null;

  // Determine steering wheel turn angle based on active command
  const wheelTurnDeg = activeCommand === 'L' ? -22 : activeCommand === 'R' ? 22 : 0;
  const isMoving = activeCommand === 'F' || activeCommand === 'B' || activeCommand === 'L' || activeCommand === 'R';

  // Front obstacle calculations
  const getZoneColor = (status: SafetyStatus | undefined) => {
    switch (status) {
      case 'STOP_ZONE':
        return {
          stroke: '#FF3B45',
          fill: 'rgba(255, 59, 69, 0.18)',
          text: 'text-[#FF3B45]',
          badge: 'bg-[#FF3B45]/15 border-[#FF3B45]/40 text-[#FF3B45]',
          label: 'STOP ZONE',
        };
      case 'CAUTION':
        return {
          stroke: '#FFB020',
          fill: 'rgba(255, 176, 32, 0.15)',
          text: 'text-[#FFB020]',
          badge: 'bg-[#FFB020]/15 border-[#FFB020]/40 text-[#FFB020]',
          label: 'CAUTION',
        };
      case 'CLEAR':
        return {
          stroke: '#36D982',
          fill: 'rgba(54, 217, 130, 0.10)',
          text: 'text-[#36D982]',
          badge: 'bg-[#36D982]/15 border-[#36D982]/40 text-[#36D982]',
          label: 'CLEAR',
        };
      case 'SENSOR_UNAVAILABLE':
      default:
        return {
          stroke: '#4A5568',
          fill: 'rgba(74, 85, 104, 0.08)',
          text: 'text-[#929BA8]',
          badge: 'bg-[#1E293B]/40 border-[#334155] text-[#929BA8]',
          label: 'SENSOR UNAVAILABLE',
        };
    }
  };

  const frontZone = getZoneColor(isConnected ? telemetry?.frontStatus : 'SENSOR_UNAVAILABLE');
  const rearZone = getZoneColor(isConnected ? telemetry?.rearStatus : 'SENSOR_UNAVAILABLE');

  // Obstacle visual position (clamped between 30px to 110px from sensor)
  const frontObstacleOffset = frontDist !== null && frontDist !== undefined
    ? Math.max(30, Math.min(115, (frontDist / 100) * 85 + 25))
    : null;

  const rearObstacleOffset = rearDist !== null && rearDist !== undefined
    ? Math.max(30, Math.min(115, (rearDist / 100) * 85 + 25))
    : null;

  return (
    <div className="w-full bg-[#111720] border border-[#1E293B] rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col items-center">
      
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-grid-tech opacity-40 pointer-events-none" />

      {/* Header Info Bar */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-racing text-sm sm:text-base tracking-wider text-white uppercase">
            CHASSIS TELEMETRY & OBSTACLE RADAR
          </span>
          <span className="text-[10px] font-telemetry text-[#929BA8]">
            HC-SR04 DUAL SONAR
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-telemetry uppercase text-[#929BA8]">
            SAFETY:
          </span>
          <span className={`text-[10px] font-telemetry font-bold px-1.5 py-0.5 rounded border ${
            frontZone.label === 'STOP_ZONE' || rearZone.label === 'STOP_ZONE'
              ? 'bg-[#FF3B45]/20 text-[#FF3B45] border-[#FF3B45]/40 animate-pulse'
              : frontZone.label === 'CAUTION' || rearZone.label === 'CAUTION'
                ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40'
                : isConnected
                  ? 'bg-[#36D982]/20 text-[#36D982] border-[#36D982]/40'
                  : 'bg-[#1E293B] text-[#929BA8] border-[#334155]'
          }`}>
            {isConnected ? (
              frontZone.label === 'STOP_ZONE' || rearZone.label === 'STOP_ZONE'
                ? 'STOP OVERRIDE'
                : frontZone.label === 'CAUTION' || rearZone.label === 'CAUTION'
                  ? 'PROXIMITY WARNING'
                  : 'NORMAL'
            ) : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Front Sonar Status Strip */}
      <div className="w-full flex items-center justify-between z-10 py-1.5 px-3 rounded-lg bg-[#19212C]/80 border border-[#1E293B] mb-2">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${frontZone.text}`} />
          <span className="text-xs font-telemetry font-medium text-[#929BA8]">
            FRONT DISTANCE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm sm:text-base font-telemetry font-bold text-white tabular-nums">
            {frontDist !== null && frontDist !== undefined ? `${frontDist.toFixed(1)} cm` : '-- cm'}
          </span>
          <span className={`text-[10px] font-telemetry font-bold px-2 py-0.5 rounded border ${frontZone.badge}`}>
            {frontZone.label}
          </span>
        </div>
      </div>

      {/* Central Interactive SVG Vehicle & Sonar Radar Canvas */}
      <div className="w-full max-w-[340px] sm:max-w-[380px] h-[340px] sm:h-[370px] relative flex items-center justify-center my-1 select-none">
        
        <svg
          viewBox="0 0 320 360"
          className="w-full h-full overflow-visible drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Front Radar Gradient */}
            <radialGradient id="frontRadarGrad" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stopColor={frontZone.stroke} stopOpacity="0.4" />
              <stop offset="50%" stopColor={frontZone.stroke} stopOpacity="0.15" />
              <stop offset="100%" stopColor={frontZone.stroke} stopOpacity="0.0" />
            </radialGradient>

            {/* Rear Radar Gradient */}
            <radialGradient id="rearRadarGrad" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor={rearZone.stroke} stopOpacity="0.4" />
              <stop offset="50%" stopColor={rearZone.stroke} stopOpacity="0.15" />
              <stop offset="100%" stopColor={rearZone.stroke} stopOpacity="0.0" />
            </radialGradient>

            {/* Tire Tread Pattern */}
            <pattern id="tireTread" width="4" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="4" y2="4" stroke="#101721" strokeWidth="1" />
            </pattern>
          </defs>

          {/* ==================== FRONT ULTRASONIC RADAR CONE ==================== */}
          <g transform="translate(160, 95)">
            {/* Radar Cones / Arcs (Facing Upwards) */}
            <path
              d="M 0,0 L -80,-90 A 120,120 0 0,1 80,-90 Z"
              fill="url(#frontRadarGrad)"
              stroke={frontZone.stroke}
              strokeWidth="1.2"
              strokeDasharray="4 2"
              opacity={isConnected ? 0.9 : 0.25}
            />
            {/* Distance Arcs */}
            <path d="M -30,-35 A 45,45 0 0,1 30,-35" fill="none" stroke={frontZone.stroke} strokeWidth="1" opacity="0.6" />
            <path d="M -55,-65 A 85,85 0 0,1 55,-65" fill="none" stroke={frontZone.stroke} strokeWidth="1" opacity="0.4" />
            <path d="M -75,-90 A 118,118 0 0,1 75,-90" fill="none" stroke={frontZone.stroke} strokeWidth="1" opacity="0.3" />

            {/* Front Stop Threshold Marker (20 cm) */}
            <circle cx="0" cy={-((frontStopThreshold / 100) * 85 + 25)} r="3" fill="#FF3B45" />
            <line
              x1="-24"
              y1={-((frontStopThreshold / 100) * 85 + 25)}
              x2="24"
              y2={-((frontStopThreshold / 100) * 85 + 25)}
              stroke="#FF3B45"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />

            {/* Detected Obstacle Graphic (Wall / Target) */}
            {frontObstacleOffset !== null && (
              <g transform={`translate(0, ${-frontObstacleOffset})`} className="transition-transform duration-200">
                <rect x="-42" y="-9" width="84" height="12" rx="3" fill={frontZone.stroke} opacity="0.9" />
                <rect x="-42" y="-9" width="84" height="12" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                {/* Hazard stripes */}
                <line x1="-30" y1="-9" x2="-22" y2="3" stroke="#111720" strokeWidth="2.5" />
                <line x1="-10" y1="-9" x2="-2" y2="3" stroke="#111720" strokeWidth="2.5" />
                <line x1="10" y1="-9" x2="18" y2="3" stroke="#111720" strokeWidth="2.5" />
                <line x1="30" y1="-9" x2="38" y2="3" stroke="#111720" strokeWidth="2.5" />
                {/* Distance Tag */}
                <text x="0" y="-13" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {frontDist?.toFixed(0)}cm
                </text>
              </g>
            )}
          </g>

          {/* ==================== REAR ULTRASONIC RADAR CONE ==================== */}
          <g transform="translate(160, 275)">
            {/* Radar Cones / Arcs (Facing Downwards) */}
            <path
              d="M 0,0 L -75,80 A 110,110 0 0,0 75,80 Z"
              fill="url(#rearRadarGrad)"
              stroke={rearZone.stroke}
              strokeWidth="1.2"
              strokeDasharray="4 2"
              opacity={isConnected ? 0.9 : 0.25}
            />
            {/* Distance Arcs */}
            <path d="M -28,30 A 40,40 0 0,0 28,30" fill="none" stroke={rearZone.stroke} strokeWidth="1" opacity="0.6" />
            <path d="M -50,55 A 75,75 0 0,0 50,55" fill="none" stroke={rearZone.stroke} strokeWidth="1" opacity="0.4" />

            {/* Rear Stop Threshold Marker (15 cm) */}
            <line
              x1="-20"
              y1={(rearStopThreshold / 100) * 85 + 25}
              x2="20"
              y2={(rearStopThreshold / 100) * 85 + 25}
              stroke="#FF3B45"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />

            {/* Detected Obstacle Graphic (Rear Wall / Barrier) */}
            {rearObstacleOffset !== null && (
              <g transform={`translate(0, ${rearObstacleOffset})`} className="transition-transform duration-200">
                <rect x="-38" y="-3" width="76" height="12" rx="3" fill={rearZone.stroke} opacity="0.9" />
                <rect x="-38" y="-3" width="76" height="12" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                {/* Hazard stripes */}
                <line x1="-25" y1="-3" x2="-18" y2="9" stroke="#111720" strokeWidth="2.5" />
                <line x1="-5" y1="-3" x2="2" y2="9" stroke="#111720" strokeWidth="2.5" />
                <line x1="15" y1="-3" x2="22" y2="9" stroke="#111720" strokeWidth="2.5" />
                <text x="0" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {rearDist?.toFixed(0)}cm
                </text>
              </g>
            )}
          </g>

          {/* ==================== F1 VEHICLE CHASSIS (TOP-DOWN) ==================== */}
          <g id="carChassis" transform="translate(160, 185)">
            
            {/* Shadow beneath car */}
            <ellipse cx="0" cy="0" rx="46" ry="85" fill="#05070A" opacity="0.8" />

            {/* Suspension Wishbones */}
            {/* Front Left / Right */}
            <line x1="-16" y1="-50" x2="-44" y2="-52" stroke="#526071" strokeWidth="2" />
            <line x1="-16" y1="-38" x2="-44" y2="-48" stroke="#374151" strokeWidth="2" />
            <line x1="16" y1="-50" x2="44" y2="-52" stroke="#526071" strokeWidth="2" />
            <line x1="16" y1="-38" x2="44" y2="-48" stroke="#374151" strokeWidth="2" />
            {/* Rear Left / Right */}
            <line x1="-18" y1="42" x2="-46" y2="46" stroke="#526071" strokeWidth="2" />
            <line x1="-18" y1="56" x2="-46" y2="52" stroke="#374151" strokeWidth="2" />
            <line x1="18" y1="42" x2="46" y2="46" stroke="#526071" strokeWidth="2" />
            <line x1="18" y1="56" x2="46" y2="52" stroke="#374151" strokeWidth="2" />

            {/* FOUR WHEELS (Racing Slicks) */}
            {/* Front Left Wheel (Rotates with steering) */}
            <g transform={`translate(-48, -50) rotate(${wheelTurnDeg})`} className="transition-transform duration-150">
              <rect x="-7" y="-18" width="14" height="36" rx="4" fill="#151A22" stroke="#2D3748" strokeWidth="1.5" />
              <rect x="-4" y="-14" width="8" height="28" rx="2" fill="#0C1017" />
              {/* Racing Orange Rim Accent */}
              <circle cx="0" cy="0" r="3.5" fill="#FF5A1F" />
            </g>

            {/* Front Right Wheel (Rotates with steering) */}
            <g transform={`translate(48, -50) rotate(${wheelTurnDeg})`} className="transition-transform duration-150">
              <rect x="-7" y="-18" width="14" height="36" rx="4" fill="#151A22" stroke="#2D3748" strokeWidth="1.5" />
              <rect x="-4" y="-14" width="8" height="28" rx="2" fill="#0C1017" />
              <circle cx="0" cy="0" r="3.5" fill="#FF5A1F" />
            </g>

            {/* Rear Left Wheel (Fixed wider rear slick) */}
            <g transform="translate(-50, 48)">
              <rect x="-8" y="-20" width="16" height="40" rx="4" fill="#151A22" stroke="#2D3748" strokeWidth="1.5" />
              <rect x="-5" y="-16" width="10" height="32" rx="2" fill="#0C1017" />
              <circle cx="0" cy="0" r="4" fill="#FF5A1F" />
            </g>

            {/* Rear Right Wheel (Fixed wider rear slick) */}
            <g transform="translate(50, 48)">
              <rect x="-8" y="-20" width="16" height="40" rx="4" fill="#151A22" stroke="#2D3748" strokeWidth="1.5" />
              <rect x="-5" y="-16" width="10" height="32" rx="2" fill="#0C1017" />
              <circle cx="0" cy="0" r="4" fill="#FF5A1F" />
            </g>

            {/* Front Aerodynamic Wing */}
            <path
              d="M -56,-78 L 56,-78 L 48,-68 L 16,-68 L 12,-72 L -12,-72 L -16,-68 L -48,-68 Z"
              fill="#111720"
              stroke="#FF5A1F"
              strokeWidth="1.5"
            />
            {/* Front Wing Endplates */}
            <rect x="-58" y="-83" width="3" height="18" rx="1.5" fill="#FF5A1F" />
            <rect x="55" y="-83" width="3" height="18" rx="1.5" fill="#FF5A1F" />

            {/* Main Aerodynamic Monocoque Body */}
            <path
              d="M 0,-76 
                 C 8,-74 12,-60 14,-42 
                 C 20,-30 26,-15 26,10 
                 C 26,35 22,50 18,65 
                 C 14,75 8,78 0,78 
                 C -8,78 -14,75 -18,65 
                 C -22,50 -26,35 -26,10 
                 C -26,-15 -20,-30 -14,-42 
                 C -12,-60 -8,-74 0,-76 Z"
              fill="#19212C"
              stroke="#2D3748"
              strokeWidth="1.5"
            />

            {/* Racing Livery Orange Center Stripe */}
            <path
              d="M 0,-74 L 3,-45 L 4,15 L 2,68 L -2,68 L -4,15 L -3,-45 Z"
              fill="#FF5A1F"
              opacity="0.95"
            />

            {/* Forward Direction Arrow on Nosecone */}
            <path
              d="M 0,-64 L -4,-56 L -1.5,-56 L -1.5,-48 L 1.5,-48 L 1.5,-56 L 4,-56 Z"
              fill="#FFFFFF"
            />

            {/* Sidepod Radiator Air Intakes */}
            <path d="M -24,-20 L -16,-20 L -15,10 L -23,10 Z" fill="#0C1017" stroke="#2D3748" strokeWidth="1" />
            <path d="M 24,-20 L 16,-20 L 15,10 L 23,10 Z" fill="#0C1017" stroke="#2D3748" strokeWidth="1" />

            {/* Cockpit / Driver Bay / Halo structure */}
            <path
              d="M 0,-28 C 8,-28 10,-18 10,0 C 10,12 6,18 0,18 C -6,18 -10,12 -10,0 C -10,-18 -8,-28 0,-28 Z"
              fill="#0B0F15"
              stroke="#FF5A1F"
              strokeWidth="1.2"
            />

            {/* Roll Hoop Airbox Intake */}
            <circle cx="0" cy="5" r="4" fill="#FF5A1F" />
            <circle cx="0" cy="5" r="2.5" fill="#080B10" />

            {/* Battery Bay / Power Unit Enclosure */}
            <rect x="-12" y="22" width="24" height="32" rx="3" fill="#111720" stroke="#374151" strokeWidth="1" />
            <text x="0" y="34" textAnchor="middle" fill="#929BA8" fontSize="6" fontFamily="monospace" fontWeight="bold">
              ESP32·EV
            </text>
            <text x="0" y="44" textAnchor="middle" fill="#FF5A1F" fontSize="5.5" fontFamily="monospace">
              2S LiPo BAY
            </text>

            {/* Rear Aerodynamic Wing & Diffuser */}
            <path
              d="M -46,74 L 46,74 L 42,86 L -42,86 Z"
              fill="#111720"
              stroke="#FF5A1F"
              strokeWidth="1.5"
            />
            {/* Rear Wing Endplates */}
            <rect x="-48" y="70" width="3" height="18" rx="1.5" fill="#FF5A1F" />
            <rect x="45" y="70" width="3" height="18" rx="1.5" fill="#FF5A1F" />

            {/* Ultrasonic Sensor 1: FRONT SENSOR (Dual Emitter/Receiver transducers) */}
            <g transform="translate(0, -78)">
              <rect x="-9" y="-6" width="18" height="6" rx="2" fill="#080B10" stroke="#FF5A1F" strokeWidth="1" />
              <circle cx="-4" cy="-3" r="2.2" fill={frontZone.stroke} />
              <circle cx="4" cy="-3" r="2.2" fill={frontZone.stroke} />
            </g>

            {/* Ultrasonic Sensor 2: REAR SENSOR (Dual Emitter/Receiver transducers) */}
            <g transform="translate(0, 86)">
              <rect x="-9" y="0" width="18" height="6" rx="2" fill="#080B10" stroke="#FF5A1F" strokeWidth="1" />
              <circle cx="-4" cy="3" r="2.2" fill={rearZone.stroke} />
              <circle cx="4" cy="3" r="2.2" fill={rearZone.stroke} />
            </g>

            {/* Motion Particle Trails if moving */}
            {isMoving && (
              <g opacity="0.7">
                <line x1="-35" y1="75" x2="-35" y2="92" stroke="#FF5A1F" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="35" y1="75" x2="35" y2="92" stroke="#FF5A1F" strokeWidth="1.5" strokeDasharray="3 3" />
              </g>
            )}

          </g>

        </svg>

      </div>

      {/* Rear Sonar Status Strip */}
      <div className="w-full flex items-center justify-between z-10 py-1.5 px-3 rounded-lg bg-[#19212C]/80 border border-[#1E293B] mt-1">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${rearZone.text}`} />
          <span className="text-xs font-telemetry font-medium text-[#929BA8]">
            REAR DISTANCE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm sm:text-base font-telemetry font-bold text-white tabular-nums">
            {rearDist !== null && rearDist !== undefined ? `${rearDist.toFixed(1)} cm` : '-- cm'}
          </span>
          <span className={`text-[10px] font-telemetry font-bold px-2 py-0.5 rounded border ${rearZone.badge}`}>
            {rearZone.label}
          </span>
        </div>
      </div>

      {/* Threshold Information Footnote */}
      <div className="w-full flex items-center justify-between text-[10px] font-telemetry text-[#929BA8] mt-2 px-1">
        <span>FRONT STOP: {frontStopThreshold}cm</span>
        <span>• ULTRASONIC RANGE: 2–400cm •</span>
        <span>REAR STOP: {rearStopThreshold}cm</span>
      </div>

    </div>
  );
};
