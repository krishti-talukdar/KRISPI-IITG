import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Scale,
  FlaskConical,
  Beaker,
  Pipette,
} from "lucide-react";
import TransparentImage from "@/components/VirtualLab/TransparentImage";
import StirringAnimation from "./StirringAnimation";
import DissolutionAnimation from "./DissolutionAnimation";
import type { EquipmentPosition, SolutionPreparationState } from "../types";

import { Button } from "@/components/ui/button";

const ACID_WARNING_STORAGE_KEY = "oxalicAcidWarningDismissed";
const ACID_WARNING_EVENT = "oxalicAcidWarningDismissed";

let acidWarningMemoryValue = false;

const readAcidWarningDismissed = (): boolean => {
  if (typeof window === "undefined") {
    return acidWarningMemoryValue;
  }

  try {
    const stored = window.localStorage.getItem(ACID_WARNING_STORAGE_KEY);
    if (stored !== null) {
      acidWarningMemoryValue = stored === "true";
    }
  } catch {}

  return acidWarningMemoryValue;
};

const persistAcidWarningDismissed = (dismissed: boolean) => {
  const previous = acidWarningMemoryValue;
  acidWarningMemoryValue = dismissed;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (dismissed) {
      window.localStorage.setItem(ACID_WARNING_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(ACID_WARNING_STORAGE_KEY);
    }
  } catch {}

  if (previous !== dismissed) {
    try {
      window.dispatchEvent(new CustomEvent<boolean>(ACID_WARNING_EVENT, { detail: dismissed }));
    } catch {}
  }
};


interface EquipmentProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  typeId?: string;
  imageSrc?: string;
  onDrag?: (id: string, x: number, y: number) => void;
  position: { x: number; y: number } | null;
  chemicals?: Array<{
    id: string;
    name: string;
    color: string;
    amount: number;
    concentration: string;
  }>;
  onChemicalDrop?: (
    chemicalId: string,
    equipmentId: string,
    amount: number,
  ) => void;
  onRemove?: (id: string) => void;
  preparationState?: SolutionPreparationState;
  onAction?: (action: string, equipmentId?: string) => void;
  stepId?: number;
}

