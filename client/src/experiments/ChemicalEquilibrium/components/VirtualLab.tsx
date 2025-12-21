import React, { useState, useCallback, useEffect } from "react";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlaskConical, Atom, BookOpen, List, Play, Pause, TestTube, Droplet, Beaker } from "lucide-react";
import {
  CHEMICAL_EQUILIBRIUM_CHEMICALS,
  CHEMICAL_EQUILIBRIUM_EQUIPMENT,
  DEFAULT_MEASUREMENTS,
  PH_HCL_CHEMICALS,
  PH_HCL_EQUIPMENT,
} from "../constants";
import ChemicalEquilibriumData, { PHHClExperiment } from "../data";
import type {
  Chemical as ChemicalDefinition,
  Equipment as EquipmentDefinition,
  EquipmentPosition,
  CobaltReactionState,
  Measurements,
  Result,
  ExperimentStep,
  ChemicalEquilibriumExperiment,
} from "../types";

interface ChemicalEquilibriumVirtualLabProps {
  step: ExperimentStep;
  onStepComplete: () => void;
  isActive: boolean;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  experiment: ChemicalEquilibriumExperiment;
  allSteps: ExperimentStep[];
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
  onResetExperiment?: () => void;
  timer?: number;
  toggleTimer?: () => void;
}

const DRY_TESTS_CHEMICALS: ChemicalDefinition[] = [
  {
    id: "ethanoic-acid-solution",
    name: "Ethanoic acid solution (CH₃COOH, 0.1 M)",
    formula: "CH₃COOH",
    color: "#FECACA",
    concentration: "0.1 M",
    volume: 30,
  },
  {
    id: "sodium-ethanoate-solution",
    name: "Sodium ethanoate solution (CH₃COONa, 0.1 M)",
    formula: "CH₃COONa",
    color: "#C4F1F9",
    concentration: "0.1 M",
    volume: 30,
  },
  {
    id: "universal-indicator",
    name: "Universal Indicator Solution",
    formula: "Indicator mix",
    color: "#C8E6C9",
    concentration: "Indicator",
    volume: 25,
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getEquipmentIcon = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes("test tube")) return <TestTube size={36} className="text-blue-600" />;
  if (key.includes("beaker")) return <Beaker size={36} className="text-cyan-600" />;
  if (key.includes("pipette") || key.includes("dropper")) return <Droplet size={36} className="text-amber-500" />;
  if (key.includes("stirrer")) return <Atom size={36} className="text-purple-600" />;
  if (key.includes("ph") || key.includes("indicator") || key.includes("meter")) return <FlaskConical size={36} className="text-emerald-600" />;
  return <Atom size={36} className="text-slate-500" />;
};

const mapDryTestEquipment = (names: string[] = []): EquipmentDefinition[] =>
  names.map((name, index) => {
    const normalized = name.toLowerCase();
    const isTestTube = normalized.includes("test tube");
    return {
      id: isTestTube ? "test_tubes" : `${slugify(name)}-${index}`,
      name,
      icon: getEquipmentIcon(name),
    };
  });

