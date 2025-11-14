import React, { useRef, useEffect, useState } from "react";

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
  molecularWeight?: number;
  blink?: boolean;
}

type SliderProps = {
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (v: number) => void;
  ariaLabel?: string;
};

function SmoothSlider({ min, max, value, step = 1, onChange, ariaLabel }: SliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLButtonElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = min + pct * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(stepped);
    };
    const handlePointerUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [min, max, step, onChange]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    document.body.style.userSelect = "none";
  };

  const onTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(stepped);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      onChange(Math.max(min, value - step));
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      onChange(Math.min(max, value + step));
      e.preventDefault();
    } else if (e.key === "Home") {
      onChange(min);
      e.preventDefault();
    } else if (e.key === "End") {
      onChange(max);
      e.preventDefault();
    }
  };

  const pct = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="w-full flex items-center space-x-3">
      <div
        ref={trackRef}
        role="presentation"
        onClick={onTrackClick}
        className="relative flex-1 h-2 rounded-full bg-gray-200 cursor-pointer"
        aria-hidden={false}
      >
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-sky-500"
          style={{ width: `${pct}%`, transition: draggingRef.current ? "none" : "width 120ms linear" }}
        />
        <button
          ref={knobRef}
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel || "slider"}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onKeyDown={onKeyDown}
          onPointerDown={startDrag}
          className="absolute -top-2 w-6 h-6 rounded-full bg-white border-2 border-sky-500 shadow-md transform -translate-x-1/2 focus:outline-none"
          style={{ left: `${pct}%`, touchAction: "none" }}
        />
      </div>
      <div className="w-16 text-right text-xs font-medium">{value} mL</div>
    </div>
  );
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
  molecularWeight,
  blink = false,
}) => {
  // For distilled water we restrict the allowed range to 80-120 mL
  const isWater = id === "distilled_water" || id === "distilled-water" || id === "distilledWater";
  const defaultMin = isWater ? 80 : 1;
  const defaultMax = isWater ? 120 : (volume || 300);
  const initial = isWater ? Math.min(100, defaultMax) : (volume && volume > 0 ? Math.min(25, volume) : 25);

  const [dragAmount, setDragAmount] = useState<number>(initial);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        id,
        name,
        formula,
        color,
        amount: dragAmount,
        concentration,
        molecularWeight,
        volume,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddWaterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    const ev = new CustomEvent("addDistilledWater", {
      detail: {
        id,
        name,
        amount: dragAmount,
      },
    });
    window.dispatchEvent(ev);
  };

  return (
    <div
    className={`chemical-card p-4 rounded-lg border-2 transition-all duration-200 ${
      selected
        ? "border-blue-500 bg-blue-50 shadow-md"
        : disabled
        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
        : "border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm"
    } ${id === 'oxalic_acid' && blink ? 'blink-until-pressed' : ''}`}
    onClick={() => !disabled && onSelect(id)}
    draggable={!disabled}
    onDragStart={handleDragStart}
    aria-disabled={disabled}
  >
      <div className="space-y-2">
        {/* Chemical Preview */}
        <div className="chemical-preview flex items-center space-x-3">
          <div
            className="chemical-color-dot w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <h3 className={`chemical-name font-semibold text-gray-900 text-sm truncate ${id === 'oxalic_acid' && blink ? 'blink-until-pressed text-yellow-700' : ''}`}>{name}</h3>
            <p className="chemical-formula text-xs text-gray-600 font-mono">{formula}</p>
          </div>
        </div>

        {/* Chemical Properties */}
        <div className="chemical-properties space-y-1 text-xs text-gray-600">
          {concentration && (
            <div className="flex justify-between">
              <span>Concentration:</span>
              <span className="font-medium">{concentration}</span>
            </div>
          )}
          {volume !== undefined && volume > 0 && (
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className="font-medium">{volume} mL</span>
            </div>
          )}
          {molecularWeight && (
            <div className="flex justify-between">
              <span>MW:</span>
              <span className="font-medium">{molecularWeight} g/mol</span>
            </div>
          )}
        </div>

        {/* Amount Control for liquids */}
        {!disabled && volume !== undefined && volume > 0 && (
          <div className="amount-control space-y-1">
            <label className="text-xs text-gray-600">Amount to use:</label>

            {/* For distilled water we render a smooth custom slider */}
            {isWater ? (
              <div>
                <SmoothSlider
                  min={defaultMin}
                  max={defaultMax}
                  value={dragAmount}
                  step={1}
                  onChange={(v) => setDragAmount(v)}
                  ariaLabel={`Distilled water amount in mL`}
                />

                <div className="mt-2 flex justify-center">
                  <button
                    onClick={handleAddWaterClick}
                    className="px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium"
                    aria-label={`Add ${dragAmount} millilitres of ${name}`}
                  >
                    Add {dragAmount} mL
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={defaultMin}
                  max={defaultMax}
                  value={dragAmount}
                  onChange={(e) => setDragAmount(Number(e.target.value))}
                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs font-medium w-12 text-right">{dragAmount} mL</span>
              </div>
            )}
          </div>
        )}

        {/* Drag Indicator */}
        {!disabled && (
          <div className="text-center">
            <p className="text-xs text-blue-600 mt-2">{id === "oxalic_acid" ? "Drag to balance" : "Drag to add"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chemical;
