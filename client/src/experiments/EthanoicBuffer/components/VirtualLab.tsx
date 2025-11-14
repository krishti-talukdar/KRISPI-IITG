import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkBench } from "@/experiments/EquilibriumShift/components/WorkBench";
import { Equipment as PHEquipment } from "@/experiments/PHComparison/components/Equipment";
import { Beaker, Droplets, FlaskConical, Info, TestTube, Undo2, Wrench, CheckCircle, Home, ArrowLeft } from "lucide-react";
import type { Experiment, ExperimentStep } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VirtualLabProps {
  experiment: Experiment;
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  currentStep: number;
  onStepComplete: (stepId?: number) => void;
  onStepUndo?: (stepId?: number) => void;
  onReset: () => void;
  completedSteps: number[];
}

export default function VirtualLab({ experiment, experimentStarted, onStartExperiment, isRunning, setIsRunning, currentStep, onStepComplete, onStepUndo, onReset, completedSteps }: VirtualLabProps) {
  const totalSteps = experiment.stepDetails.length;
  const [equipmentOnBench, setEquipmentOnBench] = useState<Array<{ id: string; name: string; position: { x: number; y: number } }>>([]);

  // Test tube visual state
  const [testTubeVolume, setTestTubeVolume] = useState(0);
  const [testTubeColor, setTestTubeColor] = useState<string | undefined>(undefined);

  // Track moles of acid (HA) and conjugate base (A-)
  const [acidMoles, setAcidMoles] = useState(0);
  const [sodiumMoles, setSodiumMoles] = useState(0);
  const [lastMeasuredPH, setLastMeasuredPH] = useState<number | null>(null);
  const [initialAcidPH, setInitialAcidPH] = useState<number | null>(null);
  const [case1PH, setCase1PH] = useState<number | null>(null);
  const [case2PH, setCase2PH] = useState<number | null>(null);
  // measurementVersion increments every time MEASURE is pressed. CASE results are revealed only when
  // measurementVersion >= the version assigned to that CASE (set when sodium is added)
  const [measurementVersion, setMeasurementVersion] = useState(0);
  const [case1Version, setCase1Version] = useState<number | null>(null);
  const [case2Version, setCase2Version] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<{ q1?: string | null; q2?: string | null; q3?: string | null; q4?: string | null; q5?: string | null; }>({ q1: null, q2: null, q3: null, q4: null, q5: null });
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSelect = (q: string, value: string) => {
    setQuizSelections((s) => ({ ...s, [q]: value }));
  };

  const allAnswered = Boolean(quizSelections.q1 && quizSelections.q2 && quizSelections.q3 && quizSelections.q4 && quizSelections.q5);

  const resetQuiz = () => {
    setQuizSelections({ q1: null, q2: null, q3: null, q4: null, q5: null });
    setQuizSubmitted(false);
  };

  const score = React.useMemo(() => {
    const answers: Record<string, string> = { q1: 'B', q2: 'B', q3: 'B', q4: 'B', q5: 'C' };
    let s = 0;
    if (quizSelections.q1 === answers.q1) s++;
    if (quizSelections.q2 === answers.q2) s++;
    if (quizSelections.q3 === answers.q3) s++;
    if (quizSelections.q4 === answers.q4) s++;
    if (quizSelections.q5 === answers.q5) s++;
    return s;
  }, [quizSelections]);
  // Guided UI cues
  const [shouldBlinkMeasure, setShouldBlinkMeasure] = useState(false);
  const [shouldBlinkReset, setShouldBlinkReset] = useState(false);
  // Count how many times sodium ethanoate has been added this session
  const [sodiumAdditions, setSodiumAdditions] = useState(0);

  const [showAceticDialog, setShowAceticDialog] = useState(false);
  const [aceticVolume, setAceticVolume] = useState("10.0");
  const [aceticError, setAceticError] = useState<string | null>(null);
  const [showSodiumDialog, setShowSodiumDialog] = useState(false);
  const [sodiumVolume, setSodiumVolume] = useState("5.0");
  const [sodiumError, setSodiumError] = useState<string | null>(null);
  // Track cumulative volume (mL) of sodium ethanoate added to the test tube so we can revert it on reset
  const [sodiumVolumeAdded, setSodiumVolumeAdded] = useState<number>(0);

  // Count measure button presses and schedule showing results after 3rd press
  const [measureCount, setMeasureCount] = useState(0);
  // Track whether the MEASURE action has been pressed (used to stop blinking prompts)
  const [measurePressed, setMeasurePressed] = useState(false);
  // Track whether the 'New pH paper' action has been pressed
  const [newPaperPressed, setNewPaperPressed] = useState(false);
  const measureTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current as number);
        measureTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (showResultsModal) {
      // stop parent timer when results are shown and clear any scheduled timeouts
      try { setIsRunning(false); } catch (e) {}
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current as number);
        measureTimeoutRef.current = null;
      }
    }
  }, [showResultsModal, setIsRunning]);

  useEffect(() => { setEquipmentOnBench([]); setAcidMoles(0); setSodiumMoles(0); setLastMeasuredPH(null); setInitialAcidPH(null); setCase1PH(null); setCase2PH(null); setShowToast(null); setMeasurePressed(false); setNewPaperPressed(false); }, [experiment.id]);

  const items = useMemo(() => {
    const iconFor = (name: string) => {
      const key = name.toLowerCase();
      if (key.includes("test tube")) return <TestTube className="w-8 h-8" />;
      if (key.includes("indicator") || key.includes("meter") || key.includes('ph')) return <FlaskConical className="w-8 h-8" />;
      return <Droplets className="w-8 h-8" />;
    };
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const raw = experiment.equipment.map((name) => {
      const key = name.toLowerCase();
      const baseId = slug(name);
      const id = key.includes('test tube') ? 'test-tube' : baseId;
      return { id, name, icon: iconFor(name) };
    });

    // Select only the four core items to mirror the provided UI: Test Tube, Ethanoic Acid, Sodium Ethanoate, pH Meter/Paper
    const isEthanoic = (n: string) => /ethanoic|acetic/i.test(n);
    const isSodiumEthanoate = (n: string) => /sodium\s*ethanoate|sodium\s*acetate/i.test(n);
    const isPhItem = (n: string) => /ph\s*(meter|paper)|universal\s*indicator/i.test(n);

    const testTube = raw.find(i => i.id === 'test-tube' || /test\s*tube/i.test(i.name));
    const ethanoic = raw.find(i => isEthanoic(i.name));
    const sodium = raw.find(i => isSodiumEthanoate(i.name));
    const ph = raw.find(i => isPhItem(i.name));

    return [testTube, ethanoic, sodium, ph].filter(Boolean) as typeof raw;
  }, [experiment.equipment]);

  const getPosition = (id: string) => {
    const idx = items.findIndex(i => i.id === id);
    const baseX = 220;
    const baseY = 160;
    if (id === 'test-tube') {
      return { x: baseX, y: baseY + 140 };
    }
    if (id === 'universal-indicator' || id.toLowerCase().includes('ph')) {
      return { x: baseX, y: baseY + 330 };
    }
    // Stack the two reagent cards in a right column similar to the screenshot
    // Ensure sodium ethanoate is slightly lower than ethanoic acid to provide a small gap
    if (id.toLowerCase().includes('sodium')) {
      return { x: baseX + 260, y: baseY + 280 };
    }
    return { x: baseX + 260, y: baseY + (idx === 1 ? 40 : 220) };
  };

  const handleDrop = (id: string, x: number, y: number, action: 'new' | 'move' = 'new') => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (action === 'move') {
      // do not allow moving fixed items (e.g., pH paper or fixed reagent bottles)
      setEquipmentOnBench(prev => prev.map(e => e.id === id ? ((e.position as any)?.fixed ? e : { ...e, position: { x, y } }) : e));
      return;
    }

    // add new equipment at the exact drop coordinates
    if (!equipmentOnBench.find(e => e.id === id)) {
      // treat pH paper / universal indicator as fixed and always place it at the designated position
      const isFixedReagent = /ethanoic|acetic|sodium-ethanoate|sodium_ethanoate|sodium ethanoate|sodium acetate/i.test(item.name);
      const isPhPaper = id === 'universal-indicator' || item.name.toLowerCase().includes('ph') || id.toLowerCase().includes('ph');

      let positionObj: any;
      // Always place the test tube at the canonical workbench location regardless of drop point
      if (id === 'test-tube' || id.toLowerCase().includes('test')) {
        const pos = getPosition('test-tube');
        positionObj = { x: pos.x, y: pos.y, fixed: true };
      } else if (isPhPaper) {
        // use the canonical getPosition to compute the exact fixed coordinates
        const pos = getPosition(id);
        positionObj = { x: pos.x, y: pos.y, fixed: true };
      } else if (isFixedReagent) {
        // always place reagents (ethanoic acid / sodium ethanoate) at their canonical workbench positions
        const pos = getPosition(id);
        positionObj = { x: pos.x, y: pos.y, fixed: true };
      } else {
        positionObj = { x, y };
      }

      setEquipmentOnBench(prev => [...prev, { id, name: id === 'test-tube' ? '25ml Test Tube' : item.name, position: positionObj }]);
      // Only mark the step complete for interactive actions (not when placing fixed reagent bottles)
      if (!positionObj.fixed && !completedSteps.includes(currentStep)) onStepComplete(currentStep);
    }
  };

  const handleRemove = (id: string) => {
    setEquipmentOnBench(prev => prev.filter(e => e.id !== id));
    if (onStepUndo) onStepUndo();
  };

  const handleInteract = (id: string) => {
  const idLower = id.toLowerCase();
  if (idLower.includes('ethanoic') || idLower.includes('acetic')) {
    setShowAceticDialog(true);
    return;
  }
  if (idLower.includes('sodium') || idLower.includes('ethanoate') || idLower.includes('acetate')) {
    setShowSodiumDialog(true);
    return;
  }
};

