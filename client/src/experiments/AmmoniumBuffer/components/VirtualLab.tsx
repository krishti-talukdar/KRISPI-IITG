import React, { useCallback, useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { WorkBench } from "@/experiments/EquilibriumShift/components/WorkBench";
import { Equipment } from "./Equipment";
import { AB_LAB_EQUIPMENT } from "./Equipment";
import { COLORS, INITIAL_TESTTUBE, GUIDED_STEPS, ANIMATION } from "../constants";
import { Beaker, Info, Wrench, CheckCircle, ArrowRight, ArrowLeft, TestTube, Undo2, TrendingUp, Clock, Home } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExperimentMode {
  current: 'guided';
  currentGuidedStep: number;
}

interface TestTubeState {
  id: string; volume: number; color: string; colorHex: string; contents: string[]; temperature: number;
}

interface LogEntry { id: string; action: string; observation: string; colorBefore: string; colorAfter: string; }

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
  const [history, setHistory] = useState<Array<{ type: 'NH4OH' | 'NH4Cl' | 'IND'; volume: number }>>([]);
  const [activeEquipment, setActiveEquipment] = useState<string>("");
  const [showToast, setShowToast] = useState<string>("");
  const [showNh4ohDialog, setShowNh4ohDialog] = useState(false);
  const [nh4ohVolume, setNh4ohVolume] = useState<string>("10.0");
  const [previewNh4ohVolume, setPreviewNh4ohVolume] = useState<number | null>(10.0);
  const [nh4ohError, setNh4ohError] = useState<string | null>(null);
  const [showNh4clDialog, setShowNh4clDialog] = useState(false);
  const [nh4clVolume, setNh4clVolume] = useState<string>("5.0");
  const [previewNh4clVolume, setPreviewNh4clVolume] = useState<number | null>(5.0);
  const [nh4clError, setNh4clError] = useState<string | null>(null);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [indicatorVolume, setIndicatorVolume] = useState<string>("0.5");
  const [previewIndicatorVolume, setPreviewIndicatorVolume] = useState<number | null>(0.5);
  const [indicatorError, setIndicatorError] = useState<string | null>(null);
  const [measurePressed, setMeasurePressed] = useState(false);
  const [newPaperPressed, setNewPaperPressed] = useState(false);
  // Track ammonium chloride additions so we can reset them
  const [nh4clVolumeAdded, setNh4clVolumeAdded] = useState<number>(0);
  const [nh4clAdditions, setNh4clAdditions] = useState<number>(0);
  const [shouldBlinkNh4clReset, setShouldBlinkNh4clReset] = useState<boolean>(false);

  const [baseSample, setBaseSample] = useState<TestTubeState | null>(null);
  const [bufferedSample, setBufferedSample] = useState<TestTubeState | null>(null);
  const [ammoniumAfterSample, setAmmoniumAfterSample] = useState<TestTubeState | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [analysisLog, setAnalysisLog] = useState<LogEntry[]>([]);
  const [lastMeasuredPH, setLastMeasuredPH] = useState<number | null>(null);
  // timer ref used to delay opening the results modal when COMPARE is pressed
  const compareTimeoutRef = useRef<number | null>(null);
  // whether a compare action has been initiated (used to show the floating View Results button)
  const [compareInitiated, setCompareInitiated] = useState<boolean>(false);

  // clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (compareTimeoutRef.current) {
        clearTimeout(compareTimeoutRef.current as unknown as number);
        compareTimeoutRef.current = null;
      }
    };
  }, []);
  const [ammoniumInitialPH, setAmmoniumInitialPH] = useState<number | null>(null);
  const [ammoniumAfterPH, setAmmoniumAfterPH] = useState<number | null>(null);
  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<{ q1?: string; q2?: string; q3?: string; q4?: string; q5?: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => { setCurrentStep((mode.currentGuidedStep || 0) + 1); }, [mode.currentGuidedStep]);

  const handleSelect = (q: 'q1'|'q2'|'q3'|'q4'|'q5', val: string) => {
    setQuizSelections(prev => ({ ...prev, [q]: val }));
  };

  const submitQuiz = () => {
    const correct: Record<string,string> = { q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'B' };
    let score = 0;
    (['q1','q2','q3','q4','q5'] as Array<'q1'|'q2'|'q3'|'q4'|'q5'>).forEach(k => { if (quizSelections[k] === correct[k]) score++; });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const allAnswered = !!(quizSelections.q1 && quizSelections.q2 && quizSelections.q3 && quizSelections.q4 && quizSelections.q5);

useEffect(() => {
  if (showResultsModal) {
    // pause the simulation when viewing results
    setIsRunning(false);
    // ensure compare state/animations stop
    setCompareInitiated(false);
    setMeasurePressed(false);
    setNewPaperPressed(false);
  }
}, [showResultsModal, setIsRunning]);

  const getEquipmentPosition = (equipmentId: string) => {
    const baseX = 220;
    const baseY = 160;

    if (equipmentId === 'test-tube') {
      return { x: baseX, y: baseY + 140 };
    }

    // pH paper / meter fixed below the test tube
    if (equipmentId === 'ph-paper' || equipmentId.toLowerCase().includes('ph')) {
      return { x: baseX, y: baseY + 330 };
    }

    // reagent bottles on right column
    if (equipmentId === 'nh4oh-0-1m') return { x: baseX + 260, y: baseY + 40 };
    if (equipmentId === 'nh4cl-0-1m') return { x: baseX + 260, y: baseY + 220 };

    return { x: baseX + 260, y: baseY + 40 };
  };

  useEffect(() => {
    if (testTube.contents.includes('IND') && testTube.contents.includes('NH4OH') && testTube.colorHex === COLORS.NH4OH_BASE) {
      setBaseSample(testTube);
    }
    if (testTube.contents.includes('IND') && testTube.contents.includes('NH4Cl') && testTube.colorHex === COLORS.NH4_BUFFERED) {
      setBufferedSample(testTube);
    }
  }, [testTube]);

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

  const addToTube = (reagent: 'NH4OH'|'NH4Cl'|'IND', volume = 3) => {
    setActiveEquipment(reagent);
    setHistory(prev => [...prev, { type: reagent, volume }]);
    const colorBefore = testTube.colorHex;
    setTimeout(() => {
      setTestTube(prev => {
        const newVol = Math.min(prev.volume + volume, 20);
        const contents = Array.from(new Set([...prev.contents, reagent]));
        let nextColor = prev.colorHex;

        // When adding pH paper (indicator), do NOT change the liquid color in the test tube.
        // Also, when adding NH4Cl we do not change the visible liquid color (indicator/paper will show change).
        if (reagent === 'IND') {
          // keep nextColor as previous color
        } else if (reagent === 'NH4Cl') {
          // intentionally do not alter the visible liquid color when NH4Cl is added
        } else {
          if (contents.includes('IND')) {
            // Only changes visible liquid color for NH4OH when indicator present
            if (contents.includes('NH4OH')) nextColor = COLORS.NH4OH_BASE; // basic
            else nextColor = COLORS.NEUTRAL;
            animateColorTransition(nextColor);
          } else if (newVol > 0) {
            // Show base blue liquid when NH4OH volume is added but no pH paper is present
            nextColor = COLORS.NH4OH_BASE;
          }
        }

        const label = reagent === 'NH4OH' ? 'Added NH4OH' : reagent === 'NH4Cl' ? 'Added NH4Cl' : 'Added pH paper';
        const observation = reagent === 'IND'
          ? 'pH paper placed (no change to liquid color)'
          : reagent === 'NH4Cl'
            ? 'NH4Cl added (no visible change to liquid color)'
            : (contents.includes('IND') ? (contents.includes('NH4OH') ? 'Indicator turned blue/green → basic (~pH > 7)' : 'Indicator added to neutral solution') : 'Solution color unchanged (no indicator)');

        setAnalysisLog(prevLog => [...prevLog, { id: `${Date.now()}-${Math.random()}`, action: `${label} (${volume.toFixed(1)} mL)`, observation, colorBefore, colorAfter: nextColor }]);
        return { ...prev, volume: newVol, contents };
      });
      setActiveEquipment("");
      if (reagent === 'IND') setShowToast('pH paper added');
      else setShowToast(`${reagent === 'NH4OH' ? 'NH4OH' : 'NH4Cl'} added`);
      setTimeout(() => setShowToast(""), 1500);
    }, ANIMATION.DROPPER_DURATION);
  };

  const handleEquipmentDrop = (equipmentId: string) => {
    if (mode.current === 'guided') {
      const stepData = GUIDED_STEPS[currentStep - 1];
      if (stepData && stepData.equipment && !stepData.equipment.includes(equipmentId)) {
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

    const pos = getEquipmentPosition(equipmentId);
    // decide if this is a fixed reagent / paper
    const isFixedReagent = ['nh4oh-0-1m','nh4cl-0-1m','ph-paper'].includes(equipmentId) || equipmentId.toLowerCase().includes('ph');
    setEquipmentOnBench(prev => {
      if (!prev.find(e => e.id === equipmentId)) return [...prev, { id: equipmentId, position: { x: pos.x, y: pos.y, fixed: isFixedReagent }, isActive: false }];
      return prev;
    });

    // if pH paper placed, also add it logically to the test tube (contents) so measurement works immediately
    if (equipmentId === 'ph-paper') {
      addToTube('IND', 0);
      // reset measurement prompts when new pH paper is placed
      setMeasurePressed(false);
      setNewPaperPressed(false);
      if (currentStep === 3 || currentStep === 5) onStepComplete(currentStep);
    }

    // mark step complete only for interactive (non-fixed) placements
    if (!['nh4oh-0-1m','nh4cl-0-1m','ph-paper'].includes(equipmentId)) {
      if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) {
      const hasTube = !!equipmentOnBench.find(e => e.id === 'test-tube');
      if (hasTube) {
        setEquipmentOnBench(prev => prev.filter(e => e.id !== 'test-tube'));
        setTestTube(INITIAL_TESTTUBE);
        if (onStepUndo) onStepUndo();
        setShowToast('Removed test tube');
        setTimeout(() => setShowToast(""), 1200);
        return;
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
      else if (contents.includes('NH4Cl')) colorHex = COLORS.NH4_BUFFERED;
      else if (contents.includes('NH4OH')) colorHex = COLORS.NH4OH_BASE;
      else colorHex = COLORS.NEUTRAL;
      return { ...prev, volume, contents, colorHex };
    });

    if (onStepUndo) onStepUndo();
    setShowToast('Last action undone');
    setTimeout(() => setShowToast(""), 1200);
  };

  const confirmAddNh4oh = () => {
    const v = parseFloat(nh4ohVolume);
    if (Number.isNaN(v) || v < 10.0 || v > 15.0) { setNh4ohError('Please enter a value between 10.0 and 15.0 mL'); return; }
    addToTube('NH4OH', v);
    if (currentStep === 2) onStepComplete(2);
    setShowNh4ohDialog(false);
  };

  const confirmAddNh4cl = () => {
    const v = parseFloat(nh4clVolume);
    if (Number.isNaN(v) || v < 5.0 || v > 10.0) { setNh4clError('Please enter a value between 5.0 and 10.0 mL'); return; }
    addToTube('NH4Cl', v);
    // track cumulative NH4Cl added to enable reset button behaviour
    setNh4clVolumeAdded(prev => Math.max(0, prev + v));
    const nextAdds = nh4clAdditions + 1;
    setNh4clAdditions(nextAdds);
    setShouldBlinkNh4clReset(nextAdds < 2);
    // start prompting the user to measure after adding NH4Cl
    setMeasurePressed(false);
    setNewPaperPressed(false);
    if (currentStep === 4) onStepComplete(4);
    setShowNh4clDialog(false);
  };

  const confirmAddIndicator = () => {
    const v = parseFloat(indicatorVolume);
    if (Number.isNaN(v) || v < 0.2 || v > 1.0) { setIndicatorError('Please enter a value between 0.2 and 1.0 mL'); return; }
    addToTube('IND', v);
    if (currentStep === 3 || currentStep === 5) onStepComplete(currentStep);
    setShowIndicatorDialog(false);
  };

  const handleInteract = (id: string) => {
    if (id === 'nh4oh-0-1m') setShowNh4ohDialog(true);
    if (id === 'nh4cl-0-1m') setShowNh4clDialog(true);
    if (id === 'ph-paper') { addToTube('IND', 0); if (currentStep === 3 || currentStep === 5) onStepComplete(currentStep); return; }
  };

  const handleRemove = (id: string) => { setEquipmentOnBench(prev => prev.filter(e => e.id !== id)); if (id === 'test-tube') setTestTube(INITIAL_TESTTUBE); };

  const testPH = () => {
    const tube = testTube;
    if (!tube || (tube.volume ?? 0) <= 0) { setShowToast('No solution in test tube'); setTimeout(() => setShowToast(''), 1400); return; }
    if (!tube.contents.includes('IND')) { setShowToast('No indicator present. Add pH paper'); setTimeout(() => setShowToast(''), 1800); return; }

    if (tube.contents.includes('NH4Cl')) {
      const ph = 9.0;
      setLastMeasuredPH(ph);
      // store NH4Cl measurement separately from the initial ammonium pH
      if (ammoniumAfterPH == null) setAmmoniumAfterPH(ph);
      // store buffered sample snapshot on first buffered measurement
      if (bufferedSample == null) setBufferedSample({ ...tube });
      // also store a dedicated sample snapshot for the NH4Cl case
      if (ammoniumAfterSample == null) setAmmoniumAfterSample({ ...tube });
      // color pH paper to buffered color
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'ph-paper' || item.id.toLowerCase().includes('ph')) ? { ...item, color: COLORS.NH4_BUFFERED } : item));
      setShowToast('Measured pH ≈ 9 (buffered, lower than NH4OH)');
      setShouldBlinkNh4clReset(nh4clVolumeAdded > 0);
      // advance guided progress: when pH is measured after NH4Cl, mark step 5 complete and move to step 6
      if (currentStep === 5 && onStepComplete && !completedSteps.includes(5)) {
        onStepComplete(5);
      }
      setTimeout(() => setShowToast(''), 2000);
      return;
    }
    if (tube.contents.includes('NH4OH')) {
      const ph = 11.0;
      setLastMeasuredPH(ph);
      if (ammoniumInitialPH == null) setAmmoniumInitialPH(ph);
      // store base sample snapshot on first base measurement
      if (baseSample == null) setBaseSample({ ...tube });
      // color pH paper to basic color
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'ph-paper' || item.id.toLowerCase().includes('ph')) ? { ...item, color: COLORS.NH4OH_BASE } : item));
      setShowToast('Measured pH ≈ 11 (basic NH4OH)');
      // if NH4Cl was previously added, prompt user to reset it after measuring
      setShouldBlinkNh4clReset(nh4clVolumeAdded > 0);
      setTimeout(() => setShowToast(''), 2000);
      return;
    }
    if (tube.colorHex === COLORS.NEUTRAL) {
      const ph = 7.0;
      setLastMeasuredPH(ph);
      if (ammoniumInitialPH == null) setAmmoniumInitialPH(ph);
      // store base sample for neutral case if none exists
      if (baseSample == null) setBaseSample({ ...tube });
      setEquipmentOnBench(prev => prev.map(item => (item.id === 'ph-paper' || item.id.toLowerCase().includes('ph')) ? { ...item, color: COLORS.NEUTRAL } : item));
      setShowToast('Measured pH ≈ 7 (neutral)');
      setShouldBlinkNh4clReset(nh4clVolumeAdded > 0);
      setTimeout(() => setShowToast(''), 2000);
      return;
    }
    setLastMeasuredPH(null);
    // set pH paper to clear/inconclusive
    setEquipmentOnBench(prev => prev.map(item => (item.id === 'ph-paper' || item.id.toLowerCase().includes('ph')) ? { ...item, color: COLORS.CLEAR } : item));
    setShowToast('pH measurement inconclusive');
    setTimeout(() => setShowToast(''), 1600);
  };

  // Henderson-Hasselbalch calculation helper
  const computeHenderson = () => {
    const pKa = 9.25; // pKa of NH4+ at 25°C (approx)
    const baseVolMl = history.filter(h => h.type === 'NH4OH').reduce((s, h) => s + h.volume, 0);
    const acidVolMl = history.filter(h => h.type === 'NH4Cl').reduce((s, h) => s + h.volume, 0);
    const indicatorVolMl = history.filter(h => h.type === 'IND').reduce((s, h) => s + h.volume, 0);
    const totalVolMl = (testTube.volume ?? 0) || (baseVolMl + acidVolMl + indicatorVolMl);
    const totalVolL = totalVolMl / 1000;
    const concM = 0.1; // stock concentration for both reagents (0.1 M)

    const molesBase = (baseVolMl / 1000) * concM;
    const molesAcid = (acidVolMl / 1000) * concM;

    const baseConc = totalVolL > 0 ? molesBase / totalVolL : 0;
    const acidConc = totalVolL > 0 ? molesAcid / totalVolL : 0;

    const ratio = acidConc > 0 ? baseConc / acidConc : (molesAcid === 0 && molesBase > 0 ? Infinity : 0);
    const pH = (molesBase > 0 && molesAcid > 0 && totalVolL > 0) ? (pKa + Math.log10(ratio)) : null;

    return { pKa, baseVolMl, acidVolMl, indicatorVolMl, totalVolMl, totalVolL, molesBase, molesAcid, baseConc, acidConc, ratio, pH };
  };

  const stepsProgress = (
    <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Experiment Progress</h3>
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
          <h4 className="font-semibold text-gray-800 mb-1">{GUIDED_STEPS[currentStep-1].title}</h4>
          <p className="text-sm text-gray-600 mb-2">{GUIDED_STEPS[currentStep-1].description}</p>
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <ArrowRight className="w-3 h-3 mr-1" />
            {GUIDED_STEPS[currentStep-1].action}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        {stepsProgress}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                Equipment
              </h3>
              <div className="space-y-3">
                {AB_LAB_EQUIPMENT.map((eq) => (
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
              <Button onClick={() => { setEquipmentOnBench([]); setTestTube(INITIAL_TESTTUBE); setHistory([]); setAmmoniumInitialPH(null); setAmmoniumAfterPH(null); setBaseSample(null); setBufferedSample(null); setAmmoniumAfterSample(null); setLastMeasuredPH(null); setMeasurePressed(false); setNewPaperPressed(false); setCompareInitiated(false); if (compareTimeoutRef.current) { clearTimeout(compareTimeoutRef.current as unknown as number); compareTimeoutRef.current = null; } onReset(); }} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>

              {/* View Results button becomes available immediately when COMPARE is pressed */}
              {(compareInitiated || ammoniumAfterSample != null) && (
                <Button onClick={() => {
                  // open results immediately and cancel any pending auto-open
                  if (compareTimeoutRef.current) {
                    clearTimeout(compareTimeoutRef.current as unknown as number);
                    compareTimeoutRef.current = null;
                  }
                  setCompareInitiated(false);
                  if (onStepComplete && !completedSteps.includes(6)) onStepComplete(6);
                  setIsRunning(false); setShowResultsModal(true);
                }} className="w-full bg-blue-500 hover:bg-blue-600 text-white">View Results & Analysis</Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <WorkBench onDrop={handleEquipmentDrop} isRunning={isRunning} currentStep={currentStep} onTestPH={testPH}>
              {equipmentOnBench.find(e => e.id === 'test-tube') && (
                <>
                  <Equipment id="test-tube" name="25ml Test Tube" icon={<TestTube className="w-8 h-8" />} position={getEquipmentPosition('test-tube')} onRemove={handleRemove} onInteract={() => {}} color={testTube.colorHex} volume={testTube.volume} displayVolume={showNh4ohDialog && previewNh4ohVolume != null ? previewNh4ohVolume : showNh4clDialog && previewNh4clVolume != null ? previewNh4clVolume : showIndicatorDialog && previewIndicatorVolume != null ? Math.min(20, testTube.volume + previewIndicatorVolume) : testTube.volume} isActive={true} />

                  {/* Show RESET button below the test tube when universal indicator has been added */}
                  {testTube.contents.includes('IND') && (
                    <div style={{ position: 'absolute', left: getEquipmentPosition('test-tube').x, top: getEquipmentPosition('test-tube').y + 220, transform: 'translate(-50%, 0)' }}>
                      <Button size="sm" className="hidden" onClick={() => {
                        // Restore test tube to empty/clear state
                        setHistory([]);
                        setTestTube(prev => ({ ...prev, volume: 0, contents: [], colorHex: COLORS.CLEAR }));
                        setShowToast('Test tube reset');
                        setTimeout(() => setShowToast(''), 1400);
                      }}>
                        RESET
                      </Button>
                    </div>
                  )}
                </>
              )}

              {equipmentOnBench.filter(e => e.id !== 'test-tube').map(e => (
                <Equipment
                  key={e.id}
                  id={e.id}
                  name={AB_LAB_EQUIPMENT.find(x => x.id === e.id)?.name || e.id}
                  icon={AB_LAB_EQUIPMENT.find(x => x.id === e.id)?.icon || <Beaker className="w-8 h-8" />}
                  position={e.position}
                  onRemove={handleRemove}
                  onInteract={handleInteract}
                  color={(e as any).color}
                />
              ))}

              {/* Contextual MEASURE action near pH paper when present */}
              {equipmentOnBench.find(e => e.id === 'ph-paper' || e.id.toLowerCase().includes('ph')) && (
                (() => {
                  const phItem = equipmentOnBench.find(e => e.id === 'ph-paper' || e.id.toLowerCase().includes('ph'))!;
                  const paperHasColor = !!(phItem as any).color && (phItem as any).color !== COLORS.CLEAR;
                  return (
                    <div key="measure-button" style={{ position: 'absolute', left: phItem.position.x, top: phItem.position.y + 60, transform: 'translate(-50%, 0)' }}>
                      <Button size="sm" className={`bg-amber-600 text-white hover:bg-amber-700 shadow-sm ${(!newPaperPressed && !compareInitiated && !showResultsModal && ((paperHasColor || (!paperHasColor && !measurePressed)) || nh4clVolumeAdded > 0)) ? 'blink-until-pressed' : ''}`} onClick={() => {
                        if (!paperHasColor) {
                          setMeasurePressed(true);
                          setNewPaperPressed(false);
                          testPH();
                        } else {
                          // when NH4Cl result exists, offer COMPARE action
                          if (ammoniumAfterSample != null) {
                            // schedule opening the results modal after 5 seconds
                            if (compareTimeoutRef.current) {
                              clearTimeout(compareTimeoutRef.current as unknown as number);
                              compareTimeoutRef.current = null;
                            }
                            setShowToast('Opening results...');
                            setCompareInitiated(true);
                            if (onStepComplete && !completedSteps.includes(6)) onStepComplete(6);
                            compareTimeoutRef.current = window.setTimeout(() => {
                              setIsRunning(false); setShowResultsModal(true);
                              setShowToast('');
                              setCompareInitiated(false);
                              compareTimeoutRef.current = null;
                            }, 5000) as unknown as number;
                          } else {
                            setNewPaperPressed(true);
                            setMeasurePressed(false);
                            setEquipmentOnBench(prev => prev.map(item => (item.id === 'ph-paper' || item.id.toLowerCase().includes('ph')) ? { ...item, color: COLORS.CLEAR } : item));
                            setShowToast('Replace pH paper');
                            setTimeout(() => setShowToast(''), 1500);
                          }
                        }
                      }}>
                        {!paperHasColor ? 'MEASURE' : (ammoniumAfterSample != null ? 'COMPARE' : 'New pH paper')}
                      </Button>
                    </div>
                  );
                })()
              )}


            </WorkBench>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2" aria-hidden="true" />
                Live Analysis
              </h3>

              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Current Step</h4>
                <p className="text-xs text-gray-600">{GUIDED_STEPS[(mode.currentGuidedStep || 0)]?.title || GUIDED_STEPS[currentStep-1]?.title}</p>
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

                <div className="mt-6">
                  <h5 className="font-medium text-sm text-black mb-1"><span className="inline-block w-2 h-2 rounded-full bg-black mr-2" aria-hidden="true" /> <span className="inline-block mr-2 font-bold">A</span> pH of Ammonium hydroxide</h5>
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 text-sm">
                    <div className="text-lg text-black font-semibold">{baseSample != null ? `${baseSample.volume.toFixed(1)} mL • pH ≈ ${ammoniumInitialPH != null ? ammoniumInitialPH.toFixed(2) : '—'}` : 'No result yet'}</div>
                  </div>
                </div>

                <div className="text-sm text-black mt-3 mb-2"><span className="inline-block w-2 h-2 rounded-full bg-black mr-2" aria-hidden="true" /> <span className="inline-block mr-2 font-bold">B</span> When NH4Cl is added</div>
                <div className="mt-3">
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 text-sm">
                    {(() => {
                      const hh = computeHenderson();
                      const addedVol = hh.acidVolMl || (ammoniumAfterSample ? ammoniumAfterSample.volume : 0);
                      const displayedPH = hh.pH !== null ? hh.pH : (ammoniumAfterPH != null ? ammoniumAfterPH : (lastMeasuredPH != null ? lastMeasuredPH : null));
                      if (!ammoniumAfterSample && addedVol === 0) return <div className="text-lg text-black font-semibold">No result yet</div>;
                      return <div className="text-lg text-black font-semibold">{`${addedVol.toFixed(1)} mL • pH ≈ ${displayedPH != null ? (Number.isFinite(displayedPH) ? displayedPH.toFixed(2) : '—') : '—'}`}</div>;
                    })()}
                  </div>
                </div>

                {showToast && <p className="text-xs text-blue-700 mt-2">{showToast}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results & Analysis Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-green-700 bg-clip-text text-transparent flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
              Experiment Results & Analysis
            </DialogTitle>
            <DialogDescription className="text-black">Analysis of your ammonium hydroxide / ammonium chloride comparison</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4 text-black">
            {/* Summary styled like HClPH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="text-sm font-medium">Ammonium hydroxide (latest)</div>
                <div className="text-3xl font-semibold mt-2">{ammoniumInitialPH != null ? `${ammoniumInitialPH.toFixed(2)} (${ammoniumInitialPH < 7 ? 'Acidic' : ammoniumInitialPH > 7 ? 'Basic' : 'Neutral'})` : 'No measurement'}</div>
              </div>

              <div className="p-4 border rounded bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                <div className="text-sm font-medium">After NH4Cl added (buffered)</div>
                <div className="text-lg font-semibold mt-2">{(() => { const hh = computeHenderson(); const measured = hh.pH !== null ? hh.pH : ammoniumAfterPH; return measured != null ? `${measured.toFixed(2)} (${measured < 7 ? 'Acidic' : measured > 7 ? 'Basic' : 'Neutral'})` : 'No result'; })()}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Henderson–Hasselbalch Calculation</h4>
              <p className="text-sm">Below we compute the expected buffered pH using Henderson–Hasselbalch when both NH4OH and NH4Cl are present.</p>

              <div className="mt-3 p-3 bg-white border rounded text-sm">
                {(() => {
                  const res = computeHenderson();
                  if (!res.totalVolMl || res.totalVolMl <= 0) return <div>No solution volume recorded yet.</div>;
                  if (res.molesBase <= 0 && res.molesAcid <= 0) return <div>No reagents added to compute a buffer.</div>;

                  if (res.molesBase > 0 && res.molesAcid > 0) {
                    return (
                      <div>
                        <div className="font-medium mb-2">Using pH = pKa + log10([base]/[acid]) with pKa = {res.pKa.toFixed(2)}</div>
                        <div className="text-sm">
                          <div>Total solution volume = {res.totalVolMl.toFixed(2)} mL ({res.totalVolL.toFixed(4)} L)</div>
                          <div>NH4OH added (base) = {res.baseVolMl.toFixed(2)} mL → moles = {res.molesBase.toExponential(3)} mol</div>
                          <div>NH4Cl added (acid) = {res.acidVolMl.toFixed(2)} mL → moles = {res.molesAcid.toExponential(3)} mol</div>
                          <div className="mt-2 font-medium">Calculated pH = {res.pH !== null ? res.pH.toFixed(2) : '—'}</div>
                        </div>
                      </div>
                    );
                  }

                  if (res.molesAcid <= 0 && res.molesBase > 0) return <div>Only base present (no conjugate acid). The solution is basic (measured pH ≈ {ammoniumInitialPH != null ? ammoniumInitialPH.toFixed(2) : '—'}).</div>;
                  if (res.molesBase <= 0 && res.molesAcid > 0) return <div>Only acid (NH4+) present — solution will be acidic/less basic (measured pH ≈ {ammoniumAfterPH != null ? ammoniumAfterPH.toFixed(2) : '—'}).</div>;
                  return null;
                })()}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Action Timeline</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analysisLog.map((log, index) => (
                  <div key={log.id} className="mb-2 p-2 rounded border bg-gradient-to-r from-yellow-50 to-white text-black">
                    <div className="font-medium">{index + 1}. {log.action}</div>
                    <div className="text-sm mt-1">{log.observation}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Final Experimental State</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-2 p-2 rounded border bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="font-medium">Ammonium hydroxide + Indicator (≈ basic)</div>
                  <div className="text-sm mt-1">Contents: {baseSample ? baseSample.contents.join(', ') : 'Not recorded'}</div>
                </div>
                <div className="mb-2 p-2 rounded border bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                  <div className="font-medium">NH4Cl added + Indicator (≈ buffered)</div>
                  <div className="text-sm mt-1">Contents: {ammoniumAfterSample ? ammoniumAfterSample.contents.join(', ') : 'Not recorded'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Interpretation & Buffer Capacity */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold mb-2">Interpretation & Key Observations</h4>
              {(() => {
                const res = computeHenderson();
                const pHcalc = res.pH !== null ? res.pH.toFixed(2) : null;
                const ratioStr = isFinite(res.ratio) ? res.ratio.toFixed(2) : '—';
                const molesBaseMs = res.molesBase ? (res.molesBase * 1000).toFixed(3) : '0';
                const molesAcidMs = res.molesAcid ? (res.molesAcid * 1000).toFixed(3) : '0';

                return (
                  <div className="text-sm text-black space-y-2">
                    <div>• Calculated buffered pH: <strong>{pHcalc ?? 'Not available'}</strong> (using pKa = {res.pKa.toFixed(2)})</div>
                    <div>• Base : Acid ratio [base]/[acid] = <strong>{ratioStr}</strong></div>
                    <div>• Total reagent amount (approx): <strong>{molesBaseMs} mmol base</strong>, <strong>{molesAcidMs} mmol acid</strong></div>
                    <div>• Interpretation: A ratio close to 1 indicates an effective buffer near the conjugate pair pKa; larger ratios shift pH more basic while smaller ratios shift pH more acidic.</div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold mb-2">Buffer Capacity (Practical)</h4>
              <div className="text-sm text-black space-y-2">
                {(() => {
                  const res = computeHenderson();
                  const totalMoles = (res.molesBase || 0) + (res.molesAcid || 0);
                  const capacity = totalMoles > 0 ? (totalMoles * 1000).toFixed(3) : '0';
                  const capacityAssessment = totalMoles <= 0 ? 'No buffer formed' : totalMoles < 0.001 ? 'Low buffer capacity' : totalMoles < 0.01 ? 'Moderate buffer capacity' : 'High buffer capacity';
                  return (
                    <div>
                      <div>Approximate total reagent amount: <strong>{capacity} mmol</strong></div>
                      <div>Estimated buffer capacity: <strong>{capacityAssessment}</strong></div>
                      <div className="mt-2">Practical note: Buffer capacity increases with the absolute amount of conjugate acid/base present. Small added volumes of strong acid/base will change pH more when total moles are low.</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold mb-2">Experimental Tips & Next Steps</h4>
              <ul className="list-disc pl-5 text-sm text-black space-y-1">
                <li>Use calibrated pipettes or burettes for more accurate volume additions to reduce dilution errors.</li>
                <li>When measuring pH with indicators, cross-check with pH paper or a pH meter for increased accuracy.</li>
                <li>To test buffer limits, add small incremental volumes of strong acid or base and observe pH change; a stable pH indicates good buffering.</li>
                <li>Record temperatures and ensure consistent mixing — pH can vary with temperature and incomplete mixing.</li>
                <li>For further study, vary the initial NH4OH concentration while keeping NH4Cl constant to observe how buffer pH responds.</li>
              </ul>
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
                <CardTitle className="text-2xl">NH4OH / NH4Cl — Quiz</CardTitle>
                {quizSubmitted && (
                  <div className="text-blue-600 font-semibold">Marks obtained ({quizScore} / 5)</div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 quiz-content">
                <section className="quiz-item">
                  <h3 className="font-semibold">Q1. Why does the addition of NH₄Cl lower the pH of NH₄OH solution?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'A'} onChange={() => handleSelect('q1','A')} />
                      <span>A) NH₄Cl reacts with water to produce OH⁻ ions</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'B'} onChange={() => handleSelect('q1','B')} />
                      <span>B) NH₄⁺ ions increase, shifting NH₄⁺/NH₃ equilibrium toward NH₃ formation, reducing OH⁻ concentration</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'C'} onChange={() => handleSelect('q1','C')} />
                      <span>C) NH₄Cl directly neutralizes NH₄OH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'D'} onChange={() => handleSelect('q1','D')} />
                      <span>D) NH₄Cl hydrolyzes to form HCl</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q1;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) NH₄Cl reacts with water to produce OH⁻ ions' : selected === 'B' ? 'B) NH₄⁺ ions increase, shifting NH₄⁺/NH₃ equilibrium toward NH₃ formation, reducing OH⁻ concentration' : selected === 'C' ? 'C) NH₄Cl directly neutralizes NH₄OH' : selected === 'D' ? 'D) NH₄Cl hydrolyzes to form HCl' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) NH₄⁺ ions increase, shifting NH₄⁺/NH₃ equilibrium toward NH₃ formation, reducing OH⁻ concentration</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q2. The NH₄⁺/NH₃ system acts as a buffer because:</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'A'} onChange={() => handleSelect('q2','A')} />
                      <span>A) Both NH₄⁺ and NH�� are strong acids and bases</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'B'} onChange={() => handleSelect('q2','B')} />
                      <span>B) The conjugate acid–base pair resists pH changes on addition of small amounts of acids or bases</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'C'} onChange={() => handleSelect('q2','C')} />
                      <span>C) NH₄OH is a strong base</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'D'} onChange={() => handleSelect('q2','D')} />
                      <span>D) NH₄Cl is a strong electrolyte</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q2;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Both NH₄⁺ and NH₃ are strong acids and bases' : selected === 'B' ? 'B) The conjugate acid–base pair resists pH changes on addition of small amounts of acids or bases' : selected === 'C' ? 'C) NH₄OH is a strong base' : selected === 'D' ? 'D) NH₄Cl is a strong electrolyte' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The conjugate acid–base pair resists pH changes on addition of small amounts of acids or bases</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q3. In the Henderson–Hasselbalch equation for this system, which statement is true?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'A'} onChange={() => handleSelect('q3','A')} />
                      <span>A) Increasing [NH₄⁺] lowers the pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'B'} onChange={() => handleSelect('q3','B')} />
                      <span>B) Increasing [NH₄⁺] raises the pH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'C'} onChange={() => handleSelect('q3','C')} />
                      <span>C) pH is independent of [NH₄⁺] and [NH₃]</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'D'} onChange={() => handleSelect('q3','D')} />
                      <span>D) It is only valid for strong acids and bases</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'A';
                    const selected = quizSelections.q3;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Increasing [NH₄⁺] lowers the pH' : selected === 'B' ? 'B) Increasing [NH₄⁺] raises the pH' : selected === 'C' ? 'C) pH is independent of [NH₄⁺] and [NH₃]' : selected === 'D' ? 'D) It is only valid for strong acids and bases' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: A) Increasing [NH₄⁺] lowers the pH</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q4. Which factor primarily limits the buffering capacity of the NH₄⁺/NH₃ system?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'A'} onChange={() => handleSelect('q4','A')} />
                      <span>A) The initial pH of NH₄OH</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'B'} onChange={() => handleSelect('q4','B')} />
                      <span>B) The ratio [NH₃]/[NH₄⁺] approaching extreme values (&lt;0.1 or &gt;10)</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'C'} onChange={() => handleSelect('q4','C')} />
                      <span>C) The temperature of the solution</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'D'} onChange={() => handleSelect('q4','D')} />
                      <span>D) The solubility of NH₄Cl in water</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q4;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) The initial pH of NH₄OH' : selected === 'B' ? 'B) The ratio [NH₃]/[NH₄⁺] approaching extreme values (<0.1 or >10)' : selected === 'C' ? 'C) The temperature of the solution' : selected === 'D' ? 'D) The solubility of NH₄Cl in water' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The ratio [NH₃]/[NH₄⁺] approaching extreme values (&lt;0.1 or &gt;10)</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q5. What happens to the pH if an excess amount of NH₄Cl is added beyond the buffer range?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'A'} onChange={() => handleSelect('q5','A')} />
                      <span>A) pH remains constant</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'B'} onChange={() => handleSelect('q5','B')} />
                      <span>B) pH decreases significantly toward acidic values</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'C'} onChange={() => handleSelect('q5','C')} />
                      <span>C) pH increases</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'D'} onChange={() => handleSelect('q5','D')} />
                      <span>D) Solution becomes strongly basic</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q5;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) pH remains constant' : selected === 'B' ? 'B) pH decreases significantly toward acidic values' : selected === 'C' ? 'C) pH increases' : selected === 'D' ? 'D) Solution becomes strongly basic' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) pH decreases significantly toward acidic values</div>
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

      {/* NH4OH dialog */}
      <Dialog open={showNh4ohDialog} onOpenChange={setShowNh4ohDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add NH4OH</DialogTitle>
            <DialogDescription>Enter the volume of ammonium hydroxide to add (10.0–15.0 mL)</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input type="number" step="0.1" value={nh4ohVolume} onChange={(e) => { setNh4ohVolume(e.target.value); setPreviewNh4ohVolume(parseFloat(e.target.value) || null); }} className="w-full border rounded px-3 py-2" />
            {nh4ohError && <p className="text-sm text-red-600">{nh4ohError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNh4ohDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddNh4oh}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NH4Cl dialog */}
      <Dialog open={showNh4clDialog} onOpenChange={setShowNh4clDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add NH4Cl</DialogTitle>
            <DialogDescription>Enter the volume of ammonium chloride solution to add (5.0–10.0 mL)</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input type="number" step="0.1" value={nh4clVolume} onChange={(e) => { setNh4clVolume(e.target.value); setPreviewNh4clVolume(parseFloat(e.target.value) || null); }} className="w-full border rounded px-3 py-2" />
            {nh4clError && <p className="text-sm text-red-600">{nh4clError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNh4clDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddNh4cl}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Indicator dialog */}
      <Dialog open={showIndicatorDialog} onOpenChange={setShowIndicatorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Universal Indicator</DialogTitle>
            <DialogDescription>Enter the volume of universal indicator to add (0.2–1.0 mL)</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input type="number" step="0.1" value={indicatorVolume} onChange={(e) => { setIndicatorVolume(e.target.value); setPreviewIndicatorVolume(parseFloat(e.target.value) || null); }} className="w-full border rounded px-3 py-2" />
            {indicatorError && <p className="text-sm text-red-600">{indicatorError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIndicatorDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddIndicator}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
