import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkBench } from "@/experiments/EquilibriumShift/components/WorkBench";
import { Beaker, Droplets, FlaskConical, TestTube, Undo2, CheckCircle, Home, ArrowLeft } from "lucide-react";
import { Equipment as RenderEquipment } from "@/experiments/PHComparison/components/Equipment";
import type { Experiment } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

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
  const [equipmentOnBench, setEquipmentOnBench] = useState<Array<{ id: string; name: string; position: { x: number; y: number } }>>([]);

  // Test tube visual state
  const [testTubeVolume, setTestTubeVolume] = useState(0); // mL
  const [testTubeColor, setTestTubeColor] = useState<string | undefined>(undefined);

  // Chemistry state – track strong acid (H+) moles from added HCl solutions
  const [hPlusMoles, setHPlusMoles] = useState(0);
  const [lastMeasuredPH, setLastMeasuredPH] = useState<number | null>(null);
  const [results, setResults] = useState<Record<string, number>>({}); // map by label
  const [lastUsedHclLabel, setLastUsedHclLabel] = useState<string | null>(null);

  // UI state
  const [showToast, setShowToast] = useState<string | null>(null);
  const [shouldBlinkMeasure, setShouldBlinkMeasure] = useState(false);
  const [shouldBlinkReset, setShouldBlinkReset] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<Record<string,string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const allAnswered = ['q1','q2','q3','q4','q5'].every((k) => Boolean(quizSelections[k]));

  // Dialog state for adding HCl volumes
  const [dialogOpenFor, setDialogOpenFor] = useState<null | { id: string; label: string; molarity: number }>(null);
  const [volumeStr, setVolumeStr] = useState("5.0");
  const [volumeError, setVolumeError] = useState<string | null>(null);

  useEffect(() => {
    setEquipmentOnBench([]);
    setTestTubeVolume(0);
    setTestTubeColor(undefined);
    setHPlusMoles(0);
    setLastMeasuredPH(null);
    setResults({});
    setLastUsedHclLabel(null);
    setShowToast(null);
    setShouldBlinkMeasure(false);
  }, [experiment.id]);

  const items = useMemo(() => {
    const iconFor = (id: string, name: string) => {
      const key = name.toLowerCase();
      if (key.includes("test tube")) return <TestTube className="w-8 h-8" />;
      if (key.includes("indicator") || key.includes("meter") || key.includes('ph')) return <FlaskConical className="w-8 h-8" />;
      return <Droplets className="w-8 h-8" />;
    };

    // Define canonical equipment for this experiment (explicit, independent of data file)
    const core = [
      { id: "test-tube", name: "25ml Test Tube" },
      { id: "hcl-0-1m", name: "Hydrochloric acid 0.1 M" },
      { id: "hcl-0-01m", name: "Hydrochloric acid 0.01 M" },
      { id: "hcl-0-001m", name: "Hydrochloric acid 0.001 M" },
      { id: "universal-indicator", name: "pH Paper / Universal Indicator" },
    ];
    return core.map((c) => ({ ...c, icon: iconFor(c.id, c.name) }));
  }, []);

  const getPosition = (id: string) => {
    const baseX = 220;
    const baseY = 160;
    if (id === "test-tube") return { x: baseX, y: baseY + 140 };
    if (id === "universal-indicator") return { x: baseX, y: baseY + 320 };
    if (id === "hcl-0-1m") return { x: baseX + 260, y: baseY + 20 };
    if (id === "hcl-0-01m") return { x: baseX + 260, y: baseY + 180 };
    if (id === "hcl-0-001m") return { x: baseX + 260, y: baseY + 340 };
    return { x: baseX, y: baseY };
  };

  const handleDrop = (id: string, x: number, y: number, action: "new" | "move" = "new") => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (action === "move") {
      setEquipmentOnBench((prev) => prev.map((e) => (e.id === id ? { ...e, position: { x, y } } : e)));
      return;
    }

    if (!equipmentOnBench.find((e) => e.id === id)) {
      const fixed = id === "test-tube" || id === "universal-indicator" || id.startsWith("hcl-");
      const pos = getPosition(id);
      setEquipmentOnBench((prev) => [
        ...prev,
        { id, name: item.name, position: fixed ? { ...pos } : { x, y } },
      ]);
      // Mark progress for first interaction(s)
      if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);
    }
  };

  const handleRemove = (id: string) => {
    setEquipmentOnBench((prev) => prev.filter((e) => e.id !== id));
    if (onStepUndo) onStepUndo();
  };

  const openHclDialog = (id: string) => {
    const map: Record<string, { label: string; molarity: number }> = {
      "hcl-0-1m": { label: "0.1 M HCl", molarity: 0.1 },
      "hcl-0-01m": { label: "0.01 M HCl", molarity: 0.01 },
      "hcl-0-001m": { label: "0.001 M HCl", molarity: 0.001 },
    };
    setDialogOpenFor({ id, ...map[id] });
    setVolumeStr("10.0");
    setVolumeError(null);
  };

  const confirmAddHcl = () => {
    if (!dialogOpenFor) return;
    const v = parseFloat(volumeStr);
    if (Number.isNaN(v) || v < 10.0 || v > 15.0) {
      setVolumeError("Please enter a value between 10.0 and 15.0 mL");
      return;
    }
    const vL = v / 1000; // L
    const moles = dialogOpenFor.molarity * vL; // strong acid: [H+] from HCl
    setHPlusMoles((m) => m + moles);

    // Record last used HCl concentration for result mapping
    const shortLabel = dialogOpenFor.molarity === 0.1 ? '0.1 M' : dialogOpenFor.molarity === 0.01 ? '0.01 M' : '0.001 M';
    setLastUsedHclLabel(shortLabel);

    setTestTubeVolume((vol) => Math.max(0, Math.min(25, vol + v)));

    // tint solution light-blue when HCl is added
    setTestTubeColor("rgba(100,181,246,0.6)");

    setShowToast(`Added ${v.toFixed(1)} mL of ${dialogOpenFor.label}`);
    setTimeout(() => setShowToast(null), 1800);

    // Encourage measuring after adding an acid
    setShouldBlinkMeasure(true);

    if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);

    setDialogOpenFor(null);
  };

  const resetHcl = () => {
    setTestTubeVolume(0);
    setHPlusMoles(0);
    setTestTubeColor(undefined);
    setLastMeasuredPH(null);
    // Preserve previously recorded pH results in Live Analysis — do not clear setResults()
    setEquipmentOnBench(prev => prev.map(e => e.id === 'universal-indicator' ? ({ ...(e as any), color: undefined } as any) : e));
    setShouldBlinkReset(false);
    setLastUsedHclLabel(null);
    setShowToast('HCl reset');
    setTimeout(() => setShowToast(null), 1400);
  };

  // Quiz handlers for Results modal
  const handleSelect = (q: string, v: string) => {
    setQuizSelections((s) => ({ ...s, [q]: v }));
  };

  const resetQuiz = () => {
    setQuizSelections({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const computeScore = () => {
    const correct: Record<string,string> = { q1: 'B', q2: 'C', q3: 'C', q4: 'B', q5: 'B' };
    let sc = 0;
    (Object.keys(correct) as Array<keyof typeof correct>).forEach((k) => {
      if (quizSelections[k] === correct[k]) sc += 1;
    });
    setScore(sc);
  };

  function computePH(): number | null {
    const totalVolL = Math.max(1e-6, testTubeVolume / 1000);
    const concH = hPlusMoles / totalVolL;
    if (!isFinite(concH) || concH <= 0) return null;
    const ph = -Math.log10(concH);
    return Math.max(0, Math.min(14, ph));
  }

  function testPH() {
    if (testTubeVolume <= 0) {
      setShowToast("No solution in test tube");
      setTimeout(() => setShowToast(null), 1400);
      return;
    }
    const ph = computePH();
    if (ph == null) {
      setShowToast("pH measurement inconclusive");
      setTimeout(() => setShowToast(null), 1400);
      return;
    }
    setLastMeasuredPH(ph);
    setShowToast(`Measured pH ≈ ${ph.toFixed(2)}`);
    setTimeout(() => setShowToast(null), 1800);
    setShouldBlinkMeasure(false);
    setShouldBlinkReset(true);

    // Update indicator color
    let paperColor: string | undefined = undefined;
    if (ph < 2) paperColor = "#e53935"; // red
    else if (ph < 4) paperColor = "#fb8c00"; // orange
    else if (ph < 7) paperColor = "#fdd835"; // yellow
    else if (ph < 8) paperColor = "#8bc34a"; // green
    else paperColor = "#64b5f6"; // blue

    setEquipmentOnBench((prev) => prev.map((e) => (e.id === "universal-indicator" ? ({ ...(e as any), color: paperColor } as any) : e)));

    // Store under the concentration actually used last; fall back to presence on bench
    let label = lastUsedHclLabel;
    if (!label) {
      const placed = equipmentOnBench.map((e) => e.id);
      label = placed.includes('hcl-0-1m') ? '0.1 M' : placed.includes('hcl-0-01m') ? '0.01 M' : placed.includes('hcl-0-001m') ? '0.001 M' : 'Sample';
    }
    setResults((r) => ({ ...r, [label as string]: ph }));

    // If the 0.001 M result was just recorded, open the Results & Analysis modal
    if (label === '0.001 M') {
      setShouldBlinkReset(false);
      setTimeout(() => {
        setShowResultsModal(true);
      }, 5000);
    }

    // Map to guided steps in the dataset
    if (currentStep === 3 || currentStep === 4) {
      if (!completedSteps.includes(currentStep)) onStepComplete(currentStep);
    }
  }

  const stepsProgress = (
    <div className="mb-4 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Experiment Progress</h3>
        <span className="text-sm text-blue-600 font-medium">Step {currentStep} of {experiment.stepDetails.length}</span>
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

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        {stepsProgress}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Equipment */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                Equipment
              </h3>
              <div className="space-y-3">
                {items.map((eq) => (
                  <div key={eq.id} className="equipment-card" draggable onDragStart={(e) => { e.dataTransfer.setData('equipment', eq.id); }} onDoubleClick={() => { if (eq.id.startsWith('hcl-')) openHclDialog(eq.id); }}>
                    <div className="equipment-icon"><div className="equipment-icon-inner">{eq.icon}</div></div>
                    <div className="equipment-name mt-2">{eq.name}</div>
                  </div>
                ))}

                {/* RESET HCL button placed below HCl bottles */}
                <div className="mt-2">
                  <Button onClick={resetHcl} variant="outline" className={`w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100 ${shouldBlinkReset ? 'blink-until-pressed' : ''}`}>RESET HCL</Button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700"><strong>Tip:</strong> Drag equipment to the workbench following the steps.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => { if (equipmentOnBench.length) { const id = equipmentOnBench[equipmentOnBench.length-1].id; handleRemove(id); } }} variant="outline" className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center">
                <Undo2 className="w-4 h-4 mr-2" /> UNDO
              </Button>

              {/* View Results button inserted between Undo and Reset Experiment */}
              {results['0.001 M'] != null && (
                <Button onClick={() => setShowResultsModal(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white">View Results &amp; Analysis</Button>
              )}

              <Button onClick={() => { setEquipmentOnBench([]); onReset(); }} variant="outline" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>
            </div>
          </div>

          {/* Workbench */}
          <div className="lg:col-span-6">
            <WorkBench onDrop={handleDrop} isRunning={isRunning} currentStep={currentStep} onTestPH={equipmentOnBench.find(e => e.id === 'universal-indicator') ? testPH : undefined}>
              {equipmentOnBench.map((e) => {
                const itemDef = items.find((i) => i.id === e.id);
                return (
                  <RenderEquipment
                    key={e.id}
                    id={e.id}
                    name={e.name}
                    icon={itemDef?.icon || <Beaker className="w-8 h-8" />}
                    position={e.position}
                    onRemove={handleRemove}
                    color={e.id === 'test-tube' ? testTubeColor : (e.id === 'universal-indicator' ? (e as any).color : undefined)}
                    volume={e.id === 'test-tube' ? testTubeVolume : undefined}
                    onInteract={(id) => { if (id.startsWith('hcl-')) openHclDialog(id); }}
                  />
                );
              })}

              {/* Contextual measure button near pH paper */}
              {equipmentOnBench.find(e => e.id === 'universal-indicator') && (() => {
                const phItem = equipmentOnBench.find(e => e.id === 'universal-indicator')!;
                const paperHasColor = Boolean((phItem as any).color);
                return (
                  <div key="measure-button" className="measure-button-wrapper" style={{ position: 'absolute', left: phItem.position.x, top: phItem.position.y + 70, transform: 'translate(-50%, 0)' }}>
                    <Button
                      size="sm"
                      className={`bg-amber-600 text-white hover:bg-amber-700 shadow-sm measure-action-btn ${shouldBlinkMeasure ? 'blink-until-pressed' : ''}`}
                      onClick={() => {
                        if (!paperHasColor) {
                          testPH();
                          return;
                        }
                        // Replace pH paper: clear tint/color but KEEP last measured value
                        setEquipmentOnBench(prev => prev.map(e => {
                          if (e.id === 'universal-indicator') {
                            const copy = { ...e } as any;
                            delete copy.color;
                            return copy;
                          }
                          return e;
                        }));
                        setShowToast('New pH paper placed');
                        setTimeout(() => setShowToast(null), 1400);
                      }}
                      aria-pressed={shouldBlinkMeasure}
                    >
                      {!paperHasColor ? 'MEASURE' : 'New pH paper'}
                    </Button>
                  </div>
                );
              })()}
            </WorkBench>
          </div>

          {/* Live Analysis */}
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

              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Measured pH</h4>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-purple-700">{lastMeasuredPH != null ? lastMeasuredPH.toFixed(2) : '--'}</div>
                  <div className="text-xs text-gray-500">{lastMeasuredPH != null ? (lastMeasuredPH < 7 ? 'Acidic' : lastMeasuredPH > 7 ? 'Basic' : 'Neutral') : 'No measurement yet'}</div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  {(["0.1 M", "0.01 M", "0.001 M"] as const).map((lab) => (
                    <div key={lab} className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                      <div className="font-medium">HCl {lab}</div>
                      <div className="text-lg text-black font-semibold">{results[lab] != null ? `${results[lab].toFixed(2)} (${results[lab] < 7 ? 'Acidic' : results[lab] > 7 ? 'Basic' : 'Neutral'})` : 'No result yet'}</div>
                    </div>
                  ))}
                </div>

                {showToast && <p className="text-xs text-blue-700 mt-2">{showToast}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for adding HCl volumes */}
  <Dialog open={!!dialogOpenFor} onOpenChange={(open) => { if (!open) setDialogOpenFor(null); }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Enter Volume</DialogTitle>
        <DialogDescription>Enter the volume of {dialogOpenFor?.label} to add to the test tube.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <label className="text-sm font-medium">Volume (mL)</label>
        <input
          type="number"
          step={0.1}
          min={10.0}
          max={15.0}
          value={volumeStr}
          onChange={(e) => {
            const val = e.target.value;
            setVolumeStr(val);
            const parsed = parseFloat(val);
            if (Number.isNaN(parsed) || parsed < 10.0 || parsed > 15.0) setVolumeError("Please enter a value between 10.0 and 15.0 mL");
            else setVolumeError(null);
          }}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Enter volume in mL"
        />
        {volumeError && <p className="text-xs text-red-600">{volumeError}</p>}
        {!volumeError && <p className="text-xs text-gray-500">Recommended range: 10.0 – 15.0 mL</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialogOpenFor(null)}>Cancel</Button>
        <Button onClick={confirmAddHcl} disabled={!!volumeError || Number.isNaN(parseFloat(volumeStr)) || parseFloat(volumeStr) < 10.0 || parseFloat(volumeStr) > 15.0}>Add Solution</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

      {/* Results modal (styled like Ethanoic Buffer results) */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black">Experiment Results & Analysis</DialogTitle>
            <DialogDescription className="text-black">Complete analysis of your HCl pH measurement experiment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-black">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <div className="text-sm font-medium text-black">Measured pH (latest)</div>
                <div className="text-3xl font-semibold mt-2 text-black">{lastMeasuredPH != null ? `${lastMeasuredPH.toFixed(2)} (${lastMeasuredPH < 7 ? 'Acidic' : lastMeasuredPH > 7 ? 'Basic' : 'Neutral'})` : 'No measurement'}</div>
              </div>

              <div className="p-4 border rounded bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="text-sm font-medium text-black">Latest Recorded Concentration</div>
                <div className="text-lg font-semibold mt-2 text-black">{lastUsedHclLabel ? `${lastUsedHclLabel} — ${results[lastUsedHclLabel] != null ? `${results[lastUsedHclLabel].toFixed(2)} (${results[lastUsedHclLabel] < 7 ? 'Acidic' : results[lastUsedHclLabel] > 7 ? 'Basic' : 'Neutral'})` : 'No result'}` : '—'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-black">pH Comparison Analysis</h4>
              <p className="text-sm text-black">Measured pH values should increase as HCl concentration decreases. Review the recorded pH values below and consider sources of experimental error such as indicator range, dilution accuracy, or contamination. Below we provide expected theoretical pH values for ideal dilution and a comparison to measured results.</p>

              <div className="mt-3 p-3 bg-white border rounded text-sm text-black">
                <div className="font-medium mb-2 text-black">Recorded pH by concentration (measured vs expected)</div>
                {(() => {
                  const colorMap: Record<string,string> = {
                    '0.1 M': 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
                    '0.01 M': 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
                    '0.001 M': 'bg-gradient-to-r from-green-50 to-green-100 border-green-200',
                  };

                  return (["0.1 M","0.01 M","0.001 M"] as const).map((lab) => {
                    const expected = lab === '0.1 M' ? 1.00 : lab === '0.01 M' ? 2.00 : 3.00;
                    const measured = results[lab];
                    const deviation = measured != null ? (measured - expected).toFixed(2) : '-';
                    const status = measured == null ? 'No measurement' : Math.abs(Number(deviation)) < 0.2 ? 'Good agreement' : Math.abs(Number(deviation)) < 0.6 ? 'Moderate deviation' : 'Significant deviation';
                    const cls = colorMap[lab] || 'bg-white border-gray-200';

                    return (
                      <div key={lab} className={`mb-2 p-2 rounded border ${cls} text-black`}>
                        <div className="font-medium text-black">HCl {lab}</div>
                        <div className="text-sm mt-1 text-black">Expected (ideal): pH {expected.toFixed(2)}</div>
                        <div className="text-sm mt-1 text-black">Measured: {measured != null ? `${measured.toFixed(2)} (${measured < 7 ? 'Acidic' : measured > 7 ? 'Basic' : 'Neutral'})` : 'No result recorded'}</div>
                        <div className="text-sm mt-1 text-black">Deviation: {deviation === '-' ? '-' : `${deviation} pH units`} — {status}</div>
                        <div className="text-xs mt-1 text-black">Notes: {measured == null ? 'No data to assess.' : status === 'Good agreement' ? 'Measured value is within experimental uncertainty of the theoretical value.' : status === 'Moderate deviation' ? 'Check dilution accuracy, indicator range and reading technique.' : 'Large deviation — inspect contamination, indicator limitations, or instrument calibration.'}</div>
                      </div>
                    );
                  });
                })()}

                {/* Summary interpretation */}
                <div className="mt-3 p-3 border rounded bg-gradient-to-r from-yellow-50 to-white text-black">
                  <div className="font-medium text-black">Interpretation</div>
                  <div className="text-sm mt-1 text-black">Theoretical pH values for strong HCl are calculated as pH = -log10([H+]). For ideal dilutions: 0.1 M → pH 1.00, 0.01 M → pH 2.00, 0.001 M → pH 3.00. Measured values differing from these indicate experimental errors (dilution inaccuracies, indicator/color reading subjectivity, contamination) or limitations of pH paper/universal indicator at extreme pH ranges.</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-black">Action Timeline</h4>
              <ol className="list-decimal list-inside text-sm text-black">
                <li>Added HCl solutions and recorded pH values where measured.</li>
                <li>Recorded values: {Object.keys(results).length ? Object.entries(results).map(([k,v]) => `${k}: ${v.toFixed(2)}`).join(' • ') : 'No recorded values'}</li>
                <li>Recommended next steps: repeat measurements with fresh indicator strips, verify dilution volumes with calibrated pipettes, and perform a blank/control measurement.</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-black">Final Experimental State</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded text-black">
                  <div className="text-sm font-medium text-black">Solution</div>
                  <div className="text-sm mt-1 text-black">pH: {lastMeasuredPH != null ? lastMeasuredPH.toFixed(2) : 'N/A'}</div>
                </div>
                <div className="p-3 border rounded text-black">
                  <div className="text-sm font-medium text-black">Notes</div>
                  <div className="text-sm mt-1 text-black">Strong acid present; ensure proper dilution and indicator range when measuring. Use appropriate PPE and neutralize waste before disposal. Consider instrument calibration if multiple samples deviate significantly from expected.</div>
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
                <Button onClick={() => setShowQuizModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white">QUIZ</Button>
              </div>

              <Button onClick={() => setShowResultsModal(false)} className="bg-blue-500 hover:bg-blue-600 text-white">Close Analysis</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto text-black">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-2xl">HCl pH — Quiz</CardTitle>
                {quizSubmitted && (
                  <div className="text-blue-600 font-semibold">Marks obtained ({score} / 5)</div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 quiz-content">

                <section className="quiz-item">
                  <h3 className="font-semibold">1. Which of the following correctly explains why hydrochloric acid shows a lower pH than acetic acid of the same molar concentration?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'A'} onChange={() => handleSelect('q1','A')} />
                      <span>A. HCl partially ionizes in water, while CH₃COOH completely ionizes.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'B'} onChange={() => handleSelect('q1','B')} />
                      <span>B. HCl completely ionizes in water, while CH₃COOH partially ionizes.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'C'} onChange={() => handleSelect('q1','C')} />
                      <span>C. Both ionize completely, but HCl has more hydrogen atoms.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q1" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q1 === 'D'} onChange={() => handleSelect('q1','D')} />
                      <span>D. pH depends only on color of the indicator, not on ionization.</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q1;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) HCl completely ionizes in water, while CH₃COOH partially ionizes.</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">2. If the concentration of HCl solution is decreased from 0.1 M to 0.001 M, the pH value will—</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'A'} onChange={() => handleSelect('q2','A')} />
                      <span>A. Increase by 1</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'B'} onChange={() => handleSelect('q2','B')} />
                      <span>B. Decrease by 1</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'C'} onChange={() => handleSelect('q2','C')} />
                      <span>C. Increase by 2</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q2" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q2 === 'D'} onChange={() => handleSelect('q2','D')} />
                      <span>D. Decrease by 2</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'C';
                    const selected = quizSelections.q2;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) Increase by 2</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">3. Which of the following statements about universal indicator is true?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'A'} onChange={() => handleSelect('q3','A')} />
                      <span>A. It gives the same color for all acids.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'B'} onChange={() => handleSelect('q3','B')} />
                      <span>B. It changes color only in basic solutions.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'C'} onChange={() => handleSelect('q3','C')} />
                      <span>C. It is a mixture of several pH indicators that cover a wide range of pH values.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q3" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q3 === 'D'} onChange={() => handleSelect('q3','D')} />
                      <span>D. It is used only for very strong acids and bases.</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'C';
                    const selected = quizSelections.q3;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) It is a mixture of several pH indicators that cover a wide range of pH values.</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">4. When using pH paper to determine the acidity of a solution, accuracy is limited because—</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'A'} onChange={() => handleSelect('q4','A')} />
                      <span>A. The paper reacts chemically with the acid.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'B'} onChange={() => handleSelect('q4','B')} />
                      <span>B. The pH color chart gives only approximate readings.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'C'} onChange={() => handleSelect('q4','C')} />
                      <span>C. The pH paper dissolves in acid.</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q4" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q4 === 'D'} onChange={() => handleSelect('q4','D')} />
                      <span>D. The paper measures temperature instead of pH.</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q4;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The pH color chart gives only approximate readings.</div>
                      </>
                    );
                  })()}
                </section>

                <section className="quiz-item">
                  <h3 className="font-semibold">5. Why must acid always be added to water during dilution and not the reverse?</h3>
                  <div className="mt-2 space-y-2">
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="A" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'A'} onChange={() => handleSelect('q5','A')} />
                      <span>A. To reduce the freezing point of the mixture</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="B" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'B'} onChange={() => handleSelect('q5','B')} />
                      <span>B. To prevent violent splashing due to exothermic reaction</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="C" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'C'} onChange={() => handleSelect('q5','C')} />
                      <span>C. To avoid dilution errors</span>
                    </label>
                    <label className="quiz-option flex items-start space-x-2">
                      <input type="radio" name="q5" value="D" className="mt-1" disabled={quizSubmitted} checked={quizSelections.q5 === 'D'} onChange={() => handleSelect('q5','D')} />
                      <span>D. To keep the color of the solution unchanged</span>
                    </label>
                  </div>
                  {quizSubmitted && (() => {
                    const correct = 'B';
                    const selected = quizSelections.q5;
                    const yourClass = selected === correct ? 'mt-2 text-sm text-green-700 font-medium' : 'mt-2 text-sm text-red-600 font-medium';
                    return (
                      <>
                        <div className={yourClass}>Your answer: {selected}</div>
                        <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) To prevent violent splashing due to exothermic reaction</div>
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
                      <Button onClick={() => { setQuizSubmitted(true); computeScore(); }} className="bg-amber-600 hover:bg-amber-700 text-white mr-2">Submit</Button>
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
