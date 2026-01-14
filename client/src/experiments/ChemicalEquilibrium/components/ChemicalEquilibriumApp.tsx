import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { Link, useRoute } from "wouter";
import ChemicalEquilibriumVirtualLab from "./VirtualLab";
import ChemicalEquilibriumData, { PHHClExperiment, BASIC_DRY_TEST_STEPS } from "../data";
import type { ExperimentStep, DryTestMode } from "../types";
import { useUpdateProgress } from "@/hooks/use-experiments";

interface ChemicalEquilibriumAppProps {
  onBack?: () => void;
}

const WET_ACID_TEST_EQUIPMENT = [
  "Test Tubes",
  "Salt Sample",
  "BaCl₂ Solution",
  "Sodium Nitroprusside",
  "NH₄OH (Ammonium hydroxide)",
  "Magnesia mixture (PO₄³⁻)",
  "CaCl₂ Solution",
  "FeCl₃",
];

const WET_BASIC_TEST_EQUIPMENT = [
  "Test Tube",
  "Salt Sample",
  "Dilute HCl",
  "H₂S Gas",
  "Solid NH₄Cl",
  "NH₄OH Solution",
  "Solid (NH₄)₂CO₃",
  "Na₂HPO₄ Solution",
  "Bunsen Burner (virtual heat source)",
];

const DRY_TEST_MODE_CONFIG: Record<DryTestMode, {
  letter: string;
  label: string;
  equipment: string[];
}> = {
  acid: {
    letter: "A",
    label: "Dry Tests for Acid Radicals",
    equipment: ChemicalEquilibriumData.equipment,
  },
  basic: {
    letter: "B",
    label: "Dry Tests for Basic Radicals",
    equipment: [
      "Test Tubes",
      "Salt Sample",
      "Glass Rod",
      "Bunsen Burner (virtual heat source)",
      "Conc. HCl",
      "Anhydrous Na₂CO₃",
      "NaOH",
      "Glass container",
    ],
  },
  wet: {
    letter: "C",
    label: "Wet Test for Acid Radicals",
    equipment: WET_ACID_TEST_EQUIPMENT,
  },
  wetBasic: {
    letter: "D",
    label: "Wet Test for Basic Radicals",
    equipment: WET_BASIC_TEST_EQUIPMENT,
  },
};

const DRY_TEST_MODE_ORDER: DryTestMode[] = ["acid", "basic", "wet", "wetBasic"];

const CHLORIDE_ACID_EQUIPMENT = "Acidified Potassium Dichromate (K₂Cr₂O₇)";

const HALIDE_SECTIONS = [
  {
    symbol: "Br",
    label: "Bromide Observations",
    description:
      "Watch for creamy precipitates when silver nitrate meets the bromide fraction of your sample.",
  },
  {
    symbol: "I",
    label: "Iodide Insights",
    description: "Note the pale yellow precipitation that signals iodide alongside the reference visuals.",
  },
  {
    symbol: "Cl",
    label: "Chloride Check",
    description: "Confirm the white AgCl precipitate and how it dissolves in ammonia to complete the chloride callout.",
  },
  {
    symbol: "S",
    label: "Sulfide Notes",
    description: "Document the black or dark residues that appear when sulfide radicals react with metal ions.",
  },
];

