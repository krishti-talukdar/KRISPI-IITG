import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Beaker,
  FlaskConical,
  TestTube,
  Droplet,
  Thermometer,
} from "lucide-react";
import TransparentImage from "./TransparentImage";

interface EquipmentProps {
    id: string;
    name: string;
    icon: React.ReactNode;
    imageSrc?: string;
    onDrag: (id: string, x: number, y: number) => void;
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
    cobaltReactionState?: {
      cobaltChlorideAdded: boolean;
      distilledWaterAdded: boolean;
      stirrerActive: boolean;
      colorTransition: "blue" | "transitioning" | "pink";
      step3WaterAdded: boolean;
    };
    allEquipmentPositions?: Array<{
      id: string;
      x: number;
      y: number;
      chemicals: any[];
    }>;
    currentStep?: number;
    disabled?: boolean;
    isCobaltAnimation?: boolean;
    color?: string;
    volume?: number;
    onInteract?: (id: string) => void;
}

export const Equipment: React.FC<EquipmentProps> = ({
  id,
  name,
  icon,
  onDrag,
  position,
  chemicals = [],
  onChemicalDrop,
  onRemove,
  cobaltReactionState,
  allEquipmentPositions = [],
  currentStep = 1,
  disabled = false,
  isCobaltAnimation = false,
  color,
  volume,
  onInteract,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Use immediate positioning for responsive movement
  const currentPosition = position;
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [pointerStartPos, setPointerStartPos] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef(0);
  const animationFrameId = useRef<number>();

  // Heating states for test tube
  const [showHeatingMessage, setShowHeatingMessage] = useState(false);
  const [finalVolumeUsed, setFinalVolumeUsed] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const v = e?.detail?.volumeUsed;
      if (typeof v === 'number' && !isNaN(v)) setFinalVolumeUsed(v);
    };
    window.addEventListener('finalVolumeUsedUpdated', handler as EventListener);
    return () => window.removeEventListener('finalVolumeUsedUpdated', handler as EventListener);
  }, []);
  const [useHeatedImage, setUseHeatedImage] = useState(false);
  const [heatingStartTime, setHeatingStartTime] = useState<number | null>(null);
  const [showEndothermicMessage, setShowEndothermicMessage] = useState(false);
  const [shouldHideBeaker, setShouldHideBeaker] = useState(false);
  const [useFinalImage, setUseFinalImage] = useState(false);

  // Cooling states for test tube (Step 5)
  const [showCoolingMessage, setShowCoolingMessage] = useState(false);
  const [useCooledImage, setUseCooledImage] = useState(false);
  const [coolingStartTime, setCoolingStartTime] = useState<number | null>(null);
  const [showExothermicMessage, setShowExothermicMessage] = useState(false);
  const [shouldHideColdBeaker, setShouldHideColdBeaker] = useState(false);
  const [useCooledFinalImage, setUseCooledFinalImage] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    // Provide both a custom type and a text/plain fallback so drops work across browsers
    try {
      e.dataTransfer.setData("equipment", id);
      e.dataTransfer.setData("text/plain", id);
      // Also include a small JSON payload for richer consumers
      e.dataTransfer.setData("application/json", JSON.stringify({ id, name }));
    } catch (err) {
      // Some environments may throw when setting multiple types; ignore silently
      try {
        e.dataTransfer.setData("text/plain", id);
      } catch (e) {
        // ignore
      }
    }

    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setDragStartTime(Date.now());

    // Calculate offset from mouse to equipment center for precise positioning
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setDragOffset({
      x: e.clientX - rect.left - centerX,
      y: e.clientY - rect.top - centerY,
    });

    // Create lightweight drag preview for better performance
    const dragPreview = document.createElement("div");
    dragPreview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 100px;
      height: 120px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: none;
      will-change: transform;
    `;

    // Add lightweight icon
    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      font-size: 36px;
      color: #1d4ed8;
      margin-bottom: 4px;
    `;
    iconContainer.innerHTML = getIconSVG(id);

    // Add simple label
    const label = document.createElement("div");
    label.style.cssText = `
      font-size: 12px;
      font-weight: 500;
      color: #1e40af;
      text-align: center;
    `;
    label.textContent = name;

    dragPreview.appendChild(iconContainer);
    dragPreview.appendChild(label);
    document.body.appendChild(dragPreview);

    e.dataTransfer.setDragImage(dragPreview, 50, 60);

    // Cleanup
    setTimeout(() => {
      if (dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setDragStartTime(0);
  };

  // Smooth pointer-based dragging for stirrer
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (id !== "stirring_rod") return;

      e.preventDefault();
      e.stopPropagation();

      const element = elementRef.current;
      if (!element) return;

      element.setPointerCapture(e.pointerId);
      setIsPointerDragging(true);
      setIsDragging(true);

      const rect = element.getBoundingClientRect();
      setPointerStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [id],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDragging || id !== "stirring_rod") return;

      e.preventDefault();

      // Throttle updates to 60fps for ultra-smooth performance
      const now = performance.now();
      if (now - lastUpdateTime.current < 16) return; // ~60fps
      lastUpdateTime.current = now;

      // Cancel previous animation frame if it exists
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        // Get the workbench element
        const workbench = document.querySelector('[data-workbench="true"]');
        if (!workbench) return;

        const workbenchRect = workbench.getBoundingClientRect();
        const x = e.clientX - workbenchRect.left - pointerStartPos.x;
        const y = e.clientY - workbenchRect.top - pointerStartPos.y;

        // Constrain to workbench bounds
        const minMargin = 30;
        const maxX = workbenchRect.width - minMargin;
        const maxY = workbenchRect.height - minMargin;

        const clampedX = Math.max(minMargin, Math.min(x, maxX));
        const clampedY = Math.max(minMargin, Math.min(y, maxY));

        // Update position immediately
        onDrag(id, clampedX, clampedY);
      });
    },
    [isPointerDragging, id, pointerStartPos, onDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (id !== "stirring_rod") return;

      const element = elementRef.current;
      if (element) {
        element.releasePointerCapture(e.pointerId);
      }

      // Clean up animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
      }

      setIsPointerDragging(false);
      setIsDragging(false);
    },
    [id],
  );

  const handleDoubleClick = () => {
    if (isOnWorkbench && onRemove) {
      onRemove(id);
    }
  };

  const getIconSVG = (equipmentId: string) => {
    const svgMap: Record<string, string> = {
      beaker: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 3h5v5.5l3.5 5.5v6c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-6l3.5-5.5V3zm1 1v4.5L7 14v6h10v-6l-3.5-5.5V4h-3z"/></svg>`,
      flask: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2v4.5L6 12v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8l-3-5.5V2H9zm2 2h2v4.5l3 5.5v6H8v-6l3-5.5V4z"/></svg>`,
      burette: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v18l-1 2-1-2V2zm0 3h2v13h-2V5z"/></svg>`,
      thermometer: `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M17 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 14V4c0-1.66 1.34-3 3-3s3 1.34 3 3v10c1.21.91 2 2.37 2 4 0 2.76-2.24 5-5 5s-5-2.24-5-5c0-1.63.79-3.09 2-4z"/></svg>`,
    };
    return svgMap[equipmentId] || svgMap.beaker;
  };

  const handleChemicalDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleChemicalDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleChemicalDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDropping(true);

    const chemicalData = e.dataTransfer.getData("chemical");
    if (chemicalData && onChemicalDrop) {
      const chemical = JSON.parse(chemicalData);
      onChemicalDrop(chemical.id, id, chemical.volume || 25);

      // Show success feedback
      console.log(
        `Added ${chemical.volume || 25}mL of ${chemical.name} to ${name}`,
      );

      // Reset dropping animation with smooth transition
      setTimeout(() => setIsDropping(false), 800);
    }
  };

  const isOnWorkbench = position && (position.x !== 0 || position.y !== 0);
  const isContainer = [
    "beaker",
    "flask",
    "burette",
    "erlenmeyer_flask",
    "conical_flask",
    "test_tubes",
    "beakers",
  ].includes(id);

  // Compute effective position for certain reagents: anchor ammonium bottles relative to the test tube
  const effectivePosition: { x: number; y: number } | null = (() => {
    if (!isOnWorkbench || !currentPosition) return currentPosition;
    const lowerId = id.toLowerCase();
    const lowerName = name.toLowerCase();
    const isAmmoniumBottle = lowerId.includes('nh4oh') || lowerId.includes('nh4cl') || lowerName.includes('ammonium hydroxide') || lowerName.includes('ammonium chloride');
    if (!isAmmoniumBottle) return currentPosition;

    // Find test tube position by commonly used ids
    const testTubePos = allEquipmentPositions.find(
      (p) => p.id === 'test-tube' || p.id === 'test_tubes' || p.id === 'test-tubes',
    );
    if (!testTubePos) return currentPosition;

    // Place bottles to the right of the test tube, stacked vertically
    const offsetX = 90; // horizontal offset from test tube center
    const offsetY = lowerId.includes('nh4oh') || lowerName.includes('ammonium hydroxide') ? -40 : 40;

    return { x: testTubePos.x + offsetX, y: testTubePos.y + offsetY };
  })();

  // Calculate mixed color from all chemicals
  const getMixedColor = () => {
    if (chemicals.length === 0) return "transparent";
    if (chemicals.length === 1) return chemicals[0].color;

    // Enhanced color mixing for chemical reactions
    const chemicalIds = chemicals.map((c) => c.id).sort();

    // Specific reaction colors
    if (chemicalIds.includes("hcl") && chemicalIds.includes("naoh")) {
      if (chemicalIds.includes("phenol")) {
        return "#FFB6C1"; // Pink when phenolphthalein is added to basic solution
      }
      return "#E8F5E8"; // Light green for neutralization
    }

    if (chemicalIds.includes("phenol") && chemicalIds.includes("naoh")) {
      return "#FF69B4"; // Bright pink
    }

    // Default color mixing
    let r = 0,
      g = 0,
      b = 0,
      totalAmount = 0;

    chemicals.forEach((chemical) => {
      const color = chemical.color;
      const amount = chemical.amount;

      const hex = color.replace("#", "");
      const rVal = parseInt(hex.substr(0, 2), 16);
      const gVal = parseInt(hex.substr(2, 2), 16);
      const bVal = parseInt(hex.substr(4, 2), 16);

      r += rVal * amount;
      g += gVal * amount;
      b += bVal * amount;
      totalAmount += amount;
    });

    if (totalAmount === 0) return "transparent";

    r = Math.round(r / totalAmount);
    g = Math.round(g / totalAmount);
    b = Math.round(b / totalAmount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getSolutionHeight = () => {
    const totalVolume = chemicals.reduce(
      (sum, chemical) => sum + chemical.amount,
      0,
    );
    return Math.min(85, (totalVolume / 100) * 85);
  };

  const getEquipmentSpecificRendering = () => {
    if (!isOnWorkbench) {
      return icon; // Use simple icons when not on workbench
    }

    // Use provided images for specific equipment types with bigger sizes

    // pH paper / universal indicator rendering on workbench
    if (
      id === "universal-indicator" ||
      id.toLowerCase().includes("ph") ||
      name.toLowerCase().includes("ph")
    ) {
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-24 h-8 relative overflow-visible mb-2"
            style={{ backgroundColor: color || "transparent" }}
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fa1eea72a49464b2f93611a90f0edd819?format=webp&width=800"
              alt="pH Paper"
              className="w-full h-full object-contain"
              style={{ mixBlendMode: "multiply", opacity: 0.95, transform: "rotate(0) scale(5)", transformOrigin: "center" }}
            />
          </div>
        </div>
      );
    }

    // Render reagent bottles (HCl variants) as styled tiles like cobalt/HCl in EquilibriumShift
    if (id.startsWith("hcl-") || id.startsWith("hcl_")) {
      const concentration = id === "hcl-0-1m" ? "HCl 0.1M" : id === "hcl-0-01m" ? "HCl 0.01M" : id === "hcl-0-001m" ? "HCl 0.001M" : "HCl";

      // If positioned on the workbench render as a white card with the bottle tile and a label underneath
      if (position) {
        // Match reference: all HCl variants render as a white card with the bottle and concentration label inside
        const insideLabel = id === "hcl-0-1m" ? "0.1 M HCl" : id === "hcl-0-01m" ? "0.01 M HCl" : id === "hcl-0-001m" ? "0.001 M HCl" : concentration;
        return (
          <div className="w-28 rounded-xl bg-white border border-gray-200 shadow-md p-3 flex flex-col items-center cursor-pointer" onClick={() => onInteract && onInteract(id)}>
            <div className="w-20 h-20 rounded-md bg-bottle-yellow border border-gray-200 chemical-bottle-shadow flex items-center justify-center">
              {icon}
            </div>
            <div className="mt-2 text-[13px] font-medium text-gray-700">{insideLabel}</div>
          </div>
        );
      }

      // Default toolbar rendering when not on workbench
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 border-2 border-gray-300 relative overflow-hidden mb-2 shadow-sm"
            style={{ backgroundColor: '#fffacd' }}
          >
            <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-yellow-200 to-transparent opacity-60" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-yellow-600 opacity-60">
              <Droplet className="w-7 h-7" />
            </div>
          </div>
          <span className="text-xs font-medium text-center">{name}</span>
          <span className="text-xs text-yellow-600 font-semibold">{concentration}</span>
        </div>
      );
    }

    if (id === "test_tubes" || id === "test-tube" || id === "test-tube") {
      // Check if test tube is being heated (positioned above hot water beaker in step 4)
      const isBeingHeated = () => {
        if (!position) return false;

        const hotWaterBeaker = allEquipmentPositions.find(
          (pos) => pos.id === "beaker_hot_water",
        );

        if (!hotWaterBeaker) return false;

        // Check if test tube is positioned above the hot water beaker
        const horizontalDistance = Math.abs(position.x - hotWaterBeaker.x);
        const verticalDistance = position.y - hotWaterBeaker.y;

        // Test tube should be directly above and very close (exact match to user's image)
        return (
          horizontalDistance < 25 &&
          verticalDistance < -15 &&
          verticalDistance > -60
        );
      };

      // Check if test tube is being cooled (positioned above cold water beaker in step 5)
      const isBeingCooled = () => {
        if (!position) return false;

        const coldWaterBeaker = allEquipmentPositions.find(
          (pos) => pos.id === "beaker_cold_water",
        );

        if (!coldWaterBeaker) return false;

        // Check if test tube is positioned above the cold water beaker
        const horizontalDistance = Math.abs(position.x - coldWaterBeaker.x);
        const verticalDistance = position.y - coldWaterBeaker.y;

        // Test tube should be directly above and very close
        return (
          horizontalDistance < 25 &&
          verticalDistance < -15 &&
          verticalDistance > -60
        );
      };

      // Determine which test tube image to show based on reaction state
      const getTestTubeImage = () => {
        // If cooled final image should be shown (after exothermic reaction message in step 5)
        if (useCooledFinalImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fbb47062bd82c4f868e040d020060d188%2Feeb7df22fe61456fba4189a1ac007f37?format=webp&width=800";
        }

        // If cooled and timer has elapsed, show the cooled image
        if (useCooledImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fb1188745942143ac9c8fd37f58bda34d?format=webp&width=800";
        }

        // If final image should be shown (after endothermic reaction message)
        if (useFinalImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fa69b69c7f47a433993fca4f013c4c0f2?format=webp&width=800";
        }

        // If heated and timer has elapsed, show the heated image
        if (useHeatedImage) {
          // Use the new heated image (since user is in experiment 3)
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fb1188745942143ac9c8fd37f58bda34d?format=webp&width=800";
        }

        // Check if HCl has been added to the test tube
        const hasHCl = chemicals.some((c) => c.id === "hcl_conc");

        // If step 3 water is added, show the user's provided pink image
        if (cobaltReactionState?.step3WaterAdded) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fbb47062bd82c4f868e040d020060d188%2Feeb7df22fe61456fba4189a1ac007f37?format=webp&width=800";
        }
        // If HCl is added to existing solution, show blue equilibrium image
        else if (
          hasHCl &&
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          return "https://cdn.builder.io/api/v1/image/assets%2F9f88423319a248faa5a2c8b5f85cccbb%2Febd9b66616e24e5fb31410143537ddbc?format=webp&width=800";
        }
        // If stirrer is active and we have cobalt + water, transition to pink
        else if (
          cobaltReactionState?.stirrerActive &&
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          // Pink liquid test tube (after stirring)
          return "https://cdn.builder.io/api/v1/image/assets%2F4fe18c7cc7824ff98352705750053deb%2F280bbef2140249df9531563786b4bae0?format=webp&width=800";
        } else if (
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          // Blue liquid test tube (after adding cobalt chloride and distilled water)
          return "https://cdn.builder.io/api/v1/image/assets%2Fc2053654ab564f8eb91577d73cfc950b%2Ff2f21a05efba467181e7b9b481f8d4e1?format=webp&width=800";
        } else if (cobaltReactionState?.cobaltChlorideAdded) {
          // Test tube with cobalt chloride solid at bottom
          return "https://cdn.builder.io/api/v1/image/assets%2Fc2053654ab564f8eb91577d73cfc950b%2F4049c3f958624bc1b8c72f54865b618d?format=webp&width=800";
        } else {
          // Default empty test tube
          return "https://cdn.builder.io/api/v1/image/assets%2F4fe18c7cc7824ff98352705750053deb%2Fa4603d4891d44fadbfe3660d27a3ae36?format=webp&width=800";
        }
      };

      const heating = isBeingHeated();
      const cooling = isBeingCooled();

      // Handle heating state changes
      useEffect(() => {
        if (heating && !heatingStartTime) {
          // Start heating - show message immediately
          setHeatingStartTime(Date.now());
          setShowHeatingMessage(true);

          // Hide message after 1 second and replace image
          setTimeout(() => {
            setShowHeatingMessage(false);
            setUseHeatedImage(true);

            // Remove beaker and show endothermic message
            setShouldHideBeaker(true);
            setShowEndothermicMessage(true);
            console.log("Endothermic message should now be visible");

            // Keep endothermic message visible and show final image
            setUseFinalImage(true);

            // Auto-advance to step 5 after keeping the message visible for longer
            if (onRemove && currentStep === 4) {
              setTimeout(() => {
                // Hide the message before advancing
                setShowEndothermicMessage(false);

                setTimeout(() => {
                  // This will trigger step completion in the parent component
                  const stepCompleteEvent = new CustomEvent("stepComplete", {
                    detail: { nextStep: 5 },
                  });
                  window.dispatchEvent(stepCompleteEvent);
                }, 500);
              }, 4000); // Keep message visible for 4 seconds
            }

            // Remove the hot water beaker from equipment list if onRemove is available
            if (onRemove) {
              setTimeout(() => {
                onRemove("beaker_hot_water");
              }, 500); // Small delay to show the message first
            }
          }, 500);
        } else if (!heating && heatingStartTime) {
          // Stopped heating - reset states
          setHeatingStartTime(null);
          setShowHeatingMessage(false);
          setUseHeatedImage(false);
          setShowEndothermicMessage(false);
          setShouldHideBeaker(false);
          setUseFinalImage(false);
        }
      }, [heating, heatingStartTime]);

      // Handle cooling state changes (Step 5)
      useEffect(() => {
        if (cooling && !coolingStartTime && currentStep === 5) {
          // Start cooling - show message immediately
          setCoolingStartTime(Date.now());
          setShowCoolingMessage(true);

          // Keep cooling message visible and replace image
          setUseCooledImage(true);

          // Keep cooling message visible for longer, then show exothermic message
          setTimeout(() => {
            setShowCoolingMessage(false);

            // Remove cold beaker and show exothermic message
            setShouldHideColdBeaker(true);
            setShowExothermicMessage(true);
            console.log("Exothermic message should now be visible");

            // Keep exothermic message visible for longer, then hide and show final image
            setTimeout(() => {
              setShowExothermicMessage(false);
              setUseCooledFinalImage(true);

              // Auto-advance to step 6 after keeping the message visible longer
              if (onRemove && currentStep === 5) {
                setTimeout(() => {
                  // This will trigger step completion in the parent component
                  const stepCompleteEvent = new CustomEvent("stepComplete", {
                    detail: { nextStep: 6 },
                  });
                  window.dispatchEvent(stepCompleteEvent);
                }, 500);
              }
            }, 4000); // Keep exothermic message visible for 4 seconds

            // Remove the cold water beaker from equipment list if onRemove is available
            if (onRemove) {
              setTimeout(() => {
                onRemove("beaker_cold_water");
              }, 500); // Small delay to show the message first
            }
          }, 3000); // Keep cooling message visible for 3 seconds
        } else if (!cooling && coolingStartTime) {
          // Stopped cooling - reset states
          setCoolingStartTime(null);
          setShowCoolingMessage(false);
          setUseCooledImage(false);
          setShowExothermicMessage(false);
          setShouldHideColdBeaker(false);
          setUseCooledFinalImage(false);
        }
      }, [cooling, coolingStartTime, currentStep]);

      const currentVolumeMl = (finalVolumeUsed ?? (typeof volume === 'number' ? volume : Math.max(0, chemicals.reduce((sum, c) => sum + (c.amount || 0), 0))));
      return (
        <div className="relative group">
          {/* Top badge */}
          {id === "test-tube" ? (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-300 shadow-sm">
              <span className="text-xs font-semibold text-gray-700">{`${Number(currentVolumeMl || 0).toFixed(1)} mL`}</span>
            </div>
          ) : (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-300 shadow-sm">
              <span className="text-xs font-semibold text-gray-700">25ml Test Tube</span>
            </div>
          )}

          <img
            key={getTestTubeImage()} // Force re-render when image changes
            src={getTestTubeImage()}
            alt="Laboratory Test Tube"
            className={`${
              cobaltReactionState?.cobaltChlorideAdded &&
              cobaltReactionState?.distilledWaterAdded
                ? "w-64 h-[40rem]"
                : cobaltReactionState?.cobaltChlorideAdded
                  ? "w-[36rem] h-[90rem]"
                  : "w-64 h-[40rem]"
            } object-contain transition-all duration-[3000ms] ease-in-out ${
              isDragging
                ? "scale-108 rotate-2 brightness-115"
                : heating
                  ? "group-hover:scale-103 group-hover:brightness-108 group-hover:rotate-0.5 animate-pulse"
                  : cooling
                    ? "group-hover:scale-103 group-hover:brightness-108 group-hover:rotate-0.5 animate-pulse"
                    : "group-hover:scale-103 group-hover:brightness-108 group-hover:rotate-0.5"
            }`}
            style={{
              filter: `drop-shadow(4px 8px 16px rgba(0,0,0,0.15)) ${
                isDragging
                  ? "drop-shadow(8px 16px 32px rgba(59,130,246,0.5)) drop-shadow(0 0 20px rgba(59,130,246,0.3))"
                  : heating
                    ? "drop-shadow(0 4px 8px rgba(0,0,0,0.1)) drop-shadow(0 0 15px rgba(255,165,0,0.6)) drop-shadow(0 0 25px rgba(255,69,0,0.4))"
                    : cooling
                      ? "drop-shadow(0 4px 8px rgba(0,0,0,0.1)) drop-shadow(0 0 15px rgba(0,191,255,0.6)) drop-shadow(0 0 25px rgba(30,144,255,0.4))"
                      : "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
              }`,
              imageRendering: "auto",
              transformOrigin: "center bottom",
              opacity:
                cobaltReactionState?.colorTransition === "transitioning"
                  ? 0.8
                  : 1,
            }}
          />
          {/* Liquid overlay for simple test-tube use (e.g., HCl pH experiment) */}
          {typeof volume === 'number' && volume > 0 && color && (
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '28px', width: '28px', height: '150px', overflow: 'hidden', borderRadius: '0 0 14px 14px' }}>
              <div
                className="absolute left-0 right-0 bottom-0 transition-all duration-500"
                style={{
                  height: `${Math.max(0, Math.min(150, ((Math.min(Math.max(volume, 0), 20) / 20) * 150)))}px`,
                  backgroundColor: color,
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.25), 0 0 3px rgba(0,0,0,0.1)',
                  opacity: 0.85,
                }}
              />
            </div>
          )}

          {/* Bottom label */}
          {id === "test-tube" ? (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-300 shadow-sm text-[10px] font-semibold text-gray-700">
              25ml Test Tube
            </div>
          ) : (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-300 shadow-sm text-[10px] font-semibold text-gray-700">
              {`${Number(currentVolumeMl || 0).toFixed(1)} mL`}
            </div>
          )}

          {/* Pink cobalt animation effects */}
          {isCobaltAnimation && (
            <>
              {/* Pink glow overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 rounded-b-3xl animate-pulse"
                  style={{
                    height: `${Math.max(30, (volume || 60) / 100 * 180)}px`,
                    background: 'linear-gradient(180deg, rgba(255,182,193,0.6), rgba(255,182,193,0.2))',
                    filter: 'blur(8px)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Pink sparkle effects */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-pink-400 rounded-full animate-ping"
                    style={{
                      left: `${45 + (i % 3) * 10}%`,
                      bottom: `${50 + (i % 2) * 20}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '1.8s'
                    }}
                  />
                ))}
              </div>

              {/* Pink shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-pink-400/20 to-transparent rounded-full animate-pulse pointer-events-none"
                   style={{ animationDuration: '2s' }} />
            </>
          )}

          {/* Heating effects when test tube is above hot water beaker */}
          {heating && (
            <>
              {/* Heat waves animation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-8 bg-gradient-to-t from-orange-400 to-transparent opacity-70 rounded-full"
                    style={{
                      left: `${45 + i * 15}%`,
                      bottom: "60%",
                      animation: `float 2s ease-in-out infinite ${i * 0.3}s`,
                      transform: `translateX(-50%) scaleY(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>

              {/* Heating indicator */}
              <div className="absolute -top-8 -right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold animate-bounce">
                🔥
              </div>

              {/* Gentle heating glow around test tube */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-transparent rounded-full animate-pulse pointer-events-none" />
            </>
          )}

          {/* Cooling effects when test tube is above cold water beaker */}
          {cooling && (
            <>
              {/* Cold waves animation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-8 bg-gradient-to-t from-blue-400 to-transparent opacity-70 rounded-full"
                    style={{
                      left: `${45 + i * 15}%`,
                      bottom: "60%",
                      animation: `float 2s ease-in-out infinite ${i * 0.3}s`,
                      transform: `translateX(-50%) scaleY(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>

              {/* Cooling indicator */}
              <div className="absolute -top-8 -right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold animate-bounce">
                ❄️
              </div>

              {/* Gentle cooling glow around test tube */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-400/20 to-transparent rounded-full animate-pulse pointer-events-none" />
            </>
          )}

          {/* Heating message */}
          {showHeatingMessage && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-lg whitespace-nowrap z-50">
              Temperature of test tube is rising!
            </div>
          )}

          {/* Cooling message */}
          {showCoolingMessage && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-lg whitespace-nowrap z-50">
              Temperature of test tube is falling!
            </div>
          )}

          {/* Endothermic reaction message */}
          {showEndothermicMessage && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-xl whitespace-nowrap z-[9999] border-2 border-white">
              🧪 Solution became blue again due to Endothermic Reaction! 🧪
            </div>
          )}

          {/* Exothermic reaction message */}
          {showExothermicMessage && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-6 py-3 rounded-lg text-lg font-bold animate-bounce shadow-xl whitespace-nowrap z-[9999] border-2 border-white">
              🧪 Solution became pink again due to Exothermic Reaction! 🧪
            </div>
          )}
        </div>
      );
    }

    if (id === "dropper") {
      return (
        <div className="relative">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fab3d7499a8fe404bb2836f6043ac08b4%2F66657d803e14427eaeecd21906ee09f6?format=webp&width=800"
            alt="Laboratory Dropper"
            className="w-24 h-32 object-contain drop-shadow-lg"
          />
          {/* Enhanced chemical composition display for droppers */}
          {chemicals.length > 0 && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-3 py-2 text-xs shadow-lg">
              <div className="text-gray-800 font-medium text-center">
                {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
              </div>
              <div className="text-gray-600 text-center">
                {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)}{" "}
                drops
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id === "beaker_hot_water") {
      // Hide beaker if it should be removed due to endothermic reaction
      if (shouldHideBeaker) {
        return null;
      }

      // Check if there's a test tube nearby that could be aligned
      const hasTestTubeNearby = () => {
        if (!position) return false;
        const testTube = allEquipmentPositions.find(
          (pos) => pos.id === "test_tubes" || pos.id === "test-tube" || pos.id === "test_tube",
        );
        if (!testTube) return false;
        const distance = Math.sqrt(
          Math.pow(position.x - testTube.x, 2) +
            Math.pow(position.y - testTube.y, 2),
        );
        return distance < 150;
      };

      return (
        <div className="relative">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fab3d7499a8fe404bb2836f6043ac08b4%2F0048f4f6e5dc45368c0cf303e98c220d?format=webp&width=800"
            alt="Hot Water Beaker"
            className="w-28 h-32 object-contain drop-shadow-lg"
          />

          {/* Steam animation */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-8 bg-gray-300 opacity-60 rounded-full animate-pulse"
                style={{
                  position: "absolute",
                  left: `${i * 5 - 5}px`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>

          {/* Chemical composition display */}
          {chemicals.length > 0 && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-3 py-2 text-xs shadow-lg">
              <div className="text-gray-800 font-medium text-center">
                Hot Water +{" "}
                {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
              </div>
              <div className="text-gray-600 text-center">
                {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id === "beaker_cold_water") {
      // Hide beaker if it should be removed due to exothermic reaction
      if (shouldHideColdBeaker) {
        return null;
      }

      return (
        <div className="relative">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fab3d7499a8fe404bb2836f6043ac08b4%2F03a7c3a8f18a4268a63a6a3a9300c780?format=webp&width=800"
            alt="Cold Water Beaker"
            className="w-28 h-32 object-contain drop-shadow-lg"
          />

          {/* Cold ice crystals animation */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-cyan-300 opacity-80 rounded-full animate-pulse"
                style={{
                  position: "absolute",
                  left: `${i * 6 - 9}px`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: "1.5s",
                }}
              />
            ))}
          </div>

          {/* Cold water indicator */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            C
          </div>
          {/* Chemical composition display */}
          {chemicals.length > 0 && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-3 py-2 text-xs shadow-lg">
              <div className="text-gray-800 font-medium text-center">
                Cold Water +{" "}
                {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
              </div>
              <div className="text-gray-600 text-center">
                {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id === "stirring_rod") {
      return (
        <div className="relative will-change-transform">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fab3d7499a8fe404bb2836f6043ac08b4%2Fc57e71c48b934b3389c584fe631276e8?format=webp&width=800"
            alt="Laboratory Stirring Rod"
            className={`w-24 h-32 object-contain ${isDragging ? "drop-shadow-2xl" : "drop-shadow-lg"} ${isDragging ? "transition-none" : "transition-all duration-200"}`}
            style={{
              transform: isDragging ? "scale(1.1)" : "scale(1)",
              filter: isDragging ? "brightness(1.1)" : "brightness(1)",
            }}
          />
        </div>
      );
    }

    // Realistic equipment renderings for workbench
    if (id === "burette") {
      return (
        <div className="relative">
          <svg
            width="60"
            height="160"
            viewBox="0 0 60 160"
            className="drop-shadow-lg"
          >
            {/* Burette body */}
            <defs>
              <linearGradient
                id="glassGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                <stop offset="50%" stopColor="rgba(240,248,255,0.8)" />
                <stop offset="100%" stopColor="rgba(219,234,254,0.9)" />
              </linearGradient>
              <linearGradient
                id="liquidGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.9"
                />
                <stop
                  offset="50%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.7"
                />
                <stop
                  offset="100%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.9"
                />
              </linearGradient>
            </defs>

            {/* Main burette tube */}
            <rect
              x="20"
              y="10"
              width="20"
              height="120"
              fill="url(#glassGradient)"
              stroke="#94a3b8"
              strokeWidth="1.5"
              rx="2"
            />

            {/* Burette top opening */}
            <ellipse
              cx="30"
              cy="10"
              rx="10"
              ry="3"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Volume markings */}
            <g
              stroke="#6b7280"
              strokeWidth="0.8"
              fill="#4b5563"
              fontSize="6"
              fontFamily="monospace"
            >
              <line x1="42" y1="20" x2="45" y2="20" />
              <text x="47" y="23">
                50
              </text>
              <line x1="42" y1="40" x2="44" y2="40" />
              <line x1="42" y1="50" x2="45" y2="50" />
              <text x="47" y="53">
                40
              </text>
              <line x1="42" y1="70" x2="44" y2="70" />
              <line x1="42" y1="80" x2="45" y2="80" />
              <text x="47" y="83">
                30
              </text>
              <line x1="42" y1="100" x2="44" y2="100" />
              <line x1="42" y1="110" x2="45" y2="110" />
              <text x="47" y="113">
                20
              </text>
              <line x1="42" y1="125" x2="45" y2="125" />
              <text x="47" y="128">
                10
              </text>
            </g>

            {/* Solution in burette */}
            {chemicals.length > 0 && (
              <rect
                x="22"
                y={130 - getSolutionHeight()}
                width="16"
                height={getSolutionHeight()}
                fill="url(#liquidGradient)"
                rx="1"
                className="transition-all duration-500"
              >
                {/* Liquid surface */}
                <animate
                  attributeName="y"
                  values={`${130 - getSolutionHeight()};${128 - getSolutionHeight()};${130 - getSolutionHeight()}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </rect>
            )}

            {/* Glass shine effect */}
            <rect
              x="23"
              y="15"
              width="4"
              height="110"
              fill="rgba(255,255,255,0.4)"
              rx="2"
            />

            {/* Burette stopcock */}
            <rect
              x="25"
              y="135"
              width="10"
              height="8"
              fill="#6b7280"
              stroke="#4b5563"
              strokeWidth="1"
              rx="2"
            />
            <circle cx="30" cy="139" r="2" fill="#374151" />

            {/* Tip */}
            <path
              d="M28 143 L30 148 L32 143 Z"
              fill="url(#glassGradient)"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Drop animation */}
            {isDropping && (
              <circle
                cx="30"
                cy="150"
                r="1.5"
                fill={getMixedColor()}
                className="animate-bounce"
              />
            )}
          </svg>
        </div>
      );
    }

    if (id === "flask" || id === "erlenmeyer_flask") {
      return (
        <div className="relative">
          <svg
            width="100"
            height="140"
            viewBox="0 0 100 140"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient
                id="flaskGlass"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="30%" stopColor="rgba(248,250,252,0.85)" />
                <stop offset="70%" stopColor="rgba(241,245,249,0.9)" />
                <stop offset="100%" stopColor="rgba(226,232,240,0.95)" />
              </linearGradient>
              <linearGradient
                id="flaskLiquid"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
                <stop
                  offset="50%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.7"
                />
                <stop
                  offset="100%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
              </linearGradient>
            </defs>

            {/* Flask body - conical shape */}
            <path
              d="M35 30 L35 45 L15 105 L85 105 L65 45 L65 30 Z"
              fill="url(#flaskGlass)"
              stroke="#94a3b8"
              strokeWidth="2"
            />

            {/* Flask neck */}
            <rect
              x="40"
              y="15"
              width="20"
              height="20"
              fill="url(#flaskGlass)"
              stroke="#94a3b8"
              strokeWidth="2"
              rx="3"
            />

            {/* Flask opening */}
            <ellipse
              cx="50"
              cy="15"
              rx="10"
              ry="3"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Volume markings */}
            <g
              stroke="#6b7280"
              strokeWidth="1"
              fill="#4b5563"
              fontSize="7"
              fontFamily="Arial"
            >
              <line x1="87" y1="65" x2="92" y2="65" />
              <text x="94" y="68">
                1000
              </text>
              <line x1="87" y1="75" x2="90" y2="75" />
              <line x1="87" y1="82" x2="92" y2="82" />
              <text x="94" y="85">
                800
              </text>
              <line x1="87" y1="89" x2="90" y2="89" />
              <line x1="87" y1="96" x2="92" y2="96" />
              <text x="94" y="99">
                600
              </text>
              <line x1="87" y1="100" x2="90" y2="100" />
              <text x="94" y="108">
                400
              </text>
            </g>

            {/* Label area */}
            <rect
              x="25"
              y="75"
              width="20"
              height="12"
              fill="rgba(255,255,255,0.9)"
              stroke="#d1d5db"
              strokeWidth="0.5"
              rx="2"
            />
            <text
              x="35"
              y="82"
              textAnchor="middle"
              fontSize="6"
              fill="#374151"
              fontWeight="bold"
            >
              1000ml
            </text>

            {/* Solution in flask */}
            {chemicals.length > 0 && (
              <path
                d={`M${20 + chemicals.length} ${105 - getSolutionHeight() * 0.6} L${80 - chemicals.length} ${105 - getSolutionHeight() * 0.6} L85 105 L15 105 Z`}
                fill="url(#flaskLiquid)"
                className="transition-all duration-500"
              />
            )}

            {/* Glass shine effects */}
            <ellipse
              cx="30"
              cy="55"
              rx="3"
              ry="15"
              fill="rgba(255,255,255,0.6)"
              opacity="0.8"
            />
            <ellipse
              cx="42"
              cy="25"
              rx="2"
              ry="8"
              fill="rgba(255,255,255,0.5)"
              opacity="0.7"
            />

            {/* Bubbling animation for reactions */}
            {chemicals.length > 1 && (
              <g>
                {[...Array(5)].map((_, i) => (
                  <circle
                    key={i}
                    cx={30 + i * 8}
                    cy={95 - (i % 2) * 8}
                    r="1.5"
                    fill="rgba(255,255,255,0.8)"
                    className="animate-bounce"
                    style={{
                      animationDelay: `${i * 0.4}s`,
                      animationDuration: "2s",
                    }}
                  />
                ))}
              </g>
            )}
          </svg>

          {/* Enhanced chemical composition display */}
          {chemicals.length > 0 && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-xs shadow-lg min-w-max">
              <div className="text-gray-800 font-semibold text-center">
                {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
              </div>
              <div className="text-gray-600 text-center">
                {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL
                total
              </div>
              <div
                className="w-full h-1 rounded-full mt-1"
                style={{ backgroundColor: getMixedColor() }}
              ></div>
            </div>
          )}
        </div>
      );
    }

    if (id === "beaker" && isOnWorkbench) {
      return (
        <div className="relative">
          {/* Use processed image with white background removed when possible and enlarge on workbench */}
          <TransparentImage
            src={imageSrc ?? "/assets/beaker.svg"}
            alt="Beaker"
            className={`w-36 h-36 object-contain drop-shadow-lg transition-transform duration-200 ${isDragging ? "scale-105" : ""}`}
            tolerance={245}
            colorDiff={8}
          />

          {chemicals.length > 0 && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-lg">
              <div className="text-gray-800 font-medium text-center">{chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}</div>
              <div className="text-gray-600 text-center">{chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL</div>
              <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: getMixedColor() }} />
            </div>
          )}
        </div>
      );
    }

    if (id === "beaker") {
      return (
        <div className="relative">
          <svg
            width="80"
            height="120"
            viewBox="0 0 80 120"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient
                id="beakerGlass"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="50%" stopColor="rgba(248,250,252,0.85)" />
                <stop offset="100%" stopColor="rgba(226,232,240,0.95)" />
              </linearGradient>
              <linearGradient
                id="beakerLiquid"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
                <stop
                  offset="50%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.7"
                />
                <stop
                  offset="100%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
              </linearGradient>
            </defs>

            {/* Beaker body */}
            <rect
              x="15"
              y="25"
              width="50"
              height="75"
              fill="url(#beakerGlass)"
              stroke="#94a3b8"
              strokeWidth="2"
              rx="4"
            />

            {/* Beaker spout */}
            <path
              d="M62 35 Q68 35 68 40 Q68 45 62 45"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
            />

            {/* Volume markings */}
            <g
              stroke="#6b7280"
              strokeWidth="1"
              fill="#4b5563"
              fontSize="7"
              fontFamily="Arial"
            >
              <line x1="67" y1="40" x2="72" y2="40" />
              <text x="74" y="43">
                500
              </text>
              <line x1="67" y1="55" x2="70" y2="55" />
              <line x1="67" y1="65" x2="72" y2="65" />
              <text x="74" y="68">
                400
              </text>
              <line x1="67" y1="75" x2="70" y2="75" />
              <line x1="67" y1="85" x2="72" y2="85" />
              <text x="74" y="88">
                300
              </text>
              <line x1="67" y1="90" x2="70" y2="90" />
              <text x="74" y="98">
                200
              </text>
            </g>

            {/* Solution in beaker */}
            {chemicals.length > 0 && (
              <rect
                x="18"
                y={95 - getSolutionHeight() * 0.8}
                width="44"
                height={getSolutionHeight() * 0.8 + 5}
                fill="url(#beakerLiquid)"
                rx="2"
                className="transition-all duration-500"
              />
            )}

            {/* Glass shine */}
            <rect
              x="20"
              y="30"
              width="6"
              height="60"
              fill="rgba(255,255,255,0.5)"
              rx="3"
              opacity="0.8"
            />

            {/* Cobalt chloride crystals - show blue crystals at bottom of beaker */}
            {cobaltReactionState?.cobaltChlorideAdded && (
              <g>
                {!cobaltReactionState?.distilledWaterAdded ? (
                  // Dry crystals before water is added
                  [...Array(8)].map((_, i) => (
                    <rect
                      key={i}
                      x={25 + (i % 3) * 6 + Math.random() * 4}
                      y={95 + (i % 2) * 3}
                      width="1.5"
                      height="1.5"
                      fill="#2563eb"
                      rx="0.5"
                      className="animate-pulse"
                      style={{
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: "2s",
                      }}
                    />
                  ))
                ) : (
                  // Wet crystals with water - more visible and realistic appearance
                  <>
                    {/* Dissolved/floating crystal particles - made larger and more visible */}
                    {[...Array(10)].map((_, i) => (
                      <circle
                        key={`dissolved-${i}`}
                        cx={24 + (i % 4) * 7 + ((i * 2) % 6)}
                        cy={87 + (i % 3) * 4 + ((i * 1.5) % 5)}
                        r={1.2 + (i % 3) * 0.5}
                        fill="#1e40af"
                        opacity={0.9}
                        className="animate-pulse"
                        style={{
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: "2s",
                        }}
                      />
                    ))}

                    {/* Remaining solid crystals at bottom - made larger and more prominent */}
                    {[...Array(6)].map((_, i) => (
                      <rect
                        key={`solid-${i}`}
                        x={25 + i * 4 + (i % 2) * 2}
                        y={95 + (i % 2) * 2}
                        width="2.5"
                        height="2.5"
                        fill="#1d4ed8"
                        rx="0.5"
                        opacity={0.95}
                        className="animate-pulse"
                        style={{
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: "1.8s",
                        }}
                      />
                    ))}

                    {/* Extra visible crystal chunks */}
                    {[...Array(4)].map((_, i) => (
                      <polygon
                        key={`chunk-${i}`}
                        points={`${28 + i * 6},${94} ${30 + i * 6},${96} ${32 + i * 6},${94} ${30 + i * 6},${92}`}
                        fill="#2563eb"
                        opacity={0.9}
                        className="animate-pulse"
                        style={{
                          animationDelay: `${i * 0.4}s`,
                          animationDuration: "2.2s",
                        }}
                      />
                    ))}

                    {/* Water with blue tint from dissolved crystals - more prominent */}
                    <rect
                      x="22"
                      y="88"
                      width="36"
                      height="10"
                      fill="rgba(37, 99, 235, 0.3)"
                      rx="2"
                      opacity="0.8"
                      className="animate-pulse"
                      style={{
                        animationDuration: "3s",
                      }}
                    />
                  </>
                )}
              </g>
            )}

            {/* Base */}
            <ellipse
              cx="40"
              cy="105"
              rx="25"
              ry="4"
              fill="url(#beakerGlass)"
              stroke="#94a3b8"
              strokeWidth="1"
            />
          </svg>

          {/* Crystal label for beaker */}
          {cobaltReactionState?.cobaltChlorideAdded && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-700 font-semibold whitespace-nowrap bg-blue-50 px-2 py-1 rounded text-center">
              {!cobaltReactionState?.distilledWaterAdded
                ? "Blue Cobalt Crystals"
                : "Hydrated Cobalt Crystals"}
            </div>
          )}
        </div>
      );
    }

    if (id === "thermometer") {
      return (
        <div className="relative">
          <svg
            width="25"
            height="140"
            viewBox="0 0 25 140"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient
                id="thermometerGlass"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(241,245,249,0.9)" />
              </linearGradient>
              <linearGradient id="mercury" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>

            {/* Thermometer tube */}
            <rect
              x="8"
              y="10"
              width="9"
              height="110"
              fill="url(#thermometerGlass)"
              stroke="#94a3b8"
              strokeWidth="1.5"
              rx="4"
            />

            {/* Mercury bulb */}
            <circle
              cx="12.5"
              cy="125"
              r="8"
              fill="url(#mercury)"
              stroke="#991b1b"
              strokeWidth="1"
            />

            {/* Mercury column */}
            <rect
              x="11"
              y="90"
              width="3"
              height="35"
              fill="url(#mercury)"
              rx="1.5"
            />

            {/* Temperature scale */}
            <g
              stroke="#4b5563"
              strokeWidth="0.5"
              fill="#374151"
              fontSize="5"
              fontFamily="Arial"
            >
              <line x1="18" y1="20" x2="21" y2="20" />
              <text x="22" y="22">
                100
              </text>
              <line x1="18" y1="35" x2="20" y2="35" />
              <line x1="18" y1="50" x2="21" y2="50" />
              <text x="22" y="52">
                50
              </text>
              <line x1="18" y1="65" x2="20" y2="65" />
              <line x1="18" y1="80" x2="21" y2="80" />
              <text x="22" y="82">
                0
              </text>
              <line x1="18" y1="95" x2="20" y2="95" />
              <line x1="18" y1="110" x2="21" y2="110" />
              <text x="22" y="112">
                -50
              </text>
            </g>

            {/* Glass shine */}
            <rect
              x="9"
              y="15"
              width="2"
              height="100"
              fill="rgba(255,255,255,0.6)"
              rx="1"
            />
          </svg>
        </div>
      );
    }

    // Fallback for any equipment not specifically handled above
    return (
      <div className="relative">
        {isOnWorkbench ? (
          // Create a realistic glass container for any unspecified equipment
          <svg
            width="70"
            height="90"
            viewBox="0 0 70 90"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient
                id="genericGlass"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="50%" stopColor="rgba(248,250,252,0.85)" />
                <stop offset="100%" stopColor="rgba(226,232,240,0.95)" />
              </linearGradient>
              <linearGradient
                id="genericLiquid"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
                <stop
                  offset="50%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.7"
                />
                <stop
                  offset="100%"
                  stopColor={getMixedColor()}
                  stopOpacity="0.85"
                />
              </linearGradient>
            </defs>

            {/* Generic container */}
            <rect
              x="15"
              y="20"
              width="40"
              height="60"
              fill="url(#genericGlass)"
              stroke="#94a3b8"
              strokeWidth="2"
              rx="3"
            />

            {/* Solution */}
            {chemicals.length > 0 && (
              <rect
                x="18"
                y={75 - getSolutionHeight() * 0.6}
                width="34"
                height={getSolutionHeight() * 0.6 + 5}
                fill="url(#genericLiquid)"
                rx="2"
                className="transition-all duration-500"
              />
            )}

            {/* Glass shine */}
            <rect
              x="20"
              y="25"
              width="4"
              height="50"
              fill="rgba(255,255,255,0.5)"
              rx="2"
              opacity="0.8"
            />

            {/* Volume markings */}
            <g stroke="#6b7280" strokeWidth="0.8" fill="#4b5563" fontSize="6">
              <line x1="57" y1="35" x2="60" y2="35" />
              <text x="62" y="38">
                100
              </text>
              <line x1="57" y1="50" x2="59" y2="50" />
              <line x1="57" y1="65" x2="60" y2="65" />
              <text x="62" y="68">
                50
              </text>
            </g>
          </svg>
        ) : (
          icon
        )}

        {/* Enhanced solution visualization for workbench containers */}
        {isContainer && chemicals.length > 0 && isOnWorkbench && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-lg">
            <div className="text-gray-800 font-medium text-center">
              {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
            </div>
            <div className="text-gray-600 text-center">
              {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL
            </div>
            <div
              className="w-full h-1 rounded-full mt-1"
              style={{ backgroundColor: getMixedColor() }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      draggable={!disabled && id !== "stirring_rod"}
      onDragStart={
        !disabled && id !== "stirring_rod" ? handleDragStart : undefined
      }
      onDragEnd={id !== "stirring_rod" ? handleDragEnd : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onDragOver={isContainer ? handleChemicalDragOver : undefined}
      onDragLeave={isContainer ? handleChemicalDragLeave : undefined}
      onDrop={isContainer ? handleChemicalDrop : undefined}
      className={`flex flex-col items-center relative ${id === "stirring_rod" ? "stirring-rod-optimized" : ""} ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-grab active:cursor-grabbing"
      } ${
        isOnWorkbench
          ? `p-0 bg-transparent border-0 shadow-none ${isDragging ? "opacity-80 z-50" : !disabled ? "hover:scale-105 hover:rotate-0.5" : ""}`
          : disabled
            ? "p-4 bg-gray-100 rounded-lg shadow-md border-2 border-gray-200"
            : "p-4 bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-blue-400 hover:equipment-glow equipment-shadow hover:scale-105 active:scale-95 active:rotate-2"
      } ${!isOnWorkbench && isContainer && isDragOver && !disabled ? "border-green-500 bg-green-50 scale-105 drop-zone-active" : ""}`}
      style={{
        position: isOnWorkbench ? "absolute" : "relative",
        left: isOnWorkbench && effectivePosition ? effectivePosition.x : "auto",
        top: isOnWorkbench && effectivePosition ? effectivePosition.y : "auto",
        zIndex: isOnWorkbench ? (isDragging ? 50 : 10) : "auto",
        transform: isOnWorkbench
          ? isDragging
            ? "translate(-50%, -50%) scale(1.05)"
            : "translate(-50%, -50%) scale(1)"
          : "none",
        transition: isDragging
          ? "none"
          : isOnWorkbench
            ? "transform 0.2s ease-out"
            : "all 0.3s ease-out",
        willChange: isDragging ? "transform" : "auto",
        cursor: isOnWorkbench ? (isDragging ? "grabbing" : "grab") : "grab",
      }}
    >
      {/* Enhanced drop zone indicator - only show when not on workbench */}
      {isContainer && !isOnWorkbench && (
        <div
          className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDragOver ? "bg-green-500 scale-125 shadow-lg" : "bg-blue-500"
          }`}
        >
          <Droplet size={14} className="text-white" />
          {isDragOver && (
            <div className="absolute inset-0 bg-green-400 rounded-full opacity-30 transition-opacity duration-500"></div>
          )}
        </div>
      )}

      {/* Drop hint text - only show when not on workbench */}
      {isContainer && !isOnWorkbench && isDragOver && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-bounce whitespace-nowrap shadow-lg">
          Drop chemical here!
        </div>
      )}

      {/* Drag over animation - only when not on workbench */}
      {isDragOver && !isOnWorkbench && (
        <div className="absolute inset-0 border-4 border-green-400 rounded-lg bg-green-100 opacity-30 transition-all duration-300 ease-in-out"></div>
      )}

      <div
        className={`mb-3 transition-all duration-300 relative ${
          isOnWorkbench ? "text-blue-700" : "text-blue-600"
        } ${isDragOver ? "scale-110" : ""} ${isOnWorkbench ? "transform scale-110" : ""}`}
      >
        {getEquipmentSpecificRendering()}
      </div>

      {/* Only show equipment name when not on workbench */}
      {!isOnWorkbench && (
        <span
          className={`text-sm font-semibold text-center transition-colors text-gray-700 ${isDragOver ? "text-green-700" : ""}`}
        >
          {name}
        </span>
      )}

      {/* Small undo button when on workbench */}
      {isOnWorkbench && !isDragging && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(id);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`absolute bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold transition-colors shadow-lg hover:shadow-xl ${
            id === "test_tubes" || id === "test-tube"
              ? "w-8 h-8 text-xs top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white z-50" // Center of test tube
              : "w-6 h-6 text-xs -top-2 -right-2 z-30" // Default positioning for other equipment
          }`}
          title="Remove equipment"
          style={{ pointerEvents: "auto" }}
        >
          ×
        </button>
      )}

      {/* Removal instruction tooltip - show on hover when on workbench */}
      {isOnWorkbench && !isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Double-click to remove
        </div>
      )}

      {/* Drag indicator when dragging */}
      {isDragging && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
          Moving...
        </div>
      )}
    </div>
  );
};

export const equipmentList = [
  { id: "beaker", name: "Beaker", icon: <Beaker size={36} /> },
  { id: "flask", name: "Erlenmeyer Flask", icon: <FlaskConical size={36} /> },
  { id: "burette", name: "Burette", icon: <TestTube size={36} /> },
  { id: "thermometer", name: "Thermometer", icon: <Thermometer size={36} /> },
];