const confirmAddAcetic = () => {
  const v = parseFloat(aceticVolume);
  if (Number.isNaN(v) || v < 10.0 || v > 15.0) {
    setAceticError('Please enter a value between 10.0 and 15.0 mL');
    return;
  }
  // Update visual: add liquid to the test tube and track moles
  const newTestTubeVolume = Math.max(0, Math.min(20, testTubeVolume + v));
  setTestTubeVolume(newTestTubeVolume);
  // semi-transparent light-blue color
  setTestTubeColor('rgba(173,216,230,0.6)');

  // compute moles: 0.1 M * volume(L)
  const vL = v / 1000;
  const moles = 0.1 * vL;
  const newAcidMoles = acidMoles + moles;
  setAcidMoles(newAcidMoles);

  // compute and store initial pH of the ethanoic acid solution (before adding sodium)
  const totalVolL = Math.max(1e-6, newTestTubeVolume / 1000);
  const initialPH = computePHFrom(newAcidMoles, sodiumMoles, totalVolL);
  if (initialPH != null) {
    setInitialAcidPH(initialPH);
    setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M ethanoic acid • pH ≈ ${initialPH.toFixed(2)}`);
  } else {
    setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M ethanoic acid`);
  }

  // mark the step complete when the user confirms adding the acetic volume
  if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);
  setShowAceticDialog(false);
  setAceticError(null);
  setTimeout(() => setShowToast(null), 2000);

};

