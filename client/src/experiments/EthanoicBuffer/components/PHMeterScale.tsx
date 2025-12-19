import React from 'react';

interface PHMeterScaleProps {
  value?: number | null;
  showLabel?: boolean;
}

export function PHMeterScale({ value = null, showLabel = true }: PHMeterScaleProps) {
  // pH scale colors: 0-14
  const colors = [
    '#e31a1c', // 0 - red
    '#e31a1c', // 1
    '#ff7f00', // 2 - orange
    '#ffff00', // 3 - yellow
    '#ffff00', // 4
    '#90ee90', // 5 - light green
    '#7cb342', // 6 - green
    '#7cb342', // 7 - green (neutral)
    '#7cb342', // 8 - green
    '#4fc3f7', // 9 - cyan
    '#2196f3', // 10 - blue
    '#1565c0', // 11 - dark blue
    '#5e35b1', // 12 - purple
    '#5e35b1', // 13 - purple
    '#5e35b1', // 14 - purple
  ];

  const getIndicatorPosition = (ph: number) => {
    const min = 0;
    const max = 14;
    const percentage = ((ph - min) / (max - min)) * 100;
    return percentage;
  };

  const indicatorPosition = value !== null ? getIndicatorPosition(value) : null;

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        {/* pH scale container */}
        <div className="flex h-12 rounded-lg overflow-hidden border-2 border-gray-800 shadow-md">
          {colors.map((color, index) => (
            <div
              key={index}
              className="flex-1 border-r border-gray-800 last:border-r-0"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Indicator pointer */}
        {indicatorPosition !== null && (
          <div
            className="absolute -bottom-3 transform -translate-x-1/2 transition-all duration-300"
            style={{ left: `${indicatorPosition}%` }}
          >
            <div className="relative">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-gray-900 mx-auto" />
              <div className="text-xs font-bold text-gray-900 text-center mt-1 min-w-max">
                {value?.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* pH scale numbers */}
      <div className="flex justify-between px-1 text-xs font-semibold text-gray-700">
        {Array.from({ length: 15 }, (_, i) => (
          <span key={i} className="text-center" style={{ flex: 1 }}>
            {i}
          </span>
        ))}
      </div>

      {/* Labels */}
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-gray-700 mt-2">
          <span>acidic</span>
          <span>neutral</span>
          <span>alkaline</span>
        </div>
      )}
    </div>
  );
}
