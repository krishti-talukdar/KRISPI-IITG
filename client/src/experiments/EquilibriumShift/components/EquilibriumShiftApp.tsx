import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause, RotateCcw, BookOpen } from "lucide-react";
import { Link, useRoute } from "wouter";
import VirtualLab from "./VirtualLab";
import EquilibriumShiftData from "../data";
import { ExperimentMode } from "../types";
import { useUpdateProgress } from "@/hooks/use-experiments";

interface EquilibriumShiftAppProps {
  onBack?: () => void;
}

export default function EquilibriumShiftApp({
  onBack,
}: EquilibriumShiftAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [mode, setMode] = useState<ExperimentMode>({ current: 'guided', currentGuidedStep: 0 });
  const [resetKey, setResetKey] = useState(0);

  const experiment = EquilibriumShiftData;
  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 1);
  const updateProgress = useUpdateProgress();

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

  const handleReset = () => {
    setExperimentStarted(false);
    setIsRunning(false);
    setTimer(0);
    setCurrentStep(0);
    setCompletedSteps([]);
    // Keep in guided mode so the Experiment Progress is visible after reset
    setMode({ current: 'guided', currentGuidedStep: 0 });
    setResetKey((k) => k + 1);

    updateProgress.mutate({
      experimentId,
      currentStep: 0,
      completed: false,
      progressPercentage: 0,
    });
  };

  // Free mode removed: always guided

  const handleStepComplete = (stepId?: number) => {
    if (mode.current === 'guided' && mode.currentGuidedStep !== undefined) {
      // Mark current step as completed
      const stepToComplete = stepId || mode.currentGuidedStep + 1;
      if (!completedSteps.includes(stepToComplete)) {
        setCompletedSteps(prev => [...prev, stepToComplete]);
      }

      // Move to next step
      if (mode.currentGuidedStep < experiment.stepDetails.length - 1) {
        setMode({
          ...mode,
          currentGuidedStep: mode.currentGuidedStep + 1
        });
        setCurrentStep(mode.currentGuidedStep + 1);
      }
    } else {
      // Free mode - just mark step as completed
      const stepToComplete = stepId || currentStep + 1;
      if (!completedSteps.includes(stepToComplete)) {
        setCompletedSteps(prev => [...prev, stepToComplete]);
      }
    }
  };

  const handleStepUndo = (stepId?: number) => {
    // Determine which step to undo (1-indexed in child)
    const stepToUndo = stepId || (mode.current === 'guided' && mode.currentGuidedStep !== undefined
      ? mode.currentGuidedStep + 1
      : currentStep + 1);

    // Remove from completed steps if present
    setCompletedSteps(prev => prev.filter(id => id !== stepToUndo));

    // In guided mode, move one step back in UI state as well
    if (mode.current === 'guided' && mode.currentGuidedStep !== undefined) {
      const newIndex = Math.max(0, mode.currentGuidedStep - 1);
      setMode({ ...mode, currentGuidedStep: newIndex });
      setCurrentStep(newIndex);
    } else {
      // Free mode: keep currentStep non-negative
      setCurrentStep(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    const total = experiment.stepDetails.length;
    const done = completedSteps.length;
    updateProgress.mutate({
      experimentId,
      currentStep: done,
      completed: done >= total,
      progressPercentage: Math.round((done / total) * 100),
    });
  }, [completedSteps, experiment.stepDetails.length, experimentId]);

  const currentStepData = experiment.stepDetails[currentStep];
  const progressPercentage = Math.round(
    (completedSteps.length / experiment.stepDetails.length) * 100,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Mode Toggle and Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                Guided Mode
              </span>
              <span className="text-sm text-gray-600">
                Step {(mode.currentGuidedStep || 0) + 1} of {experiment.stepDetails.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-blue-600 font-semibold">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress
            value={progressPercentage}
            className="h-2"
          />
        </div>

        {/* Main Lab Area */}
        <div className="w-full relative">
          {/* Experiment Not Started Overlay */}
          {!experimentStarted && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Explore Equilibrium?
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your interactive journey with cobalt complexes! Watch dramatic color changes 
                  as you shift equilibrium between pink [Co(H₂O)₆]²⁺ and blue [CoCl₄]²⁻.
                </p>
                <button
                  onClick={handleStartExperiment}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-200 mx-auto transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Virtual Lab</span>
                </button>
              </div>
            </div>
          )}

          <Card className="min-h-[85vh] shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {experiment.title} - Interactive Virtual Lab
                </span>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTimer}
                    className="flex items-center bg-white/80"
                  >
                    {isRunning ? (
                      <Pause className="h-4 w-4 mr-1" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    {formatTime(timer)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center bg-white/80"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VirtualLab
                key={resetKey}
                experimentStarted={experimentStarted}
                onStartExperiment={handleStartExperiment}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                mode={mode}
                onStepComplete={handleStepComplete}
                onStepUndo={handleStepUndo}
                onReset={handleReset}
                completedSteps={completedSteps}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
