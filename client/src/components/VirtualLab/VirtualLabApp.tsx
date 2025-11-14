import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import { Controls } from "./Controls";
import { ResultsPanel } from "./ResultsPanel";
import { ExperimentSteps } from "./ExperimentSteps";
import { ChemicalFormulas } from "./ChemicalFormulas";
import { InsightModal } from "./InsightModal";
import { CompletionModal } from "./CompletionModal";
import { InsightDataSection } from "./InsightDataSection";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  FlaskConical,
  Atom,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Beaker,
  TestTube,
  Thermometer,
  Droplets,
  Play,
} from "lucide-react";
import type { ExperimentStep } from "@shared/schema";

interface EquipmentPosition {
  id: string;
  x: number;
  y: number;
  chemicals: Array<{
    id: string;
    name: string;
    color: string;
    amount: number;
    concentration: string;
  }>;
}

interface Result {
  id: string;
  type: "success" | "warning" | "error" | "reaction";
  title: string;
  description: string;
  timestamp: string;
  calculation?: {
    volumeAdded?: number;
    totalVolume?: number;
    concentration?: string;
    molarity?: number;
    moles?: number;
    reaction?: string;
    yield?: number;
    ph?: number;
    balancedEquation?: string;
    reactionType?: string;
    products?: string[];
    mechanism?: string[];
    thermodynamics?: {
      deltaH?: number;
      deltaG?: number;
      equilibriumConstant?: number;
    };
  };
}

interface VirtualLabProps {
  step: ExperimentStep;
  onStepComplete: () => void;
  isActive: boolean;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  allSteps: ExperimentStep[];
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
}

