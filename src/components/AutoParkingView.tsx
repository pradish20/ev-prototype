import React, { useState } from 'react';
import { CommandType, TelemetryData } from '../types';
import { ShieldAlert, ArrowLeft, ArrowRight, Square, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AutoParkingViewProps {
  telemetry: TelemetryData | null;
  activeCommand: CommandType;
  isConnected: boolean;
  onExecuteCommand: (cmd: CommandType) => void;
  onEmergencyStop: () => void;
}

export const AutoParkingView: React.FC<AutoParkingViewProps> = ({
  telemetry,
  activeCommand,
  isConnected,
  onExecuteCommand,
  onEmergencyStop,
}) => {
  const [pendingManeuver, setPendingManeuver] = useState<'AL' | 'AR' | null>(null);

  const isAutoParking = activeCommand === 'AL' || activeCommand === 'AR';

  const handleStartRequest = (maneuver: 'AL' | 'AR') => {
    if (!isConnected) return;
    setPendingManeuver(maneuver);
  };

  const handleConfirmManeuver = () => {
    if (pendingManeuver) {
      onExecuteCommand(pendingManeuver);
      setPendingManeuver(null);
    }
  };

  const handleCancelModal = () => {
    setPendingManeuver(null);
  };

  const handleAbortParking = () => {
    onEmergencyStop();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 pb-8">
      
      {/* Header card */}
      <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-[#FF5A1F]" />
          <h2 className="font-racing text-xl tracking-wider text-white uppercase">
            AUTONOMOUS PARKING ASSIST
          </h2>
        </div>
        <p className="text-xs font-telemetry text-[#929BA8] leading-relaxed">
          Dispatches firmware-directed ultrasonic parallel docking maneuvers (<code className="text-[#FF5A1F]">AL</code> / <code className="text-[#FF5A1F]">AR</code>). 
          The vehicle executes edge-finding and steering sequences autonomously using the side clearance and ultrasonic transducers.
        </p>
      </div>

      {/* Active State Warning / Status Banner */}
      {isAutoParking ? (
        <div className="bg-[#FF5A1F]/15 border-2 border-[#FF5A1F] rounded-2xl p-5 flex flex-col items-center gap-4 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5A1F] animate-ping" />
            <h3 className="font-racing text-lg font-bold text-white tracking-widest uppercase">
              {activeCommand === 'AL' ? 'AUTO PARK LEFT' : 'AUTO PARK RIGHT'} MANEUVER ACTIVE
            </h3>
          </div>

          <div className="flex items-center gap-6 text-sm font-telemetry text-white">
            <div>
              <span className="text-[#929BA8] text-xs block">FRONT SENSOR:</span>
              <span className="font-bold">{telemetry?.frontDistance !== null ? `${telemetry?.frontDistance} cm` : '--'}</span>
            </div>
            <div>
              <span className="text-[#929BA8] text-xs block">REAR SENSOR:</span>
              <span className="font-bold">{telemetry?.rearDistance !== null ? `${telemetry?.rearDistance} cm` : '--'}</span>
            </div>
          </div>

          <button
            onClick={handleAbortParking}
            className="w-full max-w-sm py-3 px-6 rounded-xl bg-[#FF3B45] hover:bg-[#E02933] text-white font-racing text-lg font-bold tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B45]/40 active:scale-95 transition-all"
          >
            <Square className="w-5 h-5 fill-current" />
            ABORT & STOP VEHICLE
          </button>
        </div>
      ) : (
        /* Standby Trigger Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* AUTO PARK LEFT */}
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF5A1F]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-racing text-lg font-bold text-white tracking-wide uppercase">
                  PARK LEFT (AL)
                </span>
                <span className="text-[10px] font-telemetry text-[#FF5A1F] px-2 py-0.5 rounded bg-[#FF5A1F]/10 border border-[#FF5A1F]/30">
                  CODE: AL
                </span>
              </div>
              <p className="text-xs font-telemetry text-[#929BA8] mb-4">
                Executes left-handed 90° bay parking or parallel docking into a leftward parking envelope.
              </p>
            </div>

            <button
              onClick={() => handleStartRequest('AL')}
              disabled={!isConnected}
              className={`w-full py-3 px-4 rounded-xl font-racing text-base font-bold tracking-wider flex items-center justify-center gap-2 transition-all border ${
                !isConnected
                  ? 'bg-[#19212C] text-[#64748B] border-[#2D3748] cursor-not-allowed opacity-50'
                  : 'bg-[#FF5A1F] text-white border-[#FF7A45] hover:bg-[#E04B14] shadow-md shadow-[#FF5A1F]/20 active:scale-95'
              }`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              START AUTO PARK LEFT
            </button>
          </div>

          {/* AUTO PARK RIGHT */}
          <div className="bg-[#111720] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF5A1F]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-racing text-lg font-bold text-white tracking-wide uppercase">
                  PARK RIGHT (AR)
                </span>
                <span className="text-[10px] font-telemetry text-[#FF5A1F] px-2 py-0.5 rounded bg-[#FF5A1F]/10 border border-[#FF5A1F]/30">
                  CODE: AR
                </span>
              </div>
              <p className="text-xs font-telemetry text-[#929BA8] mb-4">
                Executes right-handed 90° bay parking or parallel docking into a rightward parking envelope.
              </p>
            </div>

            <button
              onClick={() => handleStartRequest('AR')}
              disabled={!isConnected}
              className={`w-full py-3 px-4 rounded-xl font-racing text-base font-bold tracking-wider flex items-center justify-center gap-2 transition-all border ${
                !isConnected
                  ? 'bg-[#19212C] text-[#64748B] border-[#2D3748] cursor-not-allowed opacity-50'
                  : 'bg-[#FF5A1F] text-white border-[#FF7A45] hover:bg-[#E04B14] shadow-md shadow-[#FF5A1F]/20 active:scale-95'
              }`}
            >
              <ArrowRight className="w-4 h-4 stroke-[3]" />
              START AUTO PARK RIGHT
            </button>
          </div>

        </div>
      )}

      {/* Safety Notice Card */}
      <div className="p-4 rounded-xl bg-[#19212C] border border-[#2D3748] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#FFB020] shrink-0 mt-0.5" />
        <div className="text-xs font-telemetry text-[#929BA8] leading-relaxed">
          <span className="text-white font-bold block mb-1">SAFETY & OPERATIONAL POLICY:</span>
          Autonomous parking executes pre-programmed steering routines on the ESP32 firmware. Keep physical hands ready at the Emergency Stop control. Ultrasonic rangefinder readings are logged in real-time.
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingManeuver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#111720] border border-[#FF5A1F] rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center gap-2 text-[#FFB020]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-racing text-xl font-bold tracking-wider text-white uppercase">
                CONFIRM AUTO-PARKING MANEUVER
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#19212C] border border-[#2D3748] text-xs font-telemetry space-y-2">
              <p className="text-white font-semibold">
                You are about to initiate: <span className="text-[#FF5A1F] font-bold">{pendingManeuver === 'AL' ? 'AUTO PARK LEFT (AL)' : 'AUTO PARK RIGHT (AR)'}</span>
              </p>
              <ul className="text-[#929BA8] list-disc list-inside space-y-1">
                <li>Clear an area of at least 80cm around the vehicle.</li>
                <li>Verify both front and rear ultrasonic sensors are unobstructed.</li>
                <li>Pressing STOP anytime immediately aborts the motors.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCancelModal}
                className="py-2.5 px-4 rounded-xl bg-[#19212C] hover:bg-[#232D3B] text-[#929BA8] hover:text-white font-telemetry text-xs font-bold transition-colors border border-[#2D3748]"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmManeuver}
                className="py-2.5 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-racing text-base font-bold tracking-wider transition-all border border-[#FF7A45] shadow-lg shadow-[#FF5A1F]/30"
              >
                PROCEED & DISPATCH
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
