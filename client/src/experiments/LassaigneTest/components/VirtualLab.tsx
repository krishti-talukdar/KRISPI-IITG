import React, { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Beaker, FlaskConical, Droplets, Sparkles, Eraser, Play, Wrench, Info, TestTube, Filter, Flame, ArrowLeft, RotateCcw } from "lucide-react";
import type { ExperimentMode } from "../types";
import WorkBench from "./WorkBench";

interface VirtualLabProps {
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  mode: ExperimentMode;
  onStepComplete: (stepId?: number) => void;
  onStepUndo: (stepId?: number) => void;
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
  const [hasExtract, setHasExtract] = useState(false);
  const [nitrogenPositive, setNitrogenPositive] = useState(false);
  const [sulphurPositive, setSulphurPositive] = useState<null | "lead" | "nitroprusside">(null);
  const [halide, setHalide] = useState<null | "Cl" | "Br" | "I">(null);
  const [interferenceRemoved, setInterferenceRemoved] = useState(false);

  // Preparation protocol overlay state
  const [showPreparation, setShowPreparation] = useState(false);
  const [prepStarted, setPrepStarted] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const [showPrepWorkbench, setShowPrepWorkbench] = useState(false);

  const preparationSteps = [
    {
      title: "Drag Fusion Tube to Workbench",
      detail: "Drag the fusion tube to the work bench.",
    },
    {
      title: "Handle Sodium Safely",
      detail: "Cut a dry piece of sodium under kerosene using forceps. Never touch with wet hands.",
    },
    {
      title: "Add Organic Compound",
      detail: "Add organic compound to the fusion tube.",
    },
    {
      title: "Heat to Red Hot",
      detail: "Place sodium and the organic compound in an ignition tube and heat strongly until red hot.",
    },
    {
      title: "Quench and Boil",
      detail: "Quench the hot tube in water, boil the mixture and crush the contents to dissolve sodium salts.",
    },
    {
      title: "Filter the Extract",
      detail: "Filter the hot solution to obtain a clear aqueous Lassaigne's extract for analysis.",
    },
  ];

  const equipmentItems = [
    { id: "ignition-tube", label: "Fusion Tube", icon: <TestTube className="w-8 h-8 text-blue-600 mb-2" /> },
    { id: "sodium-piece", label: "Sodium Piece (under kerosene)", icon: <Beaker className="w-8 h-8 text-emerald-600 mb-2" /> },
    { id: "organic-compound", label: "Organic Compound", icon: <FlaskConical className="w-8 h-8 text-purple-600 mb-2" /> },
    { id: "bunsen-burner", label: "Bunsen Burner", icon: <Flame className="w-8 h-8 text-orange-500 mb-2" /> },
    { id: "water-bath", label: "China Dish", icon: <Droplets className="w-8 h-8 text-blue-500 mb-2" /> },
    { id: "distilled-water", label: "Distilled Water", icon: <Droplets className="w-8 h-8 text-sky-500 mb-2" /> },
    { id: "filter-funnel", label: "Filter Paper & Funnel", icon: <Filter className="w-8 h-8 text-amber-600 mb-2" /> },
  ];

  const startPreparation = () => {
    // Open workbench-style preparation flow
    setPrepStarted(true);
    setPrepStep(0);
    setShowPreparation(false);
    setShowPrepWorkbench(true);
  };

  const finishPreparation = () => {
    setHasExtract(true);
    onStepComplete(1);
    setShowPreparation(false);
    setShowPrepWorkbench(false);
    setPrepStarted(false);
  };

  const handleSkipPreparation = () => {
    // Skip only the animation/tutorial; still assume extract prepared
    setHasExtract(true);
    onStepComplete(1);
    setShowPreparation(false);
    setShowPrepWorkbench(false);
    setPrepStarted(false);
  };

  const handleStartLabClick = () => {
    onStartExperiment();
    setShowPreparation(true);
  };

  const currentGuidedStep = mode.currentGuidedStep ?? 0;

