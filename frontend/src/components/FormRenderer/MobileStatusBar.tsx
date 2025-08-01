import React, { useState, useEffect } from 'react';

interface MobileStatusBarProps {
  carrier?: string;
  signalStrength?: 1 | 2 | 3 | 4;
  wifiStrength?: 1 | 2 | 3;
  batteryLevel?: number;
  isCharging?: boolean;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  carrier = 'Carrier',
  signalStrength = 4,
  wifiStrength = 3,
  batteryLevel = 85,
  isCharging = false
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(' ', '');
  };

  return (
    <div className="mobile-status-bar fixed top-0 left-0 right-0 h-11 z-[1000] bg-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6 text-white">
        {/* Left side - Time */}
        <div className="flex-1">
          <span className="text-sm font-medium tracking-tight">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Center - Carrier */}
        <div className="flex-1 text-center">
          <span className="text-xs opacity-90">{carrier}</span>
        </div>

        {/* Right side - Status icons */}
        <div className="flex-1 flex items-center justify-end gap-1">
          {/* Signal strength */}
          <div className="flex items-end gap-0.5 h-3">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-0.5 bg-white transition-opacity ${
                  bar <= signalStrength ? 'opacity-100' : 'opacity-30'
                }`}
                style={{ height: `${bar * 3}px` }}
              />
            ))}
          </div>

          {/* WiFi */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d={wifiStrength >= 1 ? "M12 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" : ""}
              fill="white"
            />
            <path
              d={wifiStrength >= 2 ? "M16.24 13.76c-1.17-1.17-3.07-1.17-4.24 0l1.41 1.41c.39-.39 1.02-.39 1.41 0l1.42-1.41z" : ""}
              fill="white"
              opacity={wifiStrength >= 2 ? 1 : 0.3}
            />
            <path
              d={wifiStrength >= 3 ? "M19.07 10.93c-2.73-2.73-7.17-2.73-9.9 0l1.41 1.41c1.95-1.95 5.12-1.95 7.07 0l1.42-1.41z" : ""}
              fill="white"
              opacity={wifiStrength >= 3 ? 1 : 0.3}
            />
          </svg>

          {/* Battery */}
          <div className="relative">
            <svg className="w-6 h-3" viewBox="0 0 24 12" fill="none">
              <rect x="1" y="2" width="20" height="8" rx="2" stroke="white" strokeWidth="1" fill="none" />
              <rect x="21" y="4.5" width="2" height="3" rx="0.5" fill="white" />
              <rect
                x="2"
                y="3"
                width={`${(batteryLevel / 100) * 18}`}
                height="6"
                rx="1"
                fill="white"
                className={isCharging ? 'animate-pulse' : ''}
              />
            </svg>
            {isCharging && (
              <svg className="absolute inset-0 w-6 h-3" viewBox="0 0 24 12" fill="none">
                <path d="M13 2L11 7h2l-2 5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <span className="text-xs ml-1">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );
};

export default MobileStatusBar;