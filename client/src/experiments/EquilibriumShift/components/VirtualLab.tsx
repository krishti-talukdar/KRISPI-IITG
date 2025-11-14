import React, { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlaskConical, Beaker, Droplets, Info, ArrowRight, ArrowLeft, CheckCircle, Wrench, X, TrendingUp, Clock, Home } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkBench } from "./WorkBench";
import { Equipment, LAB_EQUIPMENT } from "./Equipment";
import { 
  COLORS, 
  INITIAL_TESTTUBE, 
  EQUILIBRIUM_STATES, 
  GUIDED_STEPS,
  ANIMATION,
  EQUILIBRIUM_EQUATION 
} from "../constants";
import { 
  TestTube, 
  DropperAction, 
  EquilibriumState, 
  ExperimentMode, 
  ColorTransition,
  ExperimentLog 
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
}: VirtualLabProps) {
  // Lab state
  const [testTube, setTestTube] = useState<TestTube>(INITIAL_TESTTUBE);
  const [equilibriumState, setEquilibriumState] = useState<EquilibriumState>(EQUILIBRIUM_STATES.hydrated);
  const [colorTransition, setColorTransition] = useState<ColorTransition | null>(null);
  const [dropperAction, setDropperAction] = useState<DropperAction | null>(null);
  const [experimentLog, setExperimentLog] = useState<ExperimentLog[]>([]);
  const [showToast, setShowToast] = useState<string>("");
  
  // Workbench state
  const [currentStep, setCurrentStep] = useState(1);
  const [equipmentOnBench, setEquipmentOnBench] = useState<Array<{
    id: string;
    position: { x: number; y: number };
    isActive: boolean;
  }>>([]);
  const [activeEquipment, setActiveEquipment] = useState<string>("");
  const [hclClickCount, setHclClickCount] = useState<number>(0);
  const [waterClickCount, setWaterClickCount] = useState<number>(0);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [experimentCompleted, setExperimentCompleted] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<{type: string, equipmentId?: string, data?: any} | null>(null);
  const [stepHistory, setStepHistory] = useState<{step: number, state: any}[]>([]);
  const [showAddingSolutions, setShowAddingSolutions] = useState(false);
  const [isStirring, setIsStirring] = useState<boolean>(false);
  const [stirAnimationStep, setStirAnimationStep] = useState<number>(0);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<string>("");
  const [volumeInput, setVolumeInput] = useState<string>("");
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [observePulse, setObservePulse] = useState<boolean>(true);
  const [finalVolumeUsed, setFinalVolumeUsed] = useState<number | null>(null);

  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<{ q1?: string; q2?: string; q3?: string; q4?: string; q5?: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const handleSelect = (q: 'q1'|'q2'|'q3'|'q4'|'q5', val: string) => {
    setQuizSelections(prev => ({ ...prev, [q]: val }));
  };

  const submitQuiz = () => {
    const correct: Record<string,string> = { q1: 'B', q2: 'B', q3: 'B', q4: 'C', q5: 'C' };
    let score = 0;
    (['q1','q2','q3','q4','q5'] as Array<'q1'|'q2'|'q3'|'q4'|'q5'>).forEach(k => { if (quizSelections[k] === correct[k]) score++; });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const allAnswered = !!(quizSelections.q1 && quizSelections.q2 && quizSelections.q3 && quizSelections.q4 && quizSelections.q5);

  useEffect(() => {
    const handler = (e: any) => {
      const v = e?.detail?.volumeUsed;
      if (typeof v === 'number' && !isNaN(v)) setFinalVolumeUsed(v);
    };
    window.addEventListener('finalVolumeUsedUpdated', handler as EventListener);
    return () => window.removeEventListener('finalVolumeUsedUpdated', handler as EventListener);
  }, []);

  // Stop the timer when the results & analysis modal appears
  useEffect(() => {
    if (showResultsModal) {
      setIsRunning(false);
    }
  }, [showResultsModal, setIsRunning]);

  // Handle color transitions with animation
  const animateColorTransition = useCallback((fromColor: string, toColor: string, newState: EquilibriumState) => {
    setColorTransition({
      from: fromColor,
      to: toColor,
      duration: ANIMATION.COLOR_TRANSITION_DURATION,
      currentStep: 0,
      totalSteps: 20,
      isAnimating: true
    });

    // Animate the color transition
    let step = 0;
    const totalSteps = 20;
    const interval = setInterval(() => {
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
      
      setTestTube(prev => ({ ...prev, colorHex: currentColor }));
      
      if (step >= totalSteps) {
        clearInterval(interval);
        setTestTube(prev => ({ ...prev, colorHex: toColor }));
        setEquilibriumState(newState);
        setColorTransition(null);
      }
    }, ANIMATION.COLOR_TRANSITION_DURATION / totalSteps);
  }, []);

  // Handle stirring animation
  const animateStirring = useCallback(() => {
    setIsStirring(true);
    setStirAnimationStep(0);

    // Animation sequence: right -> left -> right -> left -> center (continuous cycle)
    const stirringSteps = [0, 18, -18, 12, -12, 0]; // X offset values for smooth stirring
    let stepIndex = 0;
    let stirInterval: NodeJS.Timeout;
    let stirSpeed = 100; // Initial stirring speed

    const cycleStirrring = () => {
      stirInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % stirringSteps.length; // Loop through steps continuously
        setStirAnimationStep(stirringSteps[stepIndex]);
      }, stirSpeed);
    };

    // Start stirring cycle
    cycleStirrring();

    // When color transition is about to complete, start slowing down stirring
    setTimeout(() => {
      clearInterval(stirInterval);
      stirSpeed = 200; // Slow down stirring
      cycleStirrring();
    }, ANIMATION.COLOR_TRANSITION_DURATION - 500); // Start slowing 500ms before color change completes

    // Stop stirring after color transition completes plus visual delay
    setTimeout(() => {
      clearInterval(stirInterval);
      // Gradually bring to center
      setStirAnimationStep(6); // Small movement
      setTimeout(() => {
        setStirAnimationStep(3);
        setTimeout(() => {
          setStirAnimationStep(0); // Return to center
          setIsStirring(false);
        }, 150);
      }, 150);
    }, ANIMATION.COLOR_TRANSITION_DURATION + 200); // Color change completes, then stirring stops
  }, []);

  // Handle volume input submission
  const handleVolumeSubmit = useCallback((volume: number) => {
    if (!selectedBottle) return;

    const equipmentId = selectedBottle;
    setShowVolumeModal(false);
    setVolumeInput("");
    setSelectedBottle("");

    if (equipmentId === 'cobalt-ii-solution') {
      // Add cobalt solution with specified volume
      if (!testTube.contents.includes('CoCl₂')) {
        setActiveEquipment(equipmentId);
        setDropperAction({
          id: Date.now().toString(),
          reagentId: 'cobalt',
          targetId: 'test-tube',
          amount: volume,
          timestamp: Date.now(),
          isAnimating: true,
        });

        setShowAddingSolutions(true);
        setTimeout(() => {
          setDropperAction(null);
          setShowAddingSolutions(false);
          animateColorTransition(testTube.colorHex, COLORS.PINK, EQUILIBRIUM_STATES.hydrated);
          setTestTube(prev => ({
            ...prev,
            color: 'Pink',
            contents: ['CoCl₂', 'H₂O'],
            volume: Math.min(prev.volume + volume, 15),
            isCobaltAnimation: true
          }));

          // Clear cobalt animation flag after animation duration
          setTimeout(() => {
            setTestTube(prev => ({ ...prev, isCobaltAnimation: false }));
          }, ANIMATION.COLOR_TRANSITION_DURATION + 1000);

          setActiveEquipment("");
          setShowToast(`Cobalt solution added: ${volume} mL - pink [Co(H₂O)₆]²⁺ formed`);
          setTimeout(() => setShowToast(""), 3000);
        }, ANIMATION.DROPPER_DURATION);
      }
    } else if (equipmentId === 'concentrated-hcl') {
      // Add HCl with specified volume; enforce 1st=purple, 2nd=blue regardless of volume
      animateStirring();

      const newClickCount = hclClickCount + 1;
      setHclClickCount(newClickCount);

      setActiveEquipment(equipmentId);
      setDropperAction({
        id: Date.now().toString(),
        reagentId: 'hcl',
        targetId: 'test-tube',
        amount: volume,
        timestamp: Date.now(),
        isAnimating: true
      });

      setShowToast(`Adding ${volume} mL HCl... Equilibrium shifting!`);
      setShowAddingSolutions(true);

      setTimeout(() => {
        setDropperAction(null);
        setShowAddingSolutions(false);

        const isFirst = newClickCount === 1;
        const isSecond = newClickCount === 2;
        const newColor = isFirst ? COLORS.PURPLE : COLORS.BLUE;
        const newState = isFirst ? EQUILIBRIUM_STATES.transition : EQUILIBRIUM_STATES.chloride;

        animateColorTransition(testTube.colorHex, newColor, newState);
        setTestTube(prev => ({
          ...prev,
          contents: [...prev.contents, 'HCl'],
          volume: Math.min(prev.volume + volume, 15)
        }));

        const logEntry: ExperimentLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: `Added HCl (${isFirst ? '1st' : isSecond ? '2nd' : newClickCount + 'th'} time, ${volume} mL)`,
          reagent: 'Concentrated HCl',
          amount: volume,
          colorBefore: testTube.colorHex,
          colorAfter: newColor,
          observation: `Solution ${isFirst ? 'changing to purple' : 'changed to blue'} - equilibrium shifting right`,
          equilibriumShift: 'right'
        };
        setExperimentLog(prev => [...prev, logEntry]);

        setActiveEquipment("");
        setShowToast(`${volume} mL HCl added successfully!`);
        setTimeout(() => setShowToast(""), 3000);

        // After the second HCl addition in guided mode at step 5, auto-complete the step
        if (isSecond && mode.current === 'guided' && currentStep === 5) {
          setTimeout(() => {
            handleStepComplete();
          }, 600);
        }

        // Cap further additions at blue state notification
        if (newClickCount > 2) {
          setHclClickCount(2);
          setShowToast('Equilibrium already at maximum blue! Add water to reverse.');
          setTimeout(() => setShowToast(""), 3000);
        }
      }, ANIMATION.DROPPER_DURATION);
    } else if (equipmentId === 'distilled-water') {
      // Add water with specified volume; mirror progressive behavior
      animateStirring();

      const newClickCount = waterClickCount + 1;
      setWaterClickCount(newClickCount);

      setActiveEquipment(equipmentId);
      setDropperAction({
        id: Date.now().toString(),
        reagentId: 'water',
        targetId: 'test-tube',
        amount: volume,
        timestamp: Date.now(),
        isAnimating: true
      });

      setShowToast(`Adding ${volume} mL water... Equilibrium shifting back!`);
      setShowAddingSolutions(true);

      setTimeout(() => {
        setDropperAction(null);
        setShowAddingSolutions(false);

        const isFirst = newClickCount === 1;
        const newColor = isFirst ? COLORS.PURPLE : COLORS.PINK;
        const newState = isFirst ? EQUILIBRIUM_STATES.transition : EQUILIBRIUM_STATES.hydrated;

        animateColorTransition(testTube.colorHex, newColor, newState);
        setTestTube(prev => ({
          ...prev,
          volume: Math.min(prev.volume + volume, 15),
        }));

        const logEntry: ExperimentLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          action: `Added Water (${isFirst ? '1st' : '2nd'} time, ${volume} mL)`,
          reagent: 'Distilled Water',
          amount: volume,
          colorBefore: testTube.colorHex,
          colorAfter: newColor,
          observation: `Solution ${isFirst ? 'changing to purple' : 'changed to pink'} - equilibrium shifting left`,
          equilibriumShift: 'left'
        };
        setExperimentLog(prev => [...prev, logEntry]);

        setActiveEquipment("");
        setShowToast(`${volume} mL water added successfully!`);
        setTimeout(() => setShowToast(""), 3000);

        // If second water addition completes reversal to pink at guided step 7, complete step and schedule results
        if (!isFirst && mode.current === 'guided' && currentStep === 7) {
          setTimeout(() => {
            handleStepComplete();
          }, 600);
        }

        if (newClickCount > 2) {
          setWaterClickCount(2);
          setShowToast('Equilibrium already at maximum pink! Add HCl to shift forward.');
          setTimeout(() => setShowToast(""), 3000);
        }
      }, ANIMATION.DROPPER_DURATION);
    }
  }, [selectedBottle, testTube, animateColorTransition, animateStirring, hclClickCount, waterClickCount, mode.current, currentStep]);

  // Predefined positions for equipment layout
  const getEquipmentPosition = (equipmentId: string) => {
    const positions = {
      'test-tube': { x: 200, y: 250 },           // Left side, center
      'cobalt-ii-solution': { x: 500, y: 180 },  // Right side, top bottle (moved slightly lower)
      'concentrated-hcl': { x: 500, y: 350 },    // Right side, middle bottle (moved slightly lower)
      'distilled-water': { x: 500, y: 520 }      // Right side, bottom bottle (moved slightly lower)
    };
    return positions[equipmentId as keyof typeof positions] || { x: 300, y: 250 };
  };

  // Handle equipment drop on workbench
  const handleEquipmentDrop = useCallback((equipmentId: string, x: number, y: number) => {
    // In guided mode, enforce step equipment requirements
    if (mode.current === 'guided') {
      const currentStepData = GUIDED_STEPS[currentStep - 1];
      if (!currentStepData.equipment.includes(equipmentId)) {
        setShowToast(`${equipmentId.replace('-', ' ')} is not needed for step ${currentStep}. Follow the current step instructions.`);
        setTimeout(() => setShowToast(""), 3000);
        return;
      }
    }

    // Special handling for cobalt solution: allow direct addition to test tube OR placement on workbench
    if (equipmentId === 'cobalt-ii-solution') {
      const tubePos = getEquipmentPosition('test-tube');
      const withinTube = Math.abs(x - tubePos.x) < 100 && Math.abs(y - tubePos.y) < 180;

      // If dropped directly onto test tube, add the solution
      if (withinTube && !testTube.contents.includes('CoCl₂')) {
        setShowAddingSolutions(true);
        setTimeout(() => {
          setShowAddingSolutions(false);
          animateColorTransition(testTube.colorHex, COLORS.PINK, EQUILIBRIUM_STATES.hydrated);
          setTestTube(prev => ({
            ...prev,
            color: 'Pink',
            contents: ['CoCl₂', 'H₂O'],
            volume: 9,
            isCobaltAnimation: true
          }));

          // Clear cobalt animation flag after animation duration
          setTimeout(() => {
            setTestTube(prev => ({ ...prev, isCobaltAnimation: false }));
          }, ANIMATION.COLOR_TRANSITION_DURATION + 1000);

          setShowToast('Pink [Co(H₂O)₆]²⁺ complex formed (60% full)');
          setTimeout(() => setShowToast(''), 3000);
          // Auto-complete guided step when cobalt successfully added
          if (mode.current === 'guided') {
            const currentStepData = GUIDED_STEPS[currentStep - 1];
            if (currentStepData.action.includes('Drag') && !completedSteps.includes(currentStep)) {
              setTimeout(() => {
                handleStepComplete();
              }, 1000);
            }
          }
        }, ANIMATION.DROPPER_DURATION);
        return; // Don't place on workbench if added to test tube
      }
      // If not dropped on test tube, proceed to place on workbench like other equipment
    }

    // For all other equipment, proceed with normal placement
    const previousState = equipmentOnBench.find(eq => eq.id === equipmentId);
    const predefinedPosition = getEquipmentPosition(equipmentId);

    setEquipmentOnBench(prev => {
      const filtered = prev.filter(eq => eq.id !== equipmentId);
      return [...filtered, { id: equipmentId, position: predefinedPosition, isActive: false }];
    });

    setLastAction({ type: 'equipment_placed', equipmentId, data: { previousState, newPosition: predefinedPosition } });

    setShowToast(`${equipmentId.replace('-', ' ')} placed on workbench`);
    setTimeout(() => setShowToast(''), 2000);

    if (mode.current === 'guided') {
      const currentStepData = GUIDED_STEPS[currentStep - 1];
      if (currentStepData.action.includes('Drag') && !completedSteps.includes(currentStep)) {
        setTimeout(() => { handleStepComplete(); }, 1000);
      }
    }
  }, [currentStep, completedSteps, mode.current, testTube.contents, testTube.colorHex, animateColorTransition, equipmentOnBench]);

  // Handle equipment interaction - progressive color changes for HCl and water
  const handleEquipmentInteract = useCallback((equipmentId: string) => {
    if (equipmentId === 'cobalt-ii-solution') {
      // Show volume input modal for cobalt solution
      setSelectedBottle(equipmentId);
      setVolumeInput("");
      setShowVolumeModal(true);
      return;
    }

    if (equipmentId === 'concentrated-hcl') {
      // Open volume modal for HCl; behavior handled in handleVolumeSubmit using click counts
      if (waterClickCount > 0) setWaterClickCount(0);
      setSelectedBottle(equipmentId);
      setVolumeInput("");
      setShowVolumeModal(true);
      return;
    }

    if (equipmentId === 'distilled-water') {
      // Open volume modal for water; behavior handled in handleVolumeSubmit using click counts
      if (hclClickCount > 0) setHclClickCount(0);
      setSelectedBottle(equipmentId);
      setVolumeInput("");
      setShowVolumeModal(true);
      return;
    }

    // For any other equipment interactions
    setShowToast("Click on bottles to add solutions and observe color changes");
    setTimeout(() => setShowToast(""), 2000);
  }, [currentStep, testTube.colorHex, animateColorTransition, animateStirring, hclClickCount, waterClickCount]);

  // Handle undo action
  const handleUndo = useCallback(() => {
    if (!lastAction) return;

    if (lastAction.type === 'equipment_placed') {
      const { equipmentId, data } = lastAction;

      if (data.previousState) {
        // Restore to previous position
        setEquipmentOnBench(prev =>
          prev.map(eq => eq.id === equipmentId ? data.previousState : eq)
        );
      } else {
        // Remove equipment if it wasn't previously on the bench
        setEquipmentOnBench(prev => prev.filter(eq => eq.id !== equipmentId));
      }

      setShowToast(`Undid: ${equipmentId?.replace('-', ' ')} placement`);
      setTimeout(() => setShowToast(""), 2000);

      // Clear the last action
      setLastAction(null);
    }
  }, [lastAction]);

  // Handle step undo - go back to previous step
  const handleStepUndo = useCallback(() => {
    if (stepHistory.length > 0 && currentStep > 1) {
      const lastState = stepHistory[stepHistory.length - 1];

      // Restore previous state
      setTestTube(lastState.state.testTube);
      setEquilibriumState(lastState.state.equilibriumState);
      setExperimentLog(lastState.state.experimentLog);
      setEquipmentOnBench(lastState.state.equipmentOnBench);
      setHclClickCount(lastState.state.hclClickCount);
      setWaterClickCount(lastState.state.waterClickCount);

      // Notify parent so global progress and guided state update
      if (onStepUndo) {
        onStepUndo(lastState.step);
      }

      // Go back to previous step locally
      setCurrentStep(currentStep - 1);

      // Remove the last state from history
      setStepHistory(prev => prev.slice(0, -1));

      setShowToast(`Undid step ${currentStep}. Returned to step ${currentStep - 1}`);
      setTimeout(() => setShowToast(""), 3000);
    }
  }, [stepHistory, currentStep, onStepUndo]);

  // Handle step completion
  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      // Save current state to history before completing step
      const currentState = {
        testTube: { ...testTube },
        equilibriumState: { ...equilibriumState },
        experimentLog: [...experimentLog],
        equipmentOnBench: [...equipmentOnBench],
        hclClickCount,
        waterClickCount
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
      } else {
        setExperimentCompleted(true);
        setShowToast("Experiment completed! Results will open in 10 seconds...");

        // Show countdown notifications
        setTimeout(() => {
          setShowToast("Results opening in 5 seconds...");
          setTimeout(() => setShowToast(""), 3000);
        }, 5000);

        // Automatically open results modal after 10 seconds
        setTimeout(() => {
          setShowToast("Opening Results & Analysis...");
          setShowResultsModal(true);
          setTimeout(() => setShowToast(""), 2000);
        }, 10000);
      }
    }
  };

  // Reset experiment
  const handleResetExperiment = () => {
    setTestTube(INITIAL_TESTTUBE);
    setEquilibriumState(EQUILIBRIUM_STATES.hydrated);
    setColorTransition(null);
    setDropperAction(null);
    setExperimentLog([]);
    setCurrentStep(1);
    setEquipmentOnBench([]);
    setActiveEquipment("");
    setHclClickCount(0);
    setWaterClickCount(0);
    setShowResultsModal(false);
    setExperimentCompleted(false);
    setLastAction(null);
    setStepHistory([]);
    setShowAddingSolutions(false);
    setShowToast("");
    setObservePulse(true);
    onReset();
  };

  const currentStepData = GUIDED_STEPS[currentStep - 1];

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        {/* Step Progress Bar (guided mode only) */}
        {mode.current === 'guided' && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Experiment Progress</h3>
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
                {currentStepData.description}
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <ArrowRight className="w-3 h-3 mr-1" />
                {currentStepData.action}
              </div>
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Equipment Section - Left */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                Equipment
              </h3>
              
              <div className="space-y-3">
                {LAB_EQUIPMENT.map((equipment) => (
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

            {/* Equilibrium Equation - Made wider */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Chemical Equilibrium</h4>
              <div className="text-center text-xs font-mono leading-relaxed bg-gray-50 rounded-lg p-3 border">
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span style={{ color: COLORS.PINK }} className="font-bold">[Co(H₂O)₆]²⁺</span>
                  <span className="mx-1">+</span>
                  <span className="font-bold">4Cl⁻</span>
                  <span className="mx-2 text-lg">⇌</span>
                  <span style={{ color: COLORS.BLUE }} className="font-bold">[CoCl₄]²⁻</span>
                  <span className="mx-1">+</span>
                  <span className="font-bold">6H₂O</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">
                Pink hydrated ⇌ Blue chloride
              </div>
            </div>

            {/* Step Undo Button - Only show when there's step history (guided mode only) */}
            {mode.current === 'guided' && stepHistory.length > 0 && currentStep > 1 && (
              <Button
                onClick={handleStepUndo}
                variant="outline"
                className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Undo Step {currentStep}</span>
              </Button>
            )}

            {/* Results Button - Only show when experiment is completed */}
            {experimentCompleted && (
              <Button
                onClick={() => setShowResultsModal(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                📊 View Results & Analysis
              </Button>
            )}

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
                const isTestTube = equipment.id === 'test-tube';
                const stirTransform = isTestTube && isStirring ? `translateX(${stirAnimationStep}px)` : 'none';

                return equipmentData ? (
                  <div
                    key={equipment.id}
                    style={{
                      transform: stirTransform,
                      transition: isStirring ? 'transform 0.1s ease-in-out' : 'none',
                    }}
                  >
                    <Equipment
                      id={equipment.id}
                      name={equipmentData.name}
                      icon={equipmentData.icon}
                      position={equipment.position}
                      onRemove={(id) => {
                        setEquipmentOnBench(prev => prev.filter(eq => eq.id !== id));
                        setShowToast(`${id.replace('-', ' ')} removed from workbench`);
                        setTimeout(() => setShowToast(""), 2000);
                      }}
                      onInteract={handleEquipmentInteract}
                      isActive={activeEquipment === equipment.id}
                      color={equipment.id === 'test-tube' ? testTube.colorHex : undefined}
                      volume={equipment.id === 'test-tube' ? Math.min(100, (testTube.volume / 15) * 100) : undefined}
                      displayVolume={equipment.id === 'test-tube' ? (finalVolumeUsed ?? testTube.volume) : undefined}
                      isCobaltAnimation={equipment.id === 'test-tube' ? testTube.isCobaltAnimation || false : false}
                    />
                  </div>
                ) : null;
              })}

              {/* Observe button - visible during step 3 when test tube + cobalt present (both modes) */}
              {currentStep === 3 && equipmentOnBench.some(eq => eq.id === 'test-tube') && testTube.contents.includes('CoCl₂') && (
                <div
                  style={{
                    position: 'absolute',
                    left: 200,
                    top: 420,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="z-10"
                >
                  <button
                    onClick={() => {
                      setObservePulse(false);
                      setShowToast("Pink [Co(H₂O)₆]²⁺ complex observed! Moving to next step...");
                      setTimeout(() => {
                        handleStepComplete();
                        setShowToast("");
                      }, 1500);
                    }}
                    className={`inline-flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer shadow-lg ${observePulse ? 'animate-pulse' : ''}`}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Observe pink solution
                  </button>
                </div>
              )}
            </WorkBench>
          </div>

          {/* Analysis Panel - Right */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-green-600" />
                Live Analysis
              </h3>

              {/* Current State */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Current State</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: equilibriumState.colorHex }}
                  ></div>
                  <span className="text-sm capitalize">{equilibriumState.dominantComplex}</span>
                </div>
                <p className="text-xs text-gray-600">{equilibriumState.explanation}</p>
              </div>

              {/* Steps Completed (guided mode only) */}
              {mode.current === 'guided' && (
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
              {experimentLog.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Recent Actions</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {experimentLog.slice(-3).reverse().map((log) => (
                      <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-gray-600">{log.observation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dropper Animation */}
        {dropperAction && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="animate-bounce bg-white rounded-lg p-4 shadow-xl border-2 border-blue-300">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-sm text-center mt-2">Adding solution...</p>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{showToast}</span>
            </div>
          </div>
        )}

        {/* Results Analysis Modal */}
        <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                Experiment Results & Analysis
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Complete analysis of your Equilibrium Shift experiment with [Co(H₂O)₆]²⁺ vs Cl⁻ Ions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Experiment Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FlaskConical className="w-5 h-5 mr-2 text-blue-600" />
                  Experiment Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{completedSteps.length}</div>
                    <div className="text-sm text-gray-600">Steps Completed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{experimentLog.length}</div>
                    <div className="text-sm text-gray-600">Actions Performed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{(finalVolumeUsed ?? testTube.volume).toFixed(1)} mL</div>
                    <div className="text-sm text-gray-600">Final Volume</div>
                  </div>
                </div>
              </div>

              {/* Chemical Equilibrium Analysis */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chemical Equilibrium Analysis</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Equilibrium Equation</h4>
                    <div className="text-center text-lg font-mono bg-white rounded p-3 border">
                      <span style={{ color: COLORS.PINK }} className="font-bold">[Co(H₂O)₆]²⁺</span>
                      <span className="mx-3">+</span>
                      <span className="font-bold">4Cl⁻</span>
                      <span className="mx-4 text-xl">⇌</span>
                      <span style={{ color: COLORS.BLUE }} className="font-bold">[CoCl₄]²⁻</span>
                      <span className="mx-3">+</span>
                      <span className="font-bold">6H₂O</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <h4 className="font-semibold text-pink-800 mb-2">Hydrated Complex [Co(H₂O)₆]²⁺</h4>
                      <ul className="text-sm text-pink-700 space-y-1">
                        <li>• Pink color</li>
                        <li>• Octahedral geometry</li>
                        <li>• Favored by excess H₂O</li>
                        <li>• Low Cl⁻ concentration</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Chloride Complex [CoCl₄]²⁻</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Blue color</li>
                        <li>• Tetrahedral geometry</li>
                        <li>• Favored by excess Cl⁻</li>
                        <li>• High Cl⁻ concentration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Timeline */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Action Timeline
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {experimentLog.map((log, index) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{log.action}</div>
                        <div className="text-sm text-gray-600">{log.observation}</div>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: log.colorBefore }}></span>
                            Before: {log.colorBefore}
                          </span>
                          <span>→</span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: log.colorAfter }}></span>
                            After: {log.colorAfter}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Le Chatelier's Principle Demonstration */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Le Chatelier's Principle Demonstrated</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Adding HCl (Stress: ↑ Cl⁻ concentration)</h4>
                    <p className="text-sm text-gray-700">
                      The system responds by shifting right to consume excess Cl⁻ ions, forming more [CoCl₄]²⁻ complex (blue color).
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-pink-800 mb-2">Adding Water (Stress: ↓ Cl⁻ concentration)</h4>
                    <p className="text-sm text-gray-700">
                      The system responds by shifting left to counteract the dilution, forming more [Co(H₂O)₆]²⁺ complex (pink color).
                    </p>
                  </div>
                </div>
              </div>

              {/* Final State */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Experimental State</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Current Solution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: equilibriumState.colorHex }}
                        ></div>
                        <span className="text-sm font-medium capitalize">{equilibriumState.dominantComplex} Complex</span>
                      </div>
                      <p className="text-sm text-gray-600">{equilibriumState.explanation}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Contents Analysis</h4>
                    <div className="space-y-1">
                      <div className="text-sm">Volume: <span className="font-medium">{(finalVolumeUsed ?? testTube.volume).toFixed(1)} mL</span></div>
                      <div className="text-sm">Components: <span className="font-medium">{testTube.contents.join(', ')}</span></div>
                      <div className="text-sm">Color: <span className="font-medium">{testTube.color}</span></div>
                    </div>
                  </div>
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
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowQuizModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white">QUIZ</Button>
                <Button
                  onClick={() => setShowResultsModal(false)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Close Analysis
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quiz Modal */}
        <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-black">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-2xl">Equilibrium Shift — Quiz</CardTitle>
                  {quizSubmitted && (
                    <div className="text-blue-600 font-semibold">Marks obtained ({quizScore} / 5)</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 quiz-content">

                  <section className="quiz-item">
                    <h3 className="font-semibold">Q1. The equilibrium between [Co(H₂O)₆]²⁺ and [CoCl₄]²⁻ is sensitive to chloride ion concentration. This is because:</h3>
                    <div className="mt-2 space-y-2">
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q1" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'A'} onChange={() => handleSelect('q1','A')} />
                        <span>A) Chloride ions act as a catalyst in the reaction</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q1" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'B'} onChange={() => handleSelect('q1','B')} />
                        <span>B) Chloride ions form a complex with Co²⁺, shifting the equilibrium</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q1" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'C'} onChange={() => handleSelect('q1','C')} />
                        <span>C) Chloride ions increase the solubility of CoCl₂</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q1" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'D'} onChange={() => handleSelect('q1','D')} />
                        <span>D) Chloride ions change the oxidation state of cobalt</span>
                      </label>
                    </div>
                    {quizSubmitted && (() => {
                      const correct = 'B';
                      const selected = quizSelections.q1;
                      const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                      return (
                        <>
                          <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Chloride ions act as a catalyst in the reaction' : selected === 'B' ? 'B) Chloride ions form a complex with Co²⁺, shifting the equilibrium' : selected === 'C' ? 'C) Chloride ions increase the solubility of CoCl₂' : selected === 'D' ? 'D) Chloride ions change the oxidation state of cobalt' : ''}</div>
                          <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Chloride ions form a complex with Co²⁺, shifting the equilibrium</div>
                        </>
                      );
                    })()}
                  </section>

                  <section className="quiz-item">
                    <h3 className="font-semibold">Q2. Why does heating the solution favor formation of the blue [CoCl₄]²⁻ complex?</h3>
                    <div className="mt-2 space-y-2">
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q2" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'A'} onChange={() => handleSelect('q2','A')} />
                        <span>A) The forward reaction is exothermic, so heat drives it forward</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q2" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'B'} onChange={() => handleSelect('q2','B')} />
                        <span>B) The forward reaction is endothermic, so heat drives it forward</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q2" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'C'} onChange={() => handleSelect('q2','C')} />
                        <span>C) Heat increases the solubility of Cl⁻ ions</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q2" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'D'} onChange={() => handleSelect('q2','D')} />
                        <span>D) Heat reduces water concentration</span>
                      </label>
                    </div>
                    {quizSubmitted && (() => {
                      const correct = 'B';
                      const selected = quizSelections.q2;
                      const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                      return (
                        <>
                          <div className={yourClass}>Your answer: {selected === 'A' ? 'A) The forward reaction is exothermic, so heat drives it forward' : selected === 'B' ? 'B) The forward reaction is endothermic, so heat drives it forward' : selected === 'C' ? 'C) Heat increases the solubility of Cl⁻ ions' : selected === 'D' ? 'D) Heat reduces water concentration' : ''}</div>
                          <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The forward reaction is endothermic, so heat drives it forward</div>
                        </>
                      );
                    })()}
                  </section>

                  <section className="quiz-item">
                    <h3 className="font-semibold">Q3. When water is added to a blue [CoCl₄]²⁻ solution, the solution turns pink. This observation illustrates:</h3>
                    <div className="mt-2 space-y-2">
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q3" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'A'} onChange={() => handleSelect('q3','A')} />
                        <span>A) The principle of constant composition</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q3" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'B'} onChange={() => handleSelect('q3','B')} />
                        <span>B) Le Chatelier’s principle — dilution shifts equilibrium toward [Co(H₂O)₆]²⁺</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q3" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'C'} onChange={() => handleSelect('q3','C')} />
                        <span>C) The formation of a precipitate</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q3" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'D'} onChange={() => handleSelect('q3','D')} />
                        <span>D) A redox reaction</span>
                      </label>
                    </div>
                    {quizSubmitted && (() => {
                      const correct = 'B';
                      const selected = quizSelections.q3;
                      const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                      return (
                        <>
                          <div className={yourClass}>Your answer: {selected === 'A' ? 'A) The principle of constant composition' : selected === 'B' ? 'B) Le Chatelier’s principle — dilution shifts equilibrium toward [Co(H₂O)₆]²⁺' : selected === 'C' ? 'C) The formation of a precipitate' : selected === 'D' ? 'D) A redox reaction' : ''}</div>
                          <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Le Chatelier’s principle — dilution shifts equilibrium toward [Co(H₂O)₆]²⁺</div>
                        </>
                      );
                    })()}
                  </section>

                  <section className="quiz-item">
                    <h3 className="font-semibold">Q4. In the equilibrium ([Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O), increasing pressure would:</h3>
                    <div className="mt-2 space-y-2">
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q4" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'A'} onChange={() => handleSelect('q4','A')} />
                        <span>A) Shift equilibrium toward blue [CoCl₄]²⁻</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q4" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'B'} onChange={() => handleSelect('q4','B')} />
                        <span>B) Shift equilibrium toward pink [Co(H₂O)₆]²⁺</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q4" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'C'} onChange={() => handleSelect('q4','C')} />
                        <span>C) Have no effect because it’s a liquid phase reaction</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q4" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'D'} onChange={() => handleSelect('q4','D')} />
                        <span>D) Cause decomposition of CoCl₂</span>
                      </label>
                    </div>
                    {quizSubmitted && (() => {
                      const correct = 'C';
                      const selected = quizSelections.q4;
                      const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                      return (
                        <>
                          <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Shift equilibrium toward blue [CoCl₄]²⁻' : selected === 'B' ? 'B) Shift equilibrium toward pink [Co(H₂O)₆]²⁺' : selected === 'C' ? 'C) Have no effect because it’s a liquid phase reaction' : selected === 'D' ? 'D) Cause decomposition of CoCl₂' : ''}</div>
                          <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) Have no effect because it’s a liquid phase reaction</div>
                        </>
                      );
                    })()}
                  </section>

                  <section className="quiz-item">
                    <h3 className="font-semibold">Q5. Which statement best describes the type of chemical equilibrium in this experiment?</h3>
                    <div className="mt-2 space-y-2">
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q5" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'A'} onChange={() => handleSelect('q5','A')} />
                        <span>A) Acid-base equilibrium</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q5" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'B'} onChange={() => handleSelect('q5','B')} />
                        <span>B) Precipitation equilibrium</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q5" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'C'} onChange={() => handleSelect('q5','C')} />
                        <span>C) Complex ion formation equilibrium</span>
                      </label>
                      <label className="quiz-option flex items-start space-x-2">
                        <input type="radio" name="q5" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'D'} onChange={() => handleSelect('q5','D')} />
                        <span>D) Redox equilibrium</span>
                      </label>
                    </div>
                    {quizSubmitted && (() => {
                      const correct = 'C';
                      const selected = quizSelections.q5;
                      const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                      return (
                        <>
                          <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Acid-base equilibrium' : selected === 'B' ? 'B) Precipitation equilibrium' : selected === 'C' ? 'C) Complex ion formation equilibrium' : selected === 'D' ? 'D) Redox equilibrium' : ''}</div>
                          <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) Complex ion formation equilibrium</div>
                        </>
                      );
                    })()}
                  </section>

                </div>
              </CardContent>

              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" className="flex items-center" onClick={() => { setShowQuizModal(false); setShowResultsModal(true); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiment
                  </Button>
                  <Link href="/">
                    <Button className="bg-gray-700 hover:bg-gray-800 text-white flex items-center px-4 py-2">
                      Return to Experiments
                    </Button>
                  </Link>
                </div>

                <div>
                  {!quizSubmitted ? (
                    <>
                      <Button variant="outline" onClick={() => { setQuizSelections({}); setQuizSubmitted(false); setQuizScore(null); }}>Reset</Button>
                      <Button onClick={() => { submitQuiz(); }} disabled={!allAnswered}>Submit</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => { setQuizSelections({}); setQuizSubmitted(false); setQuizScore(null); }}>Reset</Button>
                      <Button onClick={() => { setQuizSelections({}); setQuizSubmitted(false); setQuizScore(null); setShowQuizModal(false); }}>Close</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </DialogContent>
        </Dialog>

        {/* Volume Input Modal */}
        <Dialog open={showVolumeModal} onOpenChange={setShowVolumeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-blue-600" />
                Enter Volume
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter the volume of {selectedBottle.replace('-', ' ')} to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume (mL)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={selectedBottle === 'cobalt-ii-solution' ? '5.0' :
                       selectedBottle === 'concentrated-hcl' ? '2.0' :
                       selectedBottle === 'distilled-water' ? '3.0' : '50'}
                  step="0.1"
                  value={volumeInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVolumeInput(val);
                    const n = parseFloat(val);
                    const max = selectedBottle === 'cobalt-ii-solution' ? 5.0 :
                                 selectedBottle === 'concentrated-hcl' ? 2.0 :
                                 selectedBottle === 'distilled-water' ? 3.0 : 50;
                    if (Number.isNaN(n)) {
                      setVolumeError('Enter a valid number');
                    } else if (n < 0.1 || n > max) {
                      setVolumeError(`Please enter a value between 0.1 and ${max} mL`);
                    } else {
                      setVolumeError(null);
                    }
                  }}
                  placeholder="Enter volume in mL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {volumeError && (
                  <p className="text-xs text-red-600 mt-1">{volumeError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Recommended range: 0.1 - {selectedBottle === 'cobalt-ii-solution' ? '5.0' :
                                              selectedBottle === 'concentrated-hcl' ? '2.0' :
                                              selectedBottle === 'distilled-water' ? '3.0' : '50'} mL
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVolumeModal(false);
                    setVolumeInput("");
                    setSelectedBottle("");
                    setVolumeError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const volume = parseFloat(volumeInput);
                    const maxVolume = selectedBottle === 'cobalt-ii-solution' ? 5.0 :
                                     selectedBottle === 'concentrated-hcl' ? 2.0 :
                                     selectedBottle === 'distilled-water' ? 3.0 : 50;

                    if (Number.isNaN(volume) || volume < 0.1 || volume > maxVolume) {
                      setVolumeError(`Please enter a value between 0.1 and ${maxVolume} mL`);
                      return;
                    }
                    setVolumeError(null);
                    handleVolumeSubmit(volume);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={!volumeInput || isNaN(parseFloat(volumeInput)) || !!volumeError}
                >
                  Add Solution
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