  const actions = useMemo(() => ([
    {
      id: 1,
      stepId: 1,
      title: "Prepare Lassaigne's Extract",
      icon: <FlaskConical className="w-5 h-5" />,
      description: "Heat organic compound with sodium, then quench and filter to obtain clear extract.",
      canRun: !hasExtract,
      run: () => {
        setHasExtract(true);
        onStepComplete(1);
      },
      observation: hasExtract ? "Clear aqueous extract obtained" : "",
    },
    {
      id: 2,
      stepId: 4,
      title: "Nitrogen Test (Prussian Blue)",
      icon: <Beaker className="w-5 h-5" />,
      description: "Add FeSO₄, boil, cool, acidify with HCl, then add FeCl₃.",
      canRun: hasExtract && !nitrogenPositive,
      run: () => {
        setNitrogenPositive(true);
        onStepComplete(4);
      },
      observation: nitrogenPositive ? "Prussian blue formed → Nitrogen present" : "",
    },
    {
      id: 3,
      stepId: 6,
      title: "Sulphur Test (Lead Acetate)",
      icon: <TestTube className="w-5 h-5" />,
      description: "Acidify with acetic acid and add lead acetate.",
      canRun: hasExtract && sulphurPositive !== "lead",
      run: () => {
        setSulphurPositive("lead");
        onStepComplete(6);
      },
      observation: sulphurPositive === "lead" ? "Black ppt of PbS → Sulphur present" : "",
    },
    {
      id: 4,
      stepId: 7,
      title: "Sulphur Test (Nitroprusside)",
      icon: <Droplets className="w-5 h-5" />,
      description: "Make alkaline and add sodium nitroprusside.",
      canRun: hasExtract && sulphurPositive !== "nitroprusside",
      run: () => {
        setSulphurPositive("nitroprusside");
        onStepComplete(7);
      },
      observation: sulphurPositive === "nitroprusside" ? "Purple/violet color → Sulphur present" : "",
    },
    {
      id: 5,
      stepId: 7,
      title: "Remove Interference (for Halide Test)",
      icon: <Eraser className="w-5 h-5" />,
      description: "Boil a fresh portion with dilute HNO₃ to destroy CN⁻/S²⁻.",
      canRun: hasExtract && !interferenceRemoved,
      run: () => {
        setInterferenceRemoved(true);
        onStepComplete(7);
      },
      observation: interferenceRemoved ? "CN⁻/S²⁻ removed by HNO₃ boiling" : "",
    },
    {
      id: 6,
      stepId: 8,
      title: "Halogen Test (AgNO₃)",
      icon: <Sparkles className="w-5 h-5" />,
      description: "After HNO₃ treatment, add AgNO₃ to observe halide precipitate.",
      canRun: hasExtract && interferenceRemoved && halide == null,
      run: () => {
        const halides: Array<"Cl" | "Br" | "I"> = ["Cl", "Br", "I"];
        const picked = halides[Math.floor(Math.random() * halides.length)];
        setHalide(picked);
        onStepComplete(8);
      },
      observation:
        halide === "Cl"
          ? "White curdy ppt (AgCl)"
          : halide === "Br"
            ? "Cream ppt (AgBr)"
            : halide === "I"
              ? "Yellow ppt (AgI)"
              : "",
    },
  ]), [hasExtract, nitrogenPositive, sulphurPositive, interferenceRemoved, halide, onStepComplete]);

  const prepUndoRef = useRef<(() => void) | null>(null);

  return (
    <div className="relative min-h-[70vh] p-6">
      {!experimentStarted && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Explore Lassaigne's Test?</h3>
            <p className="text-gray-600 mb-6">Start your interactive journey with qualitative analysis. Prepare Lassaigne's extract and detect nitrogen, sulphur, and halides using classic spot tests.</p>
            <button onClick={handleStartLabClick} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 mx-auto transform hover:scale-105">
              <Play className="w-5 h-5" />
              <span>Start Virtual Lab</span>
            </button>
          </div>
        </div>
      )}

