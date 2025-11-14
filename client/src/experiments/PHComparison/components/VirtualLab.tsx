import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkBench } from "@/experiments/EquilibriumShift/components/WorkBench";
import { Equipment, PH_LAB_EQUIPMENT } from "./Equipment";
import { COLORS, INITIAL_TESTTUBE, GUIDED_STEPS, ANIMATION } from "../constants";
import { Beaker, Info, Wrench, CheckCircle, ArrowRight, ArrowLeft, TestTube, Undo2, TrendingUp, Clock, FlaskConical, Home } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExperimentMode {
  current: 'guided';
  currentGuidedStep: number;
}

interface TestTubeState {
  id: string; volume: number; color: string; colorHex: string; contents: string[]; temperature: number;
}

interface LogEntry {
  id: string;
  action: string;
  observation: string;
  colorBefore: string;
  colorAfter: string;
}

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

export default function VirtualLab({ experimentStarted, onStartExperiment, isRunning, setIsRunning, mode, onStepComplete, onStepUndo, onReset, completedSteps }: VirtualLabProps) {
  const [testTube, setTestTube] = useState<TestTubeState>(INITIAL_TESTTUBE);
  const [currentStep, setCurrentStep] = useState(1);
  const [equipmentOnBench, setEquipmentOnBench] = useState<Array<{ id: string; position: { x: number; y: number }; isActive: boolean }>>([]);
  const [history, setHistory] = useState<Array<{ type: 'HCL' | 'CH3COOH' | 'IND'; volume: number }>>([]);
  const [activeEquipment, setActiveEquipment] = useState<string>("");
  const [showToast, setShowToast] = useState<string>("");
  const [showHclDialog, setShowHclDialog] = useState(false);
  const [hclVolume, setHclVolume] = useState<string>("5.0");
  const [previewHclVolume, setPreviewHclVolume] = useState<number | null>(5.0);
  const [hclError, setHclError] = useState<string | null>(null);
  const [showAceticDialog, setShowAceticDialog] = useState(false);
  const [aceticVolume, setAceticVolume] = useState<string>("5.0");
  const [previewAceticVolume, setPreviewAceticVolume] = useState<number | null>(5.0);
  const [aceticError, setAceticError] = useState<string | null>(null);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [indicatorVolume, setIndicatorVolume] = useState<string>("0.5");
  const [previewIndicatorVolume, setPreviewIndicatorVolume] = useState<number | null>(0.5);
  const [indicatorError, setIndicatorError] = useState<string | null>(null);
  // Track whether the MEASURE/Test pH action has been pressed so we can stop blinking
  const [measurePressed, setMeasurePressed] = useState(false);

  // Comparison mode and snapshots
  const [compareMode, setCompareMode] = useState(false);
  const [hclSample, setHclSample] = useState<TestTubeState | null>(null);
  const [aceticSample, setAceticSample] = useState<TestTubeState | null>(null);

  // Results modal and analysis log
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [analysisLog, setAnalysisLog] = useState<LogEntry[]>([]);
  const [lastMeasuredPH, setLastMeasuredPH] = useState<number | null>(null);
  const [case1PH, setCase1PH] = useState<number | null>(null);
  const [case2PH, setCase2PH] = useState<number | null>(null);
  const [showPouring, setShowPouring] = useState(false);
  const [pourKey, setPourKey] = useState(0);
  // Count how many times the MEASURE action has been invoked
  const [measureCount, setMeasureCount] = useState(0);
  // Timeout handle for scheduled results opening
  const measureResultsTimeoutRef = useRef<number | null>(null);

  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<{ q1?: string; q2?: string; q3?: string; q4?: string; q5?: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Helper: ensure all questions have an answer before enabling Submit
  const allAnswered = !!(quizSelections.q1 && quizSelections.q2 && quizSelections.q3 && quizSelections.q4 && quizSelections.q5);

  // Clean up any scheduled timeouts on unmount
  useEffect(() => {
    return () => {
      if (measureResultsTimeoutRef.current) {
        clearTimeout(measureResultsTimeoutRef.current as number);
        measureResultsTimeoutRef.current = null;
      }
    };
  }, []);

  // If results modal opens, clear scheduled timeout, reset counter, and stop the timer
  useEffect(() => {
    if (showResultsModal) {
      if (measureResultsTimeoutRef.current) {
        clearTimeout(measureResultsTimeoutRef.current as number);
        measureResultsTimeoutRef.current = null;
      }
      setMeasureCount(0);
      // Stop the parent timer when results are shown
      try { setIsRunning(false); } catch (e) {}
    }
  }, [showResultsModal, setIsRunning]);

  useEffect(() => { setCurrentStep((mode.currentGuidedStep || 0) + 1); }, [mode.currentGuidedStep]);

  const getEquipmentPosition = (equipmentId: string) => {
    const baseTestTube = { x: 200, y: 250 };

    // If a test tube is already placed on the bench, anchor reagents relative to it
    const tubeOnBench = equipmentOnBench.find(e => e.id === 'test-tube');

    // Provide a right-column layout for the three common bottles (HCl, Acetic, Indicator)
    // with equal vertical spacing. If a test tube exists, base positions off it; otherwise
    // fall back to fixed coordinates.
    const commonBottleIds = ['hcl-0-01m', 'acetic-0-01m', 'universal-indicator'];
    if (commonBottleIds.includes(equipmentId)) {
      // Move the bottles slightly to the left compared to the previous layout.
      // Reduce the offset from the test tube when anchored, and lower the fallback x-coordinate.
      const baseX = tubeOnBench ? tubeOnBench.position.x + 260 : 580;
      const baseY = tubeOnBench ? tubeOnBench.position.y - 80 : 200;
      const spacing = 160; // equal vertical spacing between bottles
      const index = commonBottleIds.indexOf(equipmentId);
      return { x: baseX, y: baseY + index * spacing };
    }

    const positions: Record<string, { x: number; y: number }> = {
      'test-tube': baseTestTube,
      // default fallbacks for other items
      'nh4oh-0-1m': { x: baseTestTube.x + 120, y: baseTestTube.y + 420 },
      'nh4cl-0-1m': { x: baseTestTube.x + 120, y: baseTestTube.y + 540 },
    };
    return positions[equipmentId] || { x: 300, y: 250 };
  };

  // Capture snapshots automatically when recognizable end-states are reached
  useEffect(() => {
    if (testTube.contents.includes('IND') && testTube.contents.includes('HCL') && testTube.colorHex === COLORS.HCL_PH2) {
      setHclSample(testTube);
    }
    if (testTube.contents.includes('IND') && testTube.contents.includes('CH3COOH') && testTube.colorHex === COLORS.ACETIC_PH3) {
      setAceticSample(testTube);
    }
  }, [testTube]);

  // Advance progress to step 3 when the test tube has any volume added
  useEffect(() => {
    if ((testTube.volume ?? 0) > 0 && currentStep < 3) {
      setCurrentStep(3);
      if (onStepComplete) onStepComplete(3);
    }
  }, [testTube.volume, currentStep, onStepComplete]);

  const animateColorTransition = (toColor: string) => {
    const fromColor = testTube.colorHex;
    const totalSteps = 16;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const p = step / totalSteps;
      const r1 = parseInt(fromColor.slice(1,3),16), g1 = parseInt(fromColor.slice(3,5),16), b1 = parseInt(fromColor.slice(5,7),16);
      const r2 = parseInt(toColor.slice(1,3),16), g2 = parseInt(toColor.slice(3,5),16), b2 = parseInt(toColor.slice(5,7),16);
      const r = Math.round(r1 + (r2 - r1) * p), g = Math.round(g1 + (g2 - g1) * p), b = Math.round(b1 + (b2 - b1) * p);
      const c = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      setTestTube(prev => ({ ...prev, colorHex: c }));
      if (step >= totalSteps) { clearInterval(interval); setTestTube(prev => ({ ...prev, colorHex: toColor })); }
    }, ANIMATION.COLOR_TRANSITION_DURATION / totalSteps);
  };

  const addToTube = (reagent: 'HCL'|'CH3COOH'|'IND', volume = 3) => {
    setActiveEquipment(reagent);
    setHistory(prev => [...prev, { type: reagent, volume }]);
    const colorBefore = testTube.colorHex;
    setTimeout(() => {
      setTestTube(prev => {
        const newVol = Math.min(prev.volume + volume, 20);
        const contents = Array.from(new Set([...prev.contents, reagent]));
        let nextColor = prev.colorHex;
        if (contents.includes('IND')) {
          if (contents.includes('HCL')) nextColor = COLORS.HCL_PH2;
          else if (contents.includes('CH3COOH')) nextColor = COLORS.ACETIC_PH3;
          else nextColor = COLORS.NEUTRAL;
          animateColorTransition(nextColor);
        }
        // Log this action for analysis timeline
        const label = reagent === 'HCL' ? 'Added HCl' : reagent === 'CH3COOH' ? 'Added CH3COOH' : 'Added Universal Indicator';
        const observation = contents.includes('IND')
          ? (contents.includes('HCL') ? 'Indicator turned red/orange → strong acid (~pH 2)' : contents.includes('CH3COOH') ? 'Indicator turned yellow/orange → weak acid (~pH 3–4)' : 'Indicator added to neutral solution')
          : 'Solution color unchanged (no indicator)';
        setAnalysisLog(prevLog => [...prevLog, { id: `${Date.now()}-${Math.random()}`, action: `${label} (${volume.toFixed(1)} mL)`, observation, colorBefore, colorAfter: nextColor }]);
        return { ...prev, volume: newVol, contents };
      });
      setActiveEquipment("");
      if (reagent === 'IND') setShowToast('Indicator added');
      else setShowToast(`${reagent === 'HCL' ? 'HCl' : 'CH3COOH'} added`);
      setTimeout(() => setShowToast(""), 1500);
    }, ANIMATION.DROPPER_DURATION);
  };

  const handleEquipmentDrop = (equipmentId: string, x: number, y: number) => {
    if (mode.current === 'guided') {
      const stepData = GUIDED_STEPS[currentStep - 1];
      if (!stepData.equipment.includes(equipmentId)) {
        setShowToast(`${equipmentId.replace(/-/g,' ')} is not needed in step ${currentStep}.`);
        setTimeout(() => setShowToast(""), 2000);
        return;
      }
    }

    if (equipmentId === 'test-tube') {
      if (equipmentOnBench.find(e => e.id === 'test-tube')) return;
      setEquipmentOnBench(prev => [...prev, { id: 'test-tube', position: getEquipmentPosition('test-tube'), isActive: true }]);
      onStepComplete(1);
      return;
    }

    const tube = equipmentOnBench.find(e => e.id === 'test-tube');
    if (!tube) {
      setShowToast('Place the test tube first.');
      setTimeout(() => setShowToast(""), 1500);
      return;
    }

    // Do not add acetic acid or open dialog on drop; dialog opens when the placed bottle is pressed
    // Do not add indicator or open dialog on drop; dialog opens when the placed bottle is pressed

    const pos = getEquipmentPosition(equipmentId);
    setEquipmentOnBench(prev => {
      if (!prev.find(e => e.id === equipmentId)) return [...prev, { id: equipmentId, position: pos, isActive: false }];
      return prev;
    });
  };

  const handleUndo = () => {
    // If we're in comparison/results, exit that first
    if (compareMode || showResultsModal) {
      setCompareMode(false);
      setShowResultsModal(false);
      setHclSample(null);
      setAceticSample(null);
      if (onStepUndo) onStepUndo();
      setShowToast('Exited comparison');
      setTimeout(() => setShowToast("") , 1200);
      return;
    }

    // If no history, try to clean up any placed equipment (including pH paper) or the test tube
    if (history.length === 0) {
      const hasTube = !!equipmentOnBench.find(e => e.id === 'test-tube');
      const hasPhItems = equipmentOnBench.some(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'));
      if (hasTube) {
        setEquipmentOnBench(prev => prev.filter(e => e.id !== 'test-tube' && !(e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'))));
        setTestTube(INITIAL_TESTTUBE);
        if (onStepUndo) onStepUndo();
        setShowToast('Removed test tube and associated items');
        setTimeout(() => setShowToast(""), 1200);
        return;
      }

      // If no test tube but there are pH items placed, remove them
      if (hasPhItems) {
        setEquipmentOnBench(prev => prev.filter(e => !(e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'))));
        setShowToast('Removed indicator / pH paper');
        setTimeout(() => setShowToast(""), 1200);
      }
      return;
    }

    const last = history[history.length - 1];
    const remaining = history.slice(0, -1);
    setHistory(remaining);
    setAnalysisLog(prev => prev.slice(0, -1));
    setTestTube(prev => {
      const volume = Math.max(0, prev.volume - last.volume);
      const hasEarlier = remaining.some(h => h.type === last.type);
      let contents = prev.contents;
      if (!hasEarlier) contents = contents.filter(c => c !== last.type);
      let colorHex = prev.colorHex;
      if (!contents.includes('IND')) colorHex = COLORS.CLEAR;
      else if (contents.includes('HCL')) colorHex = COLORS.HCL_PH2;
      else if (contents.includes('CH3COOH')) colorHex = COLORS.ACETIC_PH3;
      else colorHex = COLORS.NEUTRAL;
      return { ...prev, volume, contents, colorHex };
    });

    // Also remove the corresponding bottle from the bench if it has no earlier usage
    const idMap: Record<'HCL' | 'CH3COOH' | 'IND', string> = {
      HCL: 'hcl-0-01m',
      CH3COOH: 'acetic-0-01m',
      IND: 'universal-indicator',
    };
    const hasEarlier = remaining.some(h => h.type === last.type);
    if (!hasEarlier) {
      setEquipmentOnBench(prev => prev.filter(e => e.id !== idMap[last.type]));
    }

    // If no more indicator actions remain, also remove any pH paper / indicator visuals from the bench
    if (!remaining.some(h => h.type === 'IND')) {
      setEquipmentOnBench(prev => prev.filter(e => !(e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'))));
    }

    if (onStepUndo) onStepUndo();
    setShowToast('Last action undone');
    setTimeout(() => setShowToast(""), 1200);
  };

  const confirmAddHcl = () => {
    const v = parseFloat(hclVolume);
    if (Number.isNaN(v) || v < 5.0 || v > 10.0) {
      setHclError('Please enter a value between 5.0 and 10.0 mL');
      return;
    }
    addToTube('HCL', v);
    if (currentStep === 2) {
      onStepComplete(2);
    }
    setShowHclDialog(false);
  };

  const confirmAddAcetic = () => {
    const v = parseFloat(aceticVolume);
    if (Number.isNaN(v) || v < 5.0 || v > 10.0) {
      setAceticError('Please enter a value between 5.0 and 10.0 mL');
      return;
    }
    addToTube('CH3COOH', v);
    if (currentStep === 4) {
      onStepComplete(4);
    }
    setShowAceticDialog(false);
  };

  const confirmAddIndicator = () => {
    const v = parseFloat(indicatorVolume);
    if (Number.isNaN(v) || v < 0.2 || v > 1.0) {
      setIndicatorError('Please enter a value between 0.2 and 1.0 mL');
      return;
    }
    addToTube('IND', v);
    if (currentStep === 3 || currentStep === 5) {
      onStepComplete(currentStep);
    }
    setShowIndicatorDialog(false);
  };

  const handleInteract = (id: string) => {
    if (id === 'hcl-0-01m') setShowHclDialog(true);
    if (id === 'acetic-0-01m') setShowAceticDialog(true);
    if (id === 'universal-indicator') {
      // Always open the indicator volume dialog so the user can enter how much indicator
      // to add. This applies whether or not the test tube/pH paper is already placed.
      setShowIndicatorDialog(true);
      return;
    }
  };

  const handleRemove = (id: string) => {
    setEquipmentOnBench(prev => prev.filter(e => e.id !== id));
    if (id === 'test-tube') setTestTube(INITIAL_TESTTUBE);
  };

  const handleCompare = () => {
    setCompareMode(true);
    setEquipmentOnBench(prev => prev.filter(e => e.id === 'test-tube'));
    onStepComplete(6);
    setShowToast('Results opening in 10 seconds...');
    setTimeout(() => setShowToast(""), 3000);
    setTimeout(() => {
      setShowResultsModal(true);
    }, 10000);
  };

  const stepsProgress = (
    <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Experiment Progress</h3>
        <span className="text-sm text-blue-600 font-medium">Step {currentStep} of {GUIDED_STEPS.length}</span>
      </div>
      <div className="flex space-x-2 mb-4">
        {GUIDED_STEPS.map((step) => (
          <div key={step.id} className={`flex-1 h-2 rounded-full ${completedSteps.includes(step.id) ? 'bg-green-500' : currentStep === step.id ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSteps.includes(currentStep) ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
          {completedSteps.includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">{currentStep}</span>}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-black mb-1">{GUIDED_STEPS[currentStep-1].title}</h4>
          <p className="text-sm text-gray-600 mb-2">{GUIDED_STEPS[currentStep-1].description}</p>
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <ArrowRight className="w-3 h-3 mr-1" />
            {GUIDED_STEPS[currentStep-1].action}
          </div>
        </div>
      </div>
    </div>
  );

  const shouldShowRestore = testTube.contents.includes('IND') && testTube.contents.includes('HCL') && testTube.colorHex === COLORS.HCL_PH2;
  const hasPhPaper = equipmentOnBench.some(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'));
  const phPaperItem = equipmentOnBench.find(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'));

  const testPH = () => {
    // increment measure press count immediately (counts even if measurement is inconclusive)
    setMeasureCount(prev => {
      const next = prev + 1;
      if (next === 3) {
        // schedule opening results modal after 5 seconds *only if CASE 2 saved*
        if (measureResultsTimeoutRef.current) {
          clearTimeout(measureResultsTimeoutRef.current as number);
        }
        setShowToast('Opening Results in 5 seconds...');
        measureResultsTimeoutRef.current = window.setTimeout(() => {
          setShowResultsModal(true);
        measureResultsTimeoutRef.current = null;
        }, 5000);
        // clear the short toast message shortly
        setTimeout(() => setShowToast(''), 3500);
      }
      return next;
    });

    if (!testTube || (testTube.volume ?? 0) <= 0) {
      setShowToast('No solution in test tube');
      setTimeout(() => setShowToast(''), 1400);
      return;
    }

    if (!testTube.contents.includes('IND')) {
      setShowToast('No indicator present. Add universal indicator or pH paper');
      setTimeout(() => setShowToast(''), 1800);
      return;
    }

    if (testTube.contents.includes('HCL') && testTube.colorHex === COLORS.HCL_PH2) {
      const ph = 2.0;
      setLastMeasuredPH(ph);
      setShowToast('Measured pH ≈ 2 (strong acid)');
      // color pH paper
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'universal-indicator' || item.id.toLowerCase().includes('ph')) ? { ...item, color: '#ff6b6b' } : item));
      setTimeout(() => setShowToast(''), 2000);
      return;
    }

    if (testTube.contents.includes('CH3COOH') && testTube.colorHex === COLORS.ACETIC_PH3) {
      const ph = 3.5;
      setLastMeasuredPH(ph);
      setShowToast('Measured pH ≈ 3–4 (weak acid)');
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'universal-indicator' || item.id.toLowerCase().includes('ph')) ? { ...item, color: '#ffb74d' } : item));
      setTimeout(() => setShowToast(''), 2000);
      return;
    }

    if (testTube.colorHex === COLORS.NEUTRAL) {
      const ph = 7.0;
      setLastMeasuredPH(ph);
      setShowToast('Measured pH ≈ 7 (neutral)');
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'universal-indicator' || item.id.toLowerCase().includes('ph')) ? { ...item, color: '#C8E6C9' } : item));
      setTimeout(() => setShowToast(''), 2000);
      return;
    }

    // default: inconclusive -> show neutral tint
    setLastMeasuredPH(null);
    setShowToast('pH measurement inconclusive');
    setEquipmentOnBench(prev => prev.map(item => (item.id === 'universal-indicator' || item.id.toLowerCase().includes('ph')) ? { ...item, color: '#ffffff' } : item));
    setTimeout(() => setShowToast(''), 1600);
  };

  const handleRestore = () => {
    setHistory([]);
    setTestTube(prev => ({ ...prev, volume: 0, contents: [], colorHex: COLORS.CLEAR }));
  };

  const handleSelect = (q: 'q1'|'q2'|'q3'|'q4'|'q5', val: string) => {
    setQuizSelections(prev => ({ ...prev, [q]: val }));
  };

  const submitQuiz = () => {
    const correct: Record<string,string> = { q1: 'B', q2: 'C', q3: 'B', q4: 'A', q5: 'B' };
    let score = 0;
    (['q1','q2','q3','q4','q5'] as Array<'q1'|'q2'|'q3'|'q4'|'q5'>).forEach(k => { if (quizSelections[k] === correct[k]) score++; });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        {stepsProgress}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Equipment - Left */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                Equipment
              </h3>
              <div className="space-y-3">
                {PH_LAB_EQUIPMENT.map((eq) => (
                  <Equipment key={eq.id} id={eq.id} name={eq.name} icon={eq.icon} disabled={!experimentStarted} onInteract={handleInteract} />
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700"><strong>Tip:</strong> Drag equipment to the workbench following the steps.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleUndo} variant="outline" className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center">
                <Undo2 className="w-4 h-4 mr-2" /> UNDO
              </Button>
              <Button onClick={() => { setEquipmentOnBench([]); setTestTube(INITIAL_TESTTUBE); setHistory([]); onReset(); }} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>

              {compareMode && (
                <Button onClick={() => {
                  setShowResultsModal(true);
                }} className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-2 flex items-center justify-center">
                  <span>View Results & Analysis</span>
                </Button>
              )}
            </div>
          </div>

          {/* Workbench - Center */}
          <div className="lg:col-span-6">
            <WorkBench onDrop={handleEquipmentDrop} isRunning={isRunning} currentStep={currentStep} onTestPH={hasPhPaper ? testPH : undefined}>
              {equipmentOnBench.find(e => e.id === 'test-tube') && !compareMode && (
                <>
                  <Equipment id="test-tube" name="25ml Test Tube" icon={<TestTube className="w-8 h-8" />} position={getEquipmentPosition('test-tube')} onRemove={handleRemove} onInteract={() => {}} color={testTube.colorHex} volume={testTube.volume} displayVolume={showHclDialog && previewHclVolume != null ? previewHclVolume : showAceticDialog && previewAceticVolume != null ? previewAceticVolume : showIndicatorDialog && previewIndicatorVolume != null ? Math.min(20, testTube.volume + previewIndicatorVolume) : testTube.volume} isActive={true} />
                  {shouldShowRestore && (
                    <div style={{ position: 'absolute', left: getEquipmentPosition('test-tube').x, top: getEquipmentPosition('test-tube').y + 220, transform: 'translate(-50%, 0)' }}>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm animate-pulse" onClick={handleRestore}>RESET</Button>
                    </div>
                  )}

                  {/* Show COMPARE when solution is yellow (acetic acid + indicator) */}
                  {testTube.contents.includes('IND') && testTube.contents.includes('CH3COOH') && testTube.colorHex === COLORS.ACETIC_PH3 && (
                    <div style={{ position: 'absolute', left: getEquipmentPosition('test-tube').x, top: getEquipmentPosition('test-tube').y + 260, transform: 'translate(-50%, 0)' }}>
                      <Button size="sm" className="shadow-sm animate-pulse" onClick={handleCompare}>COMPARE</Button>
                    </div>
                  )}
                </>
              )}

              {equipmentOnBench.filter(e => e.id !== 'test-tube').map(e => (
                <Equipment
                  key={e.id}
                  id={e.id}
                  name={PH_LAB_EQUIPMENT.find(x => x.id === e.id)?.name || e.id}
                  icon={PH_LAB_EQUIPMENT.find(x => x.id === e.id)?.icon || <Beaker className="w-8 h-8" />}
                  position={e.position}
                  onRemove={handleRemove}
                  onInteract={handleInteract}
                  {...((e as any).color ? { color: (e as any).color } : {})}
                />
              ))}

              {/* Contextual actions near pH paper when present (only for pH paper items, not the universal indicator bottle) */}
              {phPaperItem && !compareMode && phPaperItem.id.toLowerCase().includes('ph') && (
                <>
                  {/* MEASURE button placed beside the pH paper */}
                  <div style={{ position: 'absolute', left: phPaperItem.position.x + 90, top: phPaperItem.position.y, transform: 'translate(-50%, -50%)' }}>
                    <Button size="sm" className={`bg-amber-600 text-white hover:bg-amber-700 shadow-sm ${!measurePressed ? 'blink-until-pressed' : ''}`} onClick={() => { setMeasurePressed(true); testPH(); }}>MEASURE</Button>
                  </div>
                </>
              )}

              {/* Pouring stream animation (from test tube to pH paper) */}
              {showPouring && phPaperItem && equipmentOnBench.find(e => e.id === 'test-tube') && (
                (() => {
                  const tubePos = getEquipmentPosition('test-tube');
                  const targetPos = phPaperItem.position;
                  const left = tubePos.x;
                  const top = tubePos.y + 40; // start a bit below the tube
                  const height = Math.max(20, Math.min(300, targetPos.y - tubePos.y - 20));
                  return (
                    <div key={pourKey} style={{ position: 'absolute', left: left, top: top, transform: 'translate(-50%, 0)', pointerEvents: 'none' }}>
                      <style>{`@keyframes pourStream { 0% { height: 0 } 100% { height: ${height}px } } @keyframes dripFall { 0% { transform: translateY(0); opacity:1 } 90% { opacity:1 } 100% { transform: translateY(${height}px); opacity:0 } } .pour-stream { width: 8px; border-radius: 8px; background: linear-gradient(to bottom, rgba(59,130,246,0.95), rgba(99,102,241,0.95)); animation: pourStream 350ms linear forwards; } .drip { width:8px; height:12px; border-radius:50%; background: linear-gradient(to bottom, rgba(59,130,246,0.95), rgba(99,102,241,0.95)); animation: dripFall 700ms linear forwards; margin-top:6px; }`}</style>
                      <div className="pour-stream" style={{ margin: '0 auto' }} />
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="drip" />
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Comparison overlay */}
              {compareMode && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* pH scale at the top center to use the empty workbench space */}
                  <div className="absolute top-24 left-1/2 -translate-x-1/2">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F7d9627b53247494cb290097a41570c50?format=webp&width=800"
                      alt="Universal pH color chart"
                      className="max-w-[560px] w-[75vw] md:w-[520px] h-auto drop-shadow-md opacity-95"
                    />
                  </div>

                  {/* Two final samples pinned to the bottom */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-16">
                    <div className="grid grid-cols-2 gap-12">
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-72">
                          <img src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F3dd94cfaa2fc4876a1e3759c6d76db7e?format=webp&width=800" alt="Test tube" className="w-full h-full object-contain" />
                          <div className="absolute left-1/2 -translate-x-1/2 transition-all" style={{ bottom: '28px', width: '28px', height: '150px', overflow: 'hidden', borderRadius: '0 0 14px 14px' }}>
                            <div className="absolute left-0 right-0 bottom-0 transition-all duration-500" style={{ height: `${Math.max(0, Math.min(150, ((Math.min(Math.max((hclSample?.volume ?? 10), 0), 20) / 20) * 150)))}px`, backgroundColor: COLORS.HCL_PH2, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.25), 0 0 3px rgba(0,0,0,0.1)', opacity: 0.85 }} />
                          </div>
                        </div>
                        <span className="text-sm font-medium mt-2">0.01 M HCl + Indicator</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-72">
                          <img src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F3dd94cfaa2fc4876a1e3759c6d76db7e?format=webp&width=800" alt="Test tube" className="w-full h-full object-contain" />
                          <div className="absolute left-1/2 -translate-x-1/2 transition-all" style={{ bottom: '28px', width: '28px', height: '150px', overflow: 'hidden', borderRadius: '0 0 14px 14px' }}>
                            <div className="absolute left-0 right-0 bottom-0 transition-all duration-500" style={{ height: `${Math.max(0, Math.min(150, ((Math.min(Math.max((aceticSample?.volume ?? 10), 0), 20) / 20) * 150)))}px`, backgroundColor: COLORS.ACETIC_PH3, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.25), 0 0 3px rgba(0,0,0,0.1)', opacity: 0.85 }} />
                          </div>
                        </div>
                        <span className="text-sm font-medium mt-2">0.01 M CH3COOH + Indicator</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </WorkBench>
          </div>

          {/* Analysis - Right */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-green-600" />
                Live Analysis
              </h3>
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Current Solution</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: testTube.colorHex }}></div>
                  <span className="text-sm">{testTube.colorHex === COLORS.CLEAR ? 'Clear (no indicator)' : 'With indicator'}</span>
                </div>
                <p className="text-xs text-black">Contents: {testTube.contents.join(', ') || 'None'}</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Completed Steps</h4>
                <div className="space-y-1">
                  {GUIDED_STEPS.map((step) => (
                    <div key={step.id} className={`flex items-center space-x-2 text-xs ${completedSteps.includes(step.id) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Measured pH */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Measured pH</h4>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const display = lastMeasuredPH != null ? lastMeasuredPH.toFixed(2) : '--';
                    return (
                      <>
                        <div className="text-2xl font-bold text-purple-700">{display}</div>
                        <div className="text-xs text-gray-500">{lastMeasuredPH != null ? (lastMeasuredPH < 7 ? 'Acidic' : lastMeasuredPH > 7 ? 'Basic' : 'Neutral') : 'No measurement yet'}</div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>

            {showToast && (
              <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm">{showToast}</div>
            )}
          </div>
        </div>
      </div>

      {/* Results & Analysis Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-green-700 bg-clip-text text-transparent flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
              Experiment Results & Analysis
            </DialogTitle>
            <DialogDescription className="text-black">
              Complete analysis of your pH comparison experiment using universal indicator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Per-Solution Experiment Summaries */}
            <div className="bg-gradient-to-r from-green-50 to-amber-50 rounded-lg p-6 border border-emerald-200">
              <h3 className="text-lg font-semibold text-black mb-4">Experiment Summary (Per Solution)</h3>
              {(() => {
                const hclSteps = [1,2,3].filter(id => completedSteps.includes(id)).length;
                const aceticSteps = [1,4,5].filter(id => completedSteps.includes(id)).length;
                const hclActions = analysisLog.filter(l => l.action.includes('HCl') || l.observation.toLowerCase().includes('strong acid'));
                const aceticActions = analysisLog.filter(l => l.action.includes('CH3COOH') || l.observation.toLowerCase().includes('weak acid'));
                const hclVol = (hclSample?.volume ?? 0).toFixed(1);
                const aceticVol = (aceticSample?.volume ?? 0).toFixed(1);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* HCl (Red/Orange) */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
                      <div className="flex items-center mb-3">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.HCL_PH2 }} />
                        <h4 className="font-semibold text-black">0.01 M HCl + Indicator</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-green-700">{hclSteps}</div>
                          <div className="text-xs text-black">Steps Completed</div>
                        </div>
                        <div className="bg-red-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-blue-700">{hclActions.length}</div>
                          <div className="text-xs text-black">Actions Performed</div>
                        </div>
                        <div className="bg-red-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-purple-700">{hclVol} mL</div>
                          <div className="text-xs text-black">Total Volume</div>
                        </div>
                      </div>
                    </div>

                    {/* CH3COOH (Yellow) */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-200">
                      <div className="flex items-center mb-3">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.ACETIC_PH3 }} />
                        <h4 className="font-semibold text-black">0.01 M CH3COOH + Indicator</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-amber-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-green-700">{aceticSteps}</div>
                          <div className="text-xs text-black">Steps Completed</div>
                        </div>
                        <div className="bg-amber-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-blue-700">{aceticActions.length}</div>
                          <div className="text-xs text-black">Actions Performed</div>
                        </div>
                        <div className="bg-amber-50 rounded-md p-3 text-center">
                          <div className="text-xl font-bold text-purple-700">{aceticVol} mL</div>
                          <div className="text-xs text-black">Total Volume</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* pH Comparison Analysis */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">pH Comparison Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-1">0.01 M HCl + Universal Indicator</h4>
                  <p className="text-sm text-red-700 mb-2">Strong acid; expected indicator color: red/orange (≈ pH 2).</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: COLORS.HCL_PH2 }}></span>
                    <span>Observed acidic color implies higher [H⁺] than CH3COOH.</span>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-1">0.01 M CH3COOH + Universal Indicator</h4>
                  <p className="text-sm text-amber-700 mb-2">Weak acid; expected indicator color: yellow/orange (≈ pH 3–4).</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: COLORS.ACETIC_PH3 }}></span>
                    <span>Less acidic than HCl at same molarity.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Timeline */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Action Timeline
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analysisLog.map((log, index) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                    <div className="flex-1">
                      <div className="font-medium text-black">{log.action}</div>
                      <div className="text-sm text-black">{log.observation}</div>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: log.colorBefore }}></span>Before</span>
                        <span>→</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: log.colorAfter }}></span>After</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Experimental State (Both Solutions) */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">Final Experimental State</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HCl + Indicator (Red/Orange) */}
                <div className="rounded-lg border border-red-200 p-4 bg-red-50/40">
                  <div className="flex items-center mb-3">
                    <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: COLORS.HCL_PH2 }} />
                    <h4 className="font-semibold text-black">0.01 M HCl + Indicator (≈ pH 2)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-black mb-2">Current Solution</h5>
                      <p className="text-sm text-black">Contents: {hclSample ? hclSample.contents.join(', ') : 'Not recorded'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-black mb-2">Contents Analysis</h5>
                      <div className="space-y-1 text-sm">
                        <div>Volume: <span className="font-medium">{(hclSample?.volume ?? 0).toFixed(1)} mL</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CH3COOH + Indicator (Yellow) */}
                <div className="rounded-lg border border-amber-200 p-4 bg-amber-50/40">
                  <div className="flex items-center mb-3">
                    <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: COLORS.ACETIC_PH3 }} />
                    <h4 className="font-semibold text-black">0.1 M CH3COOH + Indicator (≈ pH 3–4)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-black mb-2">Current Solution</h5>
                      <p className="text-sm text-black">Contents: {aceticSample ? aceticSample.contents.join(', ') : 'Not recorded'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-black mb-2">Contents Analysis</h5>
                      <div className="space-y-1 text-sm">
                        <div>Volume: <span className="font-medium">{(aceticSample?.volume ?? 0).toFixed(1)} mL</span></div>
                      </div>
                    </div>
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
              <Button onClick={() => setShowResultsModal(false)} className="bg-blue-500 hover:bg-blue-600 text-white">Close Analysis</Button>
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
                <CardTitle className="text-2xl">pH Comparison — Quiz</CardTitle>
                {quizSubmitted && (
                  <div className="text-blue-600 font-semibold">Marks obtained ({quizScore} / 5)</div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 quiz-content">

                <section className="quiz-item">
                  <h3 className="font-semibold">Q1. The pH of 0.01 M CH₃COOH is higher than that of 0.01 M HCl mainly because:</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'A'} onChange={() => handleSelect('q1','A')} />
                      <span>A) Acetic acid molecules are more concentrated</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'B'} onChange={() => handleSelect('q1','B')} />
                      <span>B) Acetic acid dissociates only partially in water</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'C'} onChange={() => handleSelect('q1','C')} />
                      <span>C) HCl has a smaller molar mass than CH₃COOH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'D'} onChange={() => handleSelect('q1','D')} />
                      <span>D) HCl reacts with the indicator while CH₃COOH does not</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q1;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Acetic acid molecules are more concentrated' : selected === 'B' ? 'B) Acetic acid dissociates only partially in water' : selected === 'C' ? 'C) HCl has a smaller molar mass than CH₃COOH' : selected === 'D' ? 'D) HCl reacts with the indicator while CH₃COOH does not' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Acetic acid dissociates only partially in water</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q2. If the concentration of CH₃COOH is increased from 0.01 M to 0.1 M, what will happen to its pH?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'A'} onChange={() => handleSelect('q2','A')} />
                      <span>A) pH will remain unchanged</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'B'} onChange={() => handleSelect('q2','B')} />
                      <span>B) pH will increase</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'C'} onChange={() => handleSelect('q2','C')} />
                      <span>C) pH will decrease</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'D'} onChange={() => handleSelect('q2','D')} />
                      <span>D) pH will become 7</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'C';
                    const selected = quizSelections.q2;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) pH will remain unchanged' : selected === 'B' ? 'B) pH will increase' : selected === 'C' ? 'C) pH will decrease' : selected === 'D' ? 'D) pH will become 7' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) pH will decrease</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q3. Two acids of the same concentration (0.01 M) give different pH values. This shows that:</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'A'} onChange={() => handleSelect('q3','A')} />
                      <span>A) Concentration of acid alone decides pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'B'} onChange={() => handleSelect('q3','B')} />
                      <span>B) Strength of acid (Ka) also affects pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'C'} onChange={() => handleSelect('q3','C')} />
                      <span>C) Universal indicator is not reliable</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'D'} onChange={() => handleSelect('q3','D')} />
                      <span>D) Weak acids have no H⁺ ions</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q3;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Concentration of acid alone decides pH' : selected === 'B' ? 'B) Strength of acid (Ka) also affects pH' : selected === 'C' ? 'C) Universal indicator is not reliable' : selected === 'D' ? 'D) Weak acids have no H⁺ ions' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Strength of acid (Ka) also affects pH</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q4. Which of the following correctly represents the relationship between Ka, acid strength, and pH?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'A'} onChange={() => handleSelect('q4','A')} />
                      <span>A) Higher Ka → stronger acid → lower pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'B'} onChange={() => handleSelect('q4','B')} />
                      <span>B) Higher Ka → weaker acid → higher pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'C'} onChange={() => handleSelect('q4','C')} />
                      <span>C) Lower Ka → stronger acid → lower pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'D'} onChange={() => handleSelect('q4','D')} />
                      <span>D) Ka value does not affect pH</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'A';
                    const selected = quizSelections.q4;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Higher Ka → stronger acid → lower pH' : selected === 'B' ? 'B) Higher Ka → weaker acid → higher pH' : selected === 'C' ? 'C) Lower Ka → stronger acid → lower pH' : selected === 'D' ? 'D) Ka value does not affect pH' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: A) Higher Ka → stronger acid → lower pH</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q5. Why does universal indicator give different colours for HCl and CH₃COOH, even at the same molar concentration?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'A'} onChange={() => handleSelect('q5','A')} />
                      <span>A) It depends only on colour of solution, not acidity</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'B'} onChange={() => handleSelect('q5','B')} />
                      <span>B) Strong and weak acids produce different [H⁺] at same concentration</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'C'} onChange={() => handleSelect('q5','C')} />
                      <span>C) Universal indicator reacts differently with different acids</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'D'} onChange={() => handleSelect('q5','D')} />
                      <span>D) HCl absorbs light while CH₃COOH does not</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q5;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) It depends only on colour of solution, not acidity' : selected === 'B' ? 'B) Strong and weak acids produce different [H⁺] at same concentration' : selected === 'C' ? 'C) Universal indicator reacts differently with different acids' : selected === 'D' ? 'D) HCl absorbs light while CH₃COOH does not' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Strong and weak acids produce different [H⁺] at same concentration</div>
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

      <Dialog open={showHclDialog} onOpenChange={(open) => { setShowHclDialog(open); if (!open) setPreviewHclVolume(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Volume</DialogTitle>
            <DialogDescription>
              Enter the volume of 0.01 M HCl to add to the test tube.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Volume (mL)</label>
            <input
              type="number"
              step="0.1"
              min={5.0}
              max={10.0}
              value={hclVolume}
              onChange={(e) => {
                const val = e.target.value;
                setHclVolume(val);
                const parsed = parseFloat(val);
                if (!Number.isNaN(parsed)) {
                  setPreviewHclVolume(Math.min(10.0, Math.max(5.0, parsed)));
                  if (parsed < 5.0 || parsed > 10.0) setHclError("Please enter a value between 5.0 and 10.0 mL");
                  else setHclError(null);
                } else {
                  setPreviewHclVolume(null);
                  setHclError("Enter a valid number");
                }
              }}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter volume in mL"
            />
            {hclError && <p className="text-xs text-red-600">{hclError}</p>}
            <p className="text-xs text-gray-500">Recommended range: 5.0 – 10.0 mL</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHclDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddHcl} disabled={!!hclError || Number.isNaN(parseFloat(hclVolume)) || parseFloat(hclVolume) < 5.0 || parseFloat(hclVolume) > 10.0}>Add Solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAceticDialog} onOpenChange={(open) => { setShowAceticDialog(open); if (!open) setPreviewAceticVolume(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Volume</DialogTitle>
            <DialogDescription>
              Enter the volume of 0.1 M CH3COOH to add to the test tube.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Volume (mL)</label>
            <input
              type="number"
              step="0.1"
              min={5.0}
              max={10.0}
              value={aceticVolume}
              onChange={(e) => {
                const val = e.target.value;
                setAceticVolume(val);
                const parsed = parseFloat(val);
                if (!Number.isNaN(parsed)) {
                  setPreviewAceticVolume(Math.min(10.0, Math.max(5.0, parsed)));
                  if (parsed < 5.0 || parsed > 10.0) setAceticError("Please enter a value between 5.0 and 10.0 mL");
                  else setAceticError(null);
                } else {
                  setPreviewAceticVolume(null);
                  setAceticError("Enter a valid number");
                }
              }}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter volume in mL"
            />
            {aceticError && <p className="text-xs text-red-600">{aceticError}</p>}
            <p className="text-xs text-gray-500">Recommended range: 5.0 – 10.0 mL</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAceticDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddAcetic} disabled={!!aceticError || Number.isNaN(parseFloat(aceticVolume)) || parseFloat(aceticVolume) < 5.0 || parseFloat(aceticVolume) > 10.0}>Add Solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showIndicatorDialog} onOpenChange={(open) => { setShowIndicatorDialog(open); if (!open) setPreviewIndicatorVolume(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Volume</DialogTitle>
            <DialogDescription>
              Enter the volume of Universal Indicator to add to the test tube.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Volume (mL)</label>
            <input
              type="number"
              step="0.1"
              min={0.2}
              max={1.0}
              value={indicatorVolume}
              onChange={(e) => {
                const val = e.target.value;
                setIndicatorVolume(val);
                const parsed = parseFloat(val);
                if (!Number.isNaN(parsed)) {
                  const bounded = Math.min(1.0, Math.max(0.2, parsed));
                  setPreviewIndicatorVolume(bounded);
                  if (parsed < 0.2 || parsed > 1.0) setIndicatorError("Please enter a value between 0.2 and 1.0 mL");
                  else setIndicatorError(null);
                } else {
                  setPreviewIndicatorVolume(null);
                  setIndicatorError("Enter a valid number");
                }
              }}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter volume in mL"
            />
            {indicatorError && <p className="text-xs text-red-600">{indicatorError}</p>}
            <p className="text-xs text-gray-500">Recommended range: 0.2 – 1.0 mL</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIndicatorDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddIndicator} disabled={!!indicatorError || Number.isNaN(parseFloat(indicatorVolume)) || parseFloat(indicatorVolume) < 0.2 || parseFloat(indicatorVolume) > 1.0}>Add Solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
