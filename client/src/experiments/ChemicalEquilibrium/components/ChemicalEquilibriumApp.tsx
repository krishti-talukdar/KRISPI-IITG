import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { Link, useRoute } from "wouter";
import ChemicalEquilibriumVirtualLab from "./VirtualLab";
import ChemicalEquilibriumData, { PHHClExperiment } from "../data";
import type { ExperimentStep } from "../types";
import { useUpdateProgress } from "@/hooks/use-experiments";

interface ChemicalEquilibriumAppProps {
  onBack?: () => void;
}

export default function ChemicalEquilibriumApp({
  onBack,
}: ChemicalEquilibriumAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(false);

  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 4);
  const experiment = experimentId === PHHClExperiment.id ? PHHClExperiment : ChemicalEquilibriumData;
  const updateProgress = useUpdateProgress();

  // Auto-start when URL contains ?autostart=1 for the PH experiment
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const auto = params.get("autostart");
      if (auto === "1" && experimentId === PHHClExperiment.id) {
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
    if (currentStep < experiment.stepDetails.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < experiment.stepDetails.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    // Disable going back to previous steps - steps are linear and non-reversible
    return;
  };

  const currentStepData = experiment.stepDetails[currentStep];
  const progressPercentage = Math.round(
    ((currentStep + 1) / experiment.stepDetails.length) * 100,
  );

  useEffect(() => {
    const total = experiment.stepDetails.length;
    const done = experimentStarted ? Math.min(currentStep + 1, total) : 0;
    updateProgress.mutate({
      experimentId,
      currentStep: done,
      completed: done >= total,
      progressPercentage: Math.round((done / total) * 100),
    });
  }, [experimentStarted, currentStep, experiment.stepDetails.length, experimentId]);

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

          {/* Progress Bar - hidden for PH HCl experiment (we show per-panel progress) */}
          {experiment.id !== PHHClExperiment.id && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-blue-600 font-semibold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </>
          )}
        </div>

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
                            {currentStep + 1} / {experiment.stepDetails.length}
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
                            currentStep === experiment.stepDetails.length - 1
                          }
                          size="sm"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 px-2">
                        <span className="text-sm text-gray-600">{currentStep + 1} / {experiment.stepDetails.length}</span>
                        <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">STEP {currentStep + 1}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChemicalEquilibriumVirtualLab
                step={currentStepData}
                onStepComplete={handleCompleteStep}
                isActive={true}
                stepNumber={currentStep + 1}
                totalSteps={experiment.stepDetails.length}
                experimentTitle={experiment.title}
                allSteps={experiment.stepDetails}
                experimentStarted={experimentStarted}
                onStartExperiment={handleStartExperiment}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                onResetTimer={() => setTimer(0)}
                onResetExperiment={() => {
                  setExperimentStarted(false);
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
