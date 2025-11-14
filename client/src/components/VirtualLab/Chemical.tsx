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
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      width: 35px;
      line-height: 1.1;
    `;
    nameLabel.textContent = name.split(" ")[0];

    // Add formula label
    const formulaLabel = document.createElement("div");
    formulaLabel.style.cssText = `
      position: absolute;
      top: 87px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 7px;
      font-family: 'Courier New', monospace;
      color: #6b7280;
      text-align: center;
      width: 35px;
    `;
    formulaLabel.textContent = formula;

    // Add drag indicator with pulsing animation
    const indicator = document.createElement("div");
    indicator.style.cssText = `
      position: absolute;
      top: -5px;
      right: 5px;
      width: 20px;
      height: 20px;
      background: linear-gradient(45deg, #8b5cf6, #7c3aed);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      animation: pulse 1.5s infinite;
    `;
    indicator.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M7 14l5-5 5 5z"/></svg>`;

    // Add bubbling effect for active chemicals
    if (dragAmount > 50) {
      const bubbles = document.createElement("div");
      bubbles.style.cssText = `
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 20px;
      `;

      for (let i = 0; i < 3; i++) {
        const bubble = document.createElement("div");
        bubble.style.cssText = `
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255,255,255,0.7);
          border-radius: 50%;
          left: ${5 + i * 8}px;
          top: ${i * 3}px;
          animation: float 2s infinite ease-in-out;
          animation-delay: ${i * 0.3}s;
        `;
        bubbles.appendChild(bubble);
      }
      dragPreview.appendChild(bubbles);
    }

    dragPreview.appendChild(bottleContainer);
    dragPreview.appendChild(nameLabel);
    dragPreview.appendChild(formulaLabel);
    dragPreview.appendChild(indicator);

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); opacity: 0.7; }
        50% { transform: translateY(-8px); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 40, 80);

    // Cleanup
    setTimeout(() => {
      if (dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset any drag styling
    e.currentTarget.classList.remove("dragging");
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => !disabled && onSelect(id)}
      className={`p-4 rounded-lg transition-all duration-300 border-2 transform chemical-bottle-shadow ${
        disabled
          ? "cursor-not-allowed opacity-50 border-gray-200 bg-gray-100"
          : selected
            ? "cursor-grab active:cursor-grabbing border-purple-500 bg-purple-50 shadow-lg scale-105 ring-2 ring-purple-300 chemical-glow hover:scale-105 active:scale-95 active:rotate-1 hover:rotate-1"
            : "cursor-grab active:cursor-grabbing border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:chemical-glow hover:scale-105 active:scale-95 active:rotate-1 hover:rotate-1"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-md transition-all duration-200"
            style={{ backgroundColor: color }}
          >
            {/* Liquid animation effect */}
            <div
              className="absolute inset-1 rounded-full opacity-60 animate-pulse"
              style={{ backgroundColor: color }}
            ></div>
          </div>

          {/* Chemical drop animation when selected */}
          {selected && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-purple-500 flex items-center justify-center animate-bounce">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div
            className={`font-semibold text-lg ${selected ? "text-purple-900" : "text-gray-900"}`}
          >
            {name}
          </div>
          <div
            className={`text-sm font-mono ${selected ? "text-purple-700" : "text-gray-500"}`}
          >
            {formula}
          </div>
          {concentration && (
            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full inline-block mt-1">
              {concentration}
            </div>
          )}
        </div>

        {selected && (
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="text-xs text-purple-600 font-medium mt-1">
              SELECTED
            </div>
          </div>
        )}
      </div>

      {/* Volume indicator with animation */}
      {volume && (
        <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${Math.min(100, (volume / 100) * 100)}%`,
              backgroundColor: color,
              boxShadow: `inset 0 1px 2px rgba(0,0,0,0.1)`,
            }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent to-white opacity-30 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Volume Control */}
      {selected && (
        <div className="mt-3 bg-gray-50 rounded-lg p-2">
          <label className="text-xs text-gray-600 font-medium block mb-1">
            Amount (mL)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={dragAmount}
            onChange={(e) => setDragAmount(Number(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Drag instruction with animation */}
      <div
        className={`text-xs text-center mt-2 transition-all ${selected ? "opacity-100 animate-pulse" : "opacity-0"}`}
      >
        <div className="flex items-center justify-center space-x-1">
          <span className="text-purple-600 font-medium">Drag to equipment</span>
          <span className="text-purple-500 animate-bounce">→</span>
        </div>
      </div>
    </div>
  );
};

export const chemicalsList = [
  {
    id: "hcl",
    name: "Hydrochloric Acid",
    formula: "HCl",
    color: "#FFE135",
    concentration: "0.1 M",
    volume: 25,
  },
  {
    id: "naoh",
    name: "Sodium Hydroxide",
    formula: "NaOH",
    color: "#87CEEB",
    concentration: "0.1 M",
    volume: 50,
  },
  {
    id: "phenol",
    name: "Phenolphthalein",
    formula: "C₂₀H₁₄O₄",
    color: "#FFB6C1",
    concentration: "Indicator",
    volume: 10,
  },
];
