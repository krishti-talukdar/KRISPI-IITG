import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FlaskConical, Beaker, Droplets, Info, ArrowRight, ArrowLeft, CheckCircle, Wrench, Calculator, TrendingUp, Clock, Home, FastForward } from "lucide-react";
import { Link, useLocation } from "wouter";
import WorkBench from "./WorkBench";
import Equipment, { LAB_EQUIPMENT } from "./Equipment";
import {
  COLORS,
  INITIAL_FLASK,
  INITIAL_BURETTE,
  GUIDED_STEPS,
  ANIMATION,
  ENDPOINT_COLORS,
  EQUIPMENT_POSITIONS,
  STEP_4_POSITIONS,
  TITRATION_FORMULAS
} from "../constants";
import { 
  ConicalFlask, 
  Burette,
  TitrationAction, 
  TitrationState, 
  ExperimentMode, 
  ColorTransition,
  TitrationLog,
  TitrationData
} from "../types";

interface VirtualLabProps {
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  mode: ExperimentMode;
  onStepComplete: (stepId?: number) => void;
  onStepUndo?: (stepId?: number) => void;
  onReset: () => void;
  completedSteps: number[];
  burettePreparationComplete: boolean;
  experimentId: number;
}

export default function VirtualLab({
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  mode,
  onStepComplete,
  onStepUndo,
  onReset,
  completedSteps,
  burettePreparationComplete,
  experimentId,
}: VirtualLabProps) {
  // Lab state
  const [conicalFlask, setConicalFlask] = useState<ConicalFlask>(INITIAL_FLASK);
  const [burette, setBurette] = useState<Burette>(INITIAL_BURETTE);
  const [titrationState, setTitrationState] = useState<TitrationState>({
    currentPhase: 'preparation',
    buretteReading: 0.0,
    flaskColor: COLORS.COLORLESS,
    explanation: 'Preparation phase - set up equipment',
    titrationComplete: false
  });
  const [colorTransition, setColorTransition] = useState<ColorTransition | null>(null);
  const [titrationAction, setTitrationAction] = useState<TitrationAction | null>(null);
  const [titrationLog, setTitrationLog] = useState<TitrationLog[]>([]);
  const [showToast, setShowToast] = useState<string>("");
  const [isMixing, setIsMixing] = useState(false);
  
  // Workbench state
  const [currentStep, setCurrentStep] = useState(1);
  const [equipmentOnBench, setEquipmentOnBench] = useState<Array<{
    id: string;
    position: { x: number; y: number };
    isActive: boolean;
  }>>([]);
  const [activeEquipment, setActiveEquipment] = useState<string>("");
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [experimentCompleted, setExperimentCompleted] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<{type: string, equipmentId?: string, data?: any} | null>(null);
  const [stepHistory, setStepHistory] = useState<{step: number, state: any}[]>([]);
  const [showTitrating, setShowTitrating] = useState(false);
  const [titrationData, setTitrationData] = useState<TitrationData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [userTrials, setUserTrials] = useState<Array<{ initial: number | ""; final: number | "" }>>([{ initial: "", final: "" }]);
  const [acidNormality, setAcidNormality] = useState<number | "">("");
  const [acidVolume, setAcidVolume] = useState<number | "">("");
  const timeoutsRef = useRef<number[]>([]);
  const colorIntervalRef = useRef<number | null>(null);
  const [, setLocation] = useLocation();

  // Step 1 pipette planning state
  const [showPipetteVolumeModal, setShowPipetteVolumeModal] = useState(false);
  const [pipetteVolumeInput, setPipetteVolumeInput] = useState<string>("10");
  const [plannedOxalicVolume, setPlannedOxalicVolume] = useState<number | null>(10);

  const setSafeTimeout = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(tid => tid !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const isAnyAnimation = Boolean(colorTransition?.isAnimating || titrationAction?.isAnimating || showTitrating);

  const handleSkipAnimation = useCallback(() => {
    clearPendingTimeouts();

    if (colorTransition?.isAnimating) {
      if (colorIntervalRef.current) {
        clearInterval(colorIntervalRef.current as number);
        colorIntervalRef.current = null;
      }
      setConicalFlask(prev => ({ ...prev, colorHex: colorTransition.to }));
      setTitrationState(prev => ({
        ...prev,
        currentPhase: colorTransition.targetPhase || prev.currentPhase,
        flaskColor: colorTransition.to
      }));
      setColorTransition(null);
    }

    if (titrationAction?.isAnimating && titrationAction.actionType === 'add_solution' && titrationAction.reagentId === 'oxalic-acid') {
      setTitrationAction(null);
      const vol = Math.max(10, Math.min(25, plannedOxalicVolume ?? 25));
      setConicalFlask(prev => ({
        ...prev,
        volume: vol,
        contents: ['H₂C₂O₄'],
        colorHex: COLORS.OXALIC_ACID
      }));

      const logEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        action: 'Added oxalic acid',
        reagent: '0.1N H₂C₂O₄',
        volume: vol,
        buretteReading: burette.reading,
        colorBefore: COLORS.COLORLESS,
        colorAfter: COLORS.OXALIC_ACID,
        observation: `Transferred ${vol.toFixed(1)} mL of standard oxalic acid solution`
      } as TitrationLog;
      setTitrationLog(prev => [...prev, logEntry]);

      setActiveEquipment("");
      setShowToast("Oxalic acid added to flask!");
      setSafeTimeout(() => setShowToast(""), 2000);
      handleStepComplete();
    }

    if (showTitrating) {
      setShowTitrating(false);
      setActiveEquipment("");
    }
  }, [clearPendingTimeouts, colorTransition, titrationAction, showTitrating, burette.reading]);

  // Stop the timer when results modal appears
  useEffect(() => {
    if (showResultsModal) {
      setIsRunning(false);
    }
  }, [showResultsModal, setIsRunning]);

  const [showStartTitrationModal, setShowStartTitrationModal] = useState(false);
  const [startTitrationPromptShown, setStartTitrationPromptShown] = useState(false);

  // Auto titration flow after start prompt
  const [autoTitrating, setAutoTitrating] = useState(false);
  const [showTitrationLimitWarning, setShowTitrationLimitWarning] = useState(false);
  const [showStrengthPrompt, setShowStrengthPrompt] = useState(false);
  const autoFlowIntervalRef = useRef<number | null>(null);
  const prevBuretteReadingRef = useRef<number>(burette.reading);

  // Auto-remove phenolphthalein and pipette when step 4 begins
  useEffect(() => {
    if (currentStep === 4) {
      setEquipmentOnBench(prev => {
        const filtered = prev.filter(eq => eq.id !== 'phenolphthalein' && eq.id !== 'pipette');

        // Reposition burette and conical flask for better alignment in step 4
        let bx = STEP_4_POSITIONS.burette.x;
        let by = STEP_4_POSITIONS.burette.y;
        const withBurette = filtered.map(eq => {
          if (eq.id === 'burette') {
            bx = eq.position?.x ?? bx;
            by = eq.position?.y ?? by;
            return { ...eq, position: { x: bx, y: by } };
          }
          return eq;
        });
        const repositioned = withBurette.map(eq => {
          if (eq.id === 'conical-flask') {
            return { ...eq, position: { x: bx + 52, y: by + 235 } };
          }
          return eq;
        });

        if (filtered.length !== prev.length) {
          setShowToast("Pipette and phenolphthalein automatically removed from workbench");
          setSafeTimeout(() => setShowToast(""), 3000);
        }

        return repositioned;
      });

      if (!startTitrationPromptShown) {
        // show modal shortly after repositioning
        setStartTitrationPromptShown(true);
        setSafeTimeout(() => setShowStartTitrationModal(true), 600);
      }
    }
  }, [currentStep, setSafeTimeout, startTitrationPromptShown]);

  const startAutoTitration = useCallback(() => {
    setShowStartTitrationModal(false);
    setCurrentStep((s) => (s < 5 ? 5 : s));
    setActiveEquipment('burette');
    setAutoTitrating(true);

    if (autoFlowIntervalRef.current) {
      clearInterval(autoFlowIntervalRef.current as number);
      autoFlowIntervalRef.current = null;
    }

    autoFlowIntervalRef.current = window.setInterval(() => {
      setBurette((prev) => {
        const next = prev.reading + 0.5;
        const clamped = next >= 10 ? 10 : next;
        return { ...prev, reading: clamped };
      });
    }, 300);
  }, [burette.reading]);

  useEffect(() => {
    if (autoTitrating && burette.reading >= 10) {
      if (autoFlowIntervalRef.current) {
        clearInterval(autoFlowIntervalRef.current as number);
        autoFlowIntervalRef.current = null;
      }
      setAutoTitrating(false);
      setActiveEquipment("");
      setShowTitrationLimitWarning(true);
    }
  }, [autoTitrating, burette.reading]);

  // Update flask volume and small splash when burette reading increases
  useEffect(() => {
    const prev = prevBuretteReadingRef.current ?? 0;
    const delta = burette.reading - prev;
    if (delta > 0 && currentStep >= 5) {
      setConicalFlask(prevFlask => ({ ...prevFlask, volume: Math.round((prevFlask.volume + delta) * 10) / 10 }));
      setIsMixing(true);
      setTimeout(() => setIsMixing(false), 400);
    }
    prevBuretteReadingRef.current = burette.reading;
  }, [burette.reading, currentStep]);

  // Handle color transitions for endpoint detection
  const animateColorTransition = useCallback((fromColor: string, toColor: string, newPhase: TitrationState['currentPhase']) => {
    setColorTransition({
      from: fromColor,
      to: toColor,
      duration: ANIMATION.COLOR_TRANSITION_DURATION,
      currentStep: 0,
      totalSteps: 20,
      isAnimating: true,
      targetPhase: newPhase
    });

    // Animate color transition
    let step = 0;
    const totalSteps = 20;
    if (colorIntervalRef.current) { clearInterval(colorIntervalRef.current as number); colorIntervalRef.current = null; }
    const interval = window.setInterval(() => {
      step++;
      const progress = step / totalSteps;
      
      // Interpolate between colors
      const r1 = parseInt(fromColor.slice(1, 3), 16);
      const g1 = parseInt(fromColor.slice(3, 5), 16);
      const b1 = parseInt(fromColor.slice(5, 7), 16);
      const r2 = parseInt(toColor.slice(1, 3), 16);
      const g2 = parseInt(toColor.slice(3, 5), 16);
      const b2 = parseInt(toColor.slice(5, 7), 16);
      
      const r = Math.round(r1 + (r2 - r1) * progress);
      const g = Math.round(g1 + (g2 - g1) * progress);
      const b = Math.round(b1 + (b2 - b1) * progress);
      
      const currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      setConicalFlask(prev => ({ ...prev, colorHex: currentColor }));
      
      if (step >= totalSteps) {
        clearInterval(interval);
        if (colorIntervalRef.current) {
          clearInterval(colorIntervalRef.current as number);
          colorIntervalRef.current = null;
        }
        setConicalFlask(prev => ({ ...prev, colorHex: toColor }));
        setTitrationState(prev => ({
          ...prev,
          currentPhase: newPhase,
          flaskColor: toColor
        }));
        setColorTransition(null);
      }
    }, ANIMATION.COLOR_TRANSITION_DURATION / totalSteps);
  }, []);

  // Get predefined positions for equipment
  const getEquipmentPosition = (equipmentId: string) => {
    return EQUIPMENT_POSITIONS[equipmentId as keyof typeof EQUIPMENT_POSITIONS] || { x: 300, y: 250 };
  };

  // Handle equipment repositioning
  const handleEquipmentReposition = useCallback((equipmentId: string, x: number, y: number) => {
    setEquipmentOnBench(prev => prev.map(eq =>
      eq.id === equipmentId
        ? { ...eq, position: { x, y } }
        : eq
    ));
    setShowToast(`${equipmentId.replace('-', ' ')} repositioned`);
    setTimeout(() => setShowToast(""), 1500);
  }, []);

  // Handle equipment drop on workbench
  const handleEquipmentDrop = useCallback((equipmentId: string, x: number, y: number) => {
    // In guided mode, enforce step equipment requirements
    if (mode.current === 'guided') {
      const currentStepData = GUIDED_STEPS[currentStep - 1];
      const allowedSoFar = new Set(
        GUIDED_STEPS.slice(0, currentStep).flatMap((s) => s.equipment)
      );
      // Allow placing any equipment required up to the current step
      if (!allowedSoFar.has(equipmentId)) {
        setShowToast(`${equipmentId.replace('-', ' ')} is not needed for step ${currentStep}. Follow the current step instructions.`);
        setTimeout(() => setShowToast(""), 3000);
        return;
      }
    }

    // Add equipment to workbench at drop position and compute resulting set
    let afterIds: string[] = [];
    setEquipmentOnBench(prev => {
      const filtered = prev.filter(eq => eq.id !== equipmentId);
      const next = [
        ...filtered,
        {
          id: equipmentId,
          position: equipmentId === 'phenolphthalein' ? { x, y } : getEquipmentPosition(equipmentId),
          isActive: false,
        },
      ];
      afterIds = next.map((eq) => eq.id);
      return next;
    });

    setShowToast(`${equipmentId.replace('-', ' ')} placed on workbench`);
    setTimeout(() => setShowToast(""), 2000);

    // Step 1: show hint and volume modal when pipette is placed
    if (equipmentId === 'pipette' && currentStep === 1) {
      setShowToast('Click on the pipette to fill the oxalic acid into the conical flask');
      setSafeTimeout(() => setShowToast(''), 4000);
      setSafeTimeout(() => setShowPipetteVolumeModal(true), 800);
    }

    // Auto-complete step only when all required items for this placement step are present
    if (mode.current === 'guided') {
      const currentStepData = GUIDED_STEPS[currentStep - 1];
      const isPlacementStep = currentStepData.action.includes("Drag");
      const allPresent = currentStepData.equipment.every(id => afterIds.includes(id));

      // Step 3 special flow: after placing indicator, prompt user to click it (do not auto-complete)
      if (currentStep === 3 && equipmentId === 'phenolphthalein') {
        setTimeout(() => {
          setShowToast('click on the indicator icon');
          setSafeTimeout(() => setShowToast(''), 4000);
        }, 600);
      } else if (isPlacementStep && allPresent && !completedSteps.includes(currentStep) && currentStep !== 3) {
        // Auto-complete step for all placement steps except step 3 (phenolphthalein)
        setTimeout(() => {
          handleStepComplete();
        }, 600);
      }

      // Show guidance for step 2 when pipette and flask are on bench (only if volume is set)
      if (currentStep === 2 && afterIds.includes('pipette') && afterIds.includes('conical-flask') && plannedOxalicVolume) {
        setTimeout(() => {
          setShowToast('Click on the pipette to fill the oxalic acid into the conical flask');
          setSafeTimeout(() => setShowToast(''), 4000);
        }, 1000);
      }
    }
  }, [currentStep, completedSteps, mode.current]);

  // Handle equipment interaction
  const handleEquipmentInteract = useCallback((equipmentId: string) => {
    const currentStepData = GUIDED_STEPS[currentStep - 1];

    if (equipmentId === 'pipette' && (currentStep === 1 || currentStep === 2)) {
      if (currentStep === 1) {
        setShowPipetteVolumeModal(true);
        return;
      }
      // Transfer oxalic acid to flask using planned volume
      const vol = Math.max(10, Math.min(25, plannedOxalicVolume ?? 25));
      setActiveEquipment(equipmentId);
      setTitrationAction({
        id: Date.now().toString(),
        actionType: 'add_solution',
        reagentId: 'oxalic-acid',
        targetId: 'conical-flask',
        amount: vol,
        timestamp: Date.now(),
        isAnimating: true
      });

      setShowToast(`Adding ${vol.toFixed(1)} mL of 0.1N oxalic acid...`);

      setSafeTimeout(() => {
        setTitrationAction(null);
        const vol = Math.max(10, Math.min(25, plannedOxalicVolume ?? 25));
        setConicalFlask(prev => ({
          ...prev,
          volume: vol,
          contents: ['H₂C₂O₄'],
          colorHex: COLORS.OXALIC_ACID
        }));

        const logEntry: TitrationLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: 'Added oxalic acid',
          reagent: '0.1N H��C₂O₄',
          volume: vol,
          buretteReading: burette.reading,
          colorBefore: COLORS.COLORLESS,
          colorAfter: COLORS.OXALIC_ACID,
          observation: `Transferred ${vol.toFixed(1)} mL of standard oxalic acid solution`
        };
        setTitrationLog(prev => [...prev, logEntry]);

        setActiveEquipment("");
        setShowToast("Oxalic acid added to flask!");
        setSafeTimeout(() => setShowToast(""), 2000);
        handleStepComplete();
      }, ANIMATION.DROPPER_DURATION);

    } else if (equipmentId === 'phenolphthalein' && currentStep === 3) {
      // Add indicator after click with mixing animation and messages
      setActiveEquipment(equipmentId);
      setIsMixing(true);

      // Show immediate mixing popup message
      setShowToast('indicator mixed in the flask!');

      setSafeTimeout(() => {
        setIsMixing(false);
        setConicalFlask(prev => ({
          ...prev,
          hasIndicator: true
        }));

        const logEntry: TitrationLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: 'Added indicator',
          reagent: 'Phenolphthalein',
          volume: 0.1,
          buretteReading: burette.reading,
          colorBefore: conicalFlask.colorHex,
          colorAfter: conicalFlask.colorHex,
          observation: 'Phenolphthalein added and mixed in the flask'
        };
        setTitrationLog(prev => [...prev, logEntry]);

        setActiveEquipment("");
        setShowToast('2-3 drops of phanolpthalein added');
        setSafeTimeout(() => setShowToast(""), 3000);
        // Align flask under burette immediately after adding indicator
        setEquipmentOnBench(prev => {
          const buretteEq = prev.find(e => e.id === 'burette');
          const bx = buretteEq?.position?.x ?? STEP_4_POSITIONS.burette.x;
          const by = buretteEq?.position?.y ?? STEP_4_POSITIONS.burette.y;
          const newFlaskPos = { x: bx + 88, y: by + 245 };
          return prev.map(eq => {
            if (eq.id === 'burette') return { ...eq, position: { x: bx, y: by } };
            if (eq.id === 'conical-flask') return { ...eq, position: newFlaskPos };
            return eq;
          });
        });
        handleStepComplete();
      }, ANIMATION.MIXING_DURATION);

    } else if (equipmentId === 'naoh-solution' && currentStep === 4) {
      // Fill burette with NaOH
      setActiveEquipment(equipmentId);
      setShowToast("Filling burette with NaOH solution...");

      setSafeTimeout(() => {
        setBurette(prev => ({
          ...prev,
          reading: 0.0,
          isOpen: false
        }));

        setTitrationState(prev => ({
          ...prev,
          currentPhase: 'titration',
          explanation: 'Burette filled and ready for titration'
        }));

        const logEntry: TitrationLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: 'Filled burette',
          reagent: 'NaOH solution',
          volume: 50,
          buretteReading: 0.0,
          colorBefore: conicalFlask.colorHex,
          colorAfter: conicalFlask.colorHex,
          observation: 'Burette filled with NaOH solution and adjusted to zero'
        };
        setTitrationLog(prev => [...prev, logEntry]);

        setActiveEquipment("");
        setShowToast("Burette ready - begin titration!");
        setSafeTimeout(() => setShowToast(""), 2000);
        handleStepComplete();
      }, 2000);

    } else if (equipmentId === 'burette' && currentStep === 5) {
      // Begin titration
      setActiveEquipment(equipmentId);
      setShowTitrating(true);
      
      const newReading = burette.reading + 0.5; // Add 0.5 mL each click
      setBurette(prev => ({ ...prev, reading: newReading }));

      setShowToast(`Adding NaOH... Burette reading: ${newReading.toFixed(1)} mL`);

      // Check if approaching endpoint (around 24-26 mL for 0.1N solutions)
      if (newReading >= 23 && newReading < 24.5 && !conicalFlask.endpointReached) {
        // Approaching endpoint - very light pink
        animateColorTransition(conicalFlask.colorHex, ENDPOINT_COLORS.APPROACHING, 'endpoint');
        setShowToast("Approaching endpoint - solution turning faint pink!");
      } else if (newReading >= 24.5 && newReading < 25.5 && !conicalFlask.endpointReached) {
        // Endpoint reached!
        animateColorTransition(conicalFlask.colorHex, ENDPOINT_COLORS.ENDPOINT, 'endpoint');
        setConicalFlask(prev => ({ ...prev, endpointReached: true }));

        // Mark experiment as completed immediately when color changes
        if (!experimentCompleted) {
          const finalReading = newReading;
          const titreVolume = finalReading;
          setTitrationData(prev => [...prev, { trial: currentTrial, initialReading: 0.0, finalReading, volume: titreVolume, isValid: true }]);
          setTitrationState(prev => ({ ...prev, currentPhase: 'completed', titrationComplete: true }));
          setShowToast('✅ Endpoint confirmed! Titration complete!');
          setTimeout(() => setShowToast(''), 3000);
          setExperimentCompleted(true);
          setLocation(`/experiment/${experimentId}/results`);
        }
        
        const logEntry: TitrationLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: 'Endpoint reached',
          reagent: 'NaOH solution',
          volume: newReading,
          buretteReading: newReading,
          colorBefore: ENDPOINT_COLORS.APPROACHING,
          colorAfter: ENDPOINT_COLORS.ENDPOINT,
          observation: `Endpoint reached at ${newReading.toFixed(1)} mL - permanent light pink color`,
          isEndpoint: true
        };
        setTitrationLog(prev => [...prev, logEntry]);

        setShowToast(`🎉 ENDPOINT REACHED! Final reading: ${newReading.toFixed(1)} mL`);
        setTimeout(() => {
          setShowToast("Click conical flask to confirm endpoint!");
          setTimeout(() => setShowToast(""), 3000);
        }, 3000);
      } else if (newReading > 25.5) {
        // Overshoot
        animateColorTransition(conicalFlask.colorHex, ENDPOINT_COLORS.OVERSHOOT, 'completed');
        setShowToast("⚠️ Overshot! Solution too pink - repeat titration for accuracy");
      }

      setSafeTimeout(() => {
        setShowTitrating(false);
        setActiveEquipment("");
      }, 1000);

    } else if (equipmentId === 'conical-flask' && currentStep === 6 && conicalFlask.endpointReached) {
      // Confirm endpoint
      const finalReading = burette.reading;
      const titreVolume = finalReading;

      // Calculate results
      const naohNormality = (0.1 * 25.0) / titreVolume;
      const naohStrength = naohNormality * 40; // g/L

      // Record titration data
      const newTitrationData: TitrationData = {
        trial: currentTrial,
        initialReading: 0.0,
        finalReading: finalReading,
        volume: titreVolume,
        isValid: titreVolume >= 20 && titreVolume <= 30 // Reasonable range
      };
      setTitrationData(prev => [...prev, newTitrationData]);

      const logEntry: TitrationLog = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        action: 'Endpoint confirmed',
        reagent: 'Final reading',
        volume: titreVolume,
        buretteReading: finalReading,
        colorBefore: ENDPOINT_COLORS.ENDPOINT,
        colorAfter: ENDPOINT_COLORS.ENDPOINT,
        observation: `Titration complete. NaOH normality: ${naohNormality.toFixed(4)}N, Strength: ${naohStrength.toFixed(2)} g/L`
      };
      setTitrationLog(prev => [...prev, logEntry]);

      setTitrationState(prev => ({
        ...prev,
        currentPhase: 'completed',
        titrationComplete: true,
        explanation: `Titration complete! NaOH strength: ${naohStrength.toFixed(2)} g/L`
      }));

      setShowToast("✅ Endpoint confirmed! Titration complete!");
      setTimeout(() => setShowToast(""), 3000);
      handleStepComplete();
      
      // Set experiment as completed
      setExperimentCompleted(true);
      setLocation(`/experiment/${experimentId}/results`);
      

    } else {
      setShowToast("Follow the current step instructions");
      setTimeout(() => setShowToast(""), 2000);
    }
  }, [currentStep, conicalFlask, burette, animateColorTransition, currentTrial]);

  // Handle step completion
  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      // Save current state to history
      const currentState = {
        conicalFlask: { ...conicalFlask },
        burette: { ...burette },
        titrationState: { ...titrationState },
        titrationLog: [...titrationLog],
        equipmentOnBench: [...equipmentOnBench]
      };
      setStepHistory(prev => [...prev, { step: currentStep, state: currentState }]);

      // Call parent's step completion handler
      onStepComplete(currentStep);

      if (currentStep < GUIDED_STEPS.length) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setShowToast(`Step ${currentStep} completed! Moving to step ${currentStep + 1}`);
          setTimeout(() => setShowToast(""), 3000);
        }, 500);
      }
    }
  };

  // Reset experiment
  const handleResetExperiment = () => {
    setConicalFlask(INITIAL_FLASK);
    setBurette(INITIAL_BURETTE);
    setTitrationState({
      currentPhase: 'preparation',
      buretteReading: 0.0,
      flaskColor: COLORS.COLORLESS,
      explanation: 'Preparation phase - set up equipment',
      titrationComplete: false
    });
    setColorTransition(null);
    setTitrationAction(null);
    setTitrationLog([]);
    setCurrentStep(1);
    setEquipmentOnBench([]);
    setActiveEquipment("");
    setShowResultsModal(false);
    setExperimentCompleted(false);
    setLastAction(null);
    setStepHistory([]);
    setShowTitrating(false);
    setShowToast("");
    setTitrationData([]);
    setCurrentTrial(1);
    onReset();
  };

  const currentStepData = GUIDED_STEPS[currentStep - 1];

  const validTrialVolumes = userTrials
    .map(t => (typeof t.initial === 'number' && typeof t.final === 'number' ? Math.max(0, t.final - t.initial) : null))
    .filter((v): v is number => v !== null && !Number.isNaN(v));
  const meanV2 = validTrialVolumes.length ? validTrialVolumes.reduce((a, b) => a + b, 0) / validTrialVolumes.length : 0;
  const nAcid = typeof acidNormality === 'number' ? acidNormality : 0;
  const vAcid = typeof acidVolume === 'number' ? acidVolume : 0;
  const naohNormalityUser = meanV2 > 0 && nAcid > 0 && vAcid > 0 ? (nAcid * vAcid) / meanV2 : 0;
  const naohStrengthUser = naohNormalityUser * 40;

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        {/* Step Progress Bar (guided mode only) */}
        {mode.current === 'guided' && !experimentCompleted && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Titration Progress</h3>
            <span className="text-sm text-blue-600 font-medium">
              Step {currentStep} of {GUIDED_STEPS.length}
            </span>
          </div>
          
          {/* Progress indicators */}
          <div className="flex space-x-2 mb-4">
            {GUIDED_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500'
                    : currentStep === step.id
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current step info */}
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              completedSteps.includes(currentStep) 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {completedSteps.includes(currentStep) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-sm font-bold">{currentStep}</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                {currentStepData.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {currentStep === 4 ? "burette already filled with NaOH, Start the titration!" : currentStepData.description}
              </p>
              {currentStep !== 4 && (
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  {currentStepData.action}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Equipment Section - Left */}
          <div className={`${experimentCompleted ? "hidden" : ""} lg:col-span-3 space-y-4`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                Equipment
              </h3>
              
              <div className="space-y-3">
                {LAB_EQUIPMENT.filter(eq => !['funnel','wash-bottle','oxalic-acid','naoh-solution'].includes(eq.id)).map((equipment) => (
                  <Equipment
                    key={equipment.id}
                    id={equipment.id}
                    name={equipment.name}
                    icon={equipment.icon}
                    disabled={!experimentStarted}
                  />
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Drag equipment to the workbench following the step-by-step instructions.
                </p>
              </div>
            </div>

            {/* Titration Equation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Chemical Reaction</h4>
              <div className="text-center text-xs font-mono leading-relaxed bg-gray-50 rounded-lg p-3 border">
                <div className="mb-2">
                  H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O
                </div>
                <div className="text-gray-500">
                  Oxalic acid + Sodium hydroxide
                </div>
              </div>
            </div>


            {/* Reset Button */}
            <Button
              onClick={handleResetExperiment}
              variant="outline"
              className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              Reset Experiment
            </Button>
          </div>

          {/* Workbench - Center */}
          <div className="lg:col-span-6">
            <WorkBench
              onDrop={handleEquipmentDrop}
              isRunning={isRunning}
              currentStep={currentStep}
            >
              {/* Positioned Equipment */}
              {equipmentOnBench.map((equipment) => {
                const equipmentData = LAB_EQUIPMENT.find(eq => eq.id === equipment.id);

                return equipmentData ? (
                  <Equipment
                    key={equipment.id}
                    id={equipment.id}
                    name={equipmentData.name}
                    icon={equipmentData.icon}
                    position={equipment.position}
                    onRemove={(id) => {
                      setEquipmentOnBench(prev => prev.filter(eq => eq.id !== id));
                      setShowToast(`${id.replace('-', ' ')} removed from workbench`);
                      setTimeout(() => setShowToast(""), 2000);
                    }}
                    onReposition={handleEquipmentReposition}
                    onInteract={handleEquipmentInteract}
                    isActive={activeEquipment === equipment.id}
                    color={equipment.id === 'conical-flask' ? conicalFlask.colorHex : undefined}
                    volume={equipment.id === 'conical-flask' ? conicalFlask.volume : equipment.id === 'pipette' ? (plannedOxalicVolume ?? undefined) : undefined}
                    reading={equipment.id === 'burette' ? burette.reading : undefined}
                    mixing={equipment.id === 'conical-flask' ? isMixing : undefined}
                    currentStep={currentStep}
                    flowing={equipment.id === 'burette' ? autoTitrating : undefined}
                  />
                ) : null;
              })}

              {/* Pouring overlay placed relative to workbench */}
              {(autoTitrating || showTitrating) && (() => {
                const buretteOnBench = equipmentOnBench.find(e => e.id === 'burette');
                const flaskOnBench = equipmentOnBench.find(e => e.id === 'conical-flask');
                const left = (buretteOnBench?.position?.x ?? 120);
                const top = (buretteOnBench?.position?.y ?? 100) + 190; // adjust to tip

                return (
                  <>
                    <style>{`@keyframes pourStream { 0% { height: 0 } 100% { height: 120px } } @keyframes dripFall { 0% { transform: translateY(0); opacity:1 } 80% { opacity:1 } 100% { transform: translateY(120px); opacity:0 } }`}</style>

                    <div className="absolute pointer-events-none" style={{ left: left + 160, top, zIndex: 80 }}>
                      <div className="flex items-start space-x-3">
                        {/* Burette scale (downcounting 10→1) - moved to side */}
                        <div className="flex flex-col items-center bg-white p-2 rounded-md shadow-lg ring-1 ring-blue-200" style={{ width: 60, zIndex: 70 }}>
                          {Array.from({ length: 10 }).map((_, idx) => {
                            const n = 10 - idx; // Downcount from 10 to 1
                            const used = burette.reading >= (10 - n + 1); // Show as used when passed
                            return (
                              <div key={n} className={`w-full text-center text-xs font-medium py-0.5 mb-0.5 ${used ? 'bg-pink-600 text-white rounded' : 'text-gray-800 bg-gray-100 rounded'}`}>
                                {n} mL
                              </div>
                            );
                          })}
                        </div>

                        <div className="relative" style={{ marginLeft: -100 }}>
                          <div style={{ width: 8, borderRadius: 8, background: 'linear-gradient(to bottom, rgba(59,130,246,0.95), rgba(99,102,241,0.95))', animation: 'pourStream 300ms linear forwards' }} className="origin-top" />

                          <div style={{ position: 'absolute', left: -6, top: 0 }}>
                            {[0,1,2].map((i) => (
                              <div key={i} style={{ width: 8, height: 10, background: 'rgba(59,130,246,0.95)', borderRadius: 8, marginTop: 6, animation: `dripFall 900ms cubic-bezier(.2,.9,.3,1) ${i * 160}ms infinite` }} />
                            ))}
                          </div>

                          {/* Countdown */}
                          {autoTitrating && (
                            <div className="mt-2 bg-white/95 p-2 rounded-lg shadow text-center text-sm">
                              <div className="text-xs text-gray-500">Auto-stop at</div>
                              <div className="text-lg font-bold text-blue-600">10.0 mL</div>
                              <div className="text-xs text-gray-700">{Math.max(0, Math.ceil(((10 - burette.reading) / 0.5 * 300) / 1000))}s remaining</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Splash indicator on flask */}
                    {flaskOnBench && (
                      <div className="absolute z-30 pointer-events-none" style={{ left: (flaskOnBench.position.x ?? 250) + 40, top: (flaskOnBench.position.y ?? 300) + 40 }}>
                        <div style={{ width: 44, height: 16, borderRadius: 8, background: 'rgba(255,192,203,0.25)', transform: 'translateY(0)', animation: 'dripFall 600ms ease-in-out infinite' }} />
                      </div>
                    )}
                  </>
                );
              })()}
            </WorkBench>
          </div>

          {/* Analysis Panel - Right */}
          <div className="lg:col-span-3 space-y-4">
            {experimentCompleted && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Data Entry</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Oxalic Acid Normality (N₁)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={acidNormality as any}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAcidNormality(v === "" ? "" : Number(v));
                      }}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Oxalic Acid Volume (V₁, mL)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={acidVolume as any}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAcidVolume(v === "" ? "" : Number(v));
                      }}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 pr-4">Trial</th>
                        <th className="py-2 pr-4">Initial (mL)</th>
                        <th className="py-2 pr-4">Final (mL)</th>
                        <th className="py-2 pr-4">NaOH Used (mL)</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTrials.map((t, idx) => {
                        const vol = typeof t.initial === 'number' && typeof t.final === 'number' ? Math.max(0, t.final - t.initial) : 0;
                        return (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-4">{idx + 1}</td>
                            <td className="py-2 pr-4">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={t.initial as any}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setUserTrials(prev => prev.map((row, i) => i === idx ? { ...row, initial: v === "" ? "" : Number(v) } : row));
                                }}
                                className="w-24 border rounded px-2 py-1"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={t.final as any}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setUserTrials(prev => prev.map((row, i) => i === idx ? { ...row, final: v === "" ? "" : Number(v) } : row));
                                }}
                                className="w-24 border rounded px-2 py-1"
                              />
                            </td>
                            <td className="py-2 pr-4 font-mono">{vol.toFixed(2)}</td>
                            <td className="py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserTrials(prev => prev.filter((_, i) => i !== idx))}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserTrials(prev => [...prev, { initial: "", final: "" }])}
                    >
                      + Add Trial
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Mean Titre Volume (V₂)</div>
                    <div className="text-lg font-bold">{meanV2.toFixed(2)} mL</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">NaOH Normality (N₂)</div>
                    <div className="text-lg font-bold">{naohNormalityUser.toFixed(4)} N</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Strength</div>
                    <div className="text-lg font-bold">{naohStrengthUser.toFixed(2)} g/L</div>
                  </div>
                </div>
              </div>
            )}
            <div className={`${experimentCompleted ? "hidden" : ""} bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-green-600" />
                Live Analysis
              </h3>

              {/* Burette Preparation Status */}
              {burettePreparationComplete && (
                <div className="mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">
                        Burette Prepared
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Initial reading: 0.00 ± 0.01 mL
                    </p>
                  </div>
                </div>
              )}

              {/* Current State */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Current Phase</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: titrationState.flaskColor }}
                  ></div>
                  <span className="text-sm capitalize">{titrationState.currentPhase}</span>
                </div>
                <p className="text-xs text-gray-600">{titrationState.explanation}</p>
              </div>

              {/* Burette Reading */}
              {burette.reading > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Burette Reading</h4>
                  <div className="text-2xl font-mono font-bold text-blue-600">
                    {burette.reading.toFixed(1)} mL
                  </div>
                </div>
              )}

              {/* Steps Completed (guided mode only) */}
              {mode.current === 'guided' && !experimentCompleted && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Completed Steps</h4>
                <div className="space-y-1">
                  {GUIDED_STEPS.map((step) => (
                    <div key={step.id} className={`flex items-center space-x-2 text-xs ${
                      completedSteps.includes(step.id) ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Recent Actions */}
              {titrationLog.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Recent Actions</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {titrationLog.slice(-3).reverse().map((log) => (
                      <div key={log.id} className={`text-xs p-2 rounded ${
                        log.isEndpoint ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-gray-600">{log.observation}</div>
                        {log.volume && (
                          <div className="text-blue-600 font-mono">
                            {log.volume.toFixed(1)} mL
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAnyAnimation && (
          <div className="fixed top-4 right-4 z-50">
            <Button onClick={handleSkipAnimation} variant="outline" className="bg-white/90">
              <FastForward className="w-4 h-4 mr-2" />
              Skip animation
            </Button>
          </div>
        )}

        {/* Titration Animation */}
        {titrationAction && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="animate-bounce bg-white rounded-lg p-4 shadow-xl border-2 border-blue-300">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-sm text-center mt-2">Adding solution...</p>
            </div>
          </div>
        )}

        {/* Pipette volume modal for step 1 */}
        <Dialog open={showPipetteVolumeModal} onOpenChange={setShowPipetteVolumeModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Enter Oxalic Acid Volume</DialogTitle>
              <DialogDescription>enter the amount of oxalic acid(10ml-25ml)</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="number"
                min={10}
                max={25}
                step={0.1}
                value={pipetteVolumeInput}
                onChange={(e) => setPipetteVolumeInput(e.target.value)}
              />
              <p className="text-xs text-blue-600">Recommendation: add 10ml of oxalic acid</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPipetteVolumeModal(false)}>Cancel</Button>
                <Button onClick={() => {
                  const v = Math.max(10, Math.min(25, parseFloat(pipetteVolumeInput) || 10));
                  setPlannedOxalicVolume(v);
                  setShowPipetteVolumeModal(false);
                  setShowToast(`Volume set to ${v.toFixed(1)} mL. Click on the pipette to fill the conical flask.`);
                  setSafeTimeout(() => setShowToast(""), 4000);
                }}>Confirm</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{showToast}</span>
            </div>
          </div>
        )}

        {/* Start Titration Prompt (shown at beginning of step 4) */}
        <Dialog open={showStartTitrationModal} onOpenChange={setShowStartTitrationModal}>
          <DialogContent className="max-w-md w-full p-0 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-2xl font-extrabold">Let's start the titration now!</h3>
                  <p className="text-blue-100 mt-1">Are you excited?</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white">
              <p className="text-sm text-gray-700">The burette has been aligned and is ready with NaOH. When you're ready, start adding NaOH to the conical flask to begin the titration.</p>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={startAutoTitration}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-md shadow-md"
                >
                  Yes, I am!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warning after 10 mL - Styled */}
        <Dialog open={showTitrationLimitWarning} onOpenChange={setShowTitrationLimitWarning}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white text-2xl font-bold">Titration Limit Reached</h3>
                <p className="text-pink-100 mt-1">Titrating beyond this limit might give you a different result.</p>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-sm text-gray-700 mb-4">You have added 10.0 mL of NaOH. Continuing beyond this limit may change the endpoint reading and affect accuracy. Choose an action:</p>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100">
                    <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h.01M12 20h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Stop Titration</div>
                    <div className="text-xs text-gray-500">Record current reading and proceed to analysis</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Continue Titrating</div>
                    <div className="text-xs text-gray-500">Proceed beyond recommended limit (may overshoot)</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTitrationLimitWarning(false);
                    setConicalFlask(prev => ({ ...prev, colorHex: ENDPOINT_COLORS.ENDPOINT, endpointReached: true }));
                    setTitrationState(prev => ({ ...prev, currentPhase: 'endpoint', flaskColor: ENDPOINT_COLORS.ENDPOINT, explanation: 'Stopped at safe limit (light pink observed)' }));
                    setExperimentCompleted(true);
                    setSafeTimeout(() => setShowStrengthPrompt(true), 6000);
                  }}
                  className="border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  Stop titration
                </Button>
                <Button
                  onClick={() => {
                    setShowTitrationLimitWarning(false);
                    setConicalFlask(prev => ({ ...prev, colorHex: ENDPOINT_COLORS.OVERSHOOT }));
                    setTitrationState(prev => ({ ...prev, currentPhase: 'completed', flaskColor: ENDPOINT_COLORS.OVERSHOOT, explanation: 'Continued beyond limit (dark pink observed)' }));
                    setExperimentCompleted(true);
                    setSafeTimeout(() => setShowStrengthPrompt(true), 6000);
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Continue titrating
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Strength calculation prompt */}
        <Dialog open={showStrengthPrompt} onOpenChange={setShowStrengthPrompt}>
          <DialogContent className="max-w-md w-full p-0 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-fuchsia-600 p-6 relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_80%_30%,white,transparent_30%)]" />
              <div className="relative z-10 flex items-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-3">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold tracking-tight">Calculate the strength of NaOH now</h3>
                  <p className="text-pink-100 text-sm mt-1">The solution color is set. Proceed to compute normality and strength.</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="flex items-center mb-4">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: conicalFlask.colorHex }} />
                <span className="text-sm text-gray-600">Flask color preview</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStrengthPrompt(false)}>Stay</Button>
                <Button className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white" onClick={() => { setShowStrengthPrompt(false); setLocation(`/experiment/${experimentId}/results`); }}>Go to calculation</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Results Analysis Modal */}
        <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                Titration Results & Analysis
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Complete analysis of your NaOH standardization titration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Titration Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FlaskConical className="w-5 h-5 mr-2 text-blue-600" />
                  Titration Summary
                </h3>
                {titrationData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{titrationData[0].volume.toFixed(1)} mL</div>
                      <div className="text-sm text-gray-600">Titre Volume</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        {((0.1 * 25.0) / titrationData[0].volume).toFixed(4)}N
                      </div>
                      <div className="text-sm text-gray-600">NaOH Normality</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">
                        {(((0.1 * 25.0) / titrationData[0].volume) * 40).toFixed(2)} g/L
                      </div>
                      <div className="text-sm text-gray-600">NaOH Strength</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-orange-600">{completedSteps.length}</div>
                      <div className="text-sm text-gray-600">Steps Completed</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calculation Details */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                  Calculation Details
                </h3>
                <div className="space-y-4">
                  {TITRATION_FORMULAS.map((formula, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-2">{formula.name}</h4>
                      <div className="bg-white rounded p-3 border font-mono text-sm mb-2">
                        {formula.formula}
                      </div>
                      <p className="text-sm text-gray-600">{formula.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Timeline */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Titration Timeline
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {titrationLog.map((log, index) => (
                    <div key={log.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                      log.isEndpoint ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        log.isEndpoint ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{log.action}</div>
                        <div className="text-sm text-gray-600">{log.observation}</div>
                        {log.volume && (
                          <div className="text-xs font-mono text-blue-600 mt-1">
                            Volume: {log.volume.toFixed(1)} mL
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Link href="/">
                <Button className="bg-gray-500 hover:bg-gray-600 text-white flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Return to Experiments</span>
                </Button>
              </Link>
              <Button
                onClick={() => setShowResultsModal(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Close Analysis
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
