import React from 'react';

interface PHMeterScaleProps {
  value?: number | null;
  showLabel?: boolean;
}

export function PHMeterScale({ value = null, showLabel = true }: PHMeterScaleProps) {
  // pH scale colors: 0-14 (15 segments for pH values 0-14)
  const colors = [
    '#e53935', // 0 - red
    '#f44336', // 1 - red
    '#ff7043', // 2 - orange
    '#ffb74d', // 3 - orange-yellow
    '#fdd835', // 4 - yellow
    '#cddc39', // 5 - lime
    '#9ccc65', // 6 - light green
    '#7cb342', // 7 - green (neutral)
    '#7cb342', // 8 - green
    '#4db6ac', // 9 - cyan
    '#00bcd4', // 10 - cyan-blue
    '#2196f3', // 11 - blue
    '#5c6bc0', // 12 - indigo
    '#7e57c2', // 13 - purple
    '#9c27b0', // 14 - deep purple
  ];

  const getIndicatorPosition = (ph: number) => {
    const min = 0;
    const max = 14;
    const percentage = ((ph - min) / (max - min)) * 100;
    return percentage;
  };

  const indicatorPosition = value !== null ? getIndicatorPosition(value) : null;

  return (
    <div className="w-full space-y-2">
      <div className="relative pt-4">
        {/* pH scale container */}
        <div className="flex h-16 rounded-lg overflow-hidden border-2 border-gray-800 shadow-md bg-white">
          {colors.map((color, index) => (
            <div
              key={index}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Indicator pointer and value */}
        {indicatorPosition !== null && (
          <div
            className="absolute transition-all duration-300"
            style={{
              left: `${indicatorPosition}%`,
              transform: 'translateX(-50%)',
              top: '-8px'
            }}
          >
            <div className="flex flex-col items-center">
              {/* Triangle pointer */}
              <div className="w-0 h-0 border-l-3 border-r-3 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
              {/* Value label */}
              <div className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-300 mt-1 whitespace-nowrap">
                {value?.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* pH scale numbers (0-14) */}
      <div className="flex justify-between text-xs font-semibold text-gray-700 px-0.5">
        {Array.from({ length: 15 }, (_, i) => (
          <span key={i} className="flex-1 text-center">
            {i}
          </span>
        ))}
      </div>

      {/* Labels */}
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-gray-600 px-0.5">
          <span>acidic</span>
          <span className="absolute left-1/2 transform -translate-x-1/2">neutral</span>
          <span>alkaline</span>
        </div>
      )}
    </div>
  );
}
