import React, { useState, useCallback, useEffect, useRef } from "react";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import DissolutionAnimation from "./DissolutionAnimation";
import CalculationDisplay from "./CalculationDisplay";
import StirringAnimation from "./StirringAnimation";
import MeniscusGuide from "./MeniscusGuide";
import WeighingAnimation from "./WeighingAnimation";
import TransferAnimation from "./TransferAnimation";
import MolecularVisualization from "./MolecularVisualization";
import ErrorCalculation from "./ErrorCalculation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FlaskConical, Scale, BookOpen, Calculator } from "lucide-react";
import {
  OXALIC_ACID_CHEMICALS,
  OXALIC_ACID_EQUIPMENT,
  DEFAULT_MEASUREMENTS,
} from "../constants";
import type {
  EquipmentPosition,
  SolutionPreparationState,
  Measurements,
  Result,
  ExperimentStep,
} from "../types";

interface OxalicAcidVirtualLabProps {
  onEquipmentPlaced?: (id: string) => void;
  step: ExperimentStep;
  onStepComplete: () => void;
  isActive: boolean;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  allSteps: ExperimentStep[];
  experimentStarted: boolean;
  onStartExperiment: (run?: boolean) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
  onUndoStep: () => void;
  onResetExperiment: () => void;
  currentStepIndex: number;
}