function ChemicalEquilibriumVirtualLab({
  step,
  onStepComplete,
  isActive,
  stepNumber,
  totalSteps,
  experimentTitle,
  experiment,
  allSteps,
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  onResetTimer,
  onResetExperiment,
  timer = 0,
  toggleTimer = () => {},
}: ChemicalEquilibriumVirtualLabProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const [equipmentPositions, setEquipmentPositions] = useState<
    EquipmentPosition[]
  >([]);
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [measurements, setMeasurements] =
    useState<Measurements>(DEFAULT_MEASUREMENTS);

  // Choose chemicals and equipment based on experiment
  const isPHExperiment = experimentTitle === PHHClExperiment.title;
  const isDryTestExperiment = experimentTitle === ChemicalEquilibriumData.title;
  const usePhStyleLayout = isPHExperiment || isDryTestExperiment;
  const totalGuidedSteps = experiment.stepDetails.length;
  const chemicalsList = isPHExperiment
    ? PH_HCL_CHEMICALS
    : isDryTestExperiment
      ? DRY_TESTS_CHEMICALS
      : CHEMICAL_EQUILIBRIUM_CHEMICALS;
  const equipmentList = usePhStyleLayout
    ? isPHExperiment
      ? PH_HCL_EQUIPMENT
      : mapDryTestEquipment(experiment.equipment)
    : CHEMICAL_EQUILIBRIUM_EQUIPMENT;
  const normalizedTitle = experimentTitle?.toLowerCase() ?? "";
  const isDryTestWorkbench = normalizedTitle.includes("dry tests for acid radicals");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saltDialogOpen, setSaltDialogOpen] = useState(false);
  const [saltMass, setSaltMass] = useState("0.05");
  const [saltDialogError, setSaltDialogError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(stepNumber);

  // Chemical Equilibrium specific states
  const [cobaltChlorideAdded, setCobaltChlorideAdded] = useState(false);
  const [distilledWaterAdded, setDistilledWaterAdded] = useState(false);
  const [stirrerActive, setStirrerActive] = useState(false);
  const [colorTransition, setColorTransition] = useState<
    "blue" | "transitioning" | "pink"
  >("pink");
  const [step3WaterAdded, setStep3WaterAdded] = useState(false);

  // Listen for automatic step completion events
  useEffect(() => {
    const handleStepComplete = (event: CustomEvent) => {
      if (event.detail?.nextStep === 5 && currentStep === 4) {
        setCurrentStep(5);
        onStepComplete();
        setToastMessage("Moving to Step 5...");
        setTimeout(() => setToastMessage(null), 3000);
      } else if (event.detail?.nextStep === 6 && currentStep === 5) {
        setCurrentStep(6);
        onStepComplete();
        setToastMessage("Solution turned pink! Moving to Step 6...");
        setTimeout(() => setToastMessage(null), 800);
      }
    };

    window.addEventListener(
      "stepComplete",
      handleStepComplete as EventListener,
    );

    return () => {
      window.removeEventListener(
        "stepComplete",
        handleStepComplete as EventListener,
      );
    };
  }, [currentStep, onStepComplete]);

  const cobaltReactionState: CobaltReactionState = {
    cobaltChlorideAdded,
    distilledWaterAdded,
    stirrerActive,
    colorTransition,
    step3WaterAdded,
  };

  const handleEquipmentDrop = useCallback(
    (id: string, x: number, y: number) => {
      setEquipmentPositions((prev) => {
        const existing = prev.find((pos) => pos.id === id);
        if (existing) {
          // Auto-alignment logic for Chemical Equilibrium
          if (id === "beaker_hot_water") {
            if (currentStep === 4) {
              setToastMessage("Drop the test tube into the hot water beaker!");
            }
          } else if (id === "beaker_cold_water") {
            if (currentStep === 5) {
              setToastMessage("Drop the test tube into the cold water beaker!");
            }

            const testTube = prev.find((pos) => pos.id === "test_tubes");
            if (testTube) {
              const distance = Math.sqrt(
                Math.pow(x - testTube.x, 2) + Math.pow(y - testTube.y, 2),
              );
              if (distance < 200) {
                return prev.map((pos) =>
                  pos.id === id
                    ? { ...pos, x: testTube.x, y: testTube.y + 35 }
                    : pos,
                );
              }
            }
          } else if (id === "test_tubes") {
            const hotWaterBeaker = prev.find(
              (pos) => pos.id === "beaker_hot_water",
            );
            const coldWaterBeaker = prev.find(
              (pos) => pos.id === "beaker_cold_water",
            );

            if (hotWaterBeaker) {
              const distance = Math.sqrt(
                Math.pow(x - hotWaterBeaker.x, 2) +
                  Math.pow(y - hotWaterBeaker.y, 2),
              );
              if (distance < 200) {
                if (currentStep === 4) {
                  setToastMessage(null);
                }
                return prev.map((pos) =>
                  pos.id === id
                    ? {
                        ...pos,
                        x: hotWaterBeaker.x,
                        y: hotWaterBeaker.y - 35,
                      }
                    : pos,
                );
              }
            }

            if (coldWaterBeaker && currentStep === 5) {
              const distance = Math.sqrt(
                Math.pow(x - coldWaterBeaker.x, 2) +
                  Math.pow(y - coldWaterBeaker.y, 2),
              );
              if (distance < 200) {
                setToastMessage(null);
                return prev.map((pos) =>
                  pos.id === id
                    ? {
                        ...pos,
                        x: coldWaterBeaker.x,
                        y: coldWaterBeaker.y - 35,
                      }
                    : pos,
                );
              }
            }
          }
          return prev.map((pos) => (pos.id === id ? { ...pos, x, y } : pos));
        }

        // Stirring rod automation for Chemical Equilibrium
        if (id === "stirring_rod" && distilledWaterAdded) {
          setStirrerActive(true);
          setToastMessage("Stirrer activated! Mixing solution...");
          setTimeout(() => setToastMessage(null), 3000);

          setTimeout(() => {
            setEquipmentPositions((prev) =>
              prev.filter((pos) => pos.id !== "stirring_rod"),
            );
            setToastMessage("Stirrer removed - mixing complete!");
            setTimeout(() => setToastMessage(null), 3000);
          }, 2000);

          setTimeout(() => {
            setColorTransition("transitioning");
            setToastMessage("Solution slowly turning pink...");
            setTimeout(() => setToastMessage(null), 3000);

            setTimeout(() => {
              setColorTransition("pink");
              setToastMessage("Pink hydrated cobalt complex formed!");
              setTimeout(() => setToastMessage(null), 4000);

              setTimeout(() => {
                onStepComplete();
                setCurrentStep(currentStep + 1);
                setToastMessage("Step completed! Moving to next step...");
                setTimeout(() => setToastMessage(null), 3000);
              }, 1000);
            }, 2000);
          }, 1000);
        }

        return [...prev, { id, x, y, chemicals: [] }];
      });
    },
    [currentStep, distilledWaterAdded, onStepComplete],
  );

  const handleEquipmentRemove = useCallback((id: string) => {
    setEquipmentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setToastMessage("Equipment removed from workbench");
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const handleChemicalSelect = (id: string) => {
    setSelectedChemical(selectedChemical === id ? null : id);
  };

  const handleChemicalDrop = (
    chemicalId: string,
    equipmentId: string,
    amount: number,
  ) => {
    const chemical = chemicalsList.find(
      (c) => c.id === chemicalId,
    );
    if (!chemical) return;

    // helper: map known hcl ids to numeric concentrations
    const HCL_CONC_MAP: Record<string, number> = {
      hcl_0_1: 0.1,
      hcl_0_01: 0.01,
      hcl_0_001: 0.001,
    };

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === equipmentId) {
          const newChemicals = [
            ...pos.chemicals,
            {
              id: chemicalId,
              name: chemical.name,
              color: chemical.color,
              amount,
              concentration: chemical.concentration,
            },
          ];

          // PH experiment specific interactions
          if (isPHExperiment) {
            // If we added pH paper or indicator to a beaker that already contains HCl
            const containsHCl = newChemicals.some((c) => c.id.startsWith("hcl_")) ||
              pos.chemicals.some((c) => c.id.startsWith("hcl_"));

            // If pH paper added
            if (chemicalId === "ph_paper") {
              setToastMessage("pH paper added. Read the strip to estimate pH.");
              setTimeout(() => setToastMessage(null), 3000);

              if (containsHCl) {
                // find first hcl in this beaker
                const hcl = newChemicals.find((c) => c.id.startsWith("hcl_")) || pos.chemicals.find((c) => c.id.startsWith("hcl_"));
                if (hcl) {
                  const conc = HCL_CONC_MAP[hcl.id] ?? 0.01;
                  const phValue = Number((-(Math.log10(conc))).toFixed(2));
                  setMeasurements((m) => ({ ...m, ph: phValue }));
                }
              }

            } else if (chemicalId === "universal_indicator") {
              setToastMessage("Universal indicator added. Observe color change and compare to chart.");
              setTimeout(() => setToastMessage(null), 3000);

              if (containsHCl) {
                const hcl = newChemicals.find((c) => c.id.startsWith("hcl_")) || pos.chemicals.find((c) => c.id.startsWith("hcl_"));
                if (hcl) {
                  const conc = HCL_CONC_MAP[hcl.id] ?? 0.01;
                  const phValue = Number((-(Math.log10(conc))).toFixed(2));
                  setMeasurements((m) => ({ ...m, ph: phValue }));
                }
              }

            } else if (chemicalId.startsWith("hcl_") && (containsHCl || chemicalId.startsWith("hcl_"))) {
              // HCl added to beaker - if pH paper or indicator present in same beaker, update ph
              const hasPaperOrIndicator = newChemicals.some((c) => c.id === "ph_paper" || c.id === "universal_indicator") || pos.chemicals.some((c) => c.id === "ph_paper" || c.id === "universal_indicator");
              if (hasPaperOrIndicator) {
                const conc = HCL_CONC_MAP[chemicalId] ?? 0.01;
                const phValue = Number((-(Math.log10(conc))).toFixed(2));
                setMeasurements((m) => ({ ...m, ph: phValue }));
                setToastMessage(`Measured pH: ${phValue}`);
                setTimeout(() => setToastMessage(null), 3000);
              }
            }

            // generic add toast for PH experiment
            if (!(chemicalId === "ph_paper" || chemicalId === "universal_indicator")) {
              setToastMessage(`Added ${amount}mL of ${chemical.name} to ${equipmentId}`);
              setTimeout(() => setToastMessage(null), 3000);
            }

            return { ...pos, chemicals: newChemicals };
          }

          // Chemical Equilibrium reaction logic (original behavior)
          if (equipmentId === "test_tubes") {
            if (chemicalId === "cocl2") {
              setCobaltChlorideAdded(true);
              setToastMessage(
                "Blue cobalt chloride crystals formed in test tube!",
              );
              setTimeout(() => setToastMessage(null), 3000);
            } else if (chemicalId === "water" && cobaltChlorideAdded) {
              setDistilledWaterAdded(true);

              if (currentStep === 3) {
                setStep3WaterAdded(true);
                setToastMessage(
                  "Color changing back to pink as the equilibrium shifts in the reverse direction!",
                );
                setTimeout(() => {
                  setToastMessage(null);
                  setCurrentStep(4);
                  onStepComplete();
                }, 3000);
              } else {
                setToastMessage("Add the stirrer");
                setTimeout(() => setToastMessage(null), 5000);
              }
            } else if (
              chemicalId === "hcl_conc" &&
              cobaltChlorideAdded &&
              distilledWaterAdded
            ) {
              setToastMessage(
                "Color changed from pink to blue as the equilibrium changed!",
              );
              setTimeout(() => {
                setToastMessage(null);
                setCurrentStep(3);
                setToastMessage("Moving to the next step...");
                setTimeout(() => setToastMessage(null), 3000);
              }, 2000);
            } else {
              setToastMessage(
                `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
              );
              setTimeout(() => setToastMessage(null), 3000);
            }
          } else {
            setToastMessage(
              `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
            );
            setTimeout(() => setToastMessage(null), 3000);
          }

          return { ...pos, chemicals: newChemicals };
        }
        return pos;
      }),
    );

    setSelectedChemical(null);
  };

  const handleSaltDialogOpen = () => {
    setSaltMass("0.05");
    setSaltDialogError(null);
    setSaltDialogOpen(true);
  };

  const handleSaltDialogClose = () => {
    setSaltDialogOpen(false);
    setSaltDialogError(null);
  };

  const handleAddSaltToTestTube = () => {
    const mass = parseFloat(saltMass);
    if (Number.isNaN(mass) || mass <= 0) {
      setSaltDialogError("Enter a valid positive amount.");
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === "test_tubes")) {
      setSaltDialogError("Place the test tube on the workbench first.");
      return;
    }

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === "salt_sample");
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === "salt_sample"
                ? { ...c, amount: c.amount + mass }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: "salt_sample",
                name: "Salt Sample",
                color: "#fbbf24",
                amount: mass,
                concentration: "Dry",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    setToastMessage(`Added ${mass.toFixed(2)} g of Salt Sample to the test tube.`);
    setTimeout(() => setToastMessage(null), 3000);
    handleSaltDialogClose();
  };

  const handleStartExperiment = () => {
    onStartExperiment();
  };

  const handleReset = () => {
    setEquipmentPositions([]);
    setSelectedChemical(null);
    setIsRunning(false);
    setResults([]);
    setCurrentStep(stepNumber);
    setMeasurements(DEFAULT_MEASUREMENTS);
    setToastMessage(null);
    setCobaltChlorideAdded(false);
    setDistilledWaterAdded(false);
    setStirrerActive(false);
    setColorTransition("pink");
    setStep3WaterAdded(false);
    onResetTimer();
    if (onResetExperiment) onResetExperiment();
  };

  const handleUndoStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setToastMessage("Reverted to previous step");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleViewResults = () => {
    setToastMessage("Results & analysis will appear after completing the steps.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <TooltipProvider>
      {usePhStyleLayout ? (
        <div className="w-full flex gap-6" style={{ minHeight: '75vh' }}>
          {/* Left Equipment Column */}
          <aside className="w-72 bg-white/90 border border-gray-200 rounded-lg p-4 flex flex-col">
            <h4 className="text-sm font-semibold mb-3">Equipment</h4>

            {/* Experiment progress above equipment (PH experiment) */}
            {!isDryTestWorkbench && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Experiment Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: totalSteps }).map((_, i) => {
                    const stepIndex = i + 1;
                    const active = stepIndex <= currentStep;
                    return (
                      <div
                        key={stepIndex}
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${active ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                      >
                        {stepIndex}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                {equipmentList.map((equipment) => (
                  <div
                    key={equipment.id}
                    data-testid={equipment.id}
                    className="equipment-card justify-between"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("equipment", equipment.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDoubleClick={() => handleEquipmentDrop(equipment.id, 200, 200)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="equipment-icon">
                        <div className="equipment-icon-inner">{equipment.icon}</div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">{equipment.name}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleEquipmentDrop(equipment.id, 200, 200)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded"
                      >
                        Place
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">Tip: Drag equipment from the left panel to the workbench.</div>

            {isDryTestExperiment && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleUndoStep}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded shadow-sm hover:bg-gray-50 transition"
                >
                  Undo
                </button>
                <button
                  onClick={handleViewResults}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition"
                >
                  View Results &amp; Analysis
                </button>
              </div>
            )}

            <div className="mt-4">
              <button onClick={handleReset} className="w-full px-3 py-2 bg-red-50 text-red-600 rounded">Reset Experiment</button>
            </div>
          </aside>

          {/* Center Workbench Area */}
          <main className="flex-1 flex flex-col">
          {!isDryTestWorkbench && (
            <div className="mb-4">
              <div className="rounded-lg bg-gradient-to-b from-yellow-50 to-white border p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{experimentTitle} - Interactive Workbench</h3>
                    <p className="text-xs text-gray-500 mt-1">Follow the guided steps below to complete the experiment and record observations.</p>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                          {Array.from({ length: totalSteps }).map((_, i) => {
                            const stepIndex = i + 1;
                            const active = stepIndex <= currentStep;
                            return (
                              <div key={stepIndex} className="flex flex-col items-center mr-2">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${active ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                  {stepIndex}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-xs text-gray-600">Step {currentStep} of {totalSteps}</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-600">Current Step</div>
                          <div className="font-semibold text-sm mt-1">{allSteps[currentStep - 1]?.title ?? 'No step selected'}</div>
                          <div className="text-xs text-gray-500 mt-1">{allSteps[currentStep - 1]?.description ?? ''}</div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <button onClick={toggleTimer} className="text-xs px-2 py-1 bg-white border rounded flex items-center space-x-2">
                            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span className="text-xs">{formatTime(timer ?? 0)}</span>
                          </button>
                          <button onClick={handleReset} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">Reset</button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} className="text-xs px-2 py-1 bg-gray-100 rounded">Undo</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            <div className="flex-1 p-2">
              <WorkBench
                onDrop={experimentStarted ? handleEquipmentDrop : () => {}}
                selectedChemical={experimentStarted ? selectedChemical : null}
                isRunning={isRunning}
                experimentTitle={experimentTitle}
                currentGuidedStep={currentStep}
                totalGuidedSteps={isDryTestExperiment ? totalGuidedSteps : undefined}
              >
                {equipmentPositions.map((pos) => {
                  const equipment = equipmentList.find((eq) => eq.id === pos.id);
                  return equipment ? (
                    <Equipment
                      key={pos.id}
                      id={pos.id}
                      name={equipment.name}
                      icon={equipment.icon}
                      onDrag={experimentStarted ? handleEquipmentDrop : () => {}}
                      position={pos}
                      chemicals={pos.chemicals}
                      onChemicalDrop={experimentStarted ? handleChemicalDrop : () => {}}
                      onRemove={experimentStarted ? handleEquipmentRemove : () => {}}
                      onInteract={
                        experimentStarted && equipment.name.toLowerCase().includes("salt sample")
                          ? handleSaltDialogOpen
                          : undefined
                      }
                      cobaltReactionState={cobaltReactionState}
                      allEquipmentPositions={equipmentPositions}
                      currentStep={currentStep}
                      disabled={!experimentStarted}
                    />
                  ) : null;
                })}
              </WorkBench>
            </div>

            <div className="mt-4 bg-white p-3 border rounded">
              <h4 className="text-sm font-semibold mb-2">Instructions</h4>
              <p className="text-xs text-gray-600">Follow the steps shown. Use pH paper or the universal indicator to measure pH after adding HCl to a beaker.</p>
            </div>
          </main>

          {/* Right Live Analysis Column */}
          <aside className="w-72 bg-white/90 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Live Analysis</h4>
              <div className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Current Step</div>
              <div className="mt-1 text-sm">{allSteps[currentStep - 1]?.title ?? 'No step selected'}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Completed Steps</div>
              <ul className="list-disc list-inside mt-2">
                {allSteps.slice(0, Math.max(0, currentStep - 1)).map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            </div>

            <div className="mt-2 mb-4 p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium text-gray-600">Measured pH</div>
              <div className="text-2xl font-bold mt-1">{measurements.ph ? measurements.ph : 'No result yet'}</div>
            </div>

            <div className="text-sm font-semibold mb-2">Cases</div>
            <div className="space-y-2">
              <div className="p-2 border rounded">CASE 1
                <div className="text-xs text-gray-500">No result yet</div>
              </div>
              <div className="p-2 border rounded">CASE 2
                <div className="text-xs text-gray-500">No result yet</div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div
        className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden flex"
        style={{ minHeight: "75vh" }}
      >
        {/* Main Lab Content */}
        <div className="flex-1 flex flex-col">
          {/* Equipment Bar - Top Horizontal */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center">
                <Atom className="w-4 h-4 mr-2 text-blue-600" />
                  {experimentTitle} - Equipment
                </h4>
                <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                  STEP {currentStep}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-2 overflow-x-auto pb-2">
              {equipmentList.map((equipment) => (
                <div key={equipment.id} className="flex-shrink-0">
                  <Equipment
                    id={equipment.id}
                    name={equipment.name}
                    icon={equipment.icon}
                    onDrag={experimentStarted ? handleEquipmentDrop : () => {}}
                    position={null}
                    chemicals={[]}
                    onChemicalDrop={
                      experimentStarted ? handleChemicalDrop : () => {}
                    }
                    allEquipmentPositions={equipmentPositions}
                    currentStep={currentStep}
                    disabled={!experimentStarted}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Main Work Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 relative">
              <WorkBench
                onDrop={experimentStarted ? handleEquipmentDrop : () => {}}
                selectedChemical={experimentStarted ? selectedChemical : null}
                isRunning={isRunning}
                experimentTitle={experimentTitle}
                currentGuidedStep={currentStep}
                totalGuidedSteps={isDryTestExperiment ? totalGuidedSteps : undefined}
              >
                {equipmentPositions.map((pos) => {
                  const equipment = equipmentList.find(
                    (eq) => eq.id === pos.id,
                  );
                  return equipment ? (
                    <Equipment
                      key={pos.id}
                      id={pos.id}
                      name={equipment.name}
                      icon={equipment.icon}
                      onDrag={
                        experimentStarted ? handleEquipmentDrop : () => {}
                      }
                      position={pos}
                      chemicals={pos.chemicals}
                      onChemicalDrop={
                        experimentStarted ? handleChemicalDrop : () => {}
                      }
                      onRemove={
                        experimentStarted ? handleEquipmentRemove : () => {}
                      }
                      cobaltReactionState={cobaltReactionState}
                      allEquipmentPositions={equipmentPositions}
                      currentStep={currentStep}
                      disabled={!experimentStarted}
                    />
                  ) : null;
                })}
              </WorkBench>
            </div>
          </div>

          {!isDryTestExperiment && (
            <>
              {/* Reagents Bar - Bottom Horizontal */}
              <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                  Chemical Reagents
                </h4>
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {chemicalsList.map((chemical) => (
                    <div key={chemical.id} className="flex-shrink-0">
                      <Chemical
                        id={chemical.id}
                        name={chemical.name}
                        formula={chemical.formula}
                        color={chemical.color}
                        concentration={chemical.concentration}
                        volume={chemical.volume}
                        onSelect={
                          experimentStarted ? handleChemicalSelect : () => {}
                        }
                        selected={
                          experimentStarted && selectedChemical === chemical.id
                        }
                        disabled={!experimentStarted}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
      )}
    </TooltipProvider>
  );
}

export default ChemicalEquilibriumVirtualLab;
