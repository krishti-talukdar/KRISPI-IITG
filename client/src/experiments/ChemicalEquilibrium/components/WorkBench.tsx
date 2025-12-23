import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EquipmentPosition } from "../types";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  selectedChemical: string | null;
  isRunning: boolean;
  experimentTitle: string;
  currentGuidedStep?: number;
  totalGuidedSteps?: number;
  equipmentPositions?: EquipmentPosition[];
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  selectedChemical,
  isRunning,
  experimentTitle,
  currentGuidedStep = 1,
  totalGuidedSteps,
  equipmentPositions = [],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [temperature, setTemperature] = useState(25);

  useEffect(() => {
    if (isRunning) {
      const tempInterval = setInterval(() => {
        setTemperature((prev) => {
          const variation = (Math.random() - 0.5) * 0.5;
          return Math.round((prev + variation) * 10) / 10;
        });
      }, 2000);

      return () => clearInterval(tempInterval);
    }
  }, [isRunning]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const equipmentData = e.dataTransfer.getData("equipment");
    if (equipmentData) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDrop(equipmentData, x, y);
    }
  };

  const isPHExperiment = experimentTitle
    ? experimentTitle.toLowerCase().includes("hydrochloric") ||
      experimentTitle.toLowerCase().includes("pH") ||
      experimentTitle.toLowerCase().includes("ph ")
    : false;

  const normalizedTitle = experimentTitle?.toLowerCase() ?? "";
  const isDryTestWorkbench = normalizedTitle.includes("dry tests for acid radicals");
  const dryStepLabel = `Step ${currentGuidedStep}${totalGuidedSteps ? ` of ${totalGuidedSteps}` : ""}`;

  const workbenchRef = useRef<HTMLDivElement>(null);
  const heatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flameFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBunsenHeating, setIsBunsenHeating] = useState(false);
  const [isBunsenLit, setIsBunsenLit] = useState(false);
  const [heatCharge, setHeatCharge] = useState(0);
  const bunsenBurnerId = "bunsen-burner-virtual-heat-source-3";
  const bunsenPosition = equipmentPositions.find((pos) => pos.id === bunsenBurnerId) ?? null;
  const [heatButtonCoords, setHeatButtonCoords] = useState<{ left: number; top: number } | null>(null);
  const flameCoords = bunsenPosition
    ? {
        left: bunsenPosition.x + 28,
        top: bunsenPosition.y - 62,
      }
    : null;
  const updateHeatButtonCoords = useCallback(() => {
    if (!isDryTestWorkbench || !bunsenPosition || !workbenchRef.current) {
      setHeatButtonCoords(null);
      return;
    }

    const rect = workbenchRef.current.getBoundingClientRect();
    const desiredLeft = bunsenPosition.x + 90;
    const desiredTop = bunsenPosition.y;
    const maxLeft = Math.max(32, rect.width - 120);
    const maxTop = Math.max(32, rect.height - 60);
    const clampedLeft = Math.min(Math.max(32, desiredLeft), maxLeft);
    const clampedTop = Math.min(Math.max(32, desiredTop), maxTop);

    setHeatButtonCoords({ left: clampedLeft, top: clampedTop });
  }, [bunsenPosition, isDryTestWorkbench]);

  // PH-specific classes
  const phRootClass =
    "relative w-full h-full min-h-[500px] bg-white rounded-lg overflow-hidden transition-all duration-300 border border-gray-200";

  const dryTestWorkbenchClass = `relative w-full h-full min-h-[500px] rounded-lg overflow-hidden transition-all duration-300 shadow-sm ${
    isDragOver
      ? "bg-[#d1d5db] border-blue-400 ring-4 ring-blue-300 ring-opacity-50"
      : "bg-[#d3d3d3] border border-[#bcbcbc]"
  }`;

  const defaultRootClass = isDryTestWorkbench
    ? dryTestWorkbenchClass
    : `relative w-full h-full min-h-[500px] bg-gray-200 rounded-lg overflow-hidden transition-all duration-300 border-2 border-gray-400 ${
        isDragOver
          ? "bg-gray-300 border-blue-400 ring-4 ring-blue-300 ring-opacity-50"
          : ""
      }`;

  useEffect(() => {
    updateHeatButtonCoords();
    window.addEventListener("resize", updateHeatButtonCoords);
    return () => {
      window.removeEventListener("resize", updateHeatButtonCoords);
    };
  }, [updateHeatButtonCoords]);

  useEffect(() => {
    if (!isDryTestWorkbench) {
      return;
    }

    if (isBunsenHeating) {
      if (heatIntervalRef.current) {
        clearInterval(heatIntervalRef.current);
      }
      heatIntervalRef.current = window.setInterval(() => {
        setHeatCharge((prev) => Math.min(prev + 0.05, 1));
      }, 120);

      if (heatTimerRef.current) {
        clearTimeout(heatTimerRef.current);
      }
      heatTimerRef.current = window.setTimeout(() => {
        setIsBunsenHeating(false);
      }, 6000);

      setIsBunsenLit(true);
    } else {
      if (heatIntervalRef.current) {
        clearInterval(heatIntervalRef.current);
        heatIntervalRef.current = null;
      }
      if (heatTimerRef.current) {
        clearTimeout(heatTimerRef.current);
        heatTimerRef.current = null;
      }
      setHeatCharge(0);
    }

    return () => {
      if (heatIntervalRef.current) {
        clearInterval(heatIntervalRef.current);
        heatIntervalRef.current = null;
      }
      if (heatTimerRef.current) {
        clearTimeout(heatTimerRef.current);
        heatTimerRef.current = null;
      }
    };
  }, [isBunsenHeating, isDryTestWorkbench]);

  useEffect(() => {
    if (isBunsenHeating) {
      if (flameFadeRef.current) {
        clearTimeout(flameFadeRef.current);
        flameFadeRef.current = null;
      }
      return;
    }

    if (!isBunsenLit) {
      return;
    }

    flameFadeRef.current = window.setTimeout(() => {
      setIsBunsenLit(false);
      flameFadeRef.current = null;
    }, 2800);

    return () => {
      if (flameFadeRef.current) {
        clearTimeout(flameFadeRef.current);
        flameFadeRef.current = null;
      }
    };
  }, [isBunsenHeating, isBunsenLit]);


  return (
    <div
      ref={workbenchRef}
      data-workbench="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={isPHExperiment ? phRootClass : defaultRootClass}
    >
      {/* PH Experiment layout (center dashed work area + ambient widgets) */}
      {isPHExperiment ? (
        <>
          <div className="absolute inset-0 p-6">
            <div className="mx-auto h-full w-full max-w-3xl">
              <div className={`h-full border-2 border-dashed border-gray-300 rounded-md bg-white/50 p-6 flex flex-col`}>
                <div className="flex-1 relative">
                  {/* Children (equipment placed) */}
                  <div className="absolute inset-0">{children}</div>
                </div>
                <div className="mt-4 text-xs text-gray-500">Tip: Drag equipment from the left panel into the workspace.</div>
              </div>
            </div>
          </div>

          {/* Right top ambient indicators */}
          {!isDryTestWorkbench && (
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">{temperature}°C</span>
                </div>
              </div>

              {isRunning && (
                <div className="bg-green-500 text-white rounded-lg px-3 py-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Active</span>
                  </div>
                </div>
              )}

              {selectedChemical && (
                <div className="bg-blue-500 text-white rounded-lg px-3 py-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <span className="text-xs font-medium">Chemical Selected</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety box bottom-left */}
          <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-yellow-600">⚠️</div>
              <span className="text-xs font-medium text-yellow-800">Acid-Base Lab</span>
            </div>
          </div>
        </>
      ) : (
        // Default (original) workbench layout preserved for other experiments
        <>
          {!isDryTestWorkbench && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
              linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
              linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
              linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
            `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            />
          )}

          {/* Ambient laboratory indicators */}
          {!isDryTestWorkbench && (
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              {/* Temperature indicator */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">{temperature}°C</span>
                </div>
              </div>

              {/* Running indicator */}
              {isRunning && (
                <div className="bg-green-500 text-white rounded-lg px-3 py-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Active</span>
                  </div>
                </div>
              )}

              {/* Chemical selection indicator */}
              {selectedChemical && (
                <div className="bg-blue-500 text-white rounded-lg px-3 py-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <span className="text-xs font-medium">Chemical Selected</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety guidelines overlay */}
          {!isDryTestWorkbench && (
            <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 text-yellow-600">⚠️</div>
                <span className="text-xs font-medium text-yellow-800">Chemical Equilibrium Lab</span>
              </div>
            </div>
          )}

          {/* Drop zone indicator */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-400 border-dashed">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">Drop Equipment Here</p>
                  <p className="text-sm text-gray-600 text-center">Position your laboratory equipment on the workbench</p>
                </div>
              </div>
            </div>
          )}

          {!isDryTestWorkbench && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Chemical Equilibrium</span>
              </div>
            </div>
          )}

          {isDryTestWorkbench && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full px-3 py-1 bg-white/90 border border-gray-200 shadow-sm text-xs font-semibold text-gray-700">
                <span className="inline-flex w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{dryStepLabel}</span>
              </div>
              <div className="absolute top-4 right-4 rounded-full px-3 py-1 bg-white/90 border border-gray-200 shadow-sm text-xs font-semibold text-gray-700">
                Laboratory Workbench
              </div>
            </>
          )}

          {/* Equipment positions and children */}
          <div className="absolute inset-0 transform -translate-y-8">{children}</div>

          {isDryTestWorkbench && bunsenPosition && (
            <>
              {(isBunsenHeating || isBunsenLit) && flameCoords && (
                <div
                  className="heat-flame-layer"
                  style={{
                    "--heat-flame-left": `${flameCoords.left}px`,
                    "--heat-flame-top": `${flameCoords.top}px`,
                  } as React.CSSProperties}
                />
              )}
              {heatButtonCoords && (
                <div
                  className="heat-action-wrapper"
                  style={{
                    "--heat-action-left": `${heatButtonCoords.left}px`,
                    "--heat-action-top": `${heatButtonCoords.top}px`,
                  } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setIsBunsenHeating((prev) => !prev)}
                    className={`heat-control-button flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isBunsenHeating
                        ? "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-300"
                        : "bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-200"
                    }`}
                  >
                    {isBunsenHeating ? "Stop heating" : "Start heating"}
                  </button>
                  <div className="heat-progress-group">
                    <span className="heat-progress-label">
                      {isBunsenHeating ? "Heating active" : "Ready"}
                    </span>
                    <div className="heat-progress-indicator">
                      <span
                        className="heat-progress-fill"
                        style={{ "--heat-level": heatCharge } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!isDryTestWorkbench && (
            <>
              {/* Grid lines for precise positioning (subtle) */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
              `,
                  backgroundSize: "50px 50px",
                }}
              />

              {/* Ambient light effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
              `,
                }}
              />
            </>
          )}
        </>
      )}
      <style>{`
.heat-action-wrapper {
  position: absolute;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  left: var(--heat-action-left, 0);
  top: var(--heat-action-top, 0);
  transform: translateY(-50%);
}
.heat-control-button {
  pointer-events: auto;
}
.heat-progress-group {
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.heat-progress-label {
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
}
.heat-progress-indicator {
  width: 72px;
  height: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.6);
  overflow: hidden;
}
.heat-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  width: calc(var(--heat-level, 0) * 100%);
  background: linear-gradient(90deg, #fb923c, #ef4444);
  transition: width 180ms ease;
}
.heat-flame-layer {
  position: absolute;
  width: 40px;
  height: 96px;
  pointer-events: none;
  left: var(--heat-flame-left, 0);
  top: var(--heat-flame-top, 0);
  transform: translate(-50%, 0);
  background: radial-gradient(circle at 50% 0%, rgba(251, 146, 60, 0.85), rgba(239, 68, 68, 0.6) 45%, rgba(234, 88, 12, 0) 70%);
  filter: blur(0.5px);
  animation: bunsenFlame 0.9s ease-in-out infinite;
}
@keyframes bunsenFlame {
  0% { opacity: 0.85; transform: translate(-50%, 0) scaleY(1); }
  50% { opacity: 1; transform: translate(-50%, -5px) scaleY(1.08); }
  100% { opacity: 0.8; transform: translate(-50%, 0) scaleY(0.95); }
}
      `}</style>
    </div>
  );
};

export default WorkBench;