function VirtualLabApp({
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
}: VirtualLabProps) {
  const [equipmentPositions, setEquipmentPositions] = useState<
    EquipmentPosition[]
  >([]);
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  // Remove local isRunning state as it's now passed as prop
  const [results, setResults] = useState<Result[]>([]);
  const [showSteps, setShowSteps] = useState(true);
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [measurements, setMeasurements] = useState({
    volume: 0,
    concentration: 0,
    ph: 7,
    molarity: 0,
    moles: 0,
    temperature: 25,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentGuidedStep, setCurrentGuidedStep] = useState(1);
  const [cobaltChlorideAdded, setCobaltChlorideAdded] = useState(false);
  const [distilledWaterAdded, setDistilledWaterAdded] = useState(false);
  const [stirrerActive, setStirrerActive] = useState(false);
  const [colorTransition, setColorTransition] = useState<
    "blue" | "transitioning" | "pink"
  >("pink");
  const [step3WaterAdded, setStep3WaterAdded] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showInsightData, setShowInsightData] = useState(false);

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
        setTimeout(() => {
          setToastMessage(null);
          setShowInsightModal(true);
        }, 800);
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

  // Handler functions for insight modal
  const handleInsightYes = () => {
    setShowInsightModal(false);
    setShowInsightData(true);
  };

  const handleInsightNo = () => {
    setShowInsightModal(false);
    setShowCompletionModal(true);
  };

  const handleInsightDataBack = () => {
    setShowInsightData(false);
    setShowInsightModal(true);
  };

  const handleInsightDataComplete = () => {
    setShowInsightData(false);
    setShowCompletionModal(true);
  };

  const [, setLocation] = useLocation();

  const handleCompletionClose = () => {
    setShowCompletionModal(false);
    // Navigate back to experiments list (home page)
    setLocation("/");
  };

  // Use dynamic experiment steps from allSteps prop
  const experimentSteps = allSteps.map((stepData, index) => ({
    id: stepData.id,
    title: stepData.title,
    description: stepData.description,
    duration: parseInt(stepData.duration?.replace(/\D/g, "") || "5"),
    status: (stepData.id === currentStep
      ? "active"
      : stepData.id < currentStep
        ? "completed"
        : "pending") as "active" | "completed" | "pending",
    requirements: stepData.safety
      ? [stepData.safety]
      : [`${stepData.title} requirements`],
  }));

  // Experiment-specific chemicals and equipment
  const experimentChemicals = useMemo(() => {
    if (experimentTitle.includes("Aspirin")) {
      return [
        {
          id: "salicylic_acid",
          name: "Salicylic Acid",
          formula: "C₇H₆O₃",
          color: "#F8F8FF",
          concentration: "2.0 g",
          volume: 25,
        },
        {
          id: "acetic_anhydride",
          name: "Acetic Anhydride",
          formula: "(CH₃CO)₂O",
          color: "#DDA0DD",
          concentration: "5 mL",
          volume: 50,
        },
        {
          id: "phosphoric_acid",
          name: "Phosphoric Acid",
          formula: "H₃PO₄",
          color: "#FFA500",
          concentration: "Catalyst",
          volume: 10,
        },
        {
          id: "distilled_water",
          name: "Distilled Water",
          formula: "H₂O",
          color: "#87CEEB",
          concentration: "Pure",
          volume: 100,
        },
      ];
    } else if (experimentTitle.includes("Equilibrium")) {
      return [
        {
          id: "cocl2",
          name: "Cobalt(II) Chloride",
          formula: "CoCl₂",
          color: "#FFB6C1",
          concentration: "0.1 M",
          volume: 30,
        },
        {
          id: "hcl_conc",
          name: "Concentrated HCl",
          formula: "HCl",
          color: "#FFFF99",
          concentration: "12 M",
          volume: 20,
        },
        {
          id: "water",
          name: "Distilled Water",
          formula: "H₂O",
          color: "#87CEEB",
          concentration: "Pure",
          volume: 100,
        },
        {
          id: "ice",
          name: "Ice Bath",
          formula: "H��O(s)",
          color: "#E0F6FF",
          concentration: "0°C",
          volume: 50,
        },
      ];
    }
    return [];
  }, [experimentTitle]);

  const experimentEquipment = useMemo(() => {
    if (experimentTitle.includes("Aspirin")) {
      return [
        {
          id: "erlenmeyer_flask",
          name: "125mL Erlenmeyer Flask",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-blue-600"
            >
              <path
                d="M12 6h12v8l4 12H8l4-12V6z"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(59, 130, 246, 0.1)"
              />
              <path d="M10 6h16" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="20" r="2" fill="rgba(59, 130, 246, 0.3)" />
            </svg>
          ),
        },
        {
          id: "thermometer",
          name: "Thermometer",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-red-600"
            >
              <rect
                x="16"
                y="4"
                width="4"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(239, 68, 68, 0.1)"
              />
              <circle cx="18" cy="28" r="4" fill="currentColor" />
              <path d="M18 24v-16" stroke="currentColor" strokeWidth="1" />
            </svg>
          ),
        },
        {
          id: "graduated_cylinder",
          name: "Graduated Cylinder",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-green-600"
            >
              <rect
                x="12"
                y="6"
                width="12"
                height="24"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(34, 197, 94, 0.1)"
              />
              <path
                d="M14 12h8M14 16h8M14 20h8M14 24h8"
                stroke="currentColor"
                strokeWidth="1"
              />
              <rect
                x="10"
                y="4"
                width="16"
                height="4"
                rx="1"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
        },
        {
          id: "water_bath",
          name: "Water Bath",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-orange-600"
            >
              <rect
                x="4"
                y="12"
                width="28"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(249, 115, 22, 0.1)"
              />
              <path
                d="M8 20c2-2 4-2 6 0s4 2 6 0s4-2 6 0s4 2 6 0"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="18" cy="8" r="2" fill="rgba(249, 115, 22, 0.5)" />
              <path d="M16 6l4 4" stroke="currentColor" strokeWidth="1" />
            </svg>
          ),
        },
      ];
    } else if (experimentTitle.includes("Equilibrium")) {
      return [
        { id: "test_tubes", name: "Test Tubes", icon: <TestTube size={36} /> },
        {
          id: "beaker_hot_water",
          name: "Hot Water Beaker",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-red-600"
            >
              <path
                d="M6 8h24v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(239, 68, 68, 0.1)"
              />
              <path d="M4 8h28" stroke="currentColor" strokeWidth="2" />
              <path d="M6 20h24" stroke="currentColor" strokeWidth="1" />
              <path
                d="M10 4c0-1 1-2 2-2s2 1 2 2M16 4c0-1 1-2 2-2s2 1 2 2M22 4c0-1 1-2 2-2s2 1 2 2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          ),
        },
        {
          id: "beaker_cold_water",
          name: "Cold Water Beaker",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-blue-600"
            >
              <path
                d="M6 8h24v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(59, 130, 246, 0.1)"
              />
              <path d="M4 8h28" stroke="currentColor" strokeWidth="2" />
              <path d="M6 20h24" stroke="currentColor" strokeWidth="1" />
              <path
                d="M12 12l2 2 2-2 2 2 2-2 2 2M12 16l2 2 2-2 2 2 2-2 2 2"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
        },
      ];
    }
    return [];
  }, [experimentTitle]);

  // Guided steps for Aspirin Synthesis
  const aspirinGuidedSteps = [
    {
      id: 1,
      title: "Set up Erlenmeyer Flask",
      instruction: "Drag the 125mL Erlenmeyer Flask to the workbench",
      requiredEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 2,
      title: "Add Salicylic Acid",
      instruction: "Drag 2.0g of Salicylic Acid into the Erlenmeyer Flask",
      requiredChemical: "salicylic_acid",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 3,
      title: "Add Acetic Anhydride",
      instruction:
        "Add 5mL of Acetic Anhydride to the flask using the graduated cylinder",
      requiredChemical: "acetic_anhydride",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 4,
      title: "Add Catalyst",
      instruction: "Add 2-3 drops of Phosphoric Acid as catalyst",
      requiredChemical: "phosphoric_acid",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 5,
      title: "Set up Water Bath",
      instruction: "Drag the Water Bath to the workbench and heat to 85°C",
      requiredEquipment: "water_bath",
      completed: false,
    },
    {
      id: 6,
      title: "Heat Reaction",
      instruction: "Place the flask in the water bath and heat for 15 minutes",
      completed: false,
    },
  ];

  const handleEquipmentDrop = useCallback(
    (id: string, x: number, y: number) => {
      setEquipmentPositions((prev) => {
        const existing = prev.find((pos) => pos.id === id);
        if (existing) {
          // Auto-alignment: When dragging hot water beaker near test tube (for heating)
          if (experimentTitle.includes("Equilibrium")) {
            if (id === "beaker_hot_water") {
              // Show message for step 4 when hot water beaker is placed
              if (currentStep === 4) {
                setToastMessage(
                  "Drop the test tube into the hot water beaker!",
                );
                // Don't clear the message automatically - it will be cleared when test tube is dropped
              }
            } else if (id === "beaker_cold_water") {
              // Show message for step 5 when cold water beaker is placed
              if (currentStep === 5) {
                setToastMessage(
                  "Drop the test tube into the cold water beaker!",
                );
                // Don't clear the message automatically - it will be cleared when test tube is dropped
              }

              const testTube = prev.find((pos) => pos.id === "test_tubes");
              if (testTube) {
                const distance = Math.sqrt(
                  Math.pow(x - testTube.x, 2) + Math.pow(y - testTube.y, 2),
                );
                if (distance < 200) {
                  // Auto-align: Position hot water beaker directly below test tube (exact match to image)
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
                  // Clear the message when test tube is dropped into the beaker
                  if (currentStep === 4) {
                    setToastMessage(null);
                  }
                  // Auto-align: Position test tube directly above hot water beaker (exact match to image)
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

              // Step 5: Handle cooling when test tube is dropped into cold water beaker
              if (coldWaterBeaker && currentStep === 5) {
                const distance = Math.sqrt(
                  Math.pow(x - coldWaterBeaker.x, 2) +
                    Math.pow(y - coldWaterBeaker.y, 2),
                );
                if (distance < 200) {
                  // Clear any existing message when test tube is dropped into cold beaker
                  setToastMessage(null);
                  // Auto-align: Position test tube directly above cold water beaker
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
          }
          return prev.map((pos) => (pos.id === id ? { ...pos, x, y } : pos));
        }

        // Cobalt chloride stirrer automation
        if (
          experimentTitle.includes("Equilibrium") &&
          id === "stirring_rod" &&
          distilledWaterAdded
        ) {
          setStirrerActive(true);
          setToastMessage("Stirrer activated! Mixing solution...");
          setTimeout(() => setToastMessage(null), 3000);

          // Auto-remove stirrer after 2 seconds
          setTimeout(() => {
            setEquipmentPositions((prev) =>
              prev.filter((pos) => pos.id !== "stirring_rod"),
            );
            setToastMessage("Stirrer removed - mixing complete!");
            setTimeout(() => setToastMessage(null), 3000);
          }, 2000);

          // Start color transition after stirring begins
          setTimeout(() => {
            setColorTransition("transitioning");
            setToastMessage("Solution slowly turning pink...");
            setTimeout(() => setToastMessage(null), 3000);

            // Complete transition to pink
            setTimeout(() => {
              setColorTransition("pink");
              setToastMessage("Pink hydrated cobalt complex formed!");
              setTimeout(() => setToastMessage(null), 4000);

              // Auto-advance to next step after pink transition
              if (experimentTitle.includes("Equilibrium")) {
                setTimeout(() => {
                  onStepComplete();
                  setCurrentStep(currentStep + 1);
                  setToastMessage("Step completed! Moving to next step...");
                  setTimeout(() => setToastMessage(null), 3000);
                }, 1000);
              }
            }, 2000);
          }, 1000);
        }

        // Check if this completes a guided step for Aspirin Synthesis
        if (experimentTitle.includes("Aspirin")) {
          const currentStep = aspirinGuidedSteps[currentGuidedStep - 1];
          if (currentStep?.requiredEquipment === id) {
            setCurrentGuidedStep((prev) => prev + 1);
            setToastMessage(`✓ Step ${currentGuidedStep} completed!`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }

        return [...prev, { id, x, y, chemicals: [] }];
      });
    },
    [experimentTitle, currentGuidedStep, aspirinGuidedSteps, currentStep],
  );

  const handleEquipmentRemove = useCallback((id: string) => {
    setEquipmentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setToastMessage(`Equipment removed from workbench`);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const calculateChemicalProperties = (
    chemical: any,
    amount: number,
    totalVolume: number,
  ) => {
    const concentrations: { [key: string]: number } = {
      hcl: 0.1, // 0.1 M HCl
      naoh: 0.1, // 0.1 M NaOH
      phenol: 0, // Indicator (no molarity)
    };

    const molarity = concentrations[chemical.id] || 0;
    const volumeInL = amount / 1000; // Convert mL to L
    const moles = molarity * volumeInL;

    // Calculate pH for acids and bases
    let ph = 7; // neutral
    if (chemical.id === "hcl") {
      ph = -Math.log10(molarity * (amount / totalVolume)); // Acidic
    } else if (chemical.id === "naoh") {
      const poh = -Math.log10(molarity * (amount / totalVolume));
      ph = 14 - poh; // Basic
    }

    return {
      molarity: molarity * (amount / totalVolume),
      moles,
      ph: Math.max(0, Math.min(14, ph)),
    };
  };

  const handleChemicalSelect = (id: string) => {
    setSelectedChemical(selectedChemical === id ? null : id);
  };

  const handleChemicalDrop = (
    chemicalId: string,
    equipmentId: string,
    amount: number,
  ) => {
    const chemical = experimentChemicals.find((c) => c.id === chemicalId);
    if (!chemical) return;

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

          // Cobalt chloride reaction logic
          if (
            experimentTitle.includes("Equilibrium") &&
            equipmentId === "test_tubes"
          ) {
            if (chemicalId === "cocl2") {
              setCobaltChlorideAdded(true);
              setToastMessage(
                "Blue cobalt chloride crystals formed in test tube!",
              );
              setTimeout(() => setToastMessage(null), 3000);
            } else if (chemicalId === "water" && cobaltChlorideAdded) {
              setDistilledWaterAdded(true);

              // Check if we're in step 3 for the reverse equilibrium reaction
              if (currentStep === 3) {
                setStep3WaterAdded(true);
                setToastMessage(
                  "Color changing back to pink as the equilibrium shifts in the reverse direction!",
                );
                setTimeout(() => {
                  setToastMessage(null);
                  // Auto-advance to step 4
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
                // Auto-advance to step 3
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
            // Show success toast
            setToastMessage(
              `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
            );
            setTimeout(() => setToastMessage(null), 3000);
          }

          // Check if this completes a guided step for Aspirin Synthesis
          if (experimentTitle.includes("Aspirin")) {
            const currentStep = aspirinGuidedSteps[currentGuidedStep - 1];
            if (
              currentStep?.requiredChemical === chemicalId &&
              currentStep?.targetEquipment === equipmentId
            ) {
              setCurrentGuidedStep((prev) => prev + 1);
              setToastMessage(`✓ Step ${currentGuidedStep} completed!`);
              setTimeout(() => setToastMessage(null), 3000);
            }
          }

          // Calculate reaction if chemicals are mixed
          if (newChemicals.length >= 2) {
            const totalVolume = newChemicals.reduce(
              (sum, c) => sum + c.amount,
              0,
            );
            handleReaction(newChemicals, totalVolume);

            // Update measurements for equilibrium experiment
            if (experimentTitle.includes("Equilibrium")) {
              // Use the most recent chemical for calculations
              const recentChemical = newChemicals[newChemicals.length - 1];
              const calculations = calculateChemicalProperties(
                recentChemical,
                recentChemical.amount,
                totalVolume,
              );
              setMeasurements((prev) => ({
                ...prev,
                volume: totalVolume,
                concentration: calculations.molarity,
                ph: calculations.ph,
                molarity: calculations.molarity,
                moles: calculations.moles,
              }));
            }
          }

          return { ...pos, chemicals: newChemicals };
        }
        return pos;
      }),
    );

    setSelectedChemical(null);
  };

  const handleReaction = (chemicals: any[], totalVolume: number) => {
    // Simplified reaction detection for equilibrium experiments
    // Add specific reaction logic here if needed
  };

  const handleStartExperiment = () => {
    onStartExperiment();
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleStepClick = (stepId: number) => {
    // Only allow clicking on current or next available step, not previous completed steps
    if (stepId >= currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <TooltipProvider>
      <div
        className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden flex"
        style={{ minHeight: "75vh" }}
      >
        {/* Step Procedure Side Panel */}
        <div
          className={`transition-all duration-300 ${showSteps ? "w-80" : "w-12"} flex-shrink-0`}
        >
          {showSteps ? (
            <div className="h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
                <div className="flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  <span className="font-semibold text-sm">Procedure</span>
                </div>
                <button
                  onClick={() => setShowSteps(false)}
                  className="text-white/80 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Guided Instructions for Aspirin Synthesis */}
                {experimentTitle.includes("Aspirin") ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg">
                      <h3 className="font-bold text-sm">Step-by-Step Guide</h3>
                      <p className="text-xs opacity-90">
                        Follow instructions to synthesize aspirin
                      </p>
                    </div>

                    {aspirinGuidedSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          currentGuidedStep === step.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : currentGuidedStep > step.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentGuidedStep === step.id
                                ? "bg-blue-500 text-white"
                                : currentGuidedStep > step.id
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {currentGuidedStep > step.id ? "✓" : step.id}
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-700 ml-8">
                          {step.instruction}
                        </p>

                        {currentGuidedStep === step.id && (
                          <div className="mt-2 ml-8 flex items-center gap-2">
                            <div className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              CURRENT STEP
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <ExperimentSteps
                      currentStep={currentStep}
                      steps={experimentSteps}
                      onStepClick={handleStepClick}
                    />
                    <ChemicalFormulas experimentTitle={experimentTitle} />
                  </>
                )}

                {/* Concentration Measurement Panel - For Equilibrium Experiment */}
                {experimentTitle.includes("Equilibrium") && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                        <FlaskConical className="w-4 h-4 mr-2 text-blue-600" />
                        Live Measurements
                      </h3>
                      {isRunning && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-xs text-blue-600 font-medium">
                            Volume
                          </div>
                          <div className="text-sm font-bold text-blue-900">
                            {measurements.volume.toFixed(1)} mL
                          </div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-xs text-purple-600 font-medium">
                            pH
                          </div>
                          <div className="text-sm font-bold text-purple-900">
                            {measurements.ph.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-xs text-green-600 font-medium">
                            Molarity
                          </div>
                          <div className="text-sm font-bold text-green-900">
                            {measurements.molarity.toFixed(3)} M
                          </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-xs text-orange-600 font-medium">
                            Moles
                          </div>
                          <div className="text-sm font-bold text-orange-900">
                            {measurements.moles.toFixed(4)} mol
                          </div>
                        </div>
                      </div>

                      {experimentTitle.includes("Equilibrium") && (
                        <div className="bg-indigo-50 p-2 rounded">
                          <div className="text-xs text-indigo-600 font-medium">
                            Temperature
                          </div>
                          <div className="text-sm font-bold text-indigo-900">
                            {measurements.temperature}°C
                          </div>
                        </div>
                      )}


                      {experimentTitle.includes("Equilibrium") && (
                        <div className="bg-gray-50 p-2 rounded border-t border-gray-200">
                          <div className="text-xs text-gray-600 font-medium mb-1">
                            Equilibrium
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-600">Color: </span>
                            <span className="font-medium text-gray-900">
                              {measurements.ph < 7
                                ? "Blue (acidic)"
                                : "Pink (basic)"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col items-center">
              <button
                onClick={() => setShowSteps(true)}
                className="p-3 text-gray-600 hover:text-blue-600 border-b border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center">
                <div className="transform -rotate-90 text-xs font-medium text-gray-500 whitespace-nowrap">
                  Procedure
                </div>
              </div>
            </div>
          )}
        </div>

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
                {experimentTitle.includes("Aspirin") ? (
                  <div className="text-xs text-gray-600 mr-3 flex items-center space-x-2">
                    <span>
                      Progress: {currentGuidedStep - 1}/
                      {aspirinGuidedSteps.length}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${((currentGuidedStep - 1) / aspirinGuidedSteps.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mr-3"></div>
                )}
                <Controls
                  isRunning={isRunning}
                  onStart={handleStartExperiment}
                  onStop={() => setIsRunning(false)}
                  experimentStarted={experimentStarted}
                  onReset={() => {
                    setEquipmentPositions([]);
                    setSelectedChemical(null);
                    setIsRunning(false);
                    setResults([]);
                    setCurrentStep(stepNumber);
                    setMeasurements({
                      volume: 0,
                      concentration: 0,
                      ph: 7,
                      molarity: 0,
                      moles: 0,
                      temperature: 25,
                    });
                    setToastMessage(null);
                    setCurrentGuidedStep(1);
                    setCobaltChlorideAdded(false);
                    setDistilledWaterAdded(false);
                    setStirrerActive(false);
                    setColorTransition("pink");
                    setStep3WaterAdded(false);
                    onResetTimer();
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-2 overflow-x-auto pb-2">
              {experimentEquipment.map((equipment) => (
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

          {/* Main Work Area - Expanded */}
          <div className="flex-1 flex flex-col">
            {/* Lab Work Surface */}
            <div className="flex-1 p-6 relative">
              <WorkBench
                onDrop={experimentStarted ? handleEquipmentDrop : () => {}}
                selectedChemical={experimentStarted ? selectedChemical : null}
                isRunning={isRunning}
                experimentTitle={experimentTitle}
                currentGuidedStep={currentGuidedStep}
              >
                {equipmentPositions.map((pos) => {
                  const equipment = experimentEquipment.find(
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
                      cobaltReactionState={{
                        cobaltChlorideAdded,
                        distilledWaterAdded,
                        stirrerActive,
                        colorTransition,
                        step3WaterAdded,
                      }}
                      allEquipmentPositions={equipmentPositions}
                      currentStep={currentStep}
                      disabled={!experimentStarted}
                    />
                  ) : null;
                })}
              </WorkBench>
            </div>

            {/* Results Panel - When present */}
            {results.length > 0 && (
              <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm">
                <ResultsPanel results={results} onClear={handleClearResults} />
              </div>
            )}
          </div>

          {/* Reagents Bar - Bottom Horizontal */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3">
            <h4 className="font-semibold text-gray-800 text-sm flex items-center mb-2">
              <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
              Chemical Reagents
            </h4>
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {experimentChemicals.map((chemical) => (
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

      {/* Render Insight Data Section as overlay when active */}
      {showInsightData && (
        <div className="fixed inset-0 z-50 bg-white">
          <InsightDataSection
            onBack={handleInsightDataBack}
            onComplete={handleInsightDataComplete}
          />
        </div>
      )}

      {/* Insight Modal */}
      <InsightModal
        open={showInsightModal}
        onOpenChange={setShowInsightModal}
        onYes={handleInsightYes}
        onNo={handleInsightNo}
      />

      {/* Completion Modal */}
      <CompletionModal
        open={showCompletionModal}
        onOpenChange={setShowCompletionModal}
        onClose={handleCompletionClose}
      />
    </TooltipProvider>
  );
}

export default VirtualLabApp;
