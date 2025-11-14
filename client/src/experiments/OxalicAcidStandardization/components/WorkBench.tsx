import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "./Equipment";
import { Chemical } from "./Chemical";
import { Play, Pause, RotateCcw, Calculator, FlaskConical } from "lucide-react";
import StirringAnimation from "./StirringAnimation";
import type {
  EquipmentPosition,
  SolutionPreparationState,
  Measurements,
  Result,
  ExperimentStep,
  Chemical as ChemicalType,
  Equipment as EquipmentType,
} from "../types";

interface WorkBenchProps {
  step: ExperimentStep;
  experimentStarted: boolean;
  onStartExperiment: (run?: boolean) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  onStepAction: (opts?: { skipAnimation?: boolean }) => void;
  canProceed: boolean;
  equipmentPositions: EquipmentPosition[];
  setEquipmentPositions: React.Dispatch<React.SetStateAction<EquipmentPosition[]>>;
  preparationState: SolutionPreparationState;
  measurements: Measurements;
  results: Result[];
  chemicals: ChemicalType[];
  equipment: EquipmentType[];
  onEquipmentPlaced?: (id: string) => void;
  onUndoStep: () => void;
  onResetExperiment: () => void;
  currentStepIndex: number;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  step,
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  onResetTimer,
  stepNumber,
  totalSteps,
  experimentTitle,
  onStepAction,
  canProceed,
  equipmentPositions,
  setEquipmentPositions,
  preparationState,
  measurements,
  results,
  chemicals,
  equipment,
  onEquipmentPlaced,
  onUndoStep,
  onResetExperiment,
  currentStepIndex,
}) => {
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [temperature, setTemperature] = useState(25);
  const [showCalculator, setShowCalculator] = useState(false);
  // amount of oxalic acid (g) the user wants to add into the weighing boat during step 3
  // keep this completely under user control (do not auto-sync with calculated targetMass)
  const [acidAmount, setAcidAmount] = useState<string>("");
  // show blinking effect on the "Add to Weighing Boat" button when oxalic acid bottle is present
  const [blinkAddButton, setBlinkAddButton] = useState<boolean>(false);

  // pouring animation state when adding acid into the weighing boat
  const [pouring, setPouring] = useState<{ boatId: string; x: number; y: number; active: boolean } | null>(null);
  const [washAnimation, setWashAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [mixingAnimation, setMixingAnimation] = useState<{ x: number; y: number; width?: number; height?: number; active: boolean } | null>(null);
  const pourTimeoutRef = useRef<number | null>(null);

  // Enable blinking while an oxalic acid bottle exists on the workbench during the weighing step
  useEffect(() => {
    try {
      const hasOxalicBottle = equipmentPositions.some(p => p.isBottle && Array.isArray(p.chemicals) && p.chemicals.some((c: any) => (c.id || '').toString().toLowerCase().includes('oxalic')));
      if (stepNumber === 3 && hasOxalicBottle) {
        setBlinkAddButton(true);
      } else {
        setBlinkAddButton(false);
      }
    } catch (e) {
      // ignore
      setBlinkAddButton(false);
    }
  }, [equipmentPositions, stepNumber]);

  // animation overlay state for moving a weighing boat to the analytical balance
  const [boatMoveOverlay, setBoatMoveOverlay] = useState<{ id: string; x: number; y: number; targetX: number; targetY: number; started: boolean } | null>(null);
  const boatMoveRef = useRef<number | null>(null);

  // messages shown on the workbench area (transient)
  const [workbenchMessage, setWorkbenchMessage] = useState<string | null>(null);
  const [workbenchMessageVariant, setWorkbenchMessageVariant] = useState<'default' | 'colorful' | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);

  const showMessage = useCallback((text: string, variant: 'default' | 'colorful' = 'default') => {
    setWorkbenchMessage(text);
    setWorkbenchMessageVariant(variant);
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setWorkbenchMessage(null);
      setWorkbenchMessageVariant(null);
      messageTimeoutRef.current = null;
    }, 8000);
  }, []);

  // Cleanup for timeouts on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      if (pourTimeoutRef.current) {
        window.clearTimeout(pourTimeoutRef.current);
        pourTimeoutRef.current = null;
      }
    };
  }, []);

  // show a colorful hint for first-time users; persist dismissal in localStorage
  const [showAcidHint, setShowAcidHint] = useState<boolean>(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem('seenAcidControl');
      setShowAcidHint(!seen);
    } catch (e) {
      setShowAcidHint(false);
    }
  }, []);
  const dismissAcidHint = () => {
    try { localStorage.setItem('seenAcidControl', '1'); } catch (e) {}
    setShowAcidHint(false);
  };

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      if (pourTimeoutRef.current) {
        window.clearTimeout(pourTimeoutRef.current);
        pourTimeoutRef.current = null;
      }
    };
  }, []);

  // Listen for global reminder events triggered by equipment components
  useEffect(() => {
    const handler = () => {
      // Show a clear instruction when the oxalic acid bottle is clicked or dropped
      showMessage("Please check the calculator before adding the amount of oxalic acid");
    };
    window.addEventListener("oxalicCalculatorReminder", handler as EventListener);
    return () => {
      window.removeEventListener("oxalicCalculatorReminder", handler as EventListener);
    };
  }, [showMessage]);

  // Listen for programmatic distilled water additions from the chemical palette
  useEffect(() => {
    const addWaterHandler = (e: any) => {
      try {
        const detail = e?.detail || {};
        const amount = Number(detail.amount) || 100;

        // Find a beaker on the workbench
        const beakers = equipmentPositions.filter(p => ((p.typeId ?? p.id) + '').toLowerCase().includes('beaker'));
        if (beakers.length === 0) {
          showMessage('Place a beaker on the workbench to add distilled water.', 'colorful');
          return;
        }

        // Choose the first beaker (nearest could be implemented later)
        const target = beakers[0];

        // Compute animation position using DOM if available
        const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
        let animX = (target.x || 0) + 20;
        let animY = (target.y || 0) - 60;
        if (surfaceEl) {
          const beakerEl = surfaceEl.querySelector(`[data-equipment-id="${target.id}"]`) as HTMLElement | null;
          const surfaceRect = surfaceEl.getBoundingClientRect();
          if (beakerEl) {
            const beakerRect = beakerEl.getBoundingClientRect();
            animX = beakerRect.left - surfaceRect.left + beakerRect.width * 0.6;
            animY = beakerRect.top - surfaceRect.top - Math.max(40, beakerRect.height * 0.6);
          }
        }

        // Show a colorful hint telling the user where to add distilled water from
        showMessage(`Adding ${amount} mL distilled water into the beaker. Use the wash bottle or the Distilled Water bottle on the left.`, 'colorful');

        // Start a wash-like animation above the beaker
        setWashAnimation({ x: animX, y: animY, active: true });

        // If current step is 5, run a longer (6s) animation and then replace beaker image
        const isStepFive = stepNumber === 5;
        const duration = isStepFive ? 6000 : 1600;

        // After animation completes, actually add the water to the beaker's chemicals array
        window.setTimeout(() => {
          setEquipmentPositions(prev => prev.map(pos => {
            if (pos.id === target.id) {
              const updated = {
                ...pos,
                chemicals: [
                  ...pos.chemicals,
                  {
                    id: 'distilled_water',
                    name: 'Distilled Water',
                    color: '#87CEEB',
                    amount: amount,
                    concentration: 'Pure'
                  }
                ]
              };

              // For step 5, replace the beaker's image with the provided beaker image
              if (isStepFive) {
                // Replace with provided colored beaker image after water addition animation
                updated.imageSrc = 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F6fdc7538c2e9406bb8a67f4450870db4?format=webp&width=800';
              }

              return updated;
            }
            return pos;
          }));

          // stop animation and show confirmation
          setWashAnimation(null);
          showMessage(`${amount} mL distilled water added to the beaker.`);

          // If step 5, remove the distilled water bottle from the workspace (if present) and notify
          if (isStepFive) {
            try {
              setEquipmentPositions(prev => prev.filter(pos => {
                const idLower = (pos.typeId || pos.id || '').toString().toLowerCase();
                const hasDistilledChemical = Array.isArray(pos.chemicals) && pos.chemicals.some((c: any) => (c.id || '').toString().toLowerCase().includes('distilled'));
                // remove if it's a bottle representing distilled water or contains distilled_water as chemical
                if (pos.isBottle && hasDistilledChemical) return false;
                if (idLower.includes('distilled_water') || idLower.includes('distilled-water') || idLower.includes('distilledwater')) return false;
                return true;
              }));
            } catch (e) {}

            try { window.dispatchEvent(new CustomEvent('oxalic_beaker_image_shown')); } catch (e) {}
          }
        }, duration);
      } catch (err) {
        console.warn('addDistilledWater handler error', err);
      }
    };

    window.addEventListener('addDistilledWater', addWaterHandler as EventListener);
    return () => window.removeEventListener('addDistilledWater', addWaterHandler as EventListener);
  }, [equipmentPositions, setEquipmentPositions, showMessage, stepNumber]);

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

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // support multiple drag data formats for robustness
    const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("equipment") || e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list") || "";
    const isStepOne = stepNumber === 1;
    const allowedStepOneEquipment = new Set(["analytical_balance", "weighing_boat"]);
    const normalizeId = (value?: string) => (value ? value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "");
    const notThisStepMessage = "These equipments not necessary in this current step.";

    const enforceStepOneRestriction = (incomingId?: string) => {
      if (!isStepOne) return false;
      const normalized = normalizeId(incomingId);
      if (!incomingId || !allowedStepOneEquipment.has(normalized)) {
        showMessage(notThisStepMessage);
        return true;
      }
      return false;
    };

    let data: any = null;
    try {
      if (raw) {
        data = JSON.parse(raw);
      }
    } catch (err) {
      // raw wasn't JSON, handle common fallbacks below
      data = null;
    }

    // Helper to add a bottle (chemical)
    const addBottle = (payload: any) => {
      if (enforceStepOneRestriction(payload?.id)) {
        return;
      }

      const newPosId = `${payload.id || 'bottle'}_${Date.now()}`;

      // Default placement near drop point
      let tx = x - 30;
      let ty = y - 30;

      try {
        // If this is the oxalic acid dihydrate bottle, place it at a canonical position on the left side
        // of the workbench so it matches the requested screenshot placement.
        const idLower = (payload.id || '').toString().toLowerCase();
        if (idLower.includes('oxalic')) {
          const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
          if (surfaceEl) {
            const rect = surfaceEl.getBoundingClientRect();
            // Place roughly at 8% width from left and 20% height from top (adjusted to match visual)
            tx = Math.max(8, Math.floor(rect.width * 0.08));
            ty = Math.max(8, Math.floor(rect.height * 0.18));
          } else {
            // Fallback absolute coordinates if DOM not available
            tx = 80;
            ty = 110;
          }
        }
      } catch (e) {
        // ignore and use default drop coordinates
      }

      setEquipmentPositions(prev => [
        ...prev,
        {
          id: newPosId,
          x: tx,
          y: ty,
          isBottle: true,
          chemicals: [
            {
              id: payload.id,
              name: payload.name || payload.id,
              color: payload.color || "#87CEEB",
              amount: payload.amount || (payload.volume || 50),
              concentration: payload.concentration || "",
            }
          ],
        }
      ]);
      // small delay then align beaker & wash bottle for step 4
      setTimeout(() => alignBeakerAndWash(true), 60);

      // Notify parent that this chemical bottle was placed so the chemical can be removed from the palette
      try {
        if (onEquipmentPlaced && payload && payload.id) {
          onEquipmentPlaced(payload.id);
        }
      } catch {}

      // If oxalic acid bottle was added during quantitative analysis step, show reminder and dispatch event
      try {
        if (payload && payload.id === 'oxalic_acid' && stepNumber === 3) {
          showMessage('Click the calculator once to see the amount of acid required');
          try { window.dispatchEvent(new CustomEvent('oxalicCalculatorReminder')); } catch {}
        }
      } catch {}
    };

    // If data parsed as object, handle as before
    if (data && typeof data === 'object') {
      if (data.concentration || data.volume) {
        addBottle(data);
        return;
      }

      if (data.id && data.name) {
        if (enforceStepOneRestriction(data.id)) {
          return;
        }
        // Compute placement; special-case analytical balance to snap to a canonical spot on the workbench surface
      {
        const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
        let tx = x - 50;
        let ty = y - 50;
        if (surfaceEl && (data.id === 'analytical_balance' || (data.name || '').toLowerCase().includes('analytical balance'))) {
          const rect = surfaceEl.getBoundingClientRect();
          // place the balance slightly right-of-center and near the top of the bench
          tx = Math.max(8, Math.min(rect.width - 120, Math.floor(rect.width * 0.52)));
          ty = Math.max(8, Math.min(rect.height - 120, Math.floor(rect.height * 0.18)));
        }

        const newId = `${data.id}_${Date.now()}`;
        setEquipmentPositions(prev => [
          ...prev,
          {
            id: newId,
            x: tx,
            y: ty,
            chemicals: [],
            typeId: data.id,
            name: data.name,
            imageSrc: (stepNumber === 4 && (data.id === 'volumetric_flask' || (data.name || '').toLowerCase().includes('volumetric flask')))
              ? 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fb798dbbe782d4eefaedc7d51d5a72a53?format=webp&width=800'
              : data.imageSrc,
          }
        ]);

        // if a weighing boat was just placed and an analytical balance exists on the bench, animate the boat moving onto the balance
        if (data.id === 'weighing_boat') {
          setTimeout(() => {
            try {
              const balance = equipmentPositions.find(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('analytical_balance') || ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('analytical-balance'));
              const surfaceRect = surfaceEl ? surfaceEl.getBoundingClientRect() : { width: 300, height: 200 };
              if (balance) {
                const fromX = tx;
                const fromY = ty;

                // Compute precise target using DOM bounding rect when available so the boat lands on the balance pan
                let toX = (typeof balance.x === 'number') ? balance.x + 20 : Math.max(8, Math.floor(surfaceRect.width * 0.52));
                let toY = (typeof balance.y === 'number') ? balance.y + 36 : Math.max(8, Math.floor(surfaceRect.height * 0.18) + 30);
                try {
                  if (surfaceEl) {
                    const balanceEl = surfaceEl.querySelector(`[data-equipment-id="${balance.id}"]`) as HTMLElement | null;
                    if (balanceEl) {
                      const surfaceRect2 = surfaceEl.getBoundingClientRect();
                      const balRect = balanceEl.getBoundingClientRect();
                      // center the boat horizontally over the balance pan and vertically place it near the pan top
                      const BOAT_W = 88;
                      const BOAT_H = 46;
                      // small manual offsets to align the boat visually on the balance pan as in reference image
                      const OFFSET_X = 0; // nudge right
                      const OFFSET_Y = -6; // nudge slightly up
                      const panCenterX = balRect.left - surfaceRect2.left + Math.floor(balRect.width * 0.5) - Math.floor(BOAT_W / 2) + OFFSET_X;
                      const panCenterY = balRect.top - surfaceRect2.top + Math.floor(balRect.height * 0.62) - Math.floor(BOAT_H / 2) + OFFSET_Y;
                      toX = Math.max(8, Math.min(surfaceRect2.width - 80, Math.round(panCenterX)));
                      toY = Math.max(8, Math.min(surfaceRect2.height - 80, Math.round(panCenterY)));
                    }
                  }
                } catch (e) {}

                // Create overlay at initial position
                setBoatMoveOverlay({ id: newId, x: fromX, y: fromY, targetX: toX, targetY: toY, started: false });

                // Trigger transition to target in next tick
                setTimeout(() => {
                  setBoatMoveOverlay(prev => prev ? { ...prev, x: toX, y: toY, started: true } : prev);
                }, 40);

                // After animation completes (2s), finalize by moving the actual equipment position and clearing overlay
                if (boatMoveRef.current) { window.clearTimeout(boatMoveRef.current); boatMoveRef.current = null; }
                boatMoveRef.current = window.setTimeout(() => {
                  setEquipmentPositions(prev => prev.map(pos => pos.id === newId ? { ...pos, x: toX, y: toY } : pos));
                  setBoatMoveOverlay(null);
                  if (boatMoveRef.current) { window.clearTimeout(boatMoveRef.current); boatMoveRef.current = null; }
                }, 2000);
              }
            } catch (e) { console.warn('boat move animation error', e); }
          }, 60);
        }
      }
      setTimeout(() => alignBeakerAndWash(true), 60);
      // Notify parent that this equipment was placed so it can be removed from the palette
      if (onEquipmentPlaced) onEquipmentPlaced(data.id);
      return;
      }
    }

    // If raw is a URL (user dragged an image), create a generic equipment that displays the image
    if (raw && raw.startsWith("http")) {
      if (isStepOne) {
        showMessage(notThisStepMessage);
        return;
      }
      setEquipmentPositions(prev => [
        ...prev,
        {
          id: `image_${Date.now()}`,
          x: x - 60,
          y: y - 60,
          chemicals: [],
          name: 'Dropped Image',
          imageSrc: raw,
        }
      ]);
      setTimeout(() => alignBeakerAndWash(true), 60);
      return;
    }

    // If raw is a plain id string (e.g., "analytical_balance" or chemical id), try to resolve from props
    if (raw) {
      const trimmed = raw.trim();

      // Try equipment list first
      const eq = equipment.find(eqp => eqp.id === trimmed);
      if (eq) {
        if (enforceStepOneRestriction(eq.id)) {
          return;
        }
        // Compute placement; special-case analytical balance to snap to a canonical spot on the workbench surface
      {
        const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
        let tx = x - 50;
        let ty = y - 50;
        if (surfaceEl && eq.id === 'analytical_balance') {
          const rect = surfaceEl.getBoundingClientRect();
          tx = Math.max(8, Math.min(rect.width - 120, Math.floor(rect.width * 0.52)));
          ty = Math.max(8, Math.min(rect.height - 120, Math.floor(rect.height * 0.18)));
        }

        const newId = `${eq.id}_${Date.now()}`;
        setEquipmentPositions(prev => [
          ...prev,
          {
            id: newId,
            x: tx,
            y: ty,
            chemicals: [],
            typeId: eq.id,
            name: eq.name,
            imageSrc: eq.id === 'beaker'
              ? 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F03381c98835e4fe0b01246d23bc6440f?format=webp&width=800'
              : (stepNumber === 4 && eq.id === 'volumetric_flask')
                ? 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fb798dbbe782d4eefaedc7d51d5a72a53?format=webp&width=800'
                : undefined,
          }
        ]);

        // If adding core step-4 equipment, auto-place them into the target layout for step 4
        if (stepNumber === 4 && ['beaker', 'volumetric_flask', 'wash_bottle', 'wash-bottle', 'wash'].includes(eq.id)) {
          setTimeout(() => {
            try {
              const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
              if (!surfaceEl) return;
              const rect = surfaceEl.getBoundingClientRect();

              // compute preferred positions similar to alignBeakerAndWash (match reference layout)
              const targetBeakerX = Math.max(16, Math.floor(rect.width * 0.12));
              const targetBeakerY = Math.max(12, Math.floor(rect.height * 0.70));
              const targetWashX = Math.min(rect.width - 60, Math.floor(rect.width * 0.60));
              const targetWashY = Math.max(2, Math.floor(rect.height * 0.20));
              const targetFlaskX = Math.max(8, Math.floor(rect.width * 0.12));
              const targetFlaskY = Math.max(8, Math.floor(rect.height * 0.18));

              setEquipmentPositions(prev => prev.map(pos => {
                if (pos.id === newId) {
                  if (eq.id === 'beaker') return { ...pos, x: targetBeakerX, y: targetBeakerY };
                  if (eq.id === 'volumetric_flask') return { ...pos, x: targetFlaskX, y: targetFlaskY };
                  if (eq.id === 'wash_bottle' || eq.id === 'wash-bottle' || eq.id === 'wash') return { ...pos, x: targetWashX, y: targetWashY };
                }
                return pos;
              }));

              // ensure final alignment with other items
              setTimeout(() => alignBeakerAndWash(true), 60);
            } catch (e) { console.warn('auto-align error', e); }
          }, 40);
        }

        // If it's a weighing boat, animate it onto the analytical balance if available
        if (eq.id === 'weighing_boat') {
          setTimeout(() => {
            try {
              const balance = equipmentPositions.find(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('analytical_balance') || ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('analytical-balance'));
              const surfaceRect = surfaceEl ? surfaceEl.getBoundingClientRect() : { width: 300, height: 200 };
              if (balance) {
                const fromX = tx;
                const fromY = ty;
                let toX = (typeof balance.x === 'number') ? balance.x + 20 : Math.max(8, Math.floor(surfaceRect.width * 0.52));
                let toY = (typeof balance.y === 'number') ? balance.y + 36 : Math.max(8, Math.floor(surfaceRect.height * 0.18) + 30);
                try {
                  if (surfaceEl) {
                    const balanceEl = surfaceEl.querySelector(`[data-equipment-id="${balance.id}"]`) as HTMLElement | null;
                    if (balanceEl) {
                      const surfaceRect2 = surfaceEl.getBoundingClientRect();
                      const balRect = balanceEl.getBoundingClientRect();
                      const BOAT_W = 88;
                      const BOAT_H = 46;
                      // small manual offsets to align the boat visually on the balance pan as in reference image
                      const OFFSET_X = 0; // nudge right
                      const OFFSET_Y = -6; // nudge slightly up
                      const panCenterX = balRect.left - surfaceRect2.left + Math.floor(balRect.width * 0.5) - Math.floor(BOAT_W / 2) + OFFSET_X;
                      const panCenterY = balRect.top - surfaceRect2.top + Math.floor(balRect.height * 0.62) - Math.floor(BOAT_H / 2) + OFFSET_Y;
                      toX = Math.max(8, Math.min(surfaceRect2.width - 80, Math.round(panCenterX)));
                      toY = Math.max(8, Math.min(surfaceRect2.height - 80, Math.round(panCenterY)));
                    }
                  }
                } catch (e) {}

                setBoatMoveOverlay({ id: newId, x: fromX, y: fromY, targetX: toX, targetY: toY, started: false });
                setTimeout(() => setBoatMoveOverlay(prev => prev ? { ...prev, x: toX, y: toY, started: true } : prev), 40);

                if (boatMoveRef.current) { window.clearTimeout(boatMoveRef.current); boatMoveRef.current = null; }
                boatMoveRef.current = window.setTimeout(() => {
                  setEquipmentPositions(prev => prev.map(pos => pos.id === newId ? { ...pos, x: toX, y: toY } : pos));
                  setBoatMoveOverlay(null);
                  if (boatMoveRef.current) { window.clearTimeout(boatMoveRef.current); boatMoveRef.current = null; }
                }, 2000);
              }
            } catch (e) { console.warn('boat move animation error', e); }
          }, 60);
        }
      }
      setTimeout(() => alignBeakerAndWash(true), 60);
      // Notify parent that this equipment was placed (hide from palette)
      if (onEquipmentPlaced) onEquipmentPlaced(eq.id);
      return;
      }

      // Try chemicals list
      const chem = chemicals.find(c => c.id === trimmed);
      if (chem) {
        addBottle(chem);
        return;
      }
    }

    // Fallback: notify user or log
    if (isStepOne) {
      showMessage(notThisStepMessage);
    } else {
      console.warn('Unrecognized drop data:', raw);
    }
  };

  const handleEquipmentDrag = (id: string, x: number, y: number) => {
    setEquipmentPositions(prev =>
      prev.map(pos =>
        pos.id === id ? { ...pos, x, y } : pos
      )
    );
  };

  const handleChemicalDrop = (chemicalId: string, equipmentId: string, amount: number) => {
    setEquipmentPositions(prev =>
      prev.map(pos => {
        if (pos.id === equipmentId) {
          const chemical = chemicals.find(c => c.id === chemicalId);
          if (chemical) {
            return {
              ...pos,
              chemicals: [
                ...pos.chemicals,
                {
                  id: chemicalId,
                  name: chemical.name,
                  color: chemical.color,
                  amount: amount,
                  concentration: chemical.concentration,
                }
              ]
            };
          }
        }
        return pos;
      })
    );
  };

  const handleEquipmentRemove = (id: string) => {
    setEquipmentPositions(prev => prev.filter(pos => pos.id !== id));
  };

  const handleEquipmentAction = (action: string, equipmentId?: string) => {
    switch (action) {
      case "weigh":
        // default weighing behaviour: trigger the step action which starts weighing animation in the lab
        onStepAction();
        break;

      case "stir": {
        // If this is the final mixing step (step 6), perform a visual mixing animation where
        // acid from the weighing boat is mixed into the beaker for ~7 seconds, replace the
        // beaker image with the provided mixed-beaker image, then remove the stirrer and
        // weighing boat from the workspace and complete the step.
        if (stepNumber === 5 || stepNumber === 6) {
          // Find beaker and weighing boat positions
          const beaker = equipmentPositions.find(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('beaker'));
          const boat = equipmentPositions.find(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('weighing_boat') || ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('weighing-boat'));

          if (!beaker) {
            showMessage('Place a beaker on the workbench to mix the solution.');
            return;
          }
          if (!boat) {
            showMessage('Place the weighing boat containing the acid on the workbench first.');
            return;
          }

          // Compute approximate animation position centered above the beaker using DOM when available
          const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
          let animX = (beaker.x || 0) + 20;
          let animY = (beaker.y || 0) - 60;
          let animW = 80;
          let animH = 100;
          if (surfaceEl) {
            const beakerEl = surfaceEl.querySelector(`[data-equipment-id="${beaker.id}"]`) as HTMLElement | null;
            if (beakerEl) {
              const surfaceRect = surfaceEl.getBoundingClientRect();
              const beakerRect = beakerEl.getBoundingClientRect();
              // Make overlay cover the upper interior of the beaker so the stirrer appears inside it
              animW = Math.max(48, Math.floor(beakerRect.width * 0.6));
              animH = Math.max(48, Math.floor(beakerRect.height * 0.6));

              // Center horizontally inside the beaker
              animX = beakerRect.left - surfaceRect.left + (beakerRect.width - animW) / 2;

              // Position vertically so the overlay sits inside the beaker (a bit below the rim)
              animY = beakerRect.top - surfaceRect.top + Math.max(8, Math.floor(beakerRect.height * 0.15));
            }
          }

          // Start a stirring animation overlay positioned above the beaker
          setMixingAnimation({ x: animX, y: animY, width: animW, height: animH, active: true });
          showMessage('Stirring the beaker to mix the acid...');

          // Duration of mixing animation (7000ms as requested)
          const MIX_DURATION = 7000;

          // Clear any existing timeouts
          if (pourTimeoutRef.current) {
            window.clearTimeout(pourTimeoutRef.current);
            pourTimeoutRef.current = null;
          }

          // After animation completes, update the beaker image, remove stirrer & boat, and complete the step
          pourTimeoutRef.current = window.setTimeout(() => {
            try {
              const mixedBeakerImage = 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F27074cd0bd354b7d80f9c4b4916c55b8?format=webp&width=800';

              setEquipmentPositions(prev => {
                // replace beaker image and filter out stirrer and weighing boats
                const next = prev
                  .map(pos => {
                    const key = ((pos.typeId ?? pos.id) || '').toString().toLowerCase();
                    if (key.includes('beaker')) {
                      return { ...pos, imageSrc: mixedBeakerImage };
                    }
                    return pos;
                  })
                  .filter(pos => {
                    const key = ((pos.typeId ?? pos.id) || '').toString().toLowerCase();
                    // remove any weighing boat or stirrer positions from the workspace
                    if (key.includes('weighing_boat') || key.includes('weighing-boat') || key.includes('stirrer')) return false;
                    return true;
                  });

                return next;
              });

              // stop mixing animation overlay
              setMixingAnimation(null);

              // Inform user and complete the step action (which will update preparation state in VirtualLab)
              showMessage('Mixing complete. Final beaker image updated.');

              // Notify other listeners that beaker image was shown (keeps parity with other flows)
              try { window.dispatchEvent(new CustomEvent('oxalic_beaker_image_shown')); } catch (e) {}

              // Trigger the step action to mark step progression
              try { if (typeof onStepAction === 'function') onStepAction(); } catch (e) {}
            } catch (err) {
              console.warn('Mixing completion error', err);
            }

            // Clear timeout ref
            if (pourTimeoutRef.current) { window.clearTimeout(pourTimeoutRef.current); pourTimeoutRef.current = null; }
          }, MIX_DURATION);

          return;
        }

        // Default behaviour for non-step-6 stirring: simply trigger the step action
        onStepAction();
        break;
      }
      case "rinse": {
        if (!equipmentId) {
          showMessage('No wash bottle selected.');
          return;
        }
        const bottle = equipmentPositions.find(p => p.id === equipmentId);
        if (!bottle) {
          showMessage('Wash bottle is not on the workbench.');
          return;
        }

        // Find nearest beaker
        const beakers = equipmentPositions.filter(p => ((p.typeId ?? p.id) + '').toLowerCase().includes('beaker'));
        if (beakers.length === 0) {
          showMessage('Place a beaker on the workbench to rinse.');
          return;
        }
        let nearest = beakers[0];
        let minDist = Number.POSITIVE_INFINITY;
        beakers.forEach(b => {
          const dx = (b.x || 0) - (bottle.x || 0);
          const dy = (b.y || 0) - (bottle.y || 0);
          const d = Math.hypot(dx, dy);
          if (d < minDist) { minDist = d; nearest = b; }
        });

        // Compute wash animation position using actual DOM bounding rect so the stream is over the beaker
        const surfaceEl = (document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement) || null;
        let animX = (nearest.x || 0) + 20;
        let animY = (nearest.y || 0) - 60;
        if (surfaceEl) {
          const beakerEl = surfaceEl.querySelector(`[data-equipment-id="${nearest.id}"]`) as HTMLElement | null;
          const surfaceRect = surfaceEl.getBoundingClientRect();
          if (beakerEl) {
            const beakerRect = beakerEl.getBoundingClientRect();
            animX = beakerRect.left - surfaceRect.left + beakerRect.width * 0.6;
            animY = beakerRect.top - surfaceRect.top - Math.max(40, beakerRect.height * 0.6);
          }
        }

        // Start visual rinse animation positioned above the beaker
        setWashAnimation({ x: animX, y: animY, active: true });
        showMessage('Rinsing the beaker...');

        // After animation completes, clear chemicals in the beaker visually and remove the wash bottle for step 4
        window.setTimeout(() => {
          setEquipmentPositions(prev => prev.map(pos => pos.id === nearest.id ? { ...pos, chemicals: [] } : pos));
          setWashAnimation(null);
          try {
            if (stepNumber === 4) {
              // remove the wash bottle used for rinsing from the workbench
              setEquipmentPositions(prev => prev.filter(pos => pos.id !== bottle.id));
              // Dispatch beaker image shown so other listeners can react
              try { window.dispatchEvent(new CustomEvent('oxalic_beaker_image_shown')); } catch (e) {}
              // automatically trigger the step action to advance to the next step (skip animations where appropriate)
              try { if (typeof onStepAction === 'function') onStepAction({ skipAnimation: true }); } catch (e) {}
            }
          } catch (e) {}
          showMessage('Beaker rinsed.');
        }, 2200);

        break;
      }
    }
  };

  // Auto-align beaker and wash bottle when step 4 is active and both are present
  const washAlignRef = useRef(false);
  useEffect(() => {
    if (stepNumber !== 4) {
      washAlignRef.current = false;
      return;
    }

    const normalize = (value?: string) => (value ? value.toString().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "");
    const beaker = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('beaker'));
    const wash = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('wash') || (p.typeId ?? p.id).toString().includes('wash_bottle') || (p.typeId ?? p.id).toString().includes('wash-bottle'));

    if (!beaker || !wash) {
      washAlignRef.current = false;
      return;
    }

    // Avoid re-aligning repeatedly
    if (washAlignRef.current) return;

    const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();

    // If volumetric flask is present, align to match reference: beaker left/center, wash bottle slightly to its right and higher
    const flask = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('volumetric_flask') || (p.typeId ?? p.id).toString().toLowerCase().includes('volumetric_flask'));

    let targetBeakerX: number;
    let targetBeakerY: number;
    let targetWashX: number;
    let targetWashY: number;

    if (flask) {
      // place beaker slightly left-of-center, a bit lower to appear on the bench
      targetBeakerX = Math.max(16, Math.floor(rect.width * 0.42));
      targetBeakerY = Math.max(12, Math.floor(rect.height * 0.36));
      // wash bottle a little to the right and slightly higher so the spout overlaps the beaker rim naturally
      targetWashX = Math.min(rect.width - 60, targetBeakerX + 28);
      targetWashY = Math.max(2, targetBeakerY - 28);

      // place flask to the right of wash bottle if possible (slightly lower to keep composition)
      const targetFlaskX = Math.min(rect.width - 80, targetWashX + 110);
      const targetFlaskY = Math.min(rect.height - 80, targetBeakerY + 6);

      // apply flask position immediately to keep spacing
      setEquipmentPositions(prev => prev.map(pos => {
        if (pos.id === flask.id) return { ...pos, x: targetFlaskX, y: targetFlaskY };
        return pos;
      }));
    } else {
      // Default target: beaker slightly left of center, wash bottle above-right of beaker
      targetBeakerX = Math.max(16, Math.floor(rect.width * 0.35));
      targetBeakerY = Math.max(16, Math.floor(rect.height * 0.44));
      targetWashX = Math.min(rect.width - 60, targetBeakerX + 80);
      targetWashY = Math.max(8, targetBeakerY - 64);
    }

    // Avoid overlapping existing weighing boat(s). If a weighing boat is present near targets, shift beaker down below the boat
    const boats = equipmentPositions.filter(p => (normalize(p.typeId ?? p.id).includes('weighing_boat') || (p.typeId ?? p.id).toString().toLowerCase().includes('weighing_boat')) && typeof p.x === 'number' && typeof p.y === 'number' && isFinite(p.x) && isFinite(p.y) && (p.x > 8 || p.y > 8));

    const isOverlapping = (x1: number, y1: number, x2: number, y2: number, threshold = 60) => {
      return Math.hypot(x1 - x2, y1 - y2) < threshold;
    };

    if (boats.length > 0) {
      const boat = boats[0];
      // if default beaker pos would land on/near the boat, move beaker below the boat
      if (isOverlapping(targetBeakerX, targetBeakerY, boat.x || 0, boat.y || 0, 80)) {
        targetBeakerX = Math.max(16, (boat.x || 0) - 20);
        targetBeakerY = (boat.y || 0) + 90; // place below
        // ensure within surface
        targetBeakerX = Math.min(rect.width - 80, targetBeakerX);
        targetBeakerY = Math.min(rect.height - 80, targetBeakerY);
        // wash bottle should go to beaker's top-right
        targetWashX = Math.min(rect.width - 60, targetBeakerX + 80);
        targetWashY = Math.max(8, targetBeakerY - 64);
      }
    }

    // If any other equipment is close to target positions, nudge them slightly to avoid collision
    const occupied = equipmentPositions.filter(p => p.id !== beaker.id && p.id !== wash.id);
    const adjustIfCollision = (x: number, y: number) => {
      let nx = x;
      let ny = y;
      occupied.forEach(o => {
        if (isOverlapping(nx, ny, o.x || 0, o.y || 0, 70)) {
          ny += 80; // push down
          nx += 30; // nudge right
        }
      });
      // clamp
      nx = Math.max(8, Math.min(rect.width - 80, nx));
      ny = Math.max(8, Math.min(rect.height - 80, ny));
      return { nx, ny };
    };

    const beakerPos = adjustIfCollision(targetBeakerX, targetBeakerY);
    const washPos = adjustIfCollision(targetWashX, targetWashY);

    setEquipmentPositions(prev => {
      const updated = prev.map(pos => {
        if (pos.id === beaker.id) return { ...pos, x: beakerPos.nx, y: beakerPos.ny };
        if (pos.id === wash.id) return { ...pos, x: washPos.nx, y: washPos.ny };
        return pos;
      });
      // Ensure beaker renders on top by placing it at the end of the array
      const beakerItem = updated.find(p => p.id === beaker.id);
      if (!beakerItem) return updated;
      const others = updated.filter(p => p.id !== beaker.id);
      return [...others, beakerItem];
    });

    washAlignRef.current = true;
    try { showMessage("Click on the Rinse Beaker button to clean the beaker!", 'colorful'); } catch (e) {}
  }, [equipmentPositions, stepNumber]);

  // Alignment helper that forces the beaker and wash bottle into the step-4 layout.
  const alignBeakerAndWash = (force = false) => {
    try {
      if (stepNumber !== 4) return;
      const normalize = (value?: string) => (value ? value.toString().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "");
      const beaker = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('beaker'));
      const wash = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('wash') || (p.typeId ?? p.id).toString().includes('wash_bottle') || (p.typeId ?? p.id).toString().includes('wash-bottle'));
      if (!beaker || !wash) return;

      const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();

      // If a volumetric flask was added, proactively move any weighing boat(s) out of the primary work area
      const flask = equipmentPositions.find(p => normalize(p.typeId ?? p.id).includes('volumetric_flask') || (p.typeId ?? p.id).toString().toLowerCase().includes('volumetric_flask'));
      if (flask) {
        // Use the latest positions (prev) when relocating boats so we don't rely on stale closure values
        setEquipmentPositions(prev => {
          const boats = prev.filter(p => (normalize(p.typeId ?? p.id).includes('weighing_boat') || (p.typeId ?? p.id).toString().toLowerCase().includes('weighing_boat')) && typeof p.x === 'number' && typeof p.y === 'number' && isFinite(p.x) && isFinite(p.y));
          if (boats.length === 0) return prev;
          // place boats in the top-left corner stacked vertically to match reference layout
          const baseX = Math.max(8, Math.floor(rect.width * 0.08));
          return prev.map(pos => {
            const boatIndex = boats.findIndex(b => b.id === pos.id);
            if (boatIndex === -1) return pos;
            const safeX = baseX;
            const safeY = Math.max(8, Math.floor(rect.height * 0.08 + boatIndex * 70));
            return { ...pos, x: Math.min(rect.width - 80, safeX), y: Math.min(rect.height - 80, safeY) };
          });
        });
        // Re-run alignment shortly after moving boats to ensure beaker/wash are placed correctly
        setTimeout(() => alignBeakerAndWash(true), 80);
      }

      // Preferred positions to match the reference layout image
      let targetBeakerX = Math.max(16, Math.floor(rect.width * 0.12));
      let targetBeakerY = Math.max(12, Math.floor(rect.height * 0.70));
      // place wash bottle to right-upper area of the workspace
      let targetWashX = Math.min(rect.width - 60, Math.floor(rect.width * 0.60));
      let targetWashY = Math.max(2, Math.floor(rect.height * 0.20));

      // If there are weighing boats present, avoid overlapping them by nudging beaker/wash
      const boats = equipmentPositions.filter(p => (normalize(p.typeId ?? p.id).includes('weighing_boat') || (p.typeId ?? p.id).toString().toLowerCase().includes('weighing_boat')) && typeof p.x === 'number' && typeof p.y === 'number' && isFinite(p.x) && isFinite(p.y) && (p.x > 8 || p.y > 8));

      const isOverlapping = (x1: number, y1: number, x2: number, y2: number, threshold = 60) => {
        return Math.hypot(x1 - x2, y1 - y2) < threshold;
      };

      if (boats.length > 0) {
        const boat = boats[0];
        if (isOverlapping(targetBeakerX, targetBeakerY, boat.x || 0, boat.y || 0, 80)) {
          targetBeakerX = Math.max(16, (boat.x || 0) - 20);
          targetBeakerY = (boat.y || 0) + 90; // place below the boat
          targetBeakerX = Math.min(rect.width - 80, targetBeakerX);
          targetBeakerY = Math.min(rect.height - 80, targetBeakerY);
          targetWashX = Math.min(rect.width - 60, targetBeakerX + 80);
          targetWashY = Math.max(8, targetBeakerY - 64);
        }
      }

      // Also nudge positions if other equipment is near the targets
      const occupied = equipmentPositions.filter(p => p.id !== beaker.id && p.id !== wash.id);
      const adjustIfCollision = (x: number, y: number) => {
        let nx = x;
        let ny = y;
        occupied.forEach(o => {
          if (isOverlapping(nx, ny, o.x || 0, o.y || 0, 70)) {
            ny += 80; // push down
            nx += 30; // nudge right
          }
        });
        nx = Math.max(8, Math.min(rect.width - 80, nx));
        ny = Math.max(8, Math.min(rect.height - 80, ny));
        return { nx, ny };
      };

      const beakerPos = adjustIfCollision(targetBeakerX, targetBeakerY);
      const washPos = adjustIfCollision(targetWashX, targetWashY);
      const flaskPos = { nx: Math.max(8, Math.min(rect.width - 80, Math.floor(rect.width * 0.12))), ny: Math.max(8, Math.min(rect.height - 80, Math.floor(rect.height * 0.18))) };

      setEquipmentPositions(prev => {
        const updated = prev.map(pos => {
          if (pos.id === beaker.id) return { ...pos, x: beakerPos.nx, y: beakerPos.ny };
          if (pos.id === wash.id) return { ...pos, x: washPos.nx, y: washPos.ny };
          if (flask && pos.id === flask.id) return { ...pos, x: flaskPos.nx, y: flaskPos.ny };
          return pos;
        });
        // ensure beaker renders on top
        const beakerItem = updated.find(p => p.id === beaker.id);
        if (!beakerItem) return updated;
        const others = updated.filter(p => p.id !== beaker.id);
        return [...others, beakerItem];
      });
    } catch (e) { console.warn('align error', e); }
  };

  const getCurrentStepGuidance = () => {
    switch (stepNumber) {
      case 1:
        return "Use the calculator to determine the required mass of oxalic acid dihydrate";
      case 2:
        return "drag the oxalic acid dihydrate and stirrer into the workspace";
      case 3:
        return "drag the oxalic acid dihydrate into the workspace and click on the acid to add in the boat to tare";
      case 4:
        return "drag the beaker, wash bottle and volumetric flask into the workspace";
      case 5:
        return "after setting the distilled water limit click on the distilled water button to add water";
      case 6:
        return "drag and drop the stirrer to the workspace and click on the stirrer to mix distilled water with the acid in the weighing boat";
      case 7:
        return "Mix the solution thoroughly by inversion";
      default:
        return "Follow the current step instructions";
    }
  };

  const getStepProgress = () => {
    const progress = ((stepNumber - 1) / totalSteps) * 100;
    return Math.round(progress);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Step {stepNumber}: {step.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getCurrentStepGuidance()}
            </p>
            {stepNumber === 1 && (
              <p className="text-sm text-blue-700 font-medium mt-2">
                Drag the analytical balance and weighing boat into the workbench.
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowCalculator(!showCalculator)}
              variant="outline"
              size="sm"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </Button>
            {!experimentStarted ? (
              (() => {
                const isOxalicPreparation = experimentTitle === "Preparation of Standard Solution of Oxalic Acid";
                if (isOxalicPreparation) {
                  return (
                    <Button onClick={() => onStartExperiment(false)} size="sm">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Experiment
                    </Button>
                  );
                }
                return (
                  <Button onClick={() => onStartExperiment(true)} size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Start Experiment
                  </Button>
                );
              })()
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsRunning(!isRunning)}
                  variant={isRunning ? "secondary" : "default"}
                  size="sm"
                >
                  {isRunning ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button onClick={onResetTimer} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Step Progress */}
        <div className="mt-3 flex items-center space-x-4">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {stepNumber}/{totalSteps}
          </span>
        </div>

        {workbenchMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 text-sm px-4 py-3 rounded-md shadow-lg ${workbenchMessageVariant === 'colorful' ? 'bg-gradient-to-r from-pink-50 via-yellow-50 to-green-50 border border-transparent text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}
          >
            {workbenchMessage}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">

        {/* Workbench Area */}
        <div className="flex-1 flex flex-col">
          {/* Workbench Surface */}
          <div
            data-oxalic-workbench-surface="true"
            className={`flex-1 relative bg-black text-white ${isDragOver ? "border-2 border-dashed border-blue-400 ring-2 ring-blue-400" : ""} transform -translate-y-8`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Equipment on workbench */}
            {equipmentPositions.map((position) => {
              const equipmentData = equipment.find(eq =>
                position.typeId ? eq.id === position.typeId : position.id.startsWith(eq.id),
              );

              // If this position corresponds to a known equipment, render normally
              if (equipmentData) {
                // If this equipment is currently being animated as the boatMoveOverlay and the overlay
                // hasn't started moving yet, don't render the static equipment so the overlay is the
                // only visible instance (prevents showing two boats).
                if (boatMoveOverlay && boatMoveOverlay.id === position.id) {
                  return null;
                }

                // Show the provided analytical balance image when in step 1 of the Oxalic Acid preparation
                const balanceImageUrl = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fb0f15ec4f9e54d958cbbcd5dafd43773?format=webp&width=800";
                const weighingBoatImageUrl = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fe5172de4d6d44841bdba84ffd667286e?format=webp&width=800";
                const shouldShowBalanceImage = equipmentData.id === "analytical_balance";
                const shouldShowWeighingBoatImage = equipmentData.id === "weighing_boat";
                const imageSrc = position.imageSrc ?? (shouldShowBalanceImage
                  ? balanceImageUrl
                  : shouldShowWeighingBoatImage
                    ? weighingBoatImageUrl
                    : undefined);

                return (
                  <Equipment
                    key={position.id}
                    id={position.id}
                    typeId={equipmentData.id}
                    name={equipmentData.name}
                    icon={equipmentData.icon}
                    imageSrc={imageSrc}
                    onDrag={handleEquipmentDrag}
                    position={{ x: position.x, y: position.y }}
                    chemicals={position.chemicals}
                    onChemicalDrop={handleChemicalDrop}
                    onRemove={handleEquipmentRemove}
                    preparationState={preparationState}
                    onAction={handleEquipmentAction}
                    stepId={stepNumber}
                  />
                );
              }

              // If no equipment data found but chemicals exist, render a bottle-like equipment
              if (position.chemicals && position.chemicals.length > 0) {
                const chem = position.chemicals[0];
                const bottleIcon = (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                    <path d="M8 2h8v2h1v2l-1 2v6a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V8L7 6V4h1V2z" stroke="currentColor" strokeWidth="1.2" fill="rgba(135,206,235,0.15)" />
                    <path d="M9 4h6" stroke="currentColor" strokeWidth="1" />
                  </svg>
                );

                return (
                  <Equipment
                    key={position.id}
                    id={position.id}
                    typeId={chem.id}
                    name={`${chem.name} Bottle`}
                    icon={bottleIcon}
                    onDrag={handleEquipmentDrag}
                    position={{ x: position.x, y: position.y }}
                    chemicals={position.chemicals}
                    onChemicalDrop={handleChemicalDrop}
                    onRemove={handleEquipmentRemove}
                    preparationState={preparationState}
                    onAction={handleEquipmentAction}
                    stepId={stepNumber}
                  />
                );
              }

              // If a custom image or name was added via a drop, render it
              if (position.imageSrc || position.name) {
                return (
                  <Equipment
                    key={position.id}
                    id={position.id}
                    name={position.name || "Dropped Item"}
                    icon={<span />}
                    imageSrc={position.imageSrc}
                    onDrag={handleEquipmentDrag}
                    position={{ x: position.x, y: position.y }}
                    chemicals={position.chemicals}
                    onChemicalDrop={handleChemicalDrop}
                    onRemove={handleEquipmentRemove}
                    preparationState={preparationState}
                    onAction={handleEquipmentAction}
                    stepId={stepNumber}
                  />
                );
              }

              return null;
            })}

            {pouring && pouring.active && (
              <div
                aria-hidden
                className="pour-animation-wrapper"
                style={{ left: pouring.x, top: pouring.y, position: 'absolute', zIndex: 70 }}
              >
                <div className="pour-bottle">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
                    <path d="M7 2h10v2h1v2l-1 2v6a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8L6 6V4h1V2z" stroke="#374151" strokeWidth="1" fill="#fff" />
                    <path d="M9 4h6" stroke="#374151" strokeWidth="1" />
                  </svg>
                </div>
                <div className="pour-drops" aria-hidden>
                  {[0,1,2,3,4].map((i) => (
                    <span
                      key={i}
                      className="pour-drop"
                      style={{ left: `${50 + (i - 2) * 6}%`, animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {mixingAnimation && mixingAnimation.active && (
              <div
                aria-hidden
                className="mixing-animation-wrapper"
                style={{ left: mixingAnimation.x, top: mixingAnimation.y, position: 'absolute', zIndex: 80 }}
              >
                <div style={{ width: mixingAnimation.width || 80, height: mixingAnimation.height || 100 }}>
                  <StirringAnimation
                    isActive={true}
                    containerWidth={mixingAnimation.width || 80}
                    containerHeight={mixingAnimation.height || 100}
                    stirringSpeed="medium"
                    solutionColor="#87ceeb"
                  />
                </div>
              </div>
            )}

            {/* Boat move animation overlay */}
            {boatMoveOverlay && (
              <div
                aria-hidden
                className="boat-move-overlay"
                style={{ left: boatMoveOverlay.x, top: boatMoveOverlay.y, position: 'absolute', zIndex: 95, transition: 'left 2s ease-in-out, top 2s ease-in-out' }}
              >
                <img
                  src={"https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fe5172de4d6d44841bdba84ffd667286e?format=webp&width=800"}
                  alt="weighing boat"
                  style={{ width: 88, height: 'auto', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            )}

            {washAnimation && washAnimation.active && (
              <div
                aria-hidden
                className="wash-animation-wrapper"
                style={{ left: washAnimation.x, top: washAnimation.y, position: 'absolute', zIndex: 70 }}
              >
                <div className="wash-bottle" style={{ transform: 'translateX(-6px) rotate(-8deg)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
                    <path d="M7 2h10v2h1v2l-1 2v6a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8L6 6V4h1V2z" stroke="#0f172a" strokeWidth="1" fill="#fff" />
                  </svg>
                </div>

                <div className="wash-drops" aria-hidden>
                  {[0,1,2,3,4].map((i) => (
                    <span
                      key={i}
                      className="wash-drop"
                      style={{ left: `${40 + (i * 7)}%`, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>

                <div className="wash-splash" aria-hidden />
              </div>
            )}

            {/* Drop Zone Indicator */}
            {!experimentStarted && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Virtual Laboratory</p>
                  <p className="text-sm">Drag equipment here to start</p>
                </div>
              </div>
            )}
          </div>

          {/* Measurements & Actions (moved from left panel) */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Measurements</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span>Target Mass:</span><span className="font-mono">{measurements.targetMass.toFixed(4)} g</span></div>
                  <div className="flex justify-between"><span>Weighed Mass:</span><span className="font-mono">{measurements.massWeighed.toFixed(4)} g</span></div>
                  <div className="flex justify-between"><span>Target Molarity:</span><span className="font-mono">{measurements.targetMolarity.toFixed(3)} M</span></div>
                  <div className="flex justify-between"><span>Actual Molarity:</span><span className="font-mono">{measurements.actualMolarity.toFixed(6)} M</span></div>
                  <div className="flex justify-between"><span>Temperature:</span><span className="font-mono">{temperature}°C</span></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Chemical Equation</h4>
                <div className="text-xs font-mono bg-gray-50 rounded-lg p-3 border text-center leading-relaxed">
                  <div>H₂C₂O₄·2H₂O (s) → H₂C₂O₄ (aq) + 2H₂O</div>
                  <div className="mt-1">H₂C₂O₄ (aq) ⇌ 2H⁺ + C₂O₄²⁻</div>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                {canProceed && (
                  <Button onClick={() => onStepAction()} className="w-full mb-2" variant="default">
                    <FlaskConical className="w-4 h-4 mr-2" /> Complete Step {stepNumber}
                  </Button>
                )}

                {/* Additional controls for Step 3: allow user to set amount of oxalic acid to add to weighing boat */}
                {stepNumber === 3 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-yellow-25 shadow-md overflow-hidden">
                      {showAcidHint && (
                        <div className="mb-2 flex items-center justify-between space-x-3 p-2 rounded bg-gradient-to-r from-pink-50 via-yellow-50 to-green-50 border border-yellow-200">
                          <div className="text-sm font-medium text-yellow-800">New here? Enter the exact mass you want to add and click <span className="font-semibold">Add to Weighing Boat</span>.</div>
                          <button onClick={(e) => { e.stopPropagation(); dismissAcidHint(); }} className="ml-2 text-xs px-2 py-1 bg-yellow-200 rounded">Got it</button>
                        </div>
                      )}

                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount to add to weighing boat (g)</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={acidAmount}
                          onChange={(e) => setAcidAmount(e.target.value)}
                          className="w-32 p-2 border rounded text-sm font-mono bg-white"
                        />
                        <Button
                          onClick={() => {
                            // stop blinking once user pressed the button
                            try { setBlinkAddButton(false); } catch (e) {}

                            // Find a weighing boat on the workbench
                            const boat = equipmentPositions.find(pos => ((pos.typeId ?? pos.id).toString().toLowerCase().includes('weighing_boat') || (pos.typeId === 'weighing_boat')) && typeof pos.x === 'number' && typeof pos.y === 'number');
                            if (!boat) {
                              showMessage('Place a weighing boat on the workbench first.');
                              return;
                            }

                            // Parse user-provided value; allow clearing the input
                            const parsedAmount = parseFloat(acidAmount);
                            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                              showMessage('Please enter a positive amount to add.');
                              return;
                            }

                            // If user enters more than 1.6 g show a colorful trigger warning and prompt to use target mass
                            if (parsedAmount > 1.6) {
                              try {
                                showMessage('enter the amount of acid within the target mass as your solution might get more concentrated.', 'colorful');
                              } catch (e) {}

                              // Prefill the input with the target mass and prompt user to enter that value
                              try {
                                setAcidAmount((measurements.targetMass || 0).toFixed(4));
                                showMessage(`Please enter the target mass: ${(measurements.targetMass || 0).toFixed(4)} g`, 'colorful');
                              } catch (e) {}

                              return;
                            }

                            const amountToAdd = parsedAmount;

                            // Add oxalic acid to the boat immediately (so the tooltip/details show)
                            setEquipmentPositions(prev => {
                              // add the chemical to the selected boat
                              const withAdded = prev.map(pos => {
                                if (pos.id === boat.id) {
                                  return {
                                    ...pos,
                                    chemicals: [
                                      ...pos.chemicals,
                                      {
                                        id: 'oxalic_acid',
                                        name: 'Oxalic acid dihydrate',
                                        color: '#F0E68C',
                                        amount: amountToAdd,
                                        concentration: ''
                                      }
                                    ]
                                  };
                                }
                                return pos;
                              });

                              // remove any standalone oxalic acid bottles from the workbench palette area
                              const cleaned = withAdded.filter(pos => {
                                // always keep the target boat
                                if (pos.id === boat.id) return true;

                                // remove items explicitly marked as bottles containing oxalic_acid
                                if (pos.isBottle && Array.isArray(pos.chemicals) && pos.chemicals.some(c => c.id === 'oxalic_acid')) return false;

                                // remove any equipment that is itself the oxalic acid item
                                if ((pos.typeId || '').toString().toLowerCase().includes('oxalic_acid')) return false;

                                // otherwise keep
                                return true;
                              });

                              return cleaned;
                            });

                            // Notify parent to remove oxalic acid from the chemical palette
                            try {
                              if (onEquipmentPlaced) onEquipmentPlaced('oxalic_acid');
                            } catch {}

                            // start pouring animation overlay above the boat and show in-progress message
                            try {
                              showMessage('Oxalic acid is getting added...');
                              setPouring({ boatId: boat.id, x: boat.x + 40, y: boat.y - 60, active: true });
                              // clear previous timeout if any
                              if (pourTimeoutRef.current) {
                                window.clearTimeout(pourTimeoutRef.current);
                                pourTimeoutRef.current = null;
                              }
                              // After ~9 seconds replace the boat image with the provided image and stop the pouring animation
                              pourTimeoutRef.current = window.setTimeout(() => {
                                const newBoatImage = "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F79b0166ed4e44df0a61c55a7208a94cf?format=webp&width=800";
                                setEquipmentPositions(prev => prev.map(pos => pos.id === boat.id ? { ...pos, imageSrc: newBoatImage } : pos));
                                setPouring(null);
                                if (pourTimeoutRef.current) { window.clearTimeout(pourTimeoutRef.current); pourTimeoutRef.current = null; }

                                // Show final message after animation completes
                                showMessage(`${amountToAdd.toFixed(4)} grams of oxalic acid added!`);
                                try { window.dispatchEvent(new CustomEvent('oxalic_image_shown')); } catch (e) {}
                              }, 9000);
                            } catch (e) {}

                          }}
                          className={`w-36 flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 ${blinkAddButton ? 'blink-until-pressed' : ''}`}
                        >
                          Add to Weighing Boat
                        </Button>

                        <Button
                          onClick={() => {
                            // open calculator as a quick helper
                            try { window.dispatchEvent(new CustomEvent('oxalicCalculatorReminder')); } catch {}
                            showMessage('Open the calculator to verify the required amount.');
                          }}
                          variant="outline"
                          className="w-32"
                        >
                          Calculator
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={onUndoStep} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100" disabled={stepNumber <= 1}>
                        Undo Step {currentStepIndex}
                      </Button>
                      <Button onClick={onResetExperiment} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>
                    </div>
                  </div>
                )}

                {/* Additional control for Step 7: pour into flask */}
                {stepNumber === 7 && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        try { window.dispatchEvent(new CustomEvent('oxalic_step7_pour')); } catch (e) {}
                        showMessage('Pouring solution into volumetric flask...', 'colorful');
                      }}
                      className="w-full bg-gradient-to-r from-pink-500 via-yellow-400 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 transform transition-transform py-2"
                      aria-label="Click to pour solution into flask"
                    >
                      Click to pour!
                    </Button>
                  </div>
                )}

                {/* default Undo/Reset when not in step 3 */}
                {stepNumber !== 3 && (
                  <div className="space-y-2">
                    <Button onClick={onUndoStep} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100" disabled={stepNumber <= 1}>
                      Undo Step {currentStepIndex}
                    </Button>
                    <Button onClick={onResetExperiment} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="h-32 bg-white border-t border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Observations & Results
            </h3>
            <div className="space-y-1">
              {results.slice(-3).map((result) => (
                <div
                  key={result.id}
                  className={`text-xs p-2 rounded-md ${
                    result.type === "success"
                      ? "bg-green-50 text-green-800"
                      : result.type === "warning"
                      ? "bg-yellow-50 text-yellow-800"
                      : result.type === "error"
                      ? "bg-red-50 text-red-800"
                      : "bg-blue-50 text-blue-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.title}</span>
                    <span className="text-gray-500">{result.timestamp}</span>
                  </div>
                  <p className="mt-1">{result.description}</p>
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-xs text-gray-500 italic">
                  No observations yet. Start the experiment to see results.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Molarity Calculator</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculator(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium">Molarity (M):</label>
                  <div className="font-mono bg-gray-100 p-2 rounded">0.05 M</div>
                </div>
                <div>
                  <label className="font-medium">Volume (L):</label>
                  <div className="font-mono bg-gray-100 p-2 rounded">0.250 L</div>
                </div>
                <div>
                  <label className="font-medium">MW (g/mol):</label>
                  <div className="font-mono bg-gray-100 p-2 rounded">126.07</div>
                </div>
                <div>
                  <label className="font-medium">Mass (g):</label>
                  <div className="font-mono bg-blue-100 p-2 rounded font-bold">
                    {(0.05 * 0.25 * 126.07).toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Formula:</strong> m = M × V �� MW</p>
                <p><strong>Calculation:</strong> {(0.05 * 0.25 * 126.07).toFixed(4)} g = 0.05 M × 0.250 L �� 126.07 g/mol</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkBench;
