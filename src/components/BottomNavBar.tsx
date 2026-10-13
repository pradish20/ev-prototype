import React from 'react';
import { Gamepad2, Activity, SquareParking, SlidersHorizontal } from 'lucide-react';

export type TabType = 'DRIVE' | 'TELEMETRY' | 'PARKING' | 'SETTINGS';

interface BottomNavBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'DRIVE',
      label: 'DRIVE',
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      id: 'TELEMETRY',
      label: 'TELEMETRY',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'PARKING',
      label: 'PARKING',
      icon: <SquareParking className="w-5 h-5" />,
    },
    {
      id: 'SETTINGS',
      label: 'SETTINGS',
      icon: <SlidersHorizontal className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080B10]/95 backdrop-blur-md border-t border-[#1E293B] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative active:scale-95 ${
                isActive ? 'text-[#FF5A1F]' : 'text-[#929BA8] hover:text-[#F5F7FA]'
              }`}
            >
              {tab.icon}
              <span className={`text-[10px] font-racing font-bold tracking-wider mt-1 uppercase ${
                isActive ? 'text-[#FF5A1F]' : 'text-[#929BA8]'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-1 w-8 h-0.5 bg-[#FF5A1F] rounded-full shadow-[0_0_8px_#FF5A1F]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