const confirmAddSodium = () => {
  const v = parseFloat(sodiumVolume);
  if (Number.isNaN(v) || v < 5.0 || v > 10.0) {
    setSodiumError('Please enter a value between 5.0 and 10.0 mL');
    return;
  }
  // update volume and moles for sodium ethanoate
  const newTestTubeVolume = Math.max(0, Math.min(20, testTubeVolume + v));
  setTestTubeVolume(newTestTubeVolume);
  const vL = v / 1000;
  const moles = 0.1 * vL;
  const newSodiumMoles = sodiumMoles + moles;
  setSodiumMoles(newSodiumMoles);
  // track cumulative sodium volume added so Reset can revert the volume
  setSodiumVolumeAdded(prev => Math.max(0, prev + v));
  // bump additions count; if this is the 2nd (or later) addition, ensure reset won't blink anymore
  const nextAdditions = sodiumAdditions + 1;
  setSodiumAdditions(nextAdditions);
  if (nextAdditions >= 2) setShouldBlinkReset(false);
  // prompt user to measure after adding sodium ethanoate (only if fewer than 3 total measurements so far)
  setShouldBlinkMeasure(measurementVersion < 3);
  // Re-enable the blinking prompt for MEASURE after adding sodium
  setMeasurePressed(false);
  setNewPaperPressed(false);

  // compute and store pH after sodium ethanoate addition
  const totalVolL = Math.max(1e-6, newTestTubeVolume / 1000);
  const phAfter = computePHFrom(acidMoles, newSodiumMoles, totalVolL);
  if (phAfter != null) {
    if (case1PH == null) {
      setCase1PH(phAfter);
      // require the next MEASURE to reveal this stored CASE result
      setCase1Version(measurementVersion + 1);
      setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M sodium ethanoate • Stored pH in CASE 1`);
    } else if (case2PH == null) {
      setCase2PH(phAfter);
      setCase2Version(measurementVersion + 1);
      // stop prompting the user to measure once CASE 2 is recorded
      setShouldBlinkMeasure(false);
      setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M sodium ethanoate • Stored pH in CASE 2`);
    } else {
      setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M sodium ethanoate`);
    }
  } else {
    setShowToast(`Added ${v.toFixed(1)} mL of 0.1 M sodium ethanoate`);
  }

  // If this is the second (or later) sodium addition and we're currently on step 8,
  // immediately mark step 8 complete so the UI advances to step 9.
  // Use a guard to avoid calling the parent's completion twice.
  let autoAdvanced = false;
  if (nextAdditions >= 2 && currentStep === 8 && !completedSteps.includes(8)) {
    onStepComplete(8);
    autoAdvanced = true;
  }

  // mark the step complete when the user confirms adding the sodium ethanoate volume
  if (!autoAdvanced && !completedSteps.includes(currentStep)) onStepComplete(currentStep);
  setShowSodiumDialog(false);
  setSodiumError(null);
  setTimeout(() => setShowToast(null), 2000);

};

// Helper: compute pH given moles of HA (acid), A (conjugate base) and total volume (L)
function computePHFrom(HA: number, A: number, totalVolL: number): number | null {
  const pKa = 4.76;
  let ph: number | null = null;
  const ha = Math.max(0, HA);
  const a = Math.max(0, A);

  if (ha > 0 && a > 0) {
    const concHA = ha / totalVolL;
    const concA = a / totalVolL;
    ph = pKa + Math.log10(concA / concHA);
  } else if (ha > 0 && a === 0) {
    // approximate pH of weak acid (very rough)
    const C = ha / totalVolL;
    ph = 0.5 * (pKa - Math.log10(C));
  } else if (a > 0 && ha === 0) {
    ph = 8.5; // basic approximation
  }

  if (ph === null || Number.isNaN(ph) || !isFinite(ph)) return null;
  return Math.max(0, Math.min(14, ph));
}

function applyPHResult(ph: number) {
  const rounded = ph;
  // increment measurement version so any pending CASE results become eligible to show
  setMeasurementVersion(prev => prev + 1);
  setLastMeasuredPH(rounded);
  // store measured pH as initial acid pH on first measurement
  if (initialAcidPH == null) {
    setInitialAcidPH(rounded);
    // if we're on step 4 (Place a new pH paper / Measure initial pH), mark it complete
    if (currentStep === 4 && !completedSteps.includes(4)) onStepComplete(4);
  }
  setShowToast(`Measured pH ≈ ${rounded.toFixed(2)}`);
  setTimeout(() => setShowToast(null), 2000);

  // choose paper color
  let paperColor: string | undefined = undefined;
  if (rounded < 4.5) paperColor = '#ff6b6b'; // acidic - red
  else if (rounded < 6.5) paperColor = '#ffb74d'; // weak acidic - orange
  else if (rounded < 8) paperColor = '#C8E6C9'; // near neutral - green
  else paperColor = '#64b5f6'; // basic - blue

  setEquipmentOnBench(prev => prev.map(e => {
    if (e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph')) {
      return { ...e, color: paperColor } as any;
    }
    return e;
  }));

  // Auto-complete relevant steps: initial measure (3), observe pH change (5), and post-addition measure (6)
  if (currentStep === 3 || currentStep === 5 || currentStep === 6) {
    if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);
  }
}

// When CASE 2 becomes available (measured and revealed), open results modal after 10s
const case2TimeoutRef = useRef<number | null>(null);
useEffect(() => {
  // clear any previous scheduled open
  if (case2TimeoutRef.current) {
    clearTimeout(case2TimeoutRef.current as number);
    case2TimeoutRef.current = null;
  }

  // If CASE 2 has been recorded, stop any blinking prompt immediately
  if (case2PH != null) {
    setShouldBlinkMeasure(false);
    // stop blinking "New pH paper" as results are now calculated
    setNewPaperPressed(true);
  }

  if (case2PH != null && case2Version != null && measurementVersion >= case2Version) {
    setShowToast('Opening Results in 5 seconds...');
    case2TimeoutRef.current = window.setTimeout(() => {
      setShowResultsModal(true);
      case2TimeoutRef.current = null;
    }, 5000);
    // clear the toast a bit earlier than the modal
    setTimeout(() => setShowToast(null), 4000);
  }

  return () => {
    if (case2TimeoutRef.current) {
      clearTimeout(case2TimeoutRef.current as number);
      case2TimeoutRef.current = null;
    }
  };
}, [case2PH, case2Version, measurementVersion]);

function testPH() {
  const totalVolL = Math.max(1e-6, testTubeVolume / 1000);
  if (testTubeVolume <= 0) {
    setShowToast('No solution in test tube');
    setTimeout(() => setShowToast(null), 1400);
    return;
  }

  const ph = computePHFrom(acidMoles, sodiumMoles, totalVolL);
  if (ph == null) {
    setShowToast('pH measurement inconclusive');
    setTimeout(() => setShowToast(null), 1400);
    return;
  }

  // stop prompting MEASURE (we just measured)
  setShouldBlinkMeasure(false);
  // after measuring, prompt to reset sodium if any was added and fewer than 2 additions so far
  if (sodiumVolumeAdded > 0 && sodiumAdditions < 2) setShouldBlinkReset(true);
  else setShouldBlinkReset(false);
  applyPHResult(ph);
}

const stepsProgress = (
    <div className="mb-4 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Experiment Progress</h3>
        <span className="text-sm text-blue-600 font-medium">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="flex space-x-2 mb-3">
        {experiment.stepDetails.map((step) => (
          <div key={step.id} className={`flex-1 h-2 rounded-full ${completedSteps.includes(step.id) ? 'bg-green-500' : currentStep === step.id ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSteps.includes(currentStep) ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
          {completedSteps.includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">{currentStep}</span>}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{experiment.stepDetails[currentStep-1]?.title}</h4>
          <p className="text-xs text-gray-600">{experiment.stepDetails[currentStep-1]?.description}</p>
        </div>
      </div>
    </div>
  );

  // Precompute Henderson–Hasselbalch details for the results modal
  const pKa = 4.76;
  const totalVolLForResults = Math.max(1e-6, testTubeVolume / 1000);
  const concHA = acidMoles > 0 ? acidMoles / totalVolLForResults : null;
  const concA = sodiumMoles > 0 ? sodiumMoles / totalVolLForResults : null;
  const hhRatio = concHA && concA ? concA / concHA : null;
  const hhPH = hhRatio ? Math.max(0, Math.min(14, pKa + Math.log10(hhRatio))) : null;

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
                {items.map((eq) => (
                  <PHEquipment key={eq.id} id={eq.id} name={eq.id === 'test-tube' ? '25ml Test Tube' : eq.name} icon={eq.icon} disabled={!experimentStarted} onInteract={handleInteract} />
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700"><strong>Tip:</strong> Drag equipment to the workbench following the steps.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => { if (equipmentOnBench.length) { handleRemove(equipmentOnBench[equipmentOnBench.length-1].id); } }} variant="outline" className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center">
                <Undo2 className="w-4 h-4 mr-2" /> UNDO
              </Button>

              {/* Quick access to results when CASE 2 is available */}
              {(case2PH != null && case2Version != null && measurementVersion >= case2Version) && (
                <Button onClick={() => setShowResultsModal(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white">View Results & Analysis</Button>
              )}

              <Button onClick={() => { setEquipmentOnBench([]); onReset(); }} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <WorkBench onDrop={handleDrop} isRunning={isRunning} currentStep={currentStep} onTestPH={equipmentOnBench.find(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph')) ? testPH : undefined}>

              {equipmentOnBench.map(e => (
                <PHEquipment
                  key={e.id}
                  id={e.id}
                  name={e.name}
                  icon={items.find(i => i.id === e.id)?.icon || <Beaker className="w-8 h-8" />}
                  position={e.position}
                  onRemove={handleRemove}
                  onInteract={handleInteract}
                  // show test tube volume/color when available, or pass pH paper color if present
                  {...(e.id === 'test-tube' ? { volume: testTubeVolume, color: testTubeColor } : ((e as any).color ? { color: (e as any).color } : {}))}
                />
              ))}

              {/* Contextual MEASURE action near pH paper when present */}
              {equipmentOnBench.find(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph')) && (
                (() => {
                  const phItem = equipmentOnBench.find(e => e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph'))!;
                  return (
                  <div key="measure-button" className="measure-button-wrapper" style={{ ['--left' as any]: `${phItem.position.x}px`, ['--top' as any]: `${phItem.position.y + 70}px` } as any}>
                      {(() => {
                        const paperHasColor = Boolean((phItem as any).color);
                        return (
                          <Button
                            size="sm"
                            className={`measure-action-btn bg-amber-600 text-white hover:bg-amber-700 shadow-sm ${(shouldBlinkMeasure || (!paperHasColor ? !measurePressed : !newPaperPressed)) ? 'blink-until-pressed' : ''}` }
                            onClick={() => { if (!paperHasColor) { setMeasurePressed(true); } else { setNewPaperPressed(true); }
                              // count presses and schedule results modal after 3rd press
                              setMeasureCount(prev => {
                                const next = prev + 1;
                                if (next === 3) {
                                  // only open results if CASE 2 has been recorded and is eligible to be shown
                                  if (case2PH != null && case2Version != null && measurementVersion >= case2Version) {
                                    // clear any existing timeout
                                    if (measureTimeoutRef.current) {
                                      clearTimeout(measureTimeoutRef.current as number);
                                    }
                                    setShowToast('Opening Results in 5 seconds...');
                                    measureTimeoutRef.current = window.setTimeout(() => {
                                      setShowResultsModal(true);
                                      measureTimeoutRef.current = null;
                                    }, 5000);
                                    setTimeout(() => setShowToast(null), 3500);
                                  } else {
                                    // Defer opening modal until CASE 2 is available; inform user
                                    setShowToast('Results not ready yet — complete the sodium additions to generate CASE 2');
                                    setTimeout(() => setShowToast(null), 2500);
                                  }
                                }
                                return next;
                              });

                              if (!paperHasColor) {
                                testPH();
                                return;
                              }
                              // Replace pH paper: clear tint/color but KEEP last measured value so previous results remain visible
                              setEquipmentOnBench(prev => prev.map(e => {
                                if (e.id === 'universal-indicator' || e.id.toLowerCase().includes('ph')) {
                                  const copy = { ...e } as any;
                                  delete copy.color;
                                  return copy;
                                }
                                return e;
                              }));
                              // If we're currently on step 4, advance it
                              if (currentStep === 4 && !completedSteps.includes(4)) {
                                onStepComplete(4);
                              }
                              setShowToast('New pH paper placed');
                              setTimeout(() => setShowToast(null), 1400);
                            }}
                          >
                            {!paperHasColor ? 'MEASURE' : 'New pH paper'}
                          </Button>
                        );
                      })()}
                    </div>
                  );
                })()
              )}

              {(() => {
                const sodiumItem = equipmentOnBench.find(e => (e.name && e.name.toLowerCase().includes('sodium')) || e.id.toLowerCase().includes('sodium'));
                if (!sodiumItem) return null;
                return (
                  <div key="reset-sodium" style={{ position: 'absolute', left: sodiumItem.position.x, top: sodiumItem.position.y + 150, transform: 'translate(-50%, 0)' }}>
                    <Button
                      size="sm"
                      className={`bg-red-500 text-white hover:bg-red-600 shadow-sm px-3 ${shouldBlinkReset ? 'blink-until-pressed' : ''}`}
                      onClick={() => {
                        setSodiumMoles(0);
                        setTestTubeVolume(prev => {
                          const newVol = Math.max(0, prev - sodiumVolumeAdded);
                          return Math.min(20, newVol);
                        });
                        setSodiumVolumeAdded(0);
                        setShouldBlinkReset(false);
                        setShowToast('Sodium ethanoate reset');
                        setTimeout(() => setShowToast(null), 1400);
                      }}
                    >
                      <span className="block font-semibold">RESET</span>
                      <span className="block text-xs">(CH₃COONa)</span>
                    </Button>
                  </div>
                );
              })()}

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
                <p className="text-xs text-gray-600">{experiment.stepDetails[currentStep-1]?.title}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Completed Steps</h4>
                <div className="space-y-1">
                  {experiment.stepDetails.map((step) => (
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

                {/* pH of Ethanoic Acid (initial) */}
                <div className="mt-8">
                  <h5 className="font-medium text-sm text-black mb-1"><span className="inline-block w-2 h-2 rounded-full bg-black mr-2" aria-hidden="true" /> <span className="inline-block mr-2 font-bold">A</span>pH of Ethanoic acid</h5>
                  <div className="text-lg text-black font-semibold">{lastMeasuredPH != null && initialAcidPH != null ? `${initialAcidPH.toFixed(2)} (${initialAcidPH < 7 ? 'Acidic' : initialAcidPH > 7 ? 'Basic' : 'Neutral'})` : 'No result yet'}</div>
                </div>

                {/* CASE results (auto-filled after adding sodium ethanoate) */}
                <div className="text-sm text-black mt-3 mb-2"><span className="inline-block w-2 h-2 rounded-full bg-black mr-2" aria-hidden="true" /> <span className="inline-block mr-2 font-bold">B</span>When Sodium Ethanoate is added</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                    <div className="font-medium">CASE 1</div>
                    <div className="text-lg text-black font-semibold">{(case1PH != null && case1Version != null && measurementVersion >= case1Version) ? `${case1PH.toFixed(2)} (${case1PH < 7 ? 'Acidic' : case1PH > 7 ? 'Basic' : 'Neutral'})` : 'No result yet'}</div>
                  </div>
                  <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                    <div className="font-medium">CASE 2</div>
                    <div className="text-lg text-black font-semibold">{(case2PH != null && case2Version != null && measurementVersion >= case2Version) ? `${case2PH.toFixed(2)} (${case2PH < 7 ? 'Acidic' : case2PH > 7 ? 'Basic' : 'Neutral'})` : 'No result yet'}</div>
                  </div>
                </div>

                {showToast && <p className="text-xs text-blue-700 mt-2">{showToast}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/* Volume dialog for 0.1 M Ethanoic (Acetic) Acid */}
      <Dialog open={showAceticDialog} onOpenChange={setShowAceticDialog}>
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
              min={10.0}
              max={15.0}
              value={aceticVolume}
              onChange={(e) => {
                const val = e.target.value;
                setAceticVolume(val);
                const parsed = parseFloat(val);
                if (Number.isNaN(parsed) || parsed < 10.0 || parsed > 15.0) {
                  setAceticError("Please enter a value between 10.0 and 15.0 mL");
                } else {
                  setAceticError(null);
                }
              }}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter volume in mL"
            />
            {aceticError && <p className="text-xs text-red-600">{aceticError}</p>}
            <p className="text-xs text-gray-500">Recommended range: 10.0 – 15.0 mL</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAceticDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddAcetic} disabled={!!aceticError || Number.isNaN(parseFloat(aceticVolume)) || parseFloat(aceticVolume) < 10.0 || parseFloat(aceticVolume) > 15.0}>Add Solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Volume dialog for 0.1 M Sodium Ethanoate (Sodium Acetate) */}
      <Dialog open={showSodiumDialog} onOpenChange={setShowSodiumDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Volume</DialogTitle>
            <DialogDescription>
              Enter the volume of 0.1 M Sodium Ethanoate (Sodium Acetate) to add to the test tube.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Volume (mL)</label>
            <input
              type="number"
              step="0.1"
              min={5.0}
              max={10.0}
              value={sodiumVolume}
              onChange={(e) => {
                const val = e.target.value;
                setSodiumVolume(val);
                const parsed = parseFloat(val);
                if (Number.isNaN(parsed) || parsed < 5.0 || parsed > 10.0) {
                  setSodiumError("Please enter a value between 5.0 and 10.0 mL");
                } else {
                  setSodiumError(null);
                }
              }}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter volume in mL"
            />
            {sodiumError && <p className="text-xs text-red-600">{sodiumError}</p>}
            <p className="text-xs text-gray-500">Recommended range: 5.0 – 10.0 mL</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSodiumDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddSodium} disabled={!!sodiumError || Number.isNaN(parseFloat(sodiumVolume)) || parseFloat(sodiumVolume) < 5.0 || parseFloat(sodiumVolume) > 10.0}>Add Solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results modal shown after CASE 2 is available */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Experiment Results & Analysis</DialogTitle>
            <DialogDescription>Complete analysis of your pH buffer experiment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded bg-red-50">
                <div className="text-sm font-medium">0.1 M Ethanoic Acid</div>
                <div className="text-lg font-semibold mt-2">{initialAcidPH != null ? `${initialAcidPH.toFixed(2)} (Acidic)` : '—'}</div>
              </div>
              <div className="p-4 border rounded bg-green-50">
                <div className="text-sm font-medium">0.1 M Sodium Ethanoate (after addition)</div>
                <div className="text-lg font-semibold mt-2">{case2PH != null ? `${case2PH.toFixed(2)} (${case2PH < 7 ? 'Acidic' : case2PH > 7 ? 'Basic' : 'Neutral'})` : '—'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">pH Comparison Analysis</h4>
              <p className="text-sm text-gray-700">Initial pH: {initialAcidPH != null ? initialAcidPH.toFixed(2) : 'N/A'}. After adding sodium ethanoate the pH shifted to {case2PH != null ? case2PH.toFixed(2) : 'N/A'}. This indicates buffer formation (CH3COOH/CH3COO–) and can be interpreted using the Henderson–Hasselbalch relation.</p>

              {/* Henderson–Hasselbalch calculation details */}
              <div className="mt-3 p-3 bg-gray-50 border rounded text-sm">
                <div className="font-medium mb-2">Henderson–Hasselbalch Calculation</div>
                {concHA != null && concA != null && hhRatio != null ? (
                  <div className="space-y-1">
                    <div>pKa = {pKa.toFixed(2)}</div>
                    <div>[HA] = {concHA.toExponential(3)} M</div>
                    <div>[A⁻] = {concA.toExponential(3)} M</div>
                    <div>[A⁻]/[HA] = {hhRatio.toFixed(3)}</div>
                    <div className="font-semibold">pH = pKa + log10([A⁻]/[HA]) = {pKa.toFixed(2)} + log10({hhRatio.toFixed(3)}) ≈ {hhPH != null ? hhPH.toFixed(2) : 'N/A'}</div>
                  </div>
                ) : (
                  <div>
                    {/* Fallback approximations when only one species is present */}
                    {acidMoles > 0 && sodiumMoles === 0 && (
                      <div>Only weak acid present. Approximate pH using weak acid formula: pH ≈ 0.5*(pKa - log10([HA])) ≈ {initialAcidPH != null ? initialAcidPH.toFixed(2) : 'N/A'}</div>
                    )}
                    {sodiumMoles > 0 && acidMoles === 0 && (
                      <div>Only conjugate base present. Solution will be basic. Measured/estimated pH: {case2PH != null ? case2PH.toFixed(2) : 'N/A'}</div>
                    )}
                    {acidMoles === 0 && sodiumMoles === 0 && <div>No reagents present to compute Henderson–Hasselbalch values.</div>}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Action Timeline</h4>
              <ol className="list-decimal list-inside text-sm text-gray-700">
                <li>Added ethanoic acid — initial pH recorded {initialAcidPH != null ? `(${initialAcidPH.toFixed(2)})` : ''}</li>
                <li>Added sodium ethanoate — stored CASE values {case1PH != null ? `CASE1: ${case1PH.toFixed(2)}` : ''} {case2PH != null ? `CASE2: ${case2PH.toFixed(2)}` : ''}</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Final Experimental State</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <div className="text-sm font-medium">Solution</div>
                  <div className="text-sm mt-1">pH: {case2PH != null ? case2PH.toFixed(2) : 'N/A'}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm font-medium">Notes</div>
                  <div className="text-sm mt-1">Buffer formed: CH3COOH/CH3COO–</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="w-full flex justify-between">
              <div className="flex items-center space-x-2">
                <Link href="/">
                  <Button className="bg-gray-500 hover:bg-gray-600 text-white flex items-center space-x-2">
                    <Home className="w-4 h-4" />
                    <span>Return to Experiments</span>
                  </Button>
                </Link>
                {/* QUIZ opens an inline quiz modal */}
                <Button onClick={() => setShowQuizModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white">QUIZ</Button>
              </div>

              <Button onClick={() => setShowResultsModal(false)} className="bg-blue-500 hover:bg-blue-600 text-white">Close Analysis</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal (inline, mirrors Results & Analysis style) */}
      <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-black">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-2xl">Buffer pH — Quiz</CardTitle>
                {quizSubmitted && (
                  <div className="text-blue-600 font-semibold">Marks obtained ({score} / 5)</div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 quiz-content">

                <section className="quiz-item">
                  <h3 className="font-semibold">Q1. Ethanoic acid alone has a pH ≈ 2.9 at 0.1 M. When sodium ethanoate is added, the pH rises close to 4.7. This is mainly because:</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'A'} onChange={() => handleSelect('q1', 'A')} />
                      <span>A) Sodium ethanoate is strongly basic and neutralizes all the acid.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'B'} onChange={() => handleSelect('q1', 'B')} />
                      <span>B) The common ion effect reduces the dissociation of ethanoic acid.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'C'} onChange={() => handleSelect('q1', 'C')} />
                      <span>C) The volume of solution increases, diluting the acid.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'D'} onChange={() => handleSelect('q1', 'D')} />
                      <span>D) Sodium ethanoate removes H⁺ ions by precipitation.</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q1;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Sodium ethanoate is strongly basic and neutralizes all the acid.' : selected === 'B' ? 'B) The common ion effect reduces the dissociation of ethanoic acid.' : selected === 'C' ? 'C) The volume of solution increases, diluting the acid.' : selected === 'D' ? 'D) Sodium ethanoate removes H⁺ ions by precipitation.' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The common ion effect reduces the dissociation of ethanoic acid.</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q2. At the point where [CH₃COOH] = [CH₃COONa], the pH of the solution equals:</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'A'} onChange={() => handleSelect('q2', 'A')} />
                      <span>A) 7.0 (neutral point)</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'B'} onChange={() => handleSelect('q2', 'B')} />
                      <span>B) The pKa of acetic acid</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'C'} onChange={() => handleSelect('q2', 'C')} />
                      <span>C) The pKb of acetate ion</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'D'} onChange={() => handleSelect('q2', 'D')} />
                      <span>D) The ionic product of water (Kw)</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q2;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) 7.0 (neutral point)' : selected === 'B' ? 'B) The pKa of acetic acid' : selected === 'C' ? 'C) The pKb of acetate ion' : selected === 'D' ? 'D) The ionic product of water (Kw)' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The pKa of acetic acid</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q3. Why does the solution resist large pH changes upon addition of small amounts of strong acid or base once sodium ethanoate is added?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'A'} onChange={() => handleSelect('q3', 'A')} />
                      <span>A) Because sodium ethanoate hydrolyzes completely to form OH⁻</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'B'} onChange={() => handleSelect('q3', 'B')} />
                      <span>B) Because the weak acid and its conjugate base establish a buffer equilibrium</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'C'} onChange={() => handleSelect('q3', 'C')} />
                      <span>C) Because sodium ions neutralize all OH⁻ ions</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'D'} onChange={() => handleSelect('q3', 'D')} />
                      <span>D) Because dilution prevents ionization</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q3;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) Because sodium ethanoate hydrolyzes completely to form OH⁻' : selected === 'B' ? 'B) Because the weak acid and its conjugate base establish a buffer equilibrium' : selected === 'C' ? 'C) Because sodium ions neutralize all OH⁻ ions' : selected === 'D' ? 'D) Because dilution prevents ionization' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Because the weak acid and its conjugate base establish a buffer equilibrium</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q4. Which of the following best explains the shape of the pH vs. added sodium ethanoate volume curve?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'A'} onChange={() => handleSelect('q4', 'A')} />
                      <span>A) A linear increase in pH due to direct neutralization</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'B'} onChange={() => handleSelect('q4', 'B')} />
                      <span>B) A rapid rise initially, then leveling off near pKa due to buffer action</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'C'} onChange={() => handleSelect('q4', 'C')} />
                      <span>C) A sharp fall in pH due to hydrolysis of sodium acetate</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'D'} onChange={() => handleSelect('q4', 'D')} />
                      <span>D) A constant pH value because sodium acetate is neutral</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q4;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) A linear increase in pH due to direct neutralization' : selected === 'B' ? 'B) A rapid rise initially, then leveling off near pKa due to buffer action' : selected === 'C' ? 'C) A sharp fall in pH due to hydrolysis of sodium acetate' : selected === 'D' ? 'D) A constant pH value because sodium acetate is neutral' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) A rapid rise initially, then leveling off near pKa due to buffer action</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">Q5. If the Ka of ethanoic acid is 1.8 × 10⁻⁵, and you prepare a buffer with [CH₃COOH] = 0.05 M and [CH₃COONa] = 0.10 M, what would be the approximate pH?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'A'} onChange={() => handleSelect('q5', 'A')} />
                      <span>A) 4.7</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'B'} onChange={() => handleSelect('q5', 'B')} />
                      <span>B) 4.9</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'C'} onChange={() => handleSelect('q5', 'C')} />
                      <span>C) 5.0</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'D'} onChange={() => handleSelect('q5', 'D')} />
                      <span>D) 5.7</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'C';
                    const selected = quizSelections.q5;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected === 'A' ? 'A) 4.7' : selected === 'B' ? 'B) 4.9' : selected === 'C' ? 'C) 5.0' : selected === 'D' ? 'D) 5.7' : ''}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) 5.0 (pH ≈ pKa + log([A⁻]/[HA]) = 4.745 + log(0.10/0.05) ≈ 5.05)</div>
                      </>
                    );
                  })()}
                </section>

                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-2">
                  <Button variant="outline" className="flex items-center" onClick={() => { setShowQuizModal(false); setShowResultsModal(true); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiment
                  </Button>
                  <Link href="/">
                    <Button className="bg-gray-700 text-white">Return to Experiments</Button>
                  </Link>
                </div>

                  <div>
                    {!quizSubmitted && allAnswered && (
                      <Button onClick={() => setQuizSubmitted(true)} className="bg-amber-600 hover:bg-amber-700 text-white mr-2">Submit</Button>
                    )}
                    {!quizSubmitted && !allAnswered && (
                      <Button disabled className="opacity-50 cursor-not-allowed mr-2">Submit</Button>
                    )}
                    <Button variant="outline" onClick={resetQuiz}>Reset</Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
