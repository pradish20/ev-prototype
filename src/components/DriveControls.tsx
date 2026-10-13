import React, { useEffect, useRef, useCallback } from 'react';
import { CommandType } from '../types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square, Sliders, AlertTriangle } from 'lucide-react';

interface DriveControlsProps {
  activeCommand: CommandType;
  isConnected: boolean;
  vibrationEnabled: boolean;
  speedPercentage: number;
  speedPreset: 'LOW' | 'MED' | 'HIGH';
  onStartMove: (cmd: CommandType) => void;
  onStopMove: () => void;
  onSpeedPresetChange: (preset: 'LOW' | 'MED' | 'HIGH', pct: number) => void;
  onSpeedSliderChange: (pct: number) => void;
}

export const DriveControls: React.FC<DriveControlsProps> = ({
  activeCommand,
  isConnected,
  vibrationEnabled,
  speedPercentage,
  speedPreset,
  onStartMove,
  onStopMove,
  onSpeedPresetChange,
  onSpeedSliderChange,
}) => {
  const activePointerRef = useRef<number | null>(null);
  const activeDirRef = useRef<CommandType | null>(null);

  // Trigger brief haptic vibration if supported
  const triggerHaptic = useCallback(() => {
    if (vibrationEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignore vibration errors if unsupported or denied
      }
    }
  }, [vibrationEnabled]);

  const handlePointerDown = (cmd: CommandType, e: React.PointerEvent) => {
    // Prevent default context menus and multi-touch conflicts
    e.preventDefault();
    if (!isConnected) return;

    // Prevent multiple directional commands simultaneously
    if (activeDirRef.current && activeDirRef.current !== cmd) {
      onStopMove();
    }

    activePointerRef.current = e.pointerId;
    activeDirRef.current = cmd;
    triggerHaptic();
    onStartMove(cmd);

    // Capture pointer so moving off button still tracks release reliably
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignored if capture unsupported
    }
  };

  const handlePointerUpOrCancel = (cmd: CommandType, e: React.PointerEvent) => {
    e.preventDefault();
    if (activeDirRef.current === cmd) {
      activeDirRef.current = null;
      activePointerRef.current = null;
      onStopMove();
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Immediate STOP button click
  const handleStopClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    activeDirRef.current = null;
    activePointerRef.current = null;
    triggerHaptic();
    onStopMove();
  };

  // Ensure stop is dispatched when window blurs or visibility changes
  useEffect(() => {
    const handleBlurOrHide = () => {
      if (activeDirRef.current) {
        activeDirRef.current = null;
        activePointerRef.current = null;
        onStopMove();
      }
    };

    window.addEventListener('blur', handleBlurOrHide);
    window.addEventListener('visibilitychange', handleBlurOrHide);

    return () => {
      window.removeEventListener('blur', handleBlurOrHide);
      window.removeEventListener('visibilitychange', handleBlurOrHide);
    };
  }, [onStopMove]);

  // Helper to determine active button styling
  const isCmdActive = (cmd: CommandType) => activeCommand === cmd;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      
      {/* ================= DIRECTIONAL CONTROL PAD ================= */}
      <div className="w-full max-w-[340px] sm:max-w-[380px] bg-[#111720] border border-[#1E293B] rounded-2xl p-4 sm:p-5 flex flex-col items-center relative overflow-hidden select-none">
        
        {/* Subtle Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-racing text-sm tracking-wider text-white uppercase">
              DRIVE CONTROLS
            </span>
            <span className="text-[10px] font-telemetry text-[#929BA8]">
              (HOLD TO MOVE)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-telemetry uppercase text-[#929BA8]">
              CURRENT:
            </span>
            <span className={`text-[11px] font-telemetry font-bold px-2 py-0.5 rounded border ${
              activeCommand !== 'S'
                ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border-[#FF5A1F]/40'
                : 'bg-[#19212C] text-[#929BA8] border-[#2D3748]'
            }`}>
              {activeCommand === 'F' ? 'FORWARD' :
               activeCommand === 'B' ? 'REVERSE' :
               activeCommand === 'L' ? 'LEFT' :
               activeCommand === 'R' ? 'RIGHT' :
               activeCommand === 'AL' ? 'PARK L' :
               activeCommand === 'AR' ? 'PARK R' : 'IDLE / STOP'}
            </span>
          </div>
        </div>

        {/* Directional Pad Grid Layout (Cross pattern) */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          
          {/* FORWARD BUTTON (▲) */}
          <button
            type="button"
            disabled={!isConnected}
            onPointerDown={(e) => handlePointerDown('F', e)}
            onPointerUp={(e) => handlePointerUpOrCancel('F', e)}
            onPointerLeave={(e) => handlePointerUpOrCancel('F', e)}
            onPointerCancel={(e) => handlePointerUpOrCancel('F', e)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Drive Forward"
            className={`absolute top-0 w-24 h-20 sm:w-28 sm:h-22 rounded-2xl flex flex-col items-center justify-center transition-all touch-control border ${
              !isConnected
                ? 'bg-[#151D28] text-[#4A5568] border-[#1F2937] cursor-not-allowed opacity-50'
                : isCmdActive('F')
                  ? 'bg-[#FF5A1F] text-white border-[#FF7A45] shadow-[0_0_24px_rgba(255,90,31,0.6)] scale-95'
                  : 'bg-[#19212C] text-[#F5F7FA] border-[#2D3748] hover:border-[#FF5A1F]/60 active:scale-95'
            }`}
          >
            <ChevronUp className="w-8 h-8 stroke-[3]" />
            <span className="font-racing text-xs font-bold tracking-widest mt-0.5">FORWARD</span>
          </button>

          {/* LEFT BUTTON (◀) */}
          <button
            type="button"
            disabled={!isConnected}
            onPointerDown={(e) => handlePointerDown('L', e)}
            onPointerUp={(e) => handlePointerUpOrCancel('L', e)}
            onPointerLeave={(e) => handlePointerUpOrCancel('L', e)}
            onPointerCancel={(e) => handlePointerUpOrCancel('L', e)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Steer Left"
            className={`absolute left-0 w-20 h-24 sm:w-22 sm:h-28 rounded-2xl flex flex-col items-center justify-center transition-all touch-control border ${
              !isConnected
                ? 'bg-[#151D28] text-[#4A5568] border-[#1F2937] cursor-not-allowed opacity-50'
                : isCmdActive('L')
                  ? 'bg-[#FF5A1F] text-white border-[#FF7A45] shadow-[0_0_24px_rgba(255,90,31,0.6)] scale-95'
                  : 'bg-[#19212C] text-[#F5F7FA] border-[#2D3748] hover:border-[#FF5A1F]/60 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-8 h-8 stroke-[3]" />
            <span className="font-racing text-xs font-bold tracking-widest mt-0.5">LEFT</span>
          </button>

          {/* CENTRAL STOP BUTTON (■) - Override / Priority */}
          <button
            type="button"
            disabled={!isConnected}
            onClick={handleStopClick}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Emergency Stop Motors"
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center z-20 transition-all touch-control border shadow-lg ${
              !isConnected
                ? 'bg-[#1F191D] text-[#64748B] border-[#334155] cursor-not-allowed opacity-50'
                : isCmdActive('S') || activeCommand === 'S'
                  ? 'bg-[#FF3B45]/20 text-[#FF3B45] border-[#FF3B45] shadow-[0_0_16px_rgba(255,59,69,0.3)]'
                  : 'bg-[#FF3B45] text-white border-[#FF6B72] hover:bg-[#E02933] active:scale-90 shadow-[0_0_20px_rgba(255,59,69,0.5)]'
            }`}
          >
            <Square className="w-7 h-7 fill-current stroke-[2.5]" />
            <span className="font-racing text-xs font-bold tracking-widest mt-1">STOP</span>
          </button>

          {/* RIGHT BUTTON (▶) */}
          <button
            type="button"
            disabled={!isConnected}
            onPointerDown={(e) => handlePointerDown('R', e)}
            onPointerUp={(e) => handlePointerUpOrCancel('R', e)}
            onPointerLeave={(e) => handlePointerUpOrCancel('R', e)}
            onPointerCancel={(e) => handlePointerUpOrCancel('R', e)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Steer Right"
            className={`absolute right-0 w-20 h-24 sm:w-22 sm:h-28 rounded-2xl flex flex-col items-center justify-center transition-all touch-control border ${
              !isConnected
                ? 'bg-[#151D28] text-[#4A5568] border-[#1F2937] cursor-not-allowed opacity-50'
                : isCmdActive('R')
                  ? 'bg-[#FF5A1F] text-white border-[#FF7A45] shadow-[0_0_24px_rgba(255,90,31,0.6)] scale-95'
                  : 'bg-[#19212C] text-[#F5F7FA] border-[#2D3748] hover:border-[#FF5A1F]/60 active:scale-95'
            }`}
          >
            <ChevronRight className="w-8 h-8 stroke-[3]" />
            <span className="font-racing text-xs font-bold tracking-widest mt-0.5">RIGHT</span>
          </button>

          {/* REVERSE BUTTON (▼) */}
          <button
            type="button"
            disabled={!isConnected}
            onPointerDown={(e) => handlePointerDown('B', e)}
            onPointerUp={(e) => handlePointerUpOrCancel('B', e)}
            onPointerLeave={(e) => handlePointerUpOrCancel('B', e)}
            onPointerCancel={(e) => handlePointerUpOrCancel('B', e)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Drive Reverse"
            className={`absolute bottom-0 w-24 h-20 sm:w-28 sm:h-22 rounded-2xl flex flex-col items-center justify-center transition-all touch-control border ${
              !isConnected
                ? 'bg-[#151D28] text-[#4A5568] border-[#1F2937] cursor-not-allowed opacity-50'
                : isCmdActive('B')
                  ? 'bg-[#FF5A1F] text-white border-[#FF7A45] shadow-[0_0_24px_rgba(255,90,31,0.6)] scale-95'
                  : 'bg-[#19212C] text-[#F5F7FA] border-[#2D3748] hover:border-[#FF5A1F]/60 active:scale-95'
            }`}
          >
            <span className="font-racing text-xs font-bold tracking-widest mb-0.5">REVERSE</span>
            <ChevronDown className="w-8 h-8 stroke-[3]" />
          </button>

        </div>

        {/* Safety Note on Controls */}
        <div className="w-full text-center mt-3 pt-2 border-t border-[#1E293B]">
          <p className="text-[11px] font-telemetry text-[#929BA8]">
            Motors run only while holding a direction. Releasing immediately halts vehicle.
          </p>
        </div>

      </div>

      {/* ================= SPEED / THROTTLE CONTROL ================= */}
      <div className="w-full max-w-[340px] sm:max-w-[380px] bg-[#111720] border border-[#1E293B] rounded-2xl p-4 flex flex-col gap-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#FF5A1F]" />
            <span className="font-racing text-sm tracking-wider text-white uppercase">
              THROTTLE / SPEED PROFILE
            </span>
          </div>

          <span className="text-sm font-telemetry font-bold text-white tabular-nums">
            {speedPercentage}%
          </span>
        </div>

        {/* Presets Strip: LOW, MED, HIGH */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSpeedPresetChange('LOW', 30)}
            className={`py-1.5 px-2 rounded-lg text-xs font-telemetry font-bold tracking-wider transition-colors border ${
              speedPreset === 'LOW'
                ? 'bg-[#36D982]/20 text-[#36D982] border-[#36D982]/50'
                : 'bg-[#19212C] text-[#929BA8] border-[#2D3748] hover:text-white'
            }`}
          >
            LOW 30%
          </button>
          <button
            onClick={() => onSpeedPresetChange('MED', 60)}
            className={`py-1.5 px-2 rounded-lg text-xs font-telemetry font-bold tracking-wider transition-colors border ${
              speedPreset === 'MED'
                ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/50'
                : 'bg-[#19212C] text-[#929BA8] border-[#2D3748] hover:text-white'
            }`}
          >
            MED 60%
          </button>
          <button
            onClick={() => onSpeedPresetChange('HIGH', 100)}
            className={`py-1.5 px-2 rounded-lg text-xs font-telemetry font-bold tracking-wider transition-colors border ${
              speedPreset === 'HIGH'
                ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] border-[#FF5A1F]/50'
                : 'bg-[#19212C] text-[#929BA8] border-[#2D3748] hover:text-white'
            }`}
          >
            HIGH 100%
          </button>
        </div>

        {/* Range Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-telemetry text-[#929BA8]">0%</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={speedPercentage}
            onChange={(e) => onSpeedSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-[#19212C] rounded-lg appearance-none cursor-pointer accent-[#FF5A1F]"
          />
          <span className="text-[10px] font-telemetry text-[#929BA8]">100%</span>
        </div>

        {/* Firmware Compatibility Disclaimer (Required by Master Prompt) */}
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#19212C]/60 border border-[#2D3748]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FFB020] shrink-0 mt-0.5" />
          <p className="text-[10px] font-telemetry text-[#929BA8] leading-tight">
            Firmware fixed-speed mode active. Dedicated <code className="text-[#FFB020]">/speed</code> PWM endpoint required for variable motor duty-cycle.
          </p>
        </div>

      </div>

    </div>
  );
};
