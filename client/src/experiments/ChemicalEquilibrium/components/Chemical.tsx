import React from "react";

interface ChemicalProps {
  id: string;
  name: string;
  formula: string;
  color: string;
  onSelect: (id: string) => void;
  selected: boolean;
  concentration?: string;
  volume?: number;
  disabled?: boolean;
}

export const Chemical: React.FC<ChemicalProps> = ({
  id,
  name,
  formula,
  color,
  onSelect,
  selected,
  concentration,
  volume,
  disabled = false,
}) => {
  const [dragAmount, setDragAmount] = React.useState(volume || 25);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      "chemical",
      JSON.stringify({
        id,
        name,
        formula,
        color,
        concentration,
        volume: dragAmount,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";

    // Create realistic 3D bottle drag preview
    const dragPreview = document.createElement("div");
    dragPreview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 100px;
      height: 160px;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: rotate(-5deg) scale(1.3);
      z-index: 9999;
      pointer-events: none;
      filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.2));
    `;

    // Create bottle SVG
    const bottleSVG = `
      <svg width="80" height="120" viewBox="0 0 80 120" style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15));">
        <!-- Bottle body -->
        <rect x="15" y="35" width="50" height="70" rx="8" fill="rgba(255,255,255,0.95)" stroke="#e5e7eb" stroke-width="2"/>

        <!-- Bottle neck -->
        <rect x="30" y="15" width="20" height="25" rx="4" fill="rgba(255,255,255,0.95)" stroke="#e5e7eb" stroke-width="2"/>

        <!-- Bottle cap -->
        <rect x="28" y="10" width="24" height="10" rx="2" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>

        <!-- Chemical liquid -->
        <rect x="18" y="${75 - (dragAmount / 100) * 40}" width="44" height="${(dragAmount / 100) * 40 + 25}" rx="6" fill="${color}" opacity="0.8"/>

        <!-- Liquid surface highlight -->
        <ellipse cx="40" cy="${75 - (dragAmount / 100) * 40}" rx="22" ry="3" fill="rgba(255,255,255,0.3)"/>

        <!-- Bottle shine -->
        <rect x="20" y="40" width="8" height="50" rx="4" fill="rgba(255,255,255,0.4)" opacity="0.8"/>

        <!-- Volume markings -->
        <g stroke="#9ca3af" stroke-width="1" fill="#6b7280">
          <line x1="68" y1="50" x2="72" y2="50"/>
          <text x="74" y="52" font-size="6">${dragAmount}mL</text>
          <line x1="68" y1="70" x2="70" y2="70"/>
          <line x1="68" y1="90" x2="70" y2="90"/>
        </g>

        <!-- Label background -->
        <rect x="20" y="85" width="40" height="15" rx="3" fill="rgba(255,255,255,0.9)" stroke="#d1d5db"/>
      </svg>
    `;

    const bottleContainer = document.createElement("div");
    bottleContainer.innerHTML = bottleSVG;

    // Add chemical name label
    const nameLabel = document.createElement("div");
    nameLabel.style.cssText = `
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      font-weight: bold;
      color: #374151;
      text-align: center;
      white-space: nowrap;
      max-width: 80px;
      overflow: hidden;
    `;
    nameLabel.textContent = name.split(" ")[0];

    dragPreview.appendChild(bottleContainer);
    dragPreview.appendChild(nameLabel);
    document.body.appendChild(dragPreview);

    e.dataTransfer.setDragImage(dragPreview, 50, 80);

    setTimeout(() => {
      if (dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview);
      }
    }, 0);
  };

  const handleClick = () => {
    if (!disabled) {
      onSelect(id);
    }
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`
        flex flex-col items-center rounded-xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden
        ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-100"
            : selected
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-105 transform ring-4 ring-blue-300 hover:ring-blue-400"
              : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-400 shadow-md hover:shadow-xl active:scale-95 transform hover:scale-105"
        }
      `}
      style={{
        minWidth: "120px",
        boxShadow: selected
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 4px rgba(59, 130, 246, 0.5)"
          : undefined,
      }}
    >
      {/* Chemical bottle visualization */}
      <div className="mb-3 relative">
        <svg
          width="50"
          height="80"
          viewBox="0 0 50 80"
          className={`transition-transform duration-300 ${selected ? "scale-110" : ""}`}
        >
          {/* Bottle body */}
          <rect
            x="10"
            y="25"
            width="30"
            height="45"
            rx="4"
            fill="rgba(255,255,255,0.95)"
            stroke={selected ? "#ffffff" : "#e5e7eb"}
            strokeWidth="1.5"
          />

          {/* Bottle neck */}
          <rect
            x="18"
            y="15"
            width="14"
            height="15"
            rx="2"
            fill="rgba(255,255,255,0.95)"
            stroke={selected ? "#ffffff" : "#e5e7eb"}
            strokeWidth="1.5"
          />

          {/* Bottle cap */}
          <rect
            x="16"
            y="10"
            width="18"
            height="8"
            rx="2"
            fill={selected ? "#ffffff" : "#6b7280"}
            stroke={selected ? "#e5e7eb" : "#4b5563"}
            strokeWidth="1"
          />

          {/* Chemical liquid */}
          <rect
            x="12"
            y={55 - (dragAmount / 100) * 25}
            width="26"
            height={(dragAmount / 100) * 25 + 13}
            rx="3"
            fill={color}
            opacity="0.8"
            className="transition-all duration-500"
          />

          {/* Liquid surface highlight */}
          <ellipse
            cx="25"
            cy={55 - (dragAmount / 100) * 25}
            rx="13"
            ry="2"
            fill="rgba(255,255,255,0.4)"
          />

          {/* Bottle shine */}
          <rect
            x="14"
            y="30"
            width="4"
            height="30"
            rx="2"
            fill="rgba(255,255,255,0.5)"
            opacity="0.8"
          />

          {/* Volume markings */}
          <g
            stroke={selected ? "#ffffff" : "#9ca3af"}
            strokeWidth="0.5"
            fill={selected ? "#ffffff" : "#6b7280"}
            fontSize="5"
          >
            <line x1="42" y1="40" x2="45" y2="40" />
            <text x="46" y="42">
              {dragAmount}
            </text>
            <line x1="42" y1="50" x2="44" y2="50" />
            <line x1="42" y1="60" x2="44" y2="60" />
          </g>
        </svg>

        {/* Drag amount badge */}
        <div
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            selected ? "bg-white text-blue-600" : "bg-blue-500 text-white"
          } shadow-lg`}
        >
          {dragAmount}
        </div>
      </div>

      {/* Chemical details */}
      <div className="text-center space-y-1">
        <h4
          className={`font-bold text-sm ${
            selected ? "text-white" : "text-gray-800"
          }`}
        >
          {name}
        </h4>
        <p
          className={`text-xs font-mono ${
            selected ? "text-blue-100" : "text-gray-600"
          }`}
        >
          {formula}
        </p>
        {concentration && (
          <p
            className={`text-xs ${
              selected ? "text-blue-200" : "text-gray-500"
            }`}
          >
            {concentration}
          </p>
        )}
      </div>

      {/* Volume control slider */}
      <div className="mt-3 w-full">
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs ${
              selected ? "text-blue-100" : "text-gray-600"
            }`}
          >
            Volume:
          </span>
          <span
            className={`text-xs font-bold ${
              selected ? "text-white" : "text-gray-800"
            }`}
          >
            {dragAmount}mL
          </span>
        </div>
        <input
          type="range"
          min="5"
          max={volume || 100}
          value={dragAmount}
          onChange={(e) => setDragAmount(parseInt(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
            selected ? "bg-blue-300" : "bg-gray-200"
          } slider ${disabled ? "opacity-50" : ""}`}
          style={{
            background: selected
              ? `linear-gradient(to right, #ffffff 0%, #ffffff ${(dragAmount / (volume || 100)) * 100}%, #93c5fd ${(dragAmount / (volume || 100)) * 100}%, #93c5fd 100%)`
              : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(dragAmount / (volume || 100)) * 100}%, #e5e7eb ${(dragAmount / (volume || 100)) * 100}%, #e5e7eb 100%)`,
          }}
        />
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Drop hint when selected */}
      {selected && !disabled && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-bounce whitespace-nowrap shadow-lg">
          Drag to equipment
        </div>
      )}

      {/* Hover effect overlay */}
      {!selected && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
      )}
    </div>
  );
};