export default function ChemicalEquilibriumApp({
  onBack,
}: ChemicalEquilibriumAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [activeDryTestMode, setActiveDryTestMode] = useState<DryTestMode>("acid");
  const [activeHalide, setActiveHalide] = useState(
    HALIDE_SECTIONS[0]?.symbol ?? "Br",
  );

  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 4);
  const experiment = experimentId === PHHClExperiment.id ? PHHClExperiment : ChemicalEquilibriumData;
  const isDryTestExperiment = experiment.id === ChemicalEquilibriumData.id;
  const updateProgress = useUpdateProgress();
  const activeDryTestConfig = DRY_TEST_MODE_CONFIG[activeDryTestMode];
  const baseDryTestEquipment = activeDryTestConfig.equipment;
  const isChlorideDryAcidFlow = activeDryTestMode === "acid" && activeHalide === "Cl";
  const dryTestEquipmentToUse = isChlorideDryAcidFlow
    ? baseDryTestEquipment.includes(CHLORIDE_ACID_EQUIPMENT)
      ? baseDryTestEquipment
      : [...baseDryTestEquipment, CHLORIDE_ACID_EQUIPMENT]
    : baseDryTestEquipment;
  const activeStepDetails =
    isDryTestExperiment && activeDryTestMode === "basic"
      ? BASIC_DRY_TEST_STEPS
      : experiment.stepDetails;

  // Auto-start when URL contains ?autostart=1 for the PH experiment
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const auto = params.get("autostart");
      if (auto === "1") {
        setExperimentStarted(true);
        setIsRunning(true);
      }
    } catch (e) {
      // ignore in non-browser env
    }
  }, [experimentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && experimentStarted) {
      interval = setInterval(() => {
        setTimer((timer) => timer + 1);
      }, 1000);
    } else if (!isRunning && timer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timer, experimentStarted]);

  useEffect(() => {
    setCurrentStep(0);
    setExperimentStarted(false);
    setIsRunning(false);
    setTimer(0);
  }, [activeDryTestMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (experimentStarted) {
      setIsRunning(!isRunning);
    }
  };

  const handleStartExperiment = () => {
    setExperimentStarted(true);
    setIsRunning(true);
  };

  const handleCompleteStep = () => {
    if (currentStep < activeStepDetails.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < activeStepDetails.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    // Disable going back to previous steps - steps are linear and non-reversible
    return;
  };

  const currentStepData = activeStepDetails[currentStep];
  const progressPercentage = Math.round(
    ((currentStep + 1) / activeStepDetails.length) * 100,
  );

  useEffect(() => {
    const total = activeStepDetails.length;
    const done = experimentStarted ? Math.min(currentStep + 1, total) : 0;
    updateProgress.mutate({
      experimentId,
      currentStep: done,
      completed: done >= total,
      progressPercentage: Math.round((done / total) * 100),
    });
  }, [experimentStarted, currentStep, activeStepDetails.length, experimentId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </button>
          ) : (
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </Link>
          )}
        </div>

        {/* Experiment Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {experiment.title}
          </h1>
          <p className="text-gray-600 mb-4">{experiment.description}</p>

          {isDryTestExperiment && (
          <div className="halide-section-grid mb-6">
            {HALIDE_SECTIONS.map((section) => {
              const isActiveHalide = activeHalide === section.symbol;
              return (
                <article
                  key={section.symbol}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveHalide(section.symbol)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveHalide(section.symbol);
                    }
                  }}
                  className={`halide-section-card ${isActiveHalide ? "halide-section-card--active" : ""}`}
                  aria-pressed={isActiveHalide}
                  aria-expanded={isActiveHalide}
                >
                  <div className="halide-section-card__header">
                    <span className="halide-section-symbol" aria-hidden="true">
                      {section.symbol}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{section.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                    </div>
                  </div>
                  {isActiveHalide && (
                    <>
                      <div className="dry-test-button-panel halide-section-card__dry-test-panel">
                        {DRY_TEST_MODE_ORDER.map((mode) => {
                          const modeConfig = DRY_TEST_MODE_CONFIG[mode];
                          const isActive = activeDryTestMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveDryTestMode(mode);
                              }}
                              className={`dry-test-action-card ${isActive ? "dry-test-action-card--active" : ""}`}
                              aria-pressed={isActive}
                              aria-label={`Select ${modeConfig.label}`}
                            >
                              <span className="dry-test-action-letter" aria-hidden="true">
                                {modeConfig.letter}
                              </span>
                              <p className="dry-test-action-title">{modeConfig.label}</p>
                            </button>
                          );
                        })}
                      </div>
                      {isChlorideDryAcidFlow && (
                        <div className="halide-section-card__equipment-note">
                          Equipment highlight: {CHLORIDE_ACID_EQUIPMENT}
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}

          {/* Progress Bar - hidden for PH HCl experiment and dry tests (we show per-panel progress) */}
          {experiment.id !== PHHClExperiment.id && !isDryTestExperiment && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-blue-600 font-semibold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </>
          )}
        </div>
        {isDryTestExperiment && (
          <div className="mb-6">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-sm">
              <div className="px-6 py-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[2px] text-blue-600">Experiment Progress</p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{currentStepData?.title ?? experiment.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Follow the guided steps below to complete the dry tests.</p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-xs text-gray-500">Step {currentStep + 1} of {activeStepDetails.length}</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span>STEP {currentStep + 1}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Lab Area */}
        <div className="w-full relative">
          {/* Experiment Not Started Overlay */}
          {!experimentStarted && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Start?
                </h3>
                <p className="text-gray-600 mb-6">
                  Click on the "Start Experiment" button to begin: {experiment.title}
                </p>
                <button
                  onClick={handleStartExperiment}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors mx-auto"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Experiment</span>
                </button>
              </div>
            </div>
          )}

          <Card className="min-h-[80vh]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl">
                  {experiment.title} - Virtual Laboratory
                </span>
                <div className="flex items-center space-x-4">
                  {experiment.id !== PHHClExperiment.id ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTimer}
                        className="flex items-center"
                      >
                        {isRunning ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {formatTime(timer)}
                      </Button>

                      {!isDryTestExperiment && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={handlePreviousStep}
                            disabled={true}
                            size="sm"
                            className="opacity-50 cursor-not-allowed"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center space-x-2 px-2">
                            <span className="text-sm text-gray-600">
                              {currentStep + 1} / {activeStepDetails.length}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                              STEP {currentStep + 1}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            onClick={handleNextStep}
                            disabled={
                              currentStep === activeStepDetails.length - 1
                            }
                            size="sm"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 px-2">
                        <span className="text-sm text-gray-600">{currentStep + 1} / {activeStepDetails.length}</span>
                        <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">STEP {currentStep + 1}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChemicalEquilibriumVirtualLab
                key={`dry-test-${activeDryTestMode}`}
                dryTestEquipment={dryTestEquipmentToUse}
                dryTestMode={activeDryTestMode}
                step={currentStepData}
                onStepComplete={handleCompleteStep}
                isActive={true}
                stepNumber={currentStep + 1}
                totalSteps={activeStepDetails.length}
                experimentTitle={experiment.title}
                experiment={experiment}
                allSteps={activeStepDetails}
                experimentStarted={experimentStarted}
                onStartExperiment={handleStartExperiment}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                onResetTimer={() => setTimer(0)}
                onResetExperiment={() => {
                  setExperimentStarted(isDryTestExperiment);
                  setIsRunning(false);
                  setTimer(0);
                  setCurrentStep(0);
                }}
                timer={timer}
                toggleTimer={toggleTimer}
              />
            </CardContent>
          </Card>
        </div>

        {/* Safety Information */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Safety Information
          </h3>
          <p className="text-yellow-700 text-sm">{experiment.safetyInfo}</p>
        </div>
      </div>
    </div>
  );
}
