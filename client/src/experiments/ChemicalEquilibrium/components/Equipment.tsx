import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Beaker,
  FlaskConical,
  TestTube,
  Droplet,
  Thermometer,
} from "lucide-react";
import type { EquipmentPosition, CobaltReactionState, DryTestMode } from "../types";
import { GLASS_CONTAINER_IMAGE_URL, GLASS_ROD_IMAGE_URL } from "../constants";

const NAOH_CHEMICAL_ID = "naoh";
const NAOH_SOLUTION_COLOR = "#bfdbfe";
const MAX_NAOH_VOLUME_DISPLAY = 6;
const K2CR2O7_CHEMICAL_ID = "k2cr2o7_solution";
const K2CR2O7_SOLUTION_COLOR = "#fb923c";
const DILUTE_HNO3_WET_SOLUTION_COLOR = "rgba(14, 165, 233, 0.95)";
const NH4OH_WET_SOLUTION_COLOR = "rgba(191, 219, 254, 0.95)";
const BUNSEN_BURNER_IMAGE_URL = "https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2Fc4be507c9a054f00b694808aa900a9e5?format=webp&width=800";
const GLASS_CONTAINER_MAX_VOLUME_ML = 12;
const GLASS_CONTAINER_MIN_OVERLAY_HEIGHT = 16;
const GLASS_CONTAINER_MAX_OVERLAY_HEIGHT = 94;
const GLASS_CONTAINER_OVERLAY_WIDTH = 74;
const GLASS_CONTAINER_OVERLAY_BOTTOM = 12;