function OxalicAcidVirtualLab({
  step,
  onStepComplete,
  isActive,
  stepNumber,
  totalSteps,
  experimentTitle,
  allSteps,
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  onResetTimer,
  onUndoStep,
  onResetExperiment,
  currentStepIndex,
  onEquipmentPlaced,
}: OxalicAcidVirtualLabProps) {
  const [equipmentPositions, setEquipmentPositions] = useState<
    EquipmentPosition[]
  >([]);
  const [preparationState, setPreparationState] = useState<SolutionPreparationState>({
    oxalicAcidAdded: false,
    waterAdded: false,
    stirrerActive: false,
    dissolved: false,
    transferredToFlask: false,
    nearMark: false,
    finalVolume: false,
    mixed: false,
  });
  const [measurements, setMeasurements] = useState<Measurements>(DEFAULT_MEASUREMENTS);
  const [results, setResults] = useState<Result[]>([]);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showDissolution, setShowDissolution] = useState(false);
  const [showWeighing, setShowWeighing] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMeniscus, setShowMeniscus] = useState(false);
  const [showMolecular, setShowMolecular] = useState(false);
  const [showErrorAnalysis, setShowErrorAnalysis] = useState(false);
  const stepOneAutoProgressedRef = useRef(false);
  const stepTwoAlignedRef = useRef(false);
  const stepFourAlignedRef = useRef(false);

  const addResult = useCallback((result: Omit<Result, "id" | "timestamp">) => {
    const newResult: Result = {
      ...result,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults((prev) => [...prev, newResult]);
  }, []);

  const handleCalculation = useCallback(() => {
    setShowCalculation(true);
    setShowMolecular(true);
  }, []);

  const handleCalculationComplete = useCallback((mass: number) => {
    setMeasurements(prev => ({
      ...prev,
      targetMass: mass,
    }));

    addResult({
      type: "calculation",
      title: "Mass Calculation Complete",
      description: `Required mass: ${mass.toFixed(4)} g`,
      calculation: {
        massWeighed: mass,
        molarity: 0.1,
        moles: 0.1 * 0.25,
        procedure: "M = n/V, n = m/MW, therefore m = M × V × MW",
        notes: [
          `Molarity = 0.1 M`,
          `Volume = 0.25 L`,
          `Molecular Weight = 126.07 g/mol`,
          `Required mass = ${mass.toFixed(4)} g`
        ],
      },
    });

    setShowCalculation(false);
    setTimeout(() => setShowMolecular(false), 2000);
  }, [addResult]);

  const handleWeighing = useCallback(() => {
    setShowWeighing(true);
  }, []);

  const handleWeighingComplete = useCallback((actualMass: number) => {
    const targetMass = measurements.targetMass;

    setMeasurements(prev => ({
      ...prev,
      massWeighed: actualMass,
      actualMolarity: actualMass / (126.07 * 0.25), // Calculate actual molarity
    }));

    // mark oxalic acid as added
    setPreparationState(prev => ({ ...prev, oxalicAcidAdded: true }));

    addResult({
      type: "success",
      title: "Weighing Complete",
      description: `Accurately weighed ${actualMass.toFixed(4)} g`,
      calculation: {
        massWeighed: actualMass,
        accuracy: Math.abs((actualMass - targetMass) / targetMass * 100).toFixed(3) + "% error",
      },
    });

    setShowWeighing(false);

    // Align the weighing boat on the workbench immediately after weighing animation completes
    // This will position the weighing boat relative to the analytical balance pan on the workbench.
    const alignBoatToBalance = () => {
      let frame: number | null = null;
      let attempts = 0;
      const maxAttempts = 60; // ~1 second worth of frames

      const attempt = () => {
        attempts += 1;
        const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
        const balanceEl = surface?.querySelector('[data-equipment-type="analytical_balance"]') as HTMLElement | null;
        const boatEl = surface?.querySelector('[data-equipment-type="weighing_boat"]') as HTMLElement | null;

        if (!surface || !balanceEl || !boatEl) {
          if (attempts < maxAttempts) {
            frame = window.requestAnimationFrame(attempt);
          }
          return;
        }

        const surfaceRect = surface.getBoundingClientRect();
        const balanceRect = balanceEl.getBoundingClientRect();
        const boatRect = boatEl.getBoundingClientRect();

        const targetBalanceX = Math.max(0, (surfaceRect.width - balanceRect.width) / 2);
        const targetBalanceY = Math.max(0, surfaceRect.height * 0.12);
        const targetBoatX = targetBalanceX + (balanceRect.width - boatRect.width) / 2;
        const panCenterY = targetBalanceY + balanceRect.height * 0.55;
        const targetBoatY = panCenterY - boatRect.height / 2;

        setEquipmentPositions(prev => {
          let changed = false;
          const next = prev.map(pos => {
            const key = (pos.typeId ?? pos.id).toString().toLowerCase();
            if (key.includes("analytical_balance")) {
              if (Math.abs(pos.x - targetBalanceX) > 1 || Math.abs(pos.y - targetBalanceY) > 1) {
                changed = true;
                return { ...pos, x: targetBalanceX, y: targetBalanceY };
              }
              return pos;
            }
            if (key.includes("weighing_boat")) {
              if (Math.abs(pos.x - targetBoatX) > 1 || Math.abs(pos.y - targetBoatY) > 1) {
                changed = true;
                return { ...pos, x: targetBoatX, y: targetBoatY };
              }
              return pos;
            }
            return pos;
          });
          return changed ? next : prev;
        });

        if (frame !== null) {
          cancelAnimationFrame(frame);
        }
      };

      frame = window.requestAnimationFrame(attempt);
    };

    try {
      // step is available from closure; ensure it's the weighing step
      if (stepNumber === 2) {
        // mark dissolved so later steps (transfer) can proceed
        setPreparationState(prev => ({ ...prev, dissolved: true }));

        // Align the weighing boat now so it appears dropped in the correct position on the workbench
        alignBoatToBalance();

        // small delay to allow UI updates, then advance a single step
        setTimeout(() => {
          onStepComplete();
        }, 300);
      }
    } catch (e) {
      // swallow errors — fallback to single-step advance handled elsewhere
    }
  }, [measurements.targetMass, addResult, stepNumber, onStepComplete, setEquipmentPositions]);

  const handleDissolving = useCallback(() => {
    setPreparationState(prev => ({
      ...prev,
      waterAdded: true,
      stirrerActive: true
    }));

    setShowDissolution(true);

    setTimeout(() => {
      setPreparationState(prev => ({
        ...prev,
        dissolved: true,
        stirrerActive: false
      }));

      addResult({
        type: "success",
        title: "Dissolution Complete",
        description: "Oxalic acid completely dissolved in water",
      });

      setShowDissolution(false);
    }, 5000);
  }, [addResult]);

  const handleTransfer = useCallback(() => {
    setShowTransfer(true);
  }, []);

  const handleTransferComplete = useCallback(() => {
    setPreparationState(prev => ({ ...prev, transferredToFlask: true }));

    addResult({
      type: "success",
      title: "Transfer Complete",
      description: "Solution transferred to volumetric flask",
    });

    setShowTransfer(false);
  }, [addResult]);

  const handleNearMark = useCallback(() => {
    setPreparationState(prev => ({ ...prev, nearMark: true }));
    setShowMeniscus(true);

    addResult({
      type: "warning",
      title: "Near Volume Mark",
      description: "Add final water drops carefully to reach the mark",
    });
  }, [addResult]);

  const handleFinalVolume = useCallback(() => {
    setPreparationState(prev => ({ ...prev, finalVolume: true }));

    addResult({
      type: "success",
      title: "Volume Adjusted",
      description: "Meniscus aligned with 250 mL mark",
    });

    setShowMeniscus(false);
  }, [addResult]);

  const handleFinalMixing = useCallback(() => {
    setPreparationState(prev => ({ ...prev, mixed: true }));

    const finalMolarity = measurements.massWeighed / (126.07 * 0.25);
    const percentError = Math.abs((finalMolarity - 0.1) / 0.1 * 100);

    setMeasurements(prev => ({
      ...prev,
      actualMolarity: finalMolarity,
    }));

    addResult({
      type: "success",
      title: "Standardization Complete",
      description: `Final molarity: ${finalMolarity.toFixed(6)} M`,
      calculation: {
        molarity: finalMolarity,
        percentError: percentError,
        accuracy: percentError < 1 ? "Excellent" : percentError < 3 ? "Good" : "Acceptable",
        notes: [
          `Actual mass used: ${measurements.massWeighed.toFixed(4)} g`,
          `Final volume: 250.0 mL`,
          `Calculated molarity: ${finalMolarity.toFixed(6)} M`,
          `Percent error: ${percentError.toFixed(3)}%`
        ],
      },
    });

    // Show error analysis after mixing
    setTimeout(() => {
      setShowErrorAnalysis(true);
    }, 1000);
  }, [measurements.massWeighed, addResult]);

  const handleStepAction = useCallback((opts?: { skipAnimation?: boolean }) => {
    switch (stepNumber) {
      case 1:
        handleCalculation();
        break;
      case 2:
        handleWeighing();
        break;
      case 3:
        handleDissolving();
        break;
      case 4:
        if (opts && opts.skipAnimation) {
          // directly mark transfer complete without showing transfer animation
          handleTransferComplete();
          // advance to next step so the user can continue (small delay for UI)
          setTimeout(() => {
            try { onStepComplete(); } catch (e) {}
          }, 300);
        } else {
          handleTransfer();
        }
        break;
      case 5:
        handleNearMark();
        break;
      case 6:
        handleFinalVolume();
        break;
      case 7:
        handleFinalMixing();
        break;
    }
  }, [stepNumber, handleCalculation, handleWeighing, handleDissolving, handleTransfer, handleTransferComplete, handleNearMark, handleFinalVolume, handleFinalMixing, onStepComplete]);

  useEffect(() => {
    if (stepNumber !== 1) {
      stepOneAutoProgressedRef.current = false;
      return;
    }

    const normalize = (value?: string) =>
      value ? value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "";

    const required = ["analytical_balance", "weighing_boat"];
    const placed = new Set(
      equipmentPositions.map((position) =>
        normalize(position.typeId ?? position.id?.split("_")[0])
      )
    );

    const allPlaced = required.every((req) => placed.has(req));

    if (allPlaced && !stepOneAutoProgressedRef.current) {
      stepOneAutoProgressedRef.current = true;
      const TARGET_MASS = 0.1 * 0.25 * 126.07;
      setMeasurements((prev) =>
        prev.targetMass > 0
          ? prev
          : {
              ...prev,
              targetMass: TARGET_MASS,
            }
      );
      onStepComplete();
    }

    if (!allPlaced) {
      stepOneAutoProgressedRef.current = false;
    }
  }, [equipmentPositions, stepNumber, onStepComplete, setMeasurements]);

  useEffect(() => {
    if (stepNumber !== 2) {
      stepTwoAlignedRef.current = false;
      return;
    }

    // If we've already auto-advanced for this step, skip
    if (stepTwoAlignedRef.current) {
      return;
    }

    const normalize = (value?: string) =>
      value ? value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "";

    // Detect classic weighing workflow: balance + weighing boat
    const hasBalance = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("analytical_balance"));
    const hasBoat = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("weighing_boat"));

    // Also detect alternate workflow requested by user: stirrer + oxalic acid bottle
    const hasStirrer = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("stirrer"));
    const hasOxalicBottle = equipmentPositions.some(pos =>
      Array.isArray(pos.chemicals) && pos.chemicals.some(c => normalize((c as any).id) === "oxalic_acid")
    );

    // If the alternate flow is satisfied, mark the oxalic acid as added and advance the step
    if (hasStirrer && hasOxalicBottle && !preparationState.oxalicAcidAdded) {
      stepTwoAlignedRef.current = true;
      setPreparationState(prev => ({ ...prev, oxalicAcidAdded: true }));
      // small delay so UI updates (e.g., placement) are visible before advancing
      setTimeout(() => onStepComplete(), 400);
      return;
    }

    // Otherwise continue with original alignment flow for balance + boat
    if (!hasBalance || !hasBoat) {
      stepTwoAlignedRef.current = false;
      return;
    }

    let frame: number | null = null;
    const attemptAlignment = () => {
      const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
      if (!surface) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }
      const balanceEl = surface.querySelector('[data-equipment-type="analytical_balance"]') as HTMLElement | null;
      const boatEl = surface.querySelector('[data-equipment-type="weighing_boat"]') as HTMLElement | null;
      if (!balanceEl || !boatEl) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }

      const surfaceRect = surface.getBoundingClientRect();
      const balanceRect = balanceEl.getBoundingClientRect();
      const boatRect = boatEl.getBoundingClientRect();

      const targetBalanceX = Math.max(0, (surfaceRect.width - balanceRect.width) / 2);
      const targetBalanceY = Math.max(0, surfaceRect.height * 0.12);
      const targetBoatX = targetBalanceX + (balanceRect.width - boatRect.width) / 2;
      const panCenterY = targetBalanceY + balanceRect.height * 0.55;
      const targetBoatY = panCenterY - boatRect.height / 2;

      setEquipmentPositions(prev => {
        let changed = false;
        const next = prev.map(pos => {
          const key = (pos.typeId ?? pos.id).toLowerCase();
          if (key.includes("analytical_balance")) {
            if (Math.abs(pos.x - targetBalanceX) > 1 || Math.abs(pos.y - targetBalanceY) > 1) {
              changed = true;
              return { ...pos, x: targetBalanceX, y: targetBalanceY };
            }
            return pos;
          }
          if (key.includes("weighing_boat")) {
            if (Math.abs(pos.x - targetBoatX) > 1 || Math.abs(pos.y - targetBoatY) > 1) {
              changed = true;
              return { ...pos, x: targetBoatX, y: targetBoatY };
            }
            return pos;
          }
          return pos;
        });
        return changed ? next : prev;
      });

      const balanceAligned = Math.abs(balanceRect.left - (surfaceRect.left + targetBalanceX)) < 8 &&
        Math.abs(balanceRect.top - (surfaceRect.top + targetBalanceY)) < 8;
      const boatAligned = Math.abs(boatRect.left - (surfaceRect.left + targetBoatX)) < 8 &&
        Math.abs(boatRect.top - (surfaceRect.top + targetBoatY)) < 8;

      if (balanceAligned && boatAligned && !stepTwoAlignedRef.current) {
        stepTwoAlignedRef.current = true;
        setPreparationState(prev => ({ ...prev, oxalicAcidAdded: true }));
        setTimeout(() => {
          onStepComplete();
        }, 400);
      }
    };

    frame = window.requestAnimationFrame(attemptAlignment);
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [equipmentPositions, stepNumber, preparationState.oxalicAcidAdded, onStepComplete]);

  useEffect(() => {
    if (stepNumber !== 2) {
      stepTwoAlignedRef.current = false;
      return;
    }

    // If we've already auto-advanced for this step, skip
    if (stepTwoAlignedRef.current) {
      return;
    }

    const normalize = (value?: string) =>
      value ? value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "";

    // Detect classic weighing workflow: balance + weighing boat
    const hasBalance = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("analytical_balance"));
    const hasBoat = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("weighing_boat"));

    // Also detect alternate workflow requested by user: stirrer + oxalic acid bottle
    const hasStirrer = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("stirrer"));
    const hasOxalicBottle = equipmentPositions.some(pos =>
      Array.isArray(pos.chemicals) && pos.chemicals.some(c => normalize((c as any).id) === "oxalic_acid")
    );

    // If the alternate flow is satisfied, mark the oxalic acid as added and advance the step
    if (hasStirrer && hasOxalicBottle && !preparationState.oxalicAcidAdded) {
      stepTwoAlignedRef.current = true;
      setPreparationState(prev => ({ ...prev, oxalicAcidAdded: true }));
      // small delay so UI updates (e.g., placement) are visible before advancing
      setTimeout(() => onStepComplete(), 400);
      return;
    }

    // Otherwise continue with original alignment flow for balance + boat
    if (!hasBalance || !hasBoat) {
      stepTwoAlignedRef.current = false;
      return;
    }

    let frame: number | null = null;
    const attemptAlignment = () => {
      const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
      if (!surface) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }
      const balanceEl = surface.querySelector('[data-equipment-type="analytical_balance"]') as HTMLElement | null;
      const boatEl = surface.querySelector('[data-equipment-type="weighing_boat"]') as HTMLElement | null;
      if (!balanceEl || !boatEl) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }

      const surfaceRect = surface.getBoundingClientRect();
      const balanceRect = balanceEl.getBoundingClientRect();
      const boatRect = boatEl.getBoundingClientRect();

      const targetBalanceX = Math.max(0, (surfaceRect.width - balanceRect.width) / 2);
      const targetBalanceY = Math.max(0, surfaceRect.height * 0.12);
      const targetBoatX = targetBalanceX + (balanceRect.width - boatRect.width) / 2;
      const panCenterY = targetBalanceY + balanceRect.height * 0.55;
      const targetBoatY = panCenterY - boatRect.height / 2;

      setEquipmentPositions(prev => {
        let changed = false;
        const next = prev.map(pos => {
          const key = (pos.typeId ?? pos.id).toLowerCase();
          if (key.includes("analytical_balance")) {
            if (Math.abs(pos.x - targetBalanceX) > 1 || Math.abs(pos.y - targetBalanceY) > 1) {
              changed = true;
              return { ...pos, x: targetBalanceX, y: targetBalanceY };
            }
            return pos;
          }
          if (key.includes("weighing_boat")) {
            if (Math.abs(pos.x - targetBoatX) > 1 || Math.abs(pos.y - targetBoatY) > 1) {
              changed = true;
              return { ...pos, x: targetBoatX, y: targetBoatY };
            }
            return pos;
          }
          return pos;
        });
        return changed ? next : prev;
      });

      const balanceAligned = Math.abs(balanceRect.left - (surfaceRect.left + targetBalanceX)) < 8 &&
        Math.abs(balanceRect.top - (surfaceRect.top + targetBalanceY)) < 8;
      const boatAligned = Math.abs(boatRect.left - (surfaceRect.left + targetBoatX)) < 8 &&
        Math.abs(boatRect.top - (surfaceRect.top + targetBoatY)) < 8;

      if (balanceAligned && boatAligned && !stepTwoAlignedRef.current) {
        stepTwoAlignedRef.current = true;
        setPreparationState(prev => ({ ...prev, oxalicAcidAdded: true }));
        setTimeout(() => {
          onStepComplete();
        }, 400);
      }
    };

    frame = window.requestAnimationFrame(attemptAlignment);
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [equipmentPositions, stepNumber, preparationState.oxalicAcidAdded, onStepComplete]);

  useEffect(() => {
    if (stepNumber !== 4) {
      stepFourAlignedRef.current = false;
      return;
    }

    // If we've already aligned for this step, skip
    if (stepFourAlignedRef.current) {
      return;
    }

    const normalize = (value?: string) =>
      value ? value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") : "";

    const hasBeaker = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("beaker"));
    const hasWash = equipmentPositions.some(pos => normalize(pos.typeId ?? pos.id).includes("wash"));

    if (!hasBeaker || !hasWash) {
      stepFourAlignedRef.current = false;
      return;
    }

    let frame: number | null = null;
    const attemptAlignment = () => {
      const surface = document.querySelector('[data-oxalic-workbench-surface="true"]') as HTMLElement | null;
      if (!surface) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }

      const els = Array.from(surface.querySelectorAll('[data-equipment-type]')) as HTMLElement[];
      const beakerEl = els.find(e => (e.getAttribute('data-equipment-type')||'').toLowerCase().includes('beaker'));
      const washEl = els.find(e => (e.getAttribute('data-equipment-type')||'').toLowerCase().includes('wash'));

      if (!beakerEl || !washEl) {
        frame = window.requestAnimationFrame(attemptAlignment);
        return;
      }

      const surfaceRect = surface.getBoundingClientRect();
      const beakerRect = beakerEl.getBoundingClientRect();
      const washRect = washEl.getBoundingClientRect();

      const targetBeakerX = Math.max(0, surfaceRect.width * 0.35 - beakerRect.width / 2);
      const targetBeakerY = Math.max(0, surfaceRect.height * 0.6 - beakerRect.height / 2);
      const targetWashX = targetBeakerX + beakerRect.width * 0.5;
      const targetWashY = targetBeakerY - washRect.height * 0.9;

      setEquipmentPositions(prev => {
        let changed = false;
        const next = prev.map(pos => {
          const key = (pos.typeId ?? pos.id).toLowerCase();
          if (key.includes("beaker")) {
            if (Math.abs(pos.x - targetBeakerX) > 1 || Math.abs(pos.y - targetBeakerY) > 1) {
              changed = true;
              return { ...pos, x: targetBeakerX, y: targetBeakerY };
            }
            return pos;
          }
          if (key.includes("wash")) {
            if (Math.abs(pos.x - targetWashX) > 1 || Math.abs(pos.y - targetWashY) > 1) {
              changed = true;
              return { ...pos, x: targetWashX, y: targetWashY };
            }
            return pos;
          }
          return pos;
        });
        return changed ? next : prev;
      });

      const beakerAligned = Math.abs(beakerRect.left - (surfaceRect.left + targetBeakerX)) < 12 &&
        Math.abs(beakerRect.top - (surfaceRect.top + targetBeakerY)) < 12;
      const washAligned = Math.abs(washRect.left - (surfaceRect.left + targetWashX)) < 12 &&
        Math.abs(washRect.top - (surfaceRect.top + targetWashY)) < 12;

      if (beakerAligned && washAligned && !stepFourAlignedRef.current) {
        stepFourAlignedRef.current = true;
        // alignment complete for step 4
      }
    };

    frame = window.requestAnimationFrame(attemptAlignment);
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [equipmentPositions, stepNumber]);

  // Listen for the workbench image shown events and auto-complete relevant steps
  useEffect(() => {
    const handlerForImage = () => {
      if (stepNumber === 3) {
        setPreparationState(prev => ({ ...prev, dissolved: true }));
        setTimeout(() => {
          try { onStepComplete(); } catch (e) {}
        }, 300);
      }
    };

    const handlerForBeaker = () => {
      if (stepNumber === 5) {
        // mark nearMark so step 5 can proceed and then auto-advance
        setPreparationState(prev => ({ ...prev, nearMark: true }));
        setTimeout(() => {
          try { onStepComplete(); } catch (e) {}
        }, 300);
      }
    };

    window.addEventListener('oxalic_image_shown', handlerForImage);
    window.addEventListener('oxalic_beaker_image_shown', handlerForBeaker);
    return () => {
      window.removeEventListener('oxalic_image_shown', handlerForImage);
      window.removeEventListener('oxalic_beaker_image_shown', handlerForBeaker);
    };
  }, [stepNumber, onStepComplete]);


  // Listen for a programmatic pour action specifically for step 7 (final mixing -> pour into flask)
  useEffect(() => {
    const handler = () => {
      try {
        // Ensure there is at least one beaker and a volumetric flask on the workbench
        const beakers = equipmentPositions.filter(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('beaker'));
        const flask = equipmentPositions.find(p => ((p.typeId ?? p.id) + '').toString().toLowerCase().includes('volumetric_flask') || (p.name || '').toLowerCase().includes('volumetric flask'));
        if (!flask || beakers.length === 0) {
          try { window.dispatchEvent(new CustomEvent('oxalic_pour_failed')); } catch (e) {}
          return;
        }

        // Start transfer animation (VirtualLab's TransferAnimation listens to showTransfer)
        setShowTransfer(true);

        const POUR_DURATION = 5000;
        window.setTimeout(() => {
          const coloredFlaskImage = 'https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Ff4609eccc6b848f89b5c33ec2182757c?format=webp&width=800';

          setEquipmentPositions(prev => {
            // replace flask image
            const updated = prev.map(pos => {
              if (pos.id === flask.id) return { ...pos, imageSrc: coloredFlaskImage };
              return pos;
            });
            // remove beaker(s)
            const filtered = updated.filter(pos => !((pos.typeId ?? pos.id) + '').toString().toLowerCase().includes('beaker'));
            return filtered;
          });

          // Dispatch event so equipment instances (volumetric flask) can react and enlarge their displayed image
          try {
            window.dispatchEvent(new CustomEvent('oxalic_flask_image_shown', { detail: { id: flask.id } }));
          } catch (e) {}

          // stop transfer animation
          setShowTransfer(false);

          // notify and mark transfer complete in the virtual lab
          try { handleTransferComplete(); } catch (e) {}
        }, POUR_DURATION);
      } catch (err) {
        console.warn('step7 pour handler error', err);
      }
    };

    window.addEventListener('oxalic_step7_pour', handler as EventListener);
    return () => window.removeEventListener('oxalic_step7_pour', handler as EventListener);
  }, [equipmentPositions, setEquipmentPositions, handleTransferComplete]);


  // Remove analytical balance from the workspace only when advancing from step 3 to step 4.
  // Do NOT notify the parent so the equipment palette remains unchanged.
  const prevStepRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevStepRef.current === 3 && stepNumber === 4) {
      setEquipmentPositions(prev => prev.filter(pos => {
        const key = (pos.typeId ?? pos.id).toString().toLowerCase();
        return !key.includes("analytical_balance");
      }));
    }
    prevStepRef.current = stepNumber;
  }, [stepNumber]);

  const canProceed = useCallback(() => {
    switch (stepNumber) {
      case 1:
        return measurements.targetMass > 0;
      case 2:
        return preparationState.oxalicAcidAdded;
      case 3:
        return preparationState.dissolved;
      case 4:
        return preparationState.transferredToFlask;
      case 5:
        return preparationState.nearMark;
      case 6:
        return preparationState.finalVolume;
      case 7:
        return preparationState.mixed;
      default:
        return false;
    }
  }, [stepNumber, measurements.targetMass, preparationState]);

  useEffect(() => {
    if (stepNumber === 1) {
      return;
    }
    if (canProceed() && isActive) {
      const timer = setTimeout(() => {
        onStepComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [canProceed, isActive, onStepComplete, stepNumber]);

  return (
    <TooltipProvider>
      <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Animation Components */}
        <CalculationDisplay
          isVisible={showCalculation}
          targetMolarity={0.1}
          targetVolume={0.25}
          molecularWeight={126.07}
          onCalculationComplete={handleCalculationComplete}
        />

        <WeighingAnimation
          isActive={showWeighing}
          targetMass={measurements.targetMass}
          onWeighingComplete={handleWeighingComplete}
        />

        <TransferAnimation
          isActive={showTransfer}
          fromContainer="beaker"
          toContainer="flask"
          solutionColor="#87ceeb"
          transferVolume={100}
          onTransferComplete={handleTransferComplete}
        />

        <MeniscusGuide
          isActive={showMeniscus}
          targetVolume={250}
          currentVolume={245}
          onVolumeReached={handleFinalVolume}
          flaskHeight={150}
          flaskWidth={80}
        />

        <MolecularVisualization
          isVisible={showMolecular}
          molecule="oxalic_acid"
          showHydration={true}
          animate3D={true}
        />

        <ErrorCalculation
          actualMass={measurements.massWeighed}
          targetMass={measurements.targetMass}
          actualMolarity={measurements.actualMolarity}
          targetMolarity={0.1}
          isVisible={showErrorAnalysis}
          onAnalysisComplete={() => setShowErrorAnalysis(false)}
        />

        <WorkBench
          step={step}
          experimentStarted={experimentStarted}
          onStartExperiment={onStartExperiment}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          onResetTimer={onResetTimer}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          experimentTitle={experimentTitle}
          onStepAction={handleStepAction}
          canProceed={canProceed()}
          equipmentPositions={equipmentPositions}
          setEquipmentPositions={setEquipmentPositions}
          preparationState={preparationState}
          measurements={measurements}
          results={results}
          chemicals={OXALIC_ACID_CHEMICALS}
          equipment={OXALIC_ACID_EQUIPMENT}
          onUndoStep={onUndoStep}
          onResetExperiment={onResetExperiment}
          currentStepIndex={currentStepIndex}
          onEquipmentPlaced={onEquipmentPlaced}
        />
      </div>
    </TooltipProvider>
  );
}

export default OxalicAcidVirtualLab;
