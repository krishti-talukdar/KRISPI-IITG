import React from "react";

interface EquipmentItem {
  id: string;
  label: string;
}

interface PrepWorkbenchProps {
  step: number;
  totalSteps: number;
  title: string;
  detail: string;
  onNext: () => void;
  onFinish: () => void;
  equipmentItems: EquipmentItem[];
  registerUndo?: (fn: () => void) => void;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { TestTube, Beaker, FlaskConical, Droplets, Filter, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

// Utility to interpolate between two hex colors
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}
function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16);
        return h.length === 1 ? "0" + h : h;
      })
      .join("")
  );
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function interpolateHex(from: string, to: string, t: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return rgbToHex(r, g, bl);
}

export default function WorkBench({ step, totalSteps, equipmentItems, onNext, onFinish, registerUndo }: PrepWorkbenchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [history, setHistory] = useState<Array<{ placed: Array<{ id: string; x: number; y: number }> }>>([]);
  const [isHeating, setIsHeating] = useState(false);
  const heatTimerRef = useRef<number | null>(null);
  const [heatProgress, setHeatProgress] = useState(0); // 0 -> 1 while heating
  const [isPostHeated, setIsPostHeated] = useState(false);
  const prevHeatingRef = useRef(false);
  const TUBE_BURNER_GAP = 160;

  // Breaking animation state
  const [isBreaking, setIsBreaking] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [hideTube, setHideTube] = useState(false);
  const [animTube, setAnimTube] = useState<{ left: number; top: number; rotate: number } | null>(null);

  // Auto-stop heating after 6 seconds when started
  useEffect(() => {
    if (isHeating) {
      if (heatTimerRef.current) clearTimeout(heatTimerRef.current);
      heatTimerRef.current = window.setTimeout(() => {
        setIsHeating(false);
        heatTimerRef.current = null;
      }, 6000);
    }
    return () => {
      if (!isHeating && heatTimerRef.current) {
        clearTimeout(heatTimerRef.current);
        heatTimerRef.current = null;
      }
    };
  }, [isHeating]);

  // Detect transition from heating -> stopped to set dark red state
  useEffect(() => {
    const wasHeating = prevHeatingRef.current;
    if (wasHeating && !isHeating) {
      setIsPostHeated(true);
    }
    prevHeatingRef.current = isHeating;
  }, [isHeating]);

  // Smoothly animate heating/cooling progress
  useEffect(() => {
    const tick = () =>
      setHeatProgress((p) => {
        const delta = isHeating ? 0.03 : -0.03;
        const next = Math.max(0, Math.min(1, p + delta));
        return next;
      });
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [isHeating]);

  // Derived colors for the organic compound when heating
  const heatedColors = useMemo(() => {
    if (!isHeating && isPostHeated) {
      // After heating completes, show a hot magma gradient permanently
      // bottom = lava core, top = molten glow
      return { top: "#ffae42", bottom: "#ff3b00" };
    }
    // While heating/cooling, interpolate smoothly
    const bottom = interpolateHex("#f59e0b", "#ef4444", heatProgress);
    const top = interpolateHex("#fde68a", "#fca5a5", heatProgress);
    return { bottom, top };
  }, [heatProgress, isHeating, isPostHeated]);

  useEffect(() => {
    if (registerUndo) {
      registerUndo(() => {
        setPlaced((prev) => {
          if (history.length === 0) return prev;
          const last = history[history.length - 1];
          setHistory((h) => h.slice(0, -1));
          return last.placed;
        });
        setIsBreaking(false);
        setIsBroken(false);
        setHideTube(false);
        setAnimTube(null);
      });
    }
  }, [registerUndo, history]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const eqId = e.dataTransfer.getData("equipment");
    if (!eqId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Snap items to fixed target positions regardless of where they are dropped
    const getSnapPosition = (
      id: string,
      r: DOMRect,
      current: Array<{ id: string; x: number; y: number }>
    ) => {
      const margin = 16;
      const clampX = (x: number) => Math.max(margin, Math.min(x, r.width - margin));
      const clampY = (y: number) => Math.max(margin, Math.min(y, r.height - margin));

      // Sizes used in rendering
      const burnerSize = { w: 480, h: 480 };
      const tubeSize = { w: 224, h: 256 };

      const burnerPos = current.find((p) => p.id === "bunsen-burner");

      switch (id) {
        case "bunsen-burner": {
          const x = clampX(r.width / 2 - burnerSize.w / 2);
          const y = clampY(r.height - burnerSize.h - margin - 260);
          return { x, y };
        }
        case "ignition-tube": {
          // If burner exists, center above it; otherwise, keep centered near top
          if (burnerPos) {
            const x = clampX(
              burnerPos.x + (burnerSize.w - tubeSize.w) / 2
            );
            const y = clampY(burnerPos.y - tubeSize.h + (80 - TUBE_BURNER_GAP));
            return { x, y };
          }
          const x = clampX(r.width / 2 - tubeSize.w / 2);
          const y = clampY(20);
          return { x, y };
        }
        case "sodium-piece": {
          return { x: clampX(32), y: clampY(120) };
        }
        case "organic-compound": {
          return { x: clampX(r.width - 120), y: clampY(120) };
        }
        case "water-bath": {
          return { x: clampX(32), y: clampY(r.height - 180) };
        }
        case "filter-funnel": {
          return { x: clampX(r.width - 140), y: clampY(r.height - 200) };
        }
        default: {
          // Fallback: center
          return { x: clampX(r.width / 2 - 24), y: clampY(r.height / 2 - 24) };
        }
      }
    };

    setPlaced((prev) => {
      setHistory((h) => [...h, { placed: prev }]);
      const withoutSame = prev.filter((p) => p.id !== eqId);
      const snapped = getSnapPosition(eqId, rect, withoutSame);
      let next = [...withoutSame, { id: eqId, ...snapped }];

      // If distilled water is dropped first, automatically place the china dish
      if (eqId === "distilled-water" && !withoutSame.some((p) => p.id === "water-bath")) {
        const dishSnap = getSnapPosition("water-bath", rect, withoutSame);
        next = [...next, { id: "water-bath", ...dishSnap }];
      }

      const tube = next.find((p) => p.id === "ignition-tube");
      const burner = next.find((p) => p.id === "bunsen-burner");
      if (tube && burner) {
        const tubeWidth = 224; // w-56
        const tubeHeight = 256; // h-64
        const burnerWidth = 480; // w-[480px]
        const tubeX = Math.max(16, Math.min(burner.x + (burnerWidth - tubeWidth) / 2, rect.width - tubeWidth - 16));
        const tubeY = Math.max(16, burner.y - tubeHeight + (80 - TUBE_BURNER_GAP));
        return next.map((p) => (p.id === "ignition-tube" ? { ...p, x: tubeX, y: tubeY } : p));
      }
      return next;
    });

    // Auto-progress steps based on expected sequence
    const sequence = [
      "ignition-tube",
      "sodium-piece",
      "organic-compound",
      "bunsen-burner",
      "water-bath",
      "filter-funnel",
    ];
    const expected = sequence[step];
    if (expected && eqId === expected) {
      if (step < totalSteps - 1) onNext();
      else onFinish();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const findItem = (id: string) => equipmentItems.find(i => i.id === id);

  return (
    <div
      ref={containerRef}
      onDrop={onDrop}
      onDragOver={handleDragOver}
      className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden transition-all duration-300 border-2 border-dashed border-gray-300"
      style={{
        backgroundImage: `
          linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%),
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 25%),
          radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 25%)
        `,
      }}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
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

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Step {step + 1} of {totalSteps}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Laboratory Workbench</span>
      </div>

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

      {(() => {
        const hasIgnitionTube = placed.some(p => p.id === "ignition-tube");
        const hasSodiumPiece = placed.some(p => p.id === "sodium-piece");
        const hasOrganicCompound = placed.some(p => p.id === "organic-compound");
        const hasBunsenBurner = placed.some(p => p.id === "bunsen-burner");
        const hasWaterBath = placed.some(p => p.id === "water-bath");
        const hasDistilledWater = placed.some(p => p.id === "distilled-water");
        const tube = placed.find(p => p.id === 'ignition-tube');
        const burner = placed.find(p => p.id === 'bunsen-burner');
        const waterBath = placed.find(p => p.id === 'water-bath');
        const tubeWidth = 224;
        const tubeHeight = 256;

        const items = placed.map((p, idx) => {
          const item = findItem(p.id);
          if (!item) return null;
          if (p.id === "sodium-piece" && hasIgnitionTube) return null;
          if (p.id === "organic-compound" && hasIgnitionTube) return null;
          if (p.id === "water-bath" || p.id === "distilled-water") return null; // remove water bath & distilled water symbol from workbench
          const Icon =
            p.id === "ignition-tube"
              ? TestTube
              : p.id === "sodium-piece"
              ? Beaker
              : p.id === "bunsen-burner"
              ? Flame
              : p.id === "organic-compound"
              ? FlaskConical
              : p.id === "water-bath" || p.id === "distilled-water"
              ? Droplets
              : Filter;
          const colorClass =
            p.id === "ignition-tube"
              ? "text-blue-600"
              : p.id === "sodium-piece"
              ? "text-emerald-600"
              : p.id === "bunsen-burner"
              ? "text-orange-500"
              : p.id === "organic-compound"
              ? "text-purple-600"
              : p.id === "water-bath"
              ? "text-blue-500"
              : p.id === "distilled-water"
              ? "text-sky-500"
              : "text-amber-600";
          return (
            <div
              key={`${p.id}-${idx}`}
              className="absolute select-none"
              style={{ left: p.x, top: p.y }}
            >
              <div className="flex flex-col items-center">
                <div className={`${p.id === "ignition-tube" ? "w-56 h-64" : p.id === "bunsen-burner" ? "w-[480px] h-[480px]" : "w-16 h-16"} relative rounded-lg ${p.id === "ignition-tube" || p.id === "bunsen-burner" ? "bg-transparent border-0 shadow-none" : "bg-white border-2 border-blue-200 shadow-sm"} flex items-center justify-center ${colorClass}`}>
                  {p.id === "ignition-tube" ? (!hideTube && (
                    <>
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F320141ac949c402cb646f053900e49f8?format=webp&width=800"
                        alt="Fusion Tube"
                        className="max-w-[176px] max-h-[208px] object-contain"
                      />
                      {hasSodiumPiece && (
                        <div className="absolute bottom-10 left-[53%] -translate-x-1/2 pointer-events-none">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-400 shadow-md"
                            style={{
                              background:
                                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(229,231,235,0.9) 40%, #9ca3af 70%, #6b7280 100%)",
                            }}
                          />
                        </div>
                      )}
                      {hasOrganicCompound && (
                        <div className="absolute bottom-12 left-[53%] -translate-x-1/2 pointer-events-none">
                          <div className="relative w-[22px] h-[110px] overflow-hidden">
                            {/* Liquid content with heat-responsive color */}
                            <div
                              className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                              style={{
                                height: "22%",
                                background: `linear-gradient(to top, ${heatedColors.top}, ${heatedColors.bottom})`,
                                borderTopLeftRadius: 8,
                                borderTopRightRadius: 8,
                                opacity: 0.95,
                                boxShadow: `0 0 ${8 + 24 * heatProgress}px rgba(239,68,68,${0.4 * heatProgress})`,
                                filter: `saturate(${1 + heatProgress * 0.5}) brightness(${1 + heatProgress * 0.2})`,
                              }}
                            />
                            {/* Red-hot glow at tube tip when heating */}
                            <div
                              className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full"
                              style={{
                                width: 40,
                                height: 40,
                                background: `radial-gradient(circle, rgba(255,80,80,${0.6 * heatProgress}) 0%, rgba(255,140,0,${0.4 * heatProgress}) 40%, rgba(255,140,0,0) 70%)`,
                                filter: `blur(${6 + 10 * heatProgress}px)`,
                                opacity: heatProgress,
                                transition: "opacity 200ms, filter 200ms",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )) : p.id === "bunsen-burner" ? (
                    <img src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2Fc4be507c9a054f00b694808aa900a9e5?format=webp&width=800" alt="Bunsen Burner" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                {!(p.id === "ignition-tube" || p.id === "bunsen-burner") && (
                  <span className="mt-1 text-xs font-medium text-gray-700 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                    {item.label}
                  </span>
                )}
              </div>
            </div>
          );
        });

        const visuals: JSX.Element[] = [];
        if (hasBunsenBurner && burner) {
          const burnerMouthY = burner.y + 80;
          const containerH = containerRef.current?.getBoundingClientRect().height || 0;
          visuals.push(
            <div
              key="heat-control"
              className="absolute z-20"
              style={{
                left: 16,
                top: Math.min(Math.max(burnerMouthY, 16), containerH - 60),
              }}
            >
              <Button
                onClick={() => {
                  if (isHeating || isPostHeated) {
                    if (heatTimerRef.current) {
                      clearTimeout(heatTimerRef.current);
                      heatTimerRef.current = null;
                    }
                    setIsHeating(false);
                    setIsPostHeated(true);
                    setPlaced((prev) => prev.filter((p) => p.id !== "bunsen-burner"));
                    return;
                  }
                  setIsHeating(true);
                }}
                className={`${isHeating || isPostHeated ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white shadow px-4 py-2 rounded-md`}
              >
                {isHeating || isPostHeated ? "REMOVE BUNSEN BURNER" : "START heating"}
              </Button>
            </div>
          );
        }

        // Show china dish when water bath is on the bench
        if (hasWaterBath && waterBath) {
          // Prefer positioning directly under the fusion tube in the empty space
          const dishSize = { w: 238, h: 238 };
          const left = tube ? (tube.x + (tubeWidth - dishSize.w) / 2) : (waterBath.x + 80);
          const top = tube ? (tube.y + tubeHeight + 12) : (waterBath.y - 20);
          visuals.push(
            <div
              key="china-dish"
              className="absolute pointer-events-none"
              style={{ left, top, width: dishSize.w, height: dishSize.h }}
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F21e55328d5ce41dea7cd0cecc3be9548?format=webp&width=800"
                alt="China Dish"
                className="w-full h-full object-contain drop-shadow-md"
                style={{ background: 'transparent' }}
              />
              {hasDistilledWater && (
                <div
                  className="absolute"
                  style={{
                    left: dishSize.w * 0.21,
                    top: dishSize.h * 0.55,
                    width: dishSize.w * 0.58,
                    height: dishSize.h * 0.18,
                    borderRadius: '50% / 70% 70% 40% 40%',
                    background: 'radial-gradient(ellipse at 50% 45%, rgba(191,219,254,0.95) 0%, rgba(147,197,253,0.8) 45%, rgba(59,130,246,0.55) 70%, rgba(59,130,246,0.0) 100%)',
                    boxShadow: 'inset 0 6px 10px rgba(59,130,246,0.25)',
                    transform: 'skewX(-6deg)',
                    overflow: 'hidden',
                    clipPath: 'ellipse(50% 48% at 50% 50%)',
                  }}
                />
              )}
              {isBroken && (
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={`shard-${i}`}
                      className="absolute bg-white/80 shadow-sm"
                      style={{
                        left: (dishSize.w * 0.22) + Math.random() * dishSize.w * 0.54,
                        top: (dishSize.h * 0.55) + Math.random() * dishSize.h * 0.18,
                        width: 8 + (i % 3) * 4,
                        height: 6 + (i % 2) * 4,
                        transform: `rotate(${(i * 32) % 360}deg)` ,
                        clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)',
                        animation: 'dropShard 500ms ease-out both',
                      }}
                    />
                  ))}
                  <div className="absolute left-[22%] top-[56%] w-[56%] h-[18%] rounded-full border-2 border-blue-300/60 opacity-0 animate-[ripple_1.2s_ease-out_1]" />
                </>
              )}
            </div>
          );

          // Break button beside dish
          if (hasIgnitionTube && tube && !isBroken) {
            visuals.push(
              <div key="break-btn" className="absolute z-20"
                style={{ left: left + dishSize.w + 12, top: top + dishSize.h - 40 }}>
                <Button
                  onClick={() => {
                    const destLeft = left + (dishSize.w - 224) / 2;
                    const destTop = top - (256 - 24);
                    setIsBreaking(true);
                    setHideTube(true);
                    setAnimTube({ left: tube.x, top: tube.y, rotate: 0 });
                    requestAnimationFrame(() =>
                      setAnimTube({ left: destLeft, top: destTop, rotate: 35 })
                    );
                    window.setTimeout(() => {
                      setIsBreaking(false);
                      setIsBroken(true);
                      setAnimTube(null);
                    }, 750);
                  }}
                  disabled={isBreaking}
                  className="bg-red-600 hover:bg-red-700 text-white shadow px-3 py-2 rounded-md text-xs"
                >
                  BREAK FUSION TUBE
                </Button>
              </div>
            );
          }

          // Animated falling tube overlay
          if (isBreaking && animTube) {
            visuals.push(
              <div key="anim-tube" className="absolute"
                style={{
                  left: animTube.left,
                  top: animTube.top,
                  width: 224,
                  height: 256,
                  transform: `rotate(${animTube.rotate}deg)`,
                  transition: 'left 700ms cubic-bezier(0.22,0.61,0.36,1), top 700ms cubic-bezier(0.22,0.61,0.36,1), transform 700ms ease-out',
                }}>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F320141ac949c402cb646f053900e49f8?format=webp&width=800"
                  alt="Falling Fusion Tube"
                  className="max-w-[176px] max-h-[208px] object-contain"
                />
              </div>
            );
          }
        }

        if (hasIgnitionTube && hasBunsenBurner && tube && burner && isHeating) {
          const burnerCenterX = burner.x + 480 / 2;
          const tubeBottomY = tube.y + tubeHeight - 40;
          const burnerMouthY = burner.y + 80;
          const flameX = burnerCenterX - 24; // align with burner hole
          const minY = burnerMouthY - 24; // keep near but above burner mouth
          const targetBelowTube = tubeBottomY - 26; // keep a safe gap below the tube
          const targetAboveMouth = burnerMouthY - 12; // top boundary near burner mouth
          const midGapY = (targetBelowTube + targetAboveMouth) / 2; // midpoint between tube and burner
          const desiredY = Math.min(targetBelowTube, Math.max(targetAboveMouth, midGapY));
          const flameY = Math.max(minY, desiredY);
          visuals.push(
            <div key="flame" className="absolute pointer-events-none" style={{ left: flameX, top: flameY }}>
              <div className="relative w-8 h-32">
                <div style={{ animation: 'flameFlicker 0.8s ease-in-out infinite' }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-24 rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent blur-sm opacity-90" />
                <div style={{ animation: 'flameFlicker 1s ease-in-out infinite' }} className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-16 rounded-full bg-gradient-to-t from-red-500 via-orange-400 to-transparent blur-[2px] opacity-80" />
                <div style={{ animation: 'rise 1.2s linear infinite' }} className="absolute bottom-20 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-200 rounded-full opacity-70" />
                <div style={{ animation: 'heatWave 1s ease-in-out infinite' }} className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-40" />
              </div>
            </div>
          );

          // Heat shimmer around tube bottom
          visuals.push(
            <div key="tubeGlow" className="absolute pointer-events-none" style={{ left: tube.x + (tubeWidth / 2) - 28, top: tube.y + tubeHeight - 68 }}>
              <div
                className="rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  background: `radial-gradient(circle, rgba(255,99,71,${0.55}) 0%, rgba(255,140,0,0.45) 45%, rgba(255,140,0,0) 70%)`,
                  filter: "blur(10px)",
                  opacity: 0.85,
                  animation: 'flameFlicker 1.2s ease-in-out infinite',
                }}
              />
            </div>
          );
        }

        return (
          <>
            {items}
            {visuals}
          </>
        );
      })()}

      {placed.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-sm text-blue-500 bg-blue-50 border border-blue-200 rounded-md px-3 py-1 shadow-sm">
            Drag equipment here
          </div>
        </div>
      )}
      <style>{`
@keyframes flameFlicker {
  0% { transform: translateY(0) scaleY(1); opacity: .9; }
  50% { transform: translateY(-2px) scaleY(1.1); opacity: 1; }
  100% { transform: translateY(0) scaleY(.95); opacity: .85; }
}
@keyframes heatWave {
  0% { transform: translateY(0) scaleY(1); filter: blur(1px); }
  50% { transform: translateY(-2px) scaleY(1.05); filter: blur(1.5px); }
  100% { transform: translateY(0) scaleY(1); filter: blur(1px); }
}
@keyframes rise {
  0% { transform: translate(-50%, 0); opacity: .8; }
  100% { transform: translate(-50%, -18px); opacity: 0; }
}
@keyframes dropShard {
  0% { transform: translateY(-20px) scale(0.9) rotate(0deg); opacity: 0; }
  100% { transform: translateY(0) scale(1) rotate(25deg); opacity: 1; }
}
@keyframes ripple {
  0% { transform: scale(0.95); opacity: 0.6; }
  100% { transform: scale(1.12); opacity: 0; }
}
`}</style>
    </div>
  );
}