export const Equipment: React.FC<EquipmentProps> = ({
  id,
  name,
  icon,
  typeId,
  imageSrc,
  onDrag,
  position,
  chemicals = [],
  onChemicalDrop,
  onRemove,
  preparationState,
  onAction,
  stepId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCalculatorReminder, setShowCalculatorReminder] = useState(false);
  const equipmentRef = useRef<HTMLDivElement>(null);
  const equipmentIdentifier = typeId ?? id;
  const [enlargeAfterAnimation, setEnlargeAfterAnimation] = useState(false);
  useEffect(() => {
    if (equipmentIdentifier !== "beaker") return;
    const handler = () => setEnlargeAfterAnimation(true);
    window.addEventListener('oxalic_beaker_image_shown', handler as EventListener);
    return () => window.removeEventListener('oxalic_beaker_image_shown', handler as EventListener);
  }, [equipmentIdentifier]);
  useEffect(() => {
    if (stepId !== 5) setEnlargeAfterAnimation(false);
  }, [stepId]);

  // Enlarge volumetric flask image after the final pour animation completes (step 7)
  const [enlargeFlaskAfterPour, setEnlargeFlaskAfterPour] = useState(false);
  useEffect(() => {
    if (equipmentIdentifier !== "volumetric_flask") return;
    const handler = () => setEnlargeFlaskAfterPour(true);
    window.addEventListener('oxalic_flask_image_shown', handler as EventListener);
    return () => window.removeEventListener('oxalic_flask_image_shown', handler as EventListener);
  }, [equipmentIdentifier]);
  useEffect(() => {
    if (stepId !== 7) setEnlargeFlaskAfterPour(false);
  }, [stepId]);
  const isAnalytical = equipmentIdentifier === "analytical_balance";
  const isWeighingBoat = equipmentIdentifier === "weighing_boat";

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (position) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && position) {
        const rect = equipmentRef.current?.parentElement?.getBoundingClientRect();
        if (rect) {
          const newX = e.clientX - rect.left - dragOffset.x;
          const newY = e.clientY - rect.top - dragOffset.y;
          onDrag?.(id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag, id, position]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (onChemicalDrop) {
        onChemicalDrop(data.id, id, data.amount);
      }

      // If oxalic acid is dropped during the quantitative analysis step, show calculator reminder
      if (data && data.id === "oxalic_acid" && stepId === 3) {
        setShowCalculatorReminder(true);
        try {
          window.dispatchEvent(new CustomEvent('oxalicCalculatorReminder'));
        } catch {}
      }
    } catch (error) {
      console.error("Failed to parse drop data:", error);
    }
  }, [onChemicalDrop, id, stepId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const [showAcidWarning, setShowAcidWarning] = React.useState(false);
  const [acidWarningDismissed, setAcidWarningDismissed] = React.useState<boolean>(() => readAcidWarningDismissed());

  React.useEffect(() => {
    const stored = readAcidWarningDismissed();
    setAcidWarningDismissed((current) => (current === stored ? current : stored));
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleDismissed = (event: Event) => {
      const detail = (event as CustomEvent<boolean | undefined>).detail;
      const dismissedValue = typeof detail === "boolean" ? detail : true;
      acidWarningMemoryValue = dismissedValue;
      setAcidWarningDismissed((current) => (current === dismissedValue ? current : dismissedValue));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACID_WARNING_STORAGE_KEY) {
        return;
      }
      const dismissedValue = event.newValue === "true";
      acidWarningMemoryValue = dismissedValue;
      setAcidWarningDismissed((current) => (current === dismissedValue ? current : dismissedValue));
    };

    window.addEventListener(ACID_WARNING_EVENT, handleDismissed);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(ACID_WARNING_EVENT, handleDismissed);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    if (acidWarningDismissed) setShowAcidWarning(false);
  }, [acidWarningDismissed]);

  useEffect(() => {
    if (equipmentIdentifier !== "oxalic_acid" || stepId !== 3) {
      setShowCalculatorReminder(false);
    }
  }, [equipmentIdentifier, stepId]);

  useEffect(() => {
    if (!showCalculatorReminder) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCalculatorReminder(false);
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [showCalculatorReminder]);

  React.useEffect(() => {
    if (!showAcidWarning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAcidWarning(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showAcidWarning]);

    const getEquipmentContent = () => {
    const totalVolume = chemicals.reduce((sum, chemical) => sum + chemical.amount, 0);

    switch (equipmentIdentifier) {
      case "analytical_balance":
        const oxalicAcid = chemicals.find(c => c.id === "oxalic_acid");
        return (
          <div className="text-center">
            {imageSrc ? (
              <TransparentImage
                src={imageSrc}
                alt={name}
                className={
                  isAnalytical && position
                    ? "mx-auto block h-[22rem] w-auto object-contain"
                    : "w-28 h-28 mx-auto mb-2 object-contain"
                }
                tolerance={245}
                colorDiff={8}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <Scale className={isAnalytical && position ? "w-12 h-12 mx-auto mb-2 text-gray-600" : "w-8 h-8 mx-auto mb-2 text-gray-600"} />
            )}
            {oxalicAcid && (
              <div className="mt-2 text-xs">
                <div
                  role="button"
                  tabIndex={0}
                  data-open-acid-warning="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (stepId === 3) {
                      const dismissed = acidWarningDismissed || readAcidWarningDismissed();
                      if (!dismissed) {
                        setShowAcidWarning(true);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && stepId === 3) {
                      const dismissed = acidWarningDismissed || readAcidWarningDismissed();
                      if (!dismissed) {
                        setShowAcidWarning(true);
                      }
                    }
                  }}
                  className="bg-black text-green-400 px-2 py-1 rounded font-mono inline-block cursor-pointer"
                >
                  {(oxalicAcid.amount / 1000).toFixed(4)} g
                </div>
              </div>
            )}

          </div>
        );

      case "volumetric_flask":
        const isAtMark = preparationState?.finalVolume;
        const isNearMark = preparationState?.nearMark;
        return (
          <div className="text-center relative">
            {imageSrc ? (
              <TransparentImage
                src={imageSrc}
                alt={name}
                className={position ? (enlargeFlaskAfterPour ? "mx-auto mb-2 h-56 md:h-64 w-auto object-contain mix-blend-multiply pointer-events-none select-none transition-transform duration-500 scale-105" : "mx-auto mb-2 h-40 w-auto object-contain mix-blend-multiply pointer-events-none select-none") : "mx-auto mb-2 h-24 w-auto object-contain mix-blend-multiply pointer-events-none select-none"}
                tolerance={245}
                colorDiff={8}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <FlaskConical className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            )}
            <div className="text-xs space-y-1">
              <div>250 mL</div>
              {chemicals.length > 0 && (
                <div
                  className="w-6 h-8 mx-auto rounded-b-full border"
                  style={{
                    backgroundColor: chemicals[0]?.color || "#87CEEB",
                    opacity: 0.7,
                    height: isAtMark ? "32px" : isNearMark ? "28px" : "20px"
                  }}
                />
              )}
              {isAtMark && stepId !== 7 && (
                <div className="text-green-600 font-bold">At Mark!</div>
              )}
            </div>
          </div>
        );
      case "weighing_boat":
        return (
          <div className="relative flex justify-center">
            {imageSrc ? (
              <TransparentImage
                src={imageSrc}
                alt={name}
                className={`${position ? "h-40" : "h-24"} w-auto object-contain mix-blend-multiply pointer-events-none select-none`}
                tolerance={245}
                colorDiff={8}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              icon
            )}
          </div>
        );

      case "stirrer":
        return (
          <div className="relative flex flex-col items-center">
            {imageSrc ? (
              <TransparentImage
                src={imageSrc}
                alt={name}
                className={position ? "h-40 w-auto object-contain pointer-events-none select-none" : "h-24 w-auto object-contain pointer-events-none select-none"}
                tolerance={245}
                colorDiff={8}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              icon
            )}
            <div className="mt-2">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onAction?.("stir", id); }}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Use Stirrer
              </button>
            </div>
          </div>
        );

      case "oxalic_acid":
        return (
          <div className="relative flex justify-center">
            <button
              type="button"
              className="flex items-center justify-center rounded-full bg-transparent p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              data-open-acid-reminder="true"
              onClick={(event) => {
                event.stopPropagation();
                if (stepId === 3) {
                  setShowCalculatorReminder(true);
                  try {
                    window.dispatchEvent(new CustomEvent('oxalicCalculatorReminder'));
                  } catch {}
                }
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {icon}
              <span className="sr-only">Open calculator reminder</span>
            </button>
            <p className="mt-2 text-xs text-gray-700">{name}</p>
          </div>
        );

      case "beaker":
        const hasOxalicAcid = chemicals.some(c => c.id === "oxalic_acid");
        const hasWater = chemicals.some(c => c.id === "distilled_water");
        const showCustomBeakerImage = !!imageSrc && (stepId === 4 || stepId === 6 || stepId === 7 || !!position);

        return (
          <div className="text-center relative">
            {showCustomBeakerImage ? (
              (() => {
                const hasWaterNow = chemicals.some(c => (c.id || '').toString().toLowerCase().includes('distilled'));
                // Use reasonable sizes for step 7 (smaller than before) and keep step 6 moderately large during mixing
                const heightClass = position
                  ? (stepId === 7 ? "h-48 md:h-56" : (stepId === 6 ? "h-56 md:h-72" : (stepId === 5 && (hasWaterNow || enlargeAfterAnimation) ? "h-40 md:h-48" : "h-40")))
                  : (stepId === 7 ? "h-32" : "h-24");

                // For step 5 we reduce the scale so the beaker appears smaller when water is present
                const scaleClass = stepId === 7 ? 'scale-100 md:scale-105' : (stepId === 6 ? 'scale-105 md:scale-110' : (stepId === 5 && (hasWaterNow || enlargeAfterAnimation) ? 'scale-100' : ''));

                return (
                  <TransparentImage
                    src={imageSrc}
                    alt={name}
                    className={`mx-auto mb-2 ${heightClass} w-auto object-contain mix-blend-multiply pointer-events-none select-none transition-transform duration-500 ${scaleClass}`}
                    tolerance={245}
                    colorDiff={8}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                );
              })()
            ) : (
              <Beaker className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            )}
            <div className="text-xs space-y-1">
              <div>100 mL</div>

              {/* Show stirring animation when both chemicals are present and stirring is active */}
              {preparationState?.stirrerActive && hasOxalicAcid && hasWater ? (
                <StirringAnimation
                  isActive={true}
                  containerWidth={32}
                  containerHeight={48}
                  stirringSpeed="medium"
                  solutionColor="#87ceeb"
                />
              ) : chemicals.length > 0 ? (
                <div
                  className="w-4 h-6 mx-auto rounded-b border"
                  style={{
                    backgroundColor: chemicals[0]?.color || "#87CEEB",
                    opacity: 0.7,
                    height: `${Math.min(24, totalVolume / 2)}px`
                  }}
                />
              ) : null}

              {/* Show dissolution animation when crystals are dissolving */}
              {hasOxalicAcid && hasWater && !preparationState?.dissolved && (
                <div className="absolute inset-0 pointer-events-none">
                  <DissolutionAnimation
                    isActive={true}
                    containerWidth={32}
                    containerHeight={48}
                    onComplete={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            {imageSrc ? (
              <TransparentImage
                src={imageSrc}
                alt={name}
                className="w-32 h-32 mx-auto mb-2 object-contain mix-blend-multiply pointer-events-none select-none"
                tolerance={245}
                colorDiff={8}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              icon
            )}
            <div className="text-xs mt-1">{name}</div>
          </div>
        );
    }
  };

  const canAcceptChemical = (chemicalId: string) => {
    const eqId = equipmentIdentifier;
    switch (eqId) {
      case "analytical_balance":
        return chemicalId === "oxalic_acid";
      case "beaker":
        return true;
      case "volumetric_flask":
        return preparationState?.transferredToFlask || false;
      default:
        return false;
    }
  };

  const getActionButton = () => {
    const eqId = equipmentIdentifier;
    switch (eqId) {
      case "analytical_balance":
        if (chemicals.some(c => c.id === "oxalic_acid")) {
          return (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAction?.("weigh", id); }}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Record Weight
            </button>
          );
        }
        break;
      case "beaker":
        if (chemicals.length > 0 && !preparationState?.dissolved) {
          return (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAction?.("stir", id); }}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              Stir
            </button>
          );
        }
        break;
      case "volumetric_flask":
        // Do not show the mixing label on the volumetric flask image during step 6
        if (stepId !== 6 && preparationState?.nearMark && !preparationState?.finalVolume) {
          return (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAction?.("adjust_volume", id); }}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
            >
              Mixing of acid with distilled water
            </button>
          );
        }
        break;
      case "oxalic_acid":
        return null;
      case "wash_bottle":
        return (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onAction?.("rinse", id); }}
            className="text-xs bg-blue-400 text-white px-2 py-1 rounded hover:bg-blue-500"
          >
            Rinse Beaker
          </button>
        );
    }
    return null;
  };

  if (!position) {
    return (
      <div
        className={`p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-grab hover:border-blue-400 transition-colors ${
          isHovered ? "shadow-md" : ""
        }`}
        draggable
        onDragStart={(e) => {
          const payload: any = { id, name };
          // Attach images for certain draggable items so drops render the image on the workbench
          if (id === 'weighing_boat' || id === 'weighing-boat' || name.toLowerCase().includes('weighing boat')) {
            payload.imageSrc = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fe5172de4d6d44841bdba84ffd667286e?format=webp&width=800";
          }

          // Attach beaker image so when a beaker is dropped into the workbench it shows the provided image
          if (id === 'beaker' || name.toLowerCase().includes('beaker')) {
            payload.imageSrc = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F2cdb1bf8e78d4140840cb99a7f302fc8?format=webp&width=800";
          }

          // Attach wash bottle image so when a wash bottle is dropped it shows the provided transparent image
          if (
            id === 'wash_bottle' ||
            id === 'wash-bottle' ||
            name.toLowerCase().includes('wash bottle') ||
            name.toLowerCase().includes('wash-bottle') ||
            name.toLowerCase().includes('wash')
          ) {
            payload.imageSrc = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fbe18414e41004082b9629bd25c359dcb?format=webp&width=800";
          }

          // Attach volumetric flask image for drops (use transparent PNG/WebP)
          if (
            id === 'volumetric_flask' ||
            id === 'volumetric-flask' ||
            name.toLowerCase().includes('volumetric flask') ||
            name.toLowerCase().includes('volumetric-flask') ||
            name.toLowerCase().includes('flask')
          ) {
            payload.imageSrc = undefined as any;
          }

          e.dataTransfer.setData("text/plain", JSON.stringify(payload));
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="text-center">
          {icon}
          <p className="text-xs font-medium mt-2 text-gray-700">{name}</p>
        </div>
      </div>
    );
  }

  const hasCustomImage = !!imageSrc || (position as any)?.isBottle;
  const containerClass = isAnalytical || isWeighingBoat || hasCustomImage
    ? `absolute bg-transparent p-0 border-0 shadow-none cursor-move select-none transition-transform ${isDragging ? 'scale-105' : ''}`
    : `absolute bg-white rounded-lg border-2 p-3 shadow-lg cursor-move select-none transition-all ${isDragging ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-300 hover:border-blue-400'}`;

  return (
    <div
      ref={equipmentRef}
      data-equipment-type={equipmentIdentifier}
      data-equipment-id={id}
      className={containerClass}
      style={{
        left: position.x,
        top: position.y,
        zIndex: (() => {
          if (isDragging) return 1000;
          try {
            const key = (equipmentIdentifier || '').toString().toLowerCase();
            if (key.includes('beaker')) return 500;
            if (key.includes('wash') || key.includes('wash_bottle') || key.includes('wash-bottle')) return 150;
          } catch {}
          return 10;
        })(),
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        const acidOpener = (e.target as HTMLElement).closest('[data-open-acid-warning="true"]');
        if (acidOpener && chemicals.some((c) => c.id === "oxalic_acid") && stepId === 3) {
          const dismissed = acidWarningDismissed || readAcidWarningDismissed();
          if (!dismissed) {
            setShowAcidWarning(true);
          }
          return;
        }

        const reminderOpener = (e.target as HTMLElement).closest('[data-open-acid-reminder="true"]');
        if (reminderOpener && equipmentIdentifier === "oxalic_acid" && stepId === 3) {
          setShowCalculatorReminder(true);
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {getEquipmentContent()}

      {/* Action Button: render as absolute overlay so clicks are not intercepted by other layers */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 6, zIndex: 1100, pointerEvents: 'auto' }}>
        {getActionButton()}
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}

      {/* Details Tooltip */}
      {showDetails && chemicals.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs rounded p-2 whitespace-nowrap z-50">
          <div className="space-y-1">
            {chemicals.map((chemical, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chemical.color }}
                />
                <span>{chemical.name}: {chemical.amount}g</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
      )}

      {/* Acid added warning modal - rendered at component root so it appears regardless of equipment type */}
      {showAcidWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Acid caution"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Caution</h3>
                <p className="mt-2 text-sm text-gray-700">Be careful while you add the acid into the machine to tare. Make sure you open the calculator and verify the required amount before proceeding.</p>
                <div className="mt-4 flex items-center justify-end space-x-3">
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); setShowAcidWarning(false); }}>Close</Button>
                  <Button onClick={(e) => { e.stopPropagation(); setAcidWarningDismissed(true); persistAcidWarningDismissed(true); setShowAcidWarning(false); }}>Got it</Button>
                </div>
                <p className="mt-3 text-xs text-gray-500">This message will not show again after you click "Got it".</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCalculatorReminder && stepId === 3 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Calculator reminder"
          onClick={(event) => {
            event.stopPropagation();
            setShowCalculatorReminder(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Reminder</h3>
            <p className="mt-2 text-sm text-gray-700">Before adding the amount of acid into the boat make sure you open the calculator once!</p>
            <div className="mt-4 flex items-center justify-center space-x-3">
              <Button
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowCalculatorReminder(false);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
