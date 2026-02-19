import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EquipmentPosition, RodMoveAnimationConfig } from "../types";
import { GLASS_ROD_IMAGE_URL } from "../constants";

const DRY_TEST_VAPOR_PUFFS = [
  { offsetX: -22, duration: "3.8s", delay: "0s", scale: 0.85 },
  { offsetX: 6, duration: "3.2s", delay: "0.4s", scale: 1.05 },
  { offsetX: 18, duration: "4.1s", delay: "0.2s", scale: 0.9 },
] as const;

const MNO2_GAS_PUFFS = [
  { offsetX: -14, duration: "3.2s", delay: "0s", scale: 0.9 },
  { offsetX: 8, duration: "3.6s", delay: "0.3s", scale: 1.05 },
  { offsetX: 22, duration: "4.0s", delay: "0.5s", scale: 0.8 },
] as const;

const POST_MOVE_FUME_CONFIG = [
  { delay: "0s", scale: 1 },
  { delay: "0.12s", scale: 1.2 },
  { delay: "0.24s", scale: 1.15 },
  { delay: "0.36s", scale: 1.35 },
  { delay: "0.48s", scale: 1.4 },
  { delay: "0.6s", scale: 1.25 },
  { delay: "0.72s", scale: 1.45 },
  { delay: "0.84s", scale: 1.55 },
] as const;

const DRY_WORKBENCH_GLASS_ROD_POSITION = { xPercent: 0.7, yPercent: 0.15 };
const DRY_WORKBENCH_GLASS_CONTAINER_POSITION = { xPercent: 0.55, yPercent: 0.37 };

const stripEquipmentIdSuffix = (value: string) => value.replace(/-\d+$/, "");