interface EquipmentProps {
  id: string;
  name: string;
  icon: React.ReactNode;
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
  onInteract?: (id: string) => void;
  onObserve?: () => void;
  cobaltReactionState?: CobaltReactionState;
  allEquipmentPositions?: EquipmentPosition[];
  currentStep?: number;
  isDryTest?: boolean;
  dryTestMode?: DryTestMode;
  disabled?: boolean;
  interactDisabled?: boolean;
  imageUrl?: string;
  isRinseActive?: boolean;
  observeBlinking?: boolean;
  isHeating?: boolean;
  activeHalide?: string;
  bromideWetHeatingTriggered?: boolean;
  bromideWetHeatingCount?: number;
  iodideWetHeatingTriggered?: boolean;
  iodideWetHeatingCount?: number;
  specialCasesHeatingCount?: number;
  activeFlameTest?: string;
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
  onInteract,
  onObserve,
  cobaltReactionState,
  allEquipmentPositions = [],
  currentStep = 1,
  isDryTest = false,
  disabled = false,
  interactDisabled = false,
  imageUrl,
  dryTestMode,
  isRinseActive = false,
  observeBlinking = false,
  isHeating = false,
  activeHalide,
  bromideWetHeatingTriggered = false,
  bromideWetHeatingCount = 0,
  iodideWetHeatingTriggered = false,
  iodideWetHeatingCount = 0,
  specialCasesHeatingCount = 0,
  activeFlameTest,
}) => {
  const normalizedName = name.toLowerCase();
  const isAcidEquipment =
    normalizedName.includes("h2so4") ||
    normalizedName.includes("h₂so₄") ||
    normalizedName.includes("sulfuric");
  const isAmmoniumEquipment = normalizedName.includes("ammonium hydroxide") ||
    normalizedName.includes("nh₄oh") ||
    normalizedName.includes("nh4oh");
  const isGlassRodEquipment = normalizedName.includes("glass rod");
  const isBunsenBurnerEquipment = normalizedName.includes("bunsen");
  const isGlassContainerEquipment = normalizedName.includes("glass container");
  const isSpecialCasesFifthHeating =
    id === "test_tubes" &&
    activeHalide === "SC" &&
    dryTestMode === "acid" &&
    specialCasesHeatingCount === 5 &&
    isHeating;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const currentPosition = position;
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [pointerStartPos, setPointerStartPos] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef(0);
  const animationFrameId = useRef<number>();

  // Heating states for test tube
  const [showHeatingMessage, setShowHeatingMessage] = useState(false);
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
    e.dataTransfer.setData("equipment", id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setDragStartTime(Date.now());

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setDragOffset({
      x: e.clientX - rect.left - centerX,
      y: e.clientY - rect.top - centerY,
    });

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

    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      font-size: 36px;
      color: #1d4ed8;
      margin-bottom: 4px;
    `;
    iconContainer.innerHTML = getIconSVG(id);

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

      const now = performance.now();
      if (now - lastUpdateTime.current < 16) return;
      lastUpdateTime.current = now;

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        const workbench = document.querySelector('[data-workbench="true"]');
        if (!workbench) return;

        const workbenchRect = workbench.getBoundingClientRect();
        const x = e.clientX - workbenchRect.left - pointerStartPos.x;
        const y = e.clientY - workbenchRect.top - pointerStartPos.y;

        const minMargin = 30;
        const maxX = workbenchRect.width - minMargin;
        const maxY = workbenchRect.height - minMargin;

        const clampedX = Math.max(minMargin, Math.min(x, maxX));
        const clampedY = Math.max(minMargin, Math.min(y, maxY));

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
    if (equipmentId.includes("glass-rod")) {
      return `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="21" width="36" height="4" rx="2" fill="currentColor"/><rect x="10" y="19" width="1" height="8" rx="0.5" fill="currentColor" fill-opacity="0.7"/><rect x="37" y="19" width="1" height="8" rx="0.5" fill="currentColor" fill-opacity="0.7"/></svg>`;
    }
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

      console.log(
        `Added ${chemical.volume || 25}mL of ${chemical.name} to ${name}`,
      );

      setTimeout(() => setIsDropping(false), 800);
    }
  };

  const isOnWorkbench = position && (position.x !== 0 || position.y !== 0);
  const isSaltSampleEquipment = id.toLowerCase().startsWith("salt-sample");
  const isContainer = [
    "beaker",
    "flask",
    "burette",
    "erlenmeyer_flask",
    "conical_flask",
    "test_tubes",
    "beakers",
  ].includes(id);

  const getMixedColor = (subset: typeof chemicals = chemicals) => {
    if (subset.length === 0) return "transparent";
    if (subset.length === 1) return subset[0].color;

    const chemicalIds = subset.map((c) => c.id).sort();

    let r = 0,
      g = 0,
      b = 0,
      totalAmount = 0;

    subset.forEach((chemical) => {
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

  const BOTTLE_COLORS: Record<string, { from: string; to: string; icon: string }> = {
    amber: {
      from: "from-amber-100",
      to: "to-amber-50",
      icon: "text-amber-600",
    },
    red: {
      from: "from-red-100",
      to: "to-red-50",
      icon: "text-red-600",
    },
    emerald: {
      from: "from-emerald-100",
      to: "to-emerald-50",
      icon: "text-emerald-600",
    },
  };

  const renderLabelBottle = (
    label: string,
    tag: string,
    colorKey: keyof typeof BOTTLE_COLORS,
    interact?: () => void,
    interactDisabled?: boolean,
  ) => {
    const colors = BOTTLE_COLORS[colorKey];

    return (
      <div
        className={`flex flex-col items-center gap-1 rounded-xl bg-white shadow-[0_20px_35px_rgba(15,23,42,0.15)] py-3 px-4 transition-all duration-300 w-28 min-h-[165px] ${
          isDragging ? "scale-105" : "scale-100"
        }`}
      >
        <div
          className={`w-11 h-11 rounded-lg border border-gray-200 bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center`}
        >
          <Droplet className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="text-center text-[11px] font-semibold text-slate-800">{label}</div>
        <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500">{tag}</div>
        {interact && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (isDragging || disabled || interactDisabled) return;
              interact();
            }}
            disabled={interactDisabled}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-50"
          >
            ADD
          </button>
        )}
      </div>
    );
  };

  const renderSaltSampleBottle = () => renderLabelBottle("Salt Sample", "Dry Test", "amber", () => onInteract?.(id));
  const renderAmmoniumBottle = (interact?: () => void, bottleInteractDisabled?: boolean) =>
    renderLabelBottle("Ammonium hydroxide", "NH₄OH", "emerald", interact, bottleInteractDisabled);
  const renderHotAcidBottle = (interact?: () => void) => renderLabelBottle("Conc. H₂SO₄", "Corrosive", "red", interact);

  const getEquipmentSpecificRendering = () => {
    if (!isOnWorkbench) {
      return icon;
    }

    if (isGlassRodEquipment) {
      // Increase glass rod size by 2x when in Flame Test
      const isFlameTest = activeFlameTest === "Fl" && dryTestMode === "basic";
      const rodVisualClasses = isFlameTest
        ? `w-56 h-12 rod-visual ${isRinseActive ? "rod-visual--rinsing" : ""}`
        : `w-28 h-6 rod-visual ${isRinseActive ? "rod-visual--rinsing" : ""}`;
      return (
        <div
          className="relative flex flex-col items-center pointer-events-none"
          style={{ marginTop: "28px" }}
        >
          <div className={rodVisualClasses}>
            <img
              src={GLASS_ROD_IMAGE_URL}
              alt="Glass Rod"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      );
    }

    if (isBunsenBurnerEquipment) {
      return (
        <div className="relative flex flex-col items-center pointer-events-none">
          <img
            src={BUNSEN_BURNER_IMAGE_URL}
            alt="Bunsen Burner"
            className="max-w-[240px] max-h-[240px] object-contain drop-shadow-lg"
          />
        </div>
      );
    }

    if (isGlassContainerEquipment) {
      const containerImage = imageUrl ?? GLASS_CONTAINER_IMAGE_URL;
      const ammoniumAmount = chemicals
        .filter((chemical) => chemical.id === "nh4oh")
        .reduce((sum, chemical) => sum + (chemical.amount || 0), 0);
      const effectiveVolume = Math.max(0, Math.min(ammoniumAmount, GLASS_CONTAINER_MAX_VOLUME_ML));
      const fillRatio = GLASS_CONTAINER_MAX_VOLUME_ML
        ? effectiveVolume / GLASS_CONTAINER_MAX_VOLUME_ML
        : 0;
      const overlayHeight =
        GLASS_CONTAINER_MIN_OVERLAY_HEIGHT +
        fillRatio * (GLASS_CONTAINER_MAX_OVERLAY_HEIGHT - GLASS_CONTAINER_MIN_OVERLAY_HEIGHT);
      const showAmmoniumOverlay = ammoniumAmount > 0;
      const acidAmount = chemicals
        .filter((chemical) => chemical.id === "conc_hcl")
        .reduce((sum, chemical) => sum + (chemical.amount || 0), 0);
      const acidFillRatio = GLASS_CONTAINER_MAX_VOLUME_ML
        ? Math.min(acidAmount, GLASS_CONTAINER_MAX_VOLUME_ML) / GLASS_CONTAINER_MAX_VOLUME_ML
        : 0;
      const acidOverlayHeight =
        GLASS_CONTAINER_MIN_OVERLAY_HEIGHT +
        acidFillRatio * (GLASS_CONTAINER_MAX_OVERLAY_HEIGHT - GLASS_CONTAINER_MIN_OVERLAY_HEIGHT);
      const showAcidOverlay = acidAmount > 0;
      return (
        <div className="relative flex flex-col items-center pointer-events-none">
          <img
            src={containerImage}
            alt="Glass container"
            className="max-w-[160px] max-h-[160px] object-contain drop-shadow-lg"
          />
          {showAcidOverlay && (
            <div
              className="absolute left-1/2"
              style={{
                width: `${GLASS_CONTAINER_OVERLAY_WIDTH}px`,
                height: `${Math.max(GLASS_CONTAINER_MIN_OVERLAY_HEIGHT, acidOverlayHeight)}px`,
                bottom: `${GLASS_CONTAINER_OVERLAY_BOTTOM}px`,
                transform: "translateX(-50%)",
                borderRadius: "0px 0px 14px 14px",
                background:
                  "linear-gradient(180deg, rgba(199, 227, 255, 0.98), rgba(167, 211, 255, 0.92))",
                boxShadow:
                  "inset 0 24px 38px rgba(199, 227, 255, 0.95), 0 0 15px rgba(167, 211, 255, 0.5)",
                transition: "height 350ms ease",
                zIndex: 0,
              }}
            />
          )}
          {showAmmoniumOverlay && (
            <div
              className="absolute left-1/2"
              style={{
                width: `${GLASS_CONTAINER_OVERLAY_WIDTH}px`,
                height: `${Math.max(GLASS_CONTAINER_MIN_OVERLAY_HEIGHT, overlayHeight)}px`,
                bottom: `${GLASS_CONTAINER_OVERLAY_BOTTOM}px`,
                transform: "translateX(-50%)",
                borderRadius: "0px 0px 14px 14px",
                background:
                  "linear-gradient(180deg, rgba(204, 233, 255, 0.98), rgba(184, 210, 255, 0.9))",
                boxShadow:
                  "inset 0 24px 38px rgba(204, 233, 255, 0.95), 0 0 25px rgba(166, 199, 255, 0.5)",
                transition: "height 350ms ease",
              }}
            />
          )}
        </div>
      );
    }

    if (isSaltSampleEquipment) {
      return renderSaltSampleBottle();
    }

    if (isAmmoniumEquipment) {
      return renderAmmoniumBottle(() => onInteract?.(id), interactDisabled);
    }

    if (isAcidEquipment) {
      return renderHotAcidBottle(() => onInteract?.(id));
    }

    if (id === "test_tubes") {
      if (isDryTest) {
        const totalChemicalsAmount = chemicals.reduce(
          (sum, chemical) => sum + (chemical.amount || 0),
          0,
        );
        const hasSaltSample = chemicals.some((chemical) => chemical.id === "salt_sample");
        const hasAcidSample = chemicals.some((chemical) => chemical.id === "conc_h2so4");
        const hasAmmoniumSample = chemicals.some((chemical) => chemical.id === "nh4oh");
        const hasNaOHSample = chemicals.some((chemical) => chemical.id === NAOH_CHEMICAL_ID);
        const hasSaltOnly =
          hasSaltSample && !hasAcidSample && !hasNaOHSample && !hasAmmoniumSample;
        const naohAmount =
          chemicals.find((chemical) => chemical.id === NAOH_CHEMICAL_ID)?.amount ?? 0;
        const naohHeightRatio =
          Math.min(naohAmount, MAX_NAOH_VOLUME_DISPLAY) / MAX_NAOH_VOLUME_DISPLAY;
        const totalHeightRatio = Math.min(totalChemicalsAmount, 25) / 25;
        const heightRatio = hasNaOHSample ? naohHeightRatio : totalHeightRatio;
        const saltOverlayMinimumHeight = hasSaltSample ? 60 : 0;
        const ammoniumAmountInTube = chemicals
          .filter((chemical) => chemical.id === "nh4oh")
          .reduce((sum, chemical) => sum + (chemical.amount || 0), 0);
        const ammoniumHeightBoost = Math.min(60, ammoniumAmountInTube * 15);
        const baseOverlayHeight = Math.min(150, heightRatio * 150);
        const overlayHeight = Math.max(
          saltOverlayMinimumHeight,
          Math.min(150, baseOverlayHeight + (hasAmmoniumSample ? ammoniumHeightBoost : 0)),
        );
        const overrideWithWhite = hasSaltOnly || hasAcidSample || hasAmmoniumSample;
        const nonNaOHChemicals = chemicals.filter((chemical) => chemical.id !== NAOH_CHEMICAL_ID);
        const overlayColorSource =
          nonNaOHChemicals.length > 0 ? nonNaOHChemicals : chemicals;
        const baseOverlayColor = overrideWithWhite
          ? "rgba(255, 255, 255, 0.95)"
          : getMixedColor(overlayColorSource);
        const hasDichromate = chemicals.some(
          (chemical) => chemical.id === K2CR2O7_CHEMICAL_ID,
        );
        const shouldForceNaOHBlue =
          isDryTest &&
          dryTestMode === "basic" &&
          hasSaltSample &&
          hasNaOHSample &&
          !hasAcidSample &&
          !hasAmmoniumSample;
        const hasDiluteHNO3 = chemicals.some(
          (chemical) => chemical.id === "dil_hno3",
        );
        const shouldUseDiluteHNO3Color =
          isDryTest &&
          dryTestMode === "wet" &&
          hasDiluteHNO3 &&
          hasSaltSample;
        const shouldUseAmmoniumColor =
          isDryTest &&
          dryTestMode === "wet" &&
          hasAmmoniumSample;
        const shouldUseBromideHeatingColor =
          isDryTest &&
          dryTestMode === "acid" &&
          activeHalide === "Br" &&
          hasSaltSample &&
          hasAcidSample;
        // Check if ag_br_precipitate has been added (which happens when OBSERVE is pressed)
        const hasAgBrPrecipitate = chemicals.some((c) => c.id === "ag_br_precipitate");
        const shouldUseBromideWetPaleYellow =
          isDryTest &&
          dryTestMode === "wet" &&
          activeHalide === "Br" &&
          (hasAgBrPrecipitate || (bromideWetHeatingTriggered && bromideWetHeatingCount < 2));
        const shouldUseBromideWetOrangeBrown =
          isDryTest &&
          dryTestMode === "wet" &&
          activeHalide === "Br" &&
          bromideWetHeatingCount >= 2;
        const shouldUseIodideWetYellow =
          isDryTest &&
          dryTestMode === "wet" &&
          activeHalide === "I" &&
          (iodideWetHeatingTriggered && iodideWetHeatingCount < 2);
        const shouldUseIodideWetViolet =
          isDryTest &&
          dryTestMode === "wet" &&
          activeHalide === "I" &&
          iodideWetHeatingCount >= 2;
        const overlayColor = shouldUseIodideWetViolet
          ? "#8B5CF6"
          : shouldUseIodideWetYellow
            ? "#FCD34D"
            : shouldUseBromideWetOrangeBrown
            ? "#D97706"
            : shouldUseBromideWetPaleYellow
              ? "#FDE68A"
              : shouldUseBromideHeatingColor
            ? "#8B6939"
            : hasDichromate
              ? K2CR2O7_SOLUTION_COLOR
              : shouldUseAmmoniumColor
                ? NH4OH_WET_SOLUTION_COLOR
                : shouldUseDiluteHNO3Color
                  ? DILUTE_HNO3_WET_SOLUTION_COLOR
                  : shouldForceNaOHBlue
                    ? NAOH_SOLUTION_COLOR
                    : baseOverlayColor;
        const showOverlay =
          overlayColor !== "transparent" && totalChemicalsAmount > 0;
        const displayLabel = name.toLowerCase().includes("test tube")
          ? "25ml Test Tube"
          : name;
        const isBromideWetAcid = dryTestMode === "wet" && activeHalide === "Br";
        const isIodideWetAcid = dryTestMode === "wet" && activeHalide === "I";
        const isSpecialCasesWetAcid = dryTestMode === "wet" && (activeHalide ?? "").toLowerCase() === "sc";
        const showObserve = Boolean(onObserve) && dryTestMode === "wet" && !isBromideWetAcid && !isIodideWetAcid && !isSpecialCasesWetAcid;
        return (
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <div className="relative w-32 h-[18rem]">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5b489eed84cd44f89c5431dbe9fd14d3%2F3f3b9fb2343b4e74a0b66661affefadb?format=webp&width=800"
                  alt="25ml Test Tube"
                  className="w-full h-full object-contain"
                />
                {showOverlay && (
                  <div
                    className="test-tube-solution-overlay absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                    style={{
                      height: `${Math.max(10, overlayHeight)}px`,
                      backgroundColor: overlayColor,
                    }}
                  />
                )}

                {/* Render a precipitate layer at the bottom when a precipitate chemical is present (eg. AgBr) */}
                {chemicals.some((c) => c.id === "ag_br_precipitate") && (
                  (() => {
                    const precip = chemicals.find((c) => c.id === "ag_br_precipitate")!;
                    const precipHeight = Math.min(20, Math.max(8, overlayHeight * 0.12));
                    return (
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: `28px`,
                          width: "28px",
                          height: `${precipHeight}px`,
                          backgroundColor: precip.color,
                          borderRadius: "0 0 8px 8px",
                          boxShadow: "inset 0 6px 10px rgba(0,0,0,0.12)",
                          zIndex: 40,
                          transition: "height 350ms ease, background-color 350ms ease",
                        }}
                      />
                    );
                  })()
                )}
              </div>
            </div>
            {!isDryTest && (
              <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-center mt-2 text-gray-700">
                {displayLabel}
              </div>
            )}
            {showObserve && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onObserve?.();
                }}
                className={`lab-observe-button ${observeBlinking ? "blink-until-pressed" : ""}`}
              >
                OBSERVE
              </button>
            )}
          </div>
        );
      }

      const isBeingHeated = () => {
        if (!position) return false;

        const hotWaterBeaker = allEquipmentPositions.find(
          (pos) => pos.id === "beaker_hot_water",
        );

        if (!hotWaterBeaker) return false;

        const horizontalDistance = Math.abs(position.x - hotWaterBeaker.x);
        const verticalDistance = position.y - hotWaterBeaker.y;

        return (
          horizontalDistance < 25 &&
          verticalDistance < -15 &&
          verticalDistance > -60
        );
      };

      const isBeingCooled = () => {
        if (!position) return false;

        const coldWaterBeaker = allEquipmentPositions.find(
          (pos) => pos.id === "beaker_cold_water",
        );

        if (!coldWaterBeaker) return false;

        const horizontalDistance = Math.abs(position.x - coldWaterBeaker.x);
        const verticalDistance = position.y - coldWaterBeaker.y;

        return (
          horizontalDistance < 25 &&
          verticalDistance < -15 &&
          verticalDistance > -60
        );
      };

      const getTestTubeImage = () => {
        if (useCooledFinalImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fbb47062bd82c4f868e040d020060d188%2Feeb7df22fe61456fba4189a1ac007f37?format=webp&width=800";
        }

        if (useCooledImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fb1188745942143ac9c8fd37f58bda34d?format=webp&width=800";
        }

        if (useFinalImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fa69b69c7f47a433993fca4f013c4c0f2?format=webp&width=800";
        }

        if (useHeatedImage) {
          return "https://cdn.builder.io/api/v1/image/assets%2F3095198ab756429ab32367b162cbcf39%2Fb1188745942143ac9c8fd37f58bda34d?format=webp&width=800";
        }

        const hasHCl = chemicals.some((c) => c.id === "hcl_conc");

        if (cobaltReactionState?.step3WaterAdded) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fbb47062bd82c4f868e040d020060d188%2Feeb7df22fe61456fba4189a1ac007f37?format=webp&width=800";
        } else if (
          hasHCl &&
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          return "https://cdn.builder.io/api/v1/image/assets%2F9f88423319a248faa5a2c8b5f85cccbb%2Febd9b66616e24e5fb31410143537ddbc?format=webp&width=800";
        } else if (
          cobaltReactionState?.stirrerActive &&
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          return "https://cdn.builder.io/api/v1/image/assets%2F4fe18c7cc7824ff98352705750053deb%2F280bbef2140249df9531563786b4bae0?format=webp&width=800";
        } else if (
          cobaltReactionState?.cobaltChlorideAdded &&
          cobaltReactionState?.distilledWaterAdded
        ) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fc2053654ab564f8eb91577d73cfc950b%2Ff2f21a05efba467181e7b9b481f8d4e1?format=webp&width=800";
        } else if (cobaltReactionState?.cobaltChlorideAdded) {
          return "https://cdn.builder.io/api/v1/image/assets%2Fc2053654ab564f8eb91577d73cfc950b%2F4049c3f958624bc1b8c72f54865b618d?format=webp&width=800";
        } else {
          return "https://cdn.builder.io/api/v1/image/assets%2F4fe18c7cc7824ff98352705750053deb%2Fa4603d4891d44fadbfe3660d27a3ae36?format=webp&width=800";
        }
      };

      const heating = isBeingHeated();
      const cooling = isBeingCooled();

      useEffect(() => {
        if (heating && !heatingStartTime) {
          setHeatingStartTime(Date.now());
          setShowHeatingMessage(true);

          setTimeout(() => {
            setShowHeatingMessage(false);
            setUseHeatedImage(true);

            setShouldHideBeaker(true);
            setShowEndothermicMessage(true);

            setUseFinalImage(true);

            if (onRemove && currentStep === 4) {
              setTimeout(() => {
                setShowEndothermicMessage(false);

                setTimeout(() => {
                  const stepCompleteEvent = new CustomEvent("stepComplete", {
                    detail: { nextStep: 5 },
                  });
                  window.dispatchEvent(stepCompleteEvent);
                }, 500);
              }, 4000);
            }

            if (onRemove) {
              setTimeout(() => {
                onRemove("beaker_hot_water");
              }, 500);
            }
          }, 500);
        } else if (!heating && heatingStartTime) {
          setHeatingStartTime(null);
          setShowHeatingMessage(false);
          setUseHeatedImage(false);
          setShowEndothermicMessage(false);
          setShouldHideBeaker(false);
          setUseFinalImage(false);
        }
      }, [heating, heatingStartTime]);

      useEffect(() => {
        if (cooling && !coolingStartTime && currentStep === 5) {
          setCoolingStartTime(Date.now());
          setShowCoolingMessage(true);

          setUseCooledImage(true);

          setTimeout(() => {
            setShowCoolingMessage(false);

            setShouldHideColdBeaker(true);
            setShowExothermicMessage(true);

            setTimeout(() => {
              setShowExothermicMessage(false);
              setUseCooledFinalImage(true);

              if (onRemove && currentStep === 5) {
                setTimeout(() => {
                  const stepCompleteEvent = new CustomEvent("stepComplete", {
                    detail: { nextStep: 6 },
                  });
                  window.dispatchEvent(stepCompleteEvent);
                }, 500);
              }
            }, 4000);

            if (onRemove) {
              setTimeout(() => {
                onRemove("beaker_cold_water");
              }, 500);
            }
          }, 3000);
        } else if (!cooling && coolingStartTime) {
          setCoolingStartTime(null);
          setShowCoolingMessage(false);
          setUseCooledImage(false);
          setShowExothermicMessage(false);
          setShouldHideColdBeaker(false);
          setUseCooledFinalImage(false);
        }
      }, [cooling, coolingStartTime, currentStep]);

      return (
        <div className="relative group">
          <img
            key={getTestTubeImage()}
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

          {isSpecialCasesFifthHeating && (
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: "15%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "70%",
                height: "45%",
                background: "radial-gradient(circle, rgba(173, 216, 230, 0.6) 0%, rgba(135, 206, 250, 0.5) 100%)",
                borderRadius: "20px",
                boxShadow: "inset 0 4px 8px rgba(135, 206, 250, 0.3)",
              }}
            />
          )}

          {heating && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-2 h-8 bg-gradient-to-t opacity-70 rounded-full ${
                      isSpecialCasesFifthHeating
                        ? "from-amber-700 to-transparent"
                        : "from-orange-400 to-transparent"
                    }`}
                    style={{
                      left: `${45 + i * 15}%`,
                      bottom: "60%",
                      animation: `float 2s ease-in-out infinite ${i * 0.3}s`,
                      transform: `translateX(-50%) scaleY(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>

              <div className="absolute -top-8 -right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold animate-bounce">
                🔥
              </div>

              <div className={`absolute inset-0 rounded-full animate-pulse pointer-events-none ${
                isSpecialCasesFifthHeating
                  ? "bg-gradient-to-t from-amber-700/20 to-transparent"
                  : "bg-gradient-to-t from-orange-400/20 to-transparent"
              }`} />
            </>
          )}

          {cooling && (
            <>
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

              <div className="absolute -top-8 -right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold animate-bounce">
                ❄️
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-blue-400/20 to-transparent rounded-full animate-pulse pointer-events-none" />
            </>
          )}

          {showHeatingMessage && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-lg whitespace-nowrap z-50">
              Temperature of test tube is rising!
            </div>
          )}

          {showCoolingMessage && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-lg whitespace-nowrap z-50">
              Temperature of test tube is falling!
            </div>
          )}

          {showEndothermicMessage && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-xl whitespace-nowrap z-[9999] border-2 border-white">
              🧪 Solution became blue again due to Endothermic Reaction! 🧪
            </div>
          )}

          {showExothermicMessage && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-6 py-3 rounded-lg text-lg font-bold animate-bounce shadow-xl whitespace-nowrap z-[9999] border-2 border-white">
              🧪 Solution became pink again due to Exothermic Reaction! 🧪
            </div>
          )}
        </div>
      );
    }

    if (id === "beaker_hot_water") {
      if (shouldHideBeaker) {
        return null;
      }

      return (
        <div className="relative">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fab3d7499a8fe404bb2836f6043ac08b4%2F0048f4f6e5dc45368c0cf303e98c220d?format=webp&width=800"
            alt="Hot Water Beaker"
            className="w-28 h-32 object-contain drop-shadow-lg"
          />

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

          <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            C
          </div>

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

    return icon;
  };

  return (
    <div
      ref={elementRef}
      data-equipment-id={id}
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
        left: isOnWorkbench && currentPosition ? currentPosition.x : "auto",
        top: isOnWorkbench && currentPosition ? currentPosition.y : "auto",
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

      {isContainer && !isOnWorkbench && isDragOver && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-bounce whitespace-nowrap shadow-lg">
          Drop chemical here!
        </div>
      )}

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

      {!isOnWorkbench && (
        <span
          className={`text-sm font-semibold text-center transition-colors text-gray-700 ${isDragOver ? "text-green-700" : ""}`}
        >
          {name}
        </span>
      )}

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
            id === "test_tubes"
              ? "w-8 h-8 text-xs top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white z-50"
              : "w-6 h-6 text-xs -top-2 -right-2 z-30"
          }`}
          title="Remove equipment"
          style={{ pointerEvents: "auto" }}
        >
          ×
        </button>
      )}

      {isOnWorkbench && !isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Double-click to remove
        </div>
      )}

      {isDragging && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
          Moving...
        </div>
      )}
    </div>
  );
};