      {/* Preparation protocol overlay */}
      {experimentStarted && showPreparation && !hasExtract && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-blue-700">Lassaigne's Extract Preparation Protocol</h3>
              <p className="text-sm text-gray-600">Watch the proper technique for safe sodium fusion and extract preparation.</p>
            </div>
            <div className="px-6 py-6 text-center">
              {!prepStarted ? (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FlaskConical className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Interactive Extract Preparation</h4>
                  <p className="text-gray-700 mb-4">Follow a short guided sequence to prepare a clear sodium fusion extract used in all subsequent tests.</p>
                  <p className="text-gray-600 text-sm mb-6">Tip: You can skip the animation if you're already familiar with the procedure.</p>
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-3 text-sm max-w-xl mx-auto mb-6">
                    Important: Sodium reacts violently with water. Handle under kerosene with forceps and use a safety shield when heating.
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={startPreparation} className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white">
                      <Play className="mr-2 h-4 w-4" /> Start Preparation
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 text-left">
                    <div className="text-sm text-gray-600">Step {prepStep + 1} of {preparationSteps.length}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${((prepStep + 1) / preparationSteps.length) * 100}%` }} />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{preparationSteps[prepStep].title}</h4>
                  <p className="text-gray-700 mb-6">{preparationSteps[prepStep].detail}</p>
                  <div className="flex items-center justify-center gap-3">
                    {prepStep < preparationSteps.length - 1 ? (
                      <Button onClick={() => setPrepStep((s) => s + 1)} className="bg-blue-600 hover:bg-blue-700 text-white">Next</Button>
                    ) : (
                      <Button onClick={finishPreparation} className="bg-emerald-600 hover:bg-emerald-700 text-white">Finish & Use Extract</Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPrepWorkbench && !hasExtract ? (
        <>
          <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Preparation Progress</h3>
              <span className="text-sm text-blue-600 font-medium">Step {prepStep + 1} of {preparationSteps.length}</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">{prepStep + 1}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{preparationSteps[prepStep].title}</h4>
                <p className="text-sm text-gray-600 mb-2">{preparationSteps[prepStep].detail}</p>
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Follow the step on the workbench</div>
              </div>
              <div className="flex items-center gap-2">
                {prepStep < preparationSteps.length - 1 ? (
                  <Button onClick={() => setPrepStep((s) => s + 1)} className="bg-blue-600 hover:bg-blue-700 text-white">Next</Button>
                ) : (
                  <Button onClick={finishPreparation} className="bg-emerald-600 hover:bg-emerald-700 text-white">Finish</Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-0">
            {/* Equipment - Left */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                  Equipment
                </h3>

                <div className="space-y-3">
                  {equipmentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("equipment", item.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      {item.icon}
                      <span className="text-sm font-medium text-gray-700 text-center">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  Drag equipment into the workbench center area.
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Chemical Equations</h4>
                <div className="text-center text-xs font-mono leading-relaxed bg-gray-50 rounded-lg p-3 border">
                  <div>Na + C + N → NaCN</div>
                  <div>2Na + S → Na₂S</div>
                  <div>Na + X → NaX (X = Cl, Br, I)</div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">Sodium fusion converts elements to ionic salts</div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (!hasExtract && prepUndoRef.current) {
                      prepUndoRef.current();
                      return;
                    }
                    if (halide) setHalide(null);
                    else if (interferenceRemoved) setInterferenceRemoved(false);
                    else if (sulphurPositive) setSulphurPositive(null);
                    else if (nitrogenPositive) setNitrogenPositive(false);
                    else if (hasExtract) setHasExtract(false);
                    onStepUndo();
                  }}
                  variant="outline"
                  className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> UNDO
                </Button>
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Experiment
                </Button>
              </div>
            </div>

            {/* Workbench - Center */}
            <div className="lg:col-span-6">
              <WorkBench
                step={prepStep}
                totalSteps={preparationSteps.length}
                title={preparationSteps[prepStep].title}
                detail={preparationSteps[prepStep].detail}
                onNext={() => setPrepStep((s) => Math.min(s + 1, preparationSteps.length - 1))}
                onFinish={finishPreparation}
                equipmentItems={equipmentItems.map(({ id, label }) => ({ id, label }))}
                registerUndo={(fn) => { prepUndoRef.current = fn; }}
              />
            </div>

            {/* Analysis - Right */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-green-600" />
                  Live Analysis
                </h3>
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Current State</h4>
                  <p className="text-xs text-gray-600">Preparing Lassaigne's extract (Step {prepStep + 1} of {preparationSteps.length}).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Completed Steps</h4>
                  <div className="space-y-1">
                    {preparationSteps.map((s, idx) => (
                      <div key={idx} className={`flex items-center space-x-2 text-xs ${idx <= prepStep ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        <span>{s.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
                  Safety: Handle sodium under kerosene; use a shield when heating.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0">
          {actions.filter(a => hasExtract ? a.id !== 1 : true).map((action) => (
            <Card key={action.id} className={`transition-all ${currentGuidedStep + 1 === action.id ? 'ring-2 ring-blue-400' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">{action.icon}</div>
                  <h4 className="font-semibold text-gray-900">{action.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>

                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={action.run} disabled={!action.canRun || !experimentStarted}>
                    start experiment
                  </Button>
                  {action.id !== 1 && (
                    <Button size="sm" variant="secondary" onClick={() => onStepComplete(action.stepId)} disabled={!experimentStarted}>
                      Skip
                    </Button>
                  )}
                  {action.observation && (
                    <div className="flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-md text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> {action.observation}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="lg:col-span-2 space-y-2">
            <Button
              onClick={() => {
                if (!hasExtract && prepUndoRef.current) {
                  prepUndoRef.current();
                  return;
                }
                if (halide) setHalide(null);
                else if (interferenceRemoved) setInterferenceRemoved(false);
                else if (sulphurPositive) setSulphurPositive(null);
                else if (nitrogenPositive) setNitrogenPositive(false);
                else if (hasExtract) setHasExtract(false);
                onStepUndo();
              }}
              variant="outline"
              className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> UNDO
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Experiment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