type RinseLayout = {
  buttonLeft: number;
  buttonTop: number;
  rodLeft: number;
  rodTop: number;
  containerTop: number;
};

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  selectedChemical: string | null;
  isRunning: boolean;
  experimentTitle: string;
  currentGuidedStep?: number;
  totalGuidedSteps?: number;
  equipmentPositions?: EquipmentPosition[];
  showRinseButton?: boolean;
  onRinse?: () => void;
  isRinsing?: boolean;
  hasRinsed?: boolean;
  rodMoved?: boolean;
  showPostMoveFumes?: boolean;
  rodMoveAnimation?: RodMoveAnimationConfig | null;
  isRodMoving?: boolean;
  workbenchResetTrigger?: number;
  onHeatingStateChange?: (isHeating: boolean) => void;
  // New props for contextual fume coloring
  activeHalide?: string;
  dryTestMode?: string;
  mno2AddedDuringHeating?: boolean;
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
  showRinseButton = false,
  onRinse,
  isRinsing = false,
  hasRinsed = false,
  rodMoved = false,
  rodMoveAnimation = null,
  isRodMoving = false,
  showPostMoveFumes = true,
  workbenchResetTrigger = 0,
  onHeatingStateChange,
  activeHalide,
  dryTestMode,
  mno2AddedDuringHeating,
}) => {
  // Determine whether to use reddish-brown fumes based on context (Bromide + dry acid mode, or Special Cases + dry acid mode)
  const shouldUseReddishFumes =
    (experimentTitle?.toLowerCase().includes("salt analysis") ||
      experimentTitle?.toLowerCase().includes("dry tests for acid radicals")) &&
    dryTestMode === "acid" &&
    (activeHalide === "Br" || activeHalide === "SC");

  // Determine whether to use purple fumes based on context (Iodide + dry acid mode)
  const shouldUsePurpleFumes =
    (experimentTitle?.toLowerCase().includes("salt analysis") ||
      experimentTitle?.toLowerCase().includes("dry tests for acid radicals")) &&
    dryTestMode === "acid" &&
    activeHalide === "I";
  const [isDragOver, setIsDragOver] = useState(false);
  const [temperature, setTemperature] = useState(25);
  const [rinseLayout, setRinseLayout] = useState<RinseLayout | null>(null);

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
  const isDryTestWorkbench =
    normalizedTitle.includes("dry tests for acid radicals") ||
    normalizedTitle.includes("dry tests for basic radicals") ||
    normalizedTitle.includes("salt analysis");
  const dryStepLabel = `Step ${currentGuidedStep}${totalGuidedSteps ? ` of ${totalGuidedSteps}` : ""}`;

  const workbenchRef = useRef<HTMLDivElement>(null);
  const heatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flameFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBunsenHeating, setIsBunsenHeating] = useState(false);
  const [isBunsenLit, setIsBunsenLit] = useState(false);
  const [heatCharge, setHeatCharge] = useState(0);

  useEffect(() => {
    setIsBunsenHeating(false);
    setIsBunsenLit(false);
    setHeatCharge(0);
  }, [workbenchResetTrigger]);

  useEffect(() => {
    onHeatingStateChange?.(isBunsenHeating);
  }, [isBunsenHeating, onHeatingStateChange]);
  const bunsenBurnerBaseId = "bunsen-burner-virtual-heat-source";
  const bunsenPosition =
    equipmentPositions.find((pos) => stripEquipmentIdSuffix(pos.id) === bunsenBurnerBaseId) ??
    null;
  const testTubePosition = useMemo(
    () => equipmentPositions.find((pos) => pos.id === "test_tubes") ?? null,
    [equipmentPositions],
  );
  const vaporAnchorCoords = testTubePosition
    ? {
        left: testTubePosition.x,
        top: testTubePosition.y - 110,
      }
    : null;
  const hasMnO2InTestTube =
    Boolean(
      testTubePosition?.chemicals?.some(
        (chemical) => chemical.id === "mno2" && (chemical.amount ?? 0) > 0,
      ),
    );
  const [heatButtonCoords, setHeatButtonCoords] = useState<{ left: number; top: number } | null>(null);
  const [flameAnchorCoords, setFlameAnchorCoords] = useState<{ left: number; top: number } | null>(null);
  const defaultFlameCoords = bunsenPosition
  ? {
      left: bunsenPosition.x + 32,
      top: bunsenPosition.y - 96,
    }
  : null;
  const flameCoords = flameAnchorCoords ?? defaultFlameCoords;
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

  const updateFlamePosition = useCallback(() => {
    if (!isDryTestWorkbench || !workbenchRef.current) {
      setFlameAnchorCoords(null);
      return;
    }

    if (!bunsenPosition?.id) {
      setFlameAnchorCoords(null);
      return;
    }

    const bunsenElement = workbenchRef.current.querySelector<HTMLDivElement>(
      `[data-equipment-id="${bunsenPosition.id}"]`,
    );
    if (!bunsenElement) {
      setFlameAnchorCoords(null);
      return;
    }

    const workbenchRect = workbenchRef.current.getBoundingClientRect();
    const bunsenRect = bunsenElement.getBoundingClientRect();
    const flameLeft =
      bunsenRect.left - workbenchRect.left + bunsenRect.width / 2;
    const defaultFlameOffset = Math.min(
      60,
      Math.max(30, bunsenRect.height * 0.35),
    );
    const heatingLift = Math.min(
      18,
      Math.max(8, bunsenRect.height * 0.06),
    );
    const idleFlameTop = bunsenRect.top - workbenchRect.top - defaultFlameOffset;
    const heatingFlameTop = idleFlameTop - heatingLift;

    setFlameAnchorCoords({
      left: flameLeft,
      top: isBunsenHeating ? heatingFlameTop : idleFlameTop,
    });
  }, [
    bunsenPosition?.id,
    bunsenPosition?.x,
    bunsenPosition?.y,
    isDryTestWorkbench,
    isBunsenHeating,
  ]);

  const updateRinseLayout = useCallback(() => {
    if (!isDryTestWorkbench || !workbenchRef.current) {
      setRinseLayout(null);
      return;
    }

    const rect = workbenchRef.current.getBoundingClientRect();
    const clampValue = (value: number, minValue: number, maxValue: number) =>
      Math.max(minValue, Math.min(maxValue, value));
    const safeWidth = Math.max(32, rect.width - 32);
    const safeHeight = Math.max(32, rect.height - 32);

    const rodLeft = clampValue(
      Math.round(rect.width * DRY_WORKBENCH_GLASS_ROD_POSITION.xPercent),
      32,
      safeWidth,
    );
    const rodTop = clampValue(
      Math.round(rect.height * DRY_WORKBENCH_GLASS_ROD_POSITION.yPercent),
      32,
      safeHeight,
    );
    const containerTop = clampValue(
      Math.round(rect.height * DRY_WORKBENCH_GLASS_CONTAINER_POSITION.yPercent),
      32,
      safeHeight,
    );
    const buttonLeft = clampValue(rodLeft + 58, 32, Math.max(32, rect.width - 110));
    const buttonTop = clampValue(rodTop - 10, 12, Math.max(12, rect.height - 50));

    setRinseLayout({
      buttonLeft,
      buttonTop,
      rodLeft,
      rodTop,
      containerTop,
    });
  }, [isDryTestWorkbench]);

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

  const rinseButtonLabel = hasRinsed ? "MOVE" : "RINSE";

  useEffect(() => {
    const handleResize = () => {
      updateHeatButtonCoords();
      updateFlamePosition();
      updateRinseLayout();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateHeatButtonCoords, updateFlamePosition, updateRinseLayout]);

  useEffect(() => {
    if (!isDryTestWorkbench) {
      setRinseLayout(null);
      return;
    }

    updateHeatButtonCoords();
    updateFlamePosition();
    updateRinseLayout();
  }, [
    isDryTestWorkbench,
    isBunsenHeating,
    updateHeatButtonCoords,
    updateFlamePosition,
    updateRinseLayout,
  ]);

  useEffect(() => {
    if (!isDryTestWorkbench) {
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

          {rodMoveAnimation && (
            <div
              className="rod-move-animation"
              style={{
                left: `${rodMoveAnimation.startX}px`,
                top: `${rodMoveAnimation.startY}px`,
                "--rod-anim-dx": `${rodMoveAnimation.deltaX}px`,
                "--rod-anim-dy": `${rodMoveAnimation.deltaY}px`,
                "--rod-anim-duration": `${rodMoveAnimation.durationMs}ms`,
              } as React.CSSProperties}
            >
              <img
                src={GLASS_ROD_IMAGE_URL}
                alt="Moving glass rod"
                className="rod-move-animation__image"
              />
            </div>
          )}

          {isDryTestWorkbench && (
            <>
              {rodMoved && showPostMoveFumes && testTubePosition && (
                <div
                  className="post-move-fumes-layer"
                  style={{
                    "--fume-anchor-left": `${testTubePosition.x}px`,
                    "--fume-anchor-top": `${testTubePosition.y - 60}px`,
                  } as React.CSSProperties}
                >
                  {POST_MOVE_FUME_CONFIG.map((fume, index) => {
                    const horizontalOffset =
                      (index - (POST_MOVE_FUME_CONFIG.length - 1) / 2) * 8;
                    {
                    const fumeStyle = {
                      "--fume-delay": fume.delay,
                      "--fume-scale": `${fume.scale}`,
                      "--fume-offset-x": `${horizontalOffset}px`,
                    } as React.CSSProperties;

                    if (shouldUseReddishFumes && isBunsenHeating) {
                      Object.assign(fumeStyle, {
                        background: "radial-gradient(circle, rgba(139,37,0,1) 0%, rgba(139,37,0,0.65) 70%)",
                        boxShadow: "0 0 30px rgba(139,37,0,0.9)",
                        filter: "blur(0.5px)",
                      });
                    }

                    return (
                      <span
                        key={`${index}-${fume.delay}`}
                        className="post-move-fume"
                        style={fumeStyle}
                      />
                    );
                  }
                  })}
                </div>
              )}
              {(isBunsenHeating || isBunsenLit) && flameCoords && (
                <div
                  className={`bunsen-flame-layer ${isBunsenHeating ? "flame-burning" : "flame-embers"}`}
                  style={{
                    "--heat-flame-left": `${flameCoords.left}px`,
                    "--heat-flame-top": `${flameCoords.top}px`,
                  } as React.CSSProperties}
                  aria-hidden="true"
                />
              )}
              {isBunsenHeating && vaporAnchorCoords && (
                <div
                  className="dry-test-vapor-cloud"
                  style={{
                    "--vap-anchor-left": `${vaporAnchorCoords.left}px`,
                    "--vap-anchor-top": `${vaporAnchorCoords.top}px`,
                  } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {DRY_TEST_VAPOR_PUFFS.map((puff, index) => {
                    const puffStyle = {
                      "--vap-offset-x": `${puff.offsetX}px`,
                      "--vap-duration": puff.duration,
                      "--vap-delay": puff.delay,
                      "--vap-scale": puff.scale,
                    } as React.CSSProperties;

                    if (shouldUseReddishFumes && isBunsenHeating) {
                      Object.assign(puffStyle, {
                        background: "linear-gradient(180deg, rgba(139,37,0,0.95), rgba(139,37,0,0.4))",
                        boxShadow: "0 8px 25px rgba(139,37,0,0.6)",
                      });
                    } else if (shouldUsePurpleFumes && isBunsenHeating) {
                      Object.assign(puffStyle, {
                        background: "linear-gradient(180deg, rgba(147,51,234,0.95), rgba(147,51,234,0.4))",
                        boxShadow: "0 8px 25px rgba(147,51,234,0.8)",
                      });
                    }

                    return (
                      <span
                        key={`${index}-${puff.delay}`}
                        className="dry-test-vapor-puff"
                        style={puffStyle}
                      />
                    );
                  })}
                </div>
              )}
              {isBunsenHeating && hasMnO2InTestTube && vaporAnchorCoords && (
                <div
                  className="mno2-gas-cloud"
                  style={{
                    "--mno2-gas-left": `${vaporAnchorCoords.left}px`,
                    "--mno2-gas-top": `${vaporAnchorCoords.top}px`,
                  } as React.CSSProperties}
                  role="status"
                  aria-label="Greenish-yellow gas rising from MnO₂ heated in the test tube"
                >
                  {(
                    mno2AddedDuringHeating && shouldUseReddishFumes
                      ? [...MNO2_GAS_PUFFS, ...MNO2_GAS_PUFFS.map((p) => ({ ...p, offsetX: p.offsetX + 6, scale: p.scale * 1.25 }))]
                      : MNO2_GAS_PUFFS
                  ).map((puff, index) => {
                    const puffStyle: React.CSSProperties = {
                      "--mno2-offset-x": `${puff.offsetX}px`,
                      "--mno2-duration": puff.duration,
                      "--mno2-delay": puff.delay,
                      "--mno2-scale": puff.scale,
                    } as React.CSSProperties;
                    if (shouldUseReddishFumes && mno2AddedDuringHeating) {
                      Object.assign(puffStyle, {
                        background: "radial-gradient(circle, rgba(139,37,0,0.95) 0%, rgba(139,37,0,0.4) 70%)",
                        boxShadow: "0 12px 30px rgba(139,37,0,0.6)",
                      });
                    } else if (shouldUsePurpleFumes && mno2AddedDuringHeating) {
                      Object.assign(puffStyle, {
                        background: "radial-gradient(circle, rgba(147,51,234,0.95) 0%, rgba(147,51,234,0.4) 70%)",
                        boxShadow: "0 12px 30px rgba(147,51,234,0.8)",
                      });
                    }
                    return (
                      <span
                        key={`mno2-${index}-${puff.delay}`}
                        className="mno2-gas-puff"
                        style={puffStyle}
                      />
                    );
                  })}
                </div>
              )}
              {heatButtonCoords && (
                <div
                  className="heat-control-panel"
                  style={{
                    "--heat-action-left": `${heatButtonCoords.left}px`,
                    "--heat-action-top": `${heatButtonCoords.top}px`,
                  } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setIsBunsenHeating((prev) => !prev)}
                    className={`heat-trigger-button flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isBunsenHeating
                        ? "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-300"
                        : "bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-200"
                    }`}
                  >
                    {isBunsenHeating ? "Stop heating" : "Start heating"}
                  </button>
                  <div className="heat-status-panel">
                    <span className="heat-progress-status">
                      {isBunsenHeating ? "Heating active" : "Ready"}
                    </span>
                    <div className="heat-progress-track">
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
      {showRinseButton && rinseLayout && (
        <button
          type="button"
          onClick={() => onRinse?.()}
          disabled={isRinsing || rodMoved || isRodMoving}
          className="dry-test-rinse-button"
          style={{
            "--rinse-left": `${rinseLayout.buttonLeft}px`,
            "--rinse-top": `${rinseLayout.buttonTop}px`,
          } as React.CSSProperties}
        >
          {rinseButtonLabel}
        </button>
      )}
      <style>{`
.heat-control-panel {
  position: absolute;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  left: var(--heat-action-left, 0);
  top: var(--heat-action-top, 0);
  transform: translateY(-50%);
}
.heat-trigger-button {
  pointer-events: auto;
}
.heat-status-panel {
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}
.heat-progress-status {
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
}
.heat-progress-track {
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
.bunsen-flame-layer {
  position: absolute;
  width: 44px;
  height: 110px;
  pointer-events: none;
  left: var(--heat-flame-left, 0);
  top: var(--heat-flame-top, 0);
  transform: translate(-50%, 0);
  background: radial-gradient(circle at 50% 0%, rgba(251, 146, 60, 0.9), rgba(239, 68, 68, 0.6) 45%, rgba(234, 88, 12, 0) 72%);
  filter: blur(0.4px) drop-shadow(0 0 20px rgba(251, 146, 60, 0.6));
  border-radius: 50% 50% 40% 40%;
  animation: bunsenFlame 0.9s ease-in-out infinite;
  z-index: 30;
}
.bunsen-flame-layer::after {
  content: "";
  position: absolute;
  inset: 30% 25% 0;
  background: radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.8), rgba(251, 146, 60, 0));
  border-radius: inherit;
  opacity: 0.6;
}
.bunsen-flame-layer.flame-burning {
  opacity: 1;
}
.bunsen-flame-layer.flame-embers {
  opacity: 0.5;
  animation-duration: 1.4s;
}
.dry-test-vapor-cloud {
  position: absolute;
  pointer-events: none;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  left: var(--vap-anchor-left, 0);
  top: var(--vap-anchor-top, 0);
  transform: translate(-50%, -100%);
}
.dry-test-vapor-puff {
  position: absolute;
  bottom: 0;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.8);
  filter: blur(0.5px);
  transform: translate(var(--vap-offset-x, 0), 0) scale(var(--vap-scale, 1));
  animation: dryTestVaporRise var(--vap-duration, 3.5s) var(--vap-delay, 0s) infinite;
  opacity: 0;
}
.mno2-gas-cloud {
  position: absolute;
  pointer-events: none;
  width: 160px;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  left: var(--mno2-gas-left, 0);
  top: var(--mno2-gas-top, 0);
  transform: translate(-50%, -100%);
}
.mno2-gas-puff {
  position: absolute;
  bottom: 0;
  width: 26px;
  height: 30px;
  background: linear-gradient(180deg, rgba(132, 204, 22, 0.85), rgba(250, 204, 21, 0.4));
  border-radius: 50% 50% 60% 60%;
  box-shadow: 0 12px 30px rgba(132, 204, 22, 0.6);
  filter: blur(1px);
  transform: translate(var(--mno2-offset-x, 0), 0) scale(var(--mno2-scale, 1));
  animation: mno2GasDrift var(--mno2-duration, 3.4s) var(--mno2-delay, 0s) infinite;
  opacity: 0;
}
@keyframes dryTestVaporRise {
  0% {
    opacity: 0;
    transform: translate(var(--vap-offset-x, 0), 0) scale(var(--vap-scale, 1));
  }
  20% {
    opacity: 0.35;
  }
  60% {
    opacity: 0.9;
    transform: translate(calc(var(--vap-offset-x, 0) + 4px), -58px) scale(calc(var(--vap-scale, 1) * 1.15));
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--vap-offset-x, 0) + 10px), -120px) scale(calc(var(--vap-scale, 1) * 1.4));
  }
}
@keyframes mno2GasDrift {
  0% {
    opacity: 0;
    transform: translate(var(--mno2-offset-x, 0), 0) scale(var(--mno2-scale, 1));
  }
  25% {
    opacity: 0.38;
    transform: translate(calc(var(--mno2-offset-x, 0) + 2px), -40px) scale(calc(var(--mno2-scale, 1) * 1.05));
  }
  60% {
    opacity: 0.9;
    transform: translate(calc(var(--mno2-offset-x, 0) + 8px), -80px) scale(calc(var(--mno2-scale, 1) * 1.2));
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--mno2-offset-x, 0) + 14px), -140px) scale(calc(var(--mno2-scale, 1) * 1.3));
  }
}
@keyframes bunsenFlame {
  0% { opacity: 0.85; transform: translate(-50%, 0) scaleY(1); }
  50% { opacity: 1; transform: translate(-50%, -6px) scaleY(1.05); }
  100% { opacity: 0.8; transform: translate(-50%, 0) scaleY(0.95); }
}
.rod-visual {
  transform-origin: center;
  transform: scale(5) rotate(-12deg);
  will-change: transform;
}
.rod-visual--rinsing {
  animation: rodRinseDip 2.2s ease-in-out both;
}
@keyframes rodRinseDip {
  0% {
    transform: scale(5) rotate(-12deg) translate(0, 0);
  }
  25% {
    transform: scale(5) rotate(-14deg) translate(-6px, 20px);
  }
  45% {
    transform: scale(5) rotate(-18deg) translate(8px, 42px);
  }
  65% {
    transform: scale(5) rotate(-16deg) translate(-4px, 34px);
  }
  85% {
    transform: scale(5) rotate(-13deg) translate(5px, 28px);
  }
  100% {
    transform: scale(5) rotate(-12deg) translate(0, 0);
  }
}
.rod-move-animation {
  --rod-anim-dx: 0px;
  --rod-anim-dy: 0px;
  --rod-anim-duration: 1.2s;
  position: absolute;
  pointer-events: none;
  width: 140px;
  height: 32px;
  left: 0;
  top: 0;
  transform-origin: center;
  z-index: 45;
  animation: rodMoveGlide var(--rod-anim-duration, 1.2s) ease-in-out both;
}
.rod-move-animation__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
@keyframes rodMoveGlide {
  0% {
    transform: translate(-50%, -50%) rotate(-12deg);
  }
  30% {
    transform: translate(calc(var(--rod-anim-dx) * 0.35 - 50%), calc(var(--rod-anim-dy) * 0.35 - 50% - 12px)) rotate(-14deg);
  }
  60% {
    transform: translate(calc(var(--rod-anim-dx) * 0.7 - 50%), calc(var(--rod-anim-dy) * 0.7 - 50% - 6px)) rotate(-15deg);
  }
  100% {
    transform: translate(calc(var(--rod-anim-dx) - 50%), calc(var(--rod-anim-dy) - 50%)) rotate(-12deg);
  }
}
.dry-test-rinse-button {
  position: absolute;
  left: var(--rinse-left, 0);
  top: var(--rinse-top, 0);
  padding: 0.35rem 0.75rem;
  font-size: 10px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  border-radius: 9999px;
  background: #0f172a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 20px 25px -15px rgba(15, 23, 42, 0.75), 0 12px 20px -10px rgba(15, 23, 42, 0.5);
  transition: transform 200ms ease, box-shadow 200ms ease;
  z-index: 35;
  cursor: pointer;
}
.dry-test-rinse-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.post-move-fumes-layer {
  position: absolute;
  pointer-events: none;
  width: 200px;
  height: 220px;
  left: var(--fume-anchor-left, 0);
  top: var(--fume-anchor-top, 0);
  transform: translate(-50%, -100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  animation: postMoveFumesDrift 3s ease-in-out infinite;
  opacity: 0.95;
  filter: drop-shadow(0 0 28px rgba(255, 255, 255, 0.85));
}
.post-move-fume {
  position: absolute;
  width: 26px;
  height: 26px;
  background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.65) 70%);
  border-radius: 999px;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.92);
  opacity: 0;
  animation: postMoveFumeRise 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  transform: translate(var(--fume-offset-x, 0), 0) scale(var(--fume-scale, 1));
  animation-delay: var(--fume-delay, 0s);
  mix-blend-mode: screen;
  filter: blur(0.35px);
  will-change: transform, opacity;
}
@keyframes postMoveFumeRise {
  0% {
    opacity: 0;
    transform: translate(calc(var(--fume-offset-x, 0) + 2px), 18px) scale(var(--fume-scale, 1));
  }
  25% {
    opacity: 0.75;
  }
  60% {
    opacity: 0.95;
    transform: translate(calc(var(--fume-offset-x, 0) + 10px), -92px) scale(calc(var(--fume-scale, 1) * 1.4));
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--fume-offset-x, 0) + 16px), -150px) scale(calc(var(--fume-scale, 1) * 1.8));
  }
}
@keyframes postMoveFumesDrift {
  0% {
    transform: translate(-50%, -100%) translateX(0);
  }
  50% {
    transform: translate(-50%, -100%) translateX(8px);
  }
  100% {
    transform: translate(-50%, -100%) translateX(-5px);
  }
}
      `}</style>
    </div>
  );
};

export default WorkBench;
