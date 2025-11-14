import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause, RotateCcw, FlaskConical, BarChart3, Droplets } from "lucide-react";
import { Link, useRoute } from "wouter";
import VirtualLab from "./VirtualLab";
import FeSCNEquilibriumData from "../data";
import { ExperimentPhase } from "../types";
import { useUpdateProgress } from "@/hooks/use-experiments";

interface FeSCNEquilibriumAppProps {
  onBack?: () => void;
}

export default function FeSCNEquilibriumApp({
  onBack,
}: FeSCNEquilibriumAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [showSeriesSelection, setShowSeriesSelection] = useState(false);
  const [phase, setPhase] = useState<ExperimentPhase>({
    current: 'part-a',
    partACompleted: false,
    partBCompleted: false
  });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const experiment = FeSCNEquilibriumData;
  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 3);
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
    setShowSeriesSelection(true);
  };

  const handleSeriesSelection = (selectedSeries: 'scn-first' | 'fe-first') => {
    setShowSeriesSelection(false);
    setExperimentStarted(true);
    setIsRunning(true);

    if (selectedSeries === 'fe-first') {
      setPhase({
        current: 'part-b',
        partACompleted: false,
        partBCompleted: false
      });
      setCurrentStep(4); // Start with Part B steps
    } else {
      setPhase({
        current: 'part-a',
        partACompleted: false,
        partBCompleted: false
      });
      setCurrentStep(0); // Start with Part A steps
    }
  };

  const handleReset = () => {
    setExperimentStarted(false);
    setIsRunning(false);
    setTimer(0);
    setCurrentStep(0);
    setShowSeriesSelection(false);
    setPhase({
      current: 'part-a',
      partACompleted: false,
      partBCompleted: false
    });
    setShowAnalysis(false);
    setResetKey((k) => k + 1);
    updateProgress.mutate({
      experimentId,
      currentStep: 0,
      completed: false,
      progressPercentage: 0,
    });
  };

  const handlePhaseComplete = (completedPhase: 'part-a' | 'part-b') => {
    if (completedPhase === 'part-a') {
      setPhase(prev => ({
        ...prev,
        partACompleted: true,
        current: 'part-b'
      }));
      setCurrentStep(4); // Move to Part B steps
    } else if (completedPhase === 'part-b') {
      setPhase(prev => ({
        ...prev,
        partBCompleted: true,
        current: 'analysis'
      }));
      setCurrentStep(7); // Move to analysis step
      setShowAnalysis(true);
    }
  };

  const handleStepComplete = () => {
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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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

  // Calculate phase progress
  const getPhaseProgress = () => {
    if (phase.current === 'part-a') return 'Part A: Variable [SCN⁻]';
    if (phase.current === 'part-b') return 'Part B: Variable [Fe³⁺]';
    return 'Analysis: Color Observations';
  };

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

          {/* Phase and Progress Indicators */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  {getPhaseProgress()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${phase.partACompleted ? 'bg-green-500' : phase.current === 'part-a' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">Part A</span>
                <div className={`w-3 h-3 rounded-full ${phase.partBCompleted ? 'bg-green-500' : phase.current === 'part-b' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">Part B</span>
                <div className={`w-3 h-3 rounded-full ${phase.current === 'analysis' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">Analysis</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-red-600 font-semibold">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2 mb-4" />

          {/* Current Step Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  Step {currentStep + 1}: {currentStepData.title}
                </h3>
                <p className="text-sm text-red-700">{currentStepData.description}</p>
                <span className="text-xs text-red-600 font-medium">
                  Duration: {currentStepData.duration}
                </span>
              </div>
              <div className="text-2xl">
                {currentStepData.phase === 'setup' && '⚙️'}
                {currentStepData.phase === 'part-a' && '🧪'}
                {currentStepData.phase === 'part-b' && '🔬'}
                {currentStepData.phase === 'analysis' && '📊'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Lab Area */}
        <div className="w-full relative">
          {/* Experiment Not Started Overlay */}
          {!experimentStarted && !showSeriesSelection && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FlaskConical className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Ready to Study Fe³⁺ + SCN⁻ Equilibrium?
                </h3>
                <p className="text-gray-600 mb-4">
                  Explore Le Chatelier's principle through the formation of blood-red [FeSCN]²⁺ complex.
                  This comprehensive experiment uses 12 test tubes to systematically study concentration effects.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">Experiment Overview:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Part A:</strong> Vary [SCN⁻] while keeping [Fe³⁺] constant (Tubes T1-T6)</li>
                    <li>• <strong>Part B:</strong> Vary [Fe³⁺] while keeping [SCN⁻] constant (Tubes T7-T12)</li>
                    <li>• <strong>Analysis:</strong> Observe color intensity patterns and equilibrium shifts</li>
                  </ul>
                </div>
                <button
                  onClick={handleStartExperiment}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 mx-auto transform hover:scale-105 shadow-lg"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Virtual Lab</span>
                </button>
              </div>
            </div>
          )}

          {/* Series Selection Overlay */}
          {showSeriesSelection && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Which series would you like to continue first?
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose your experimental approach to study the Fe³⁺ + SCN⁻ ⇌ [FeSCN]²⁺ equilibrium.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Option 1: Increase SCN⁻ ions */}
                  <button
                    onClick={() => handleSeriesSelection('scn-first')}
                    className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-200 transform hover:scale-105 group"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                        <Droplets className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-green-800 mb-2">Option 1</h4>
                      <h5 className="text-xl font-semibold text-gray-800 mb-3">Increase SCN⁻ ions</h5>
                      <p className="text-sm text-gray-600 mb-4">
                        Start with Part A: Keep [Fe³⁺] constant while varying [SCN⁻] concentrations
                      </p>
                      <div className="bg-white/80 rounded-lg p-3">
                        <p className="text-xs text-green-700 font-medium">Tubes T1-T6 first</p>
                        <p className="text-xs text-gray-500">Fixed Fe³⁺ (5.00 mL) + Variable SCN⁻ (0-4 mL)</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Increase Fe³⁺ ions */}
                  <button
                    onClick={() => handleSeriesSelection('fe-first')}
                    className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all duration-200 transform hover:scale-105 group"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 transition-colors">
                        <FlaskConical className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-orange-800 mb-2">Option 2</h4>
                      <h5 className="text-xl font-semibold text-gray-800 mb-3">Increase Fe³⁺ ions</h5>
                      <p className="text-sm text-gray-600 mb-4">
                        Start with Part B: Keep [SCN⁻] constant while varying [Fe³⁺] concentrations
                      </p>
                      <div className="bg-white/80 rounded-lg p-3">
                        <p className="text-xs text-orange-700 font-medium">Tubes T7-T12 first</p>
                        <p className="text-xs text-gray-500">Fixed SCN⁻ (1.00 mL) + Variable Fe³⁺ (0.5-5 mL)</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> You can complete both series during the experiment. This choice only determines your starting point.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card className="min-h-[85vh] shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {experiment.title} - Virtual Laboratory
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
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="flex items-center bg-white/80"
                    disabled={!phase.partBCompleted}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analysis
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
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={currentStep === 0}
                      size="sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2 px-2">
                      <span className="text-sm text-gray-600">
                        {currentStep + 1} / {experiment.stepDetails.length}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleNextStep}
                      disabled={currentStep === experiment.stepDetails.length - 1}
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VirtualLab key={resetKey}
                experimentStarted={experimentStarted}
                onStartExperiment={handleStartExperiment}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                currentStep={currentStep}
                onStepComplete={handleStepComplete}
                phase={phase}
                onPhaseComplete={handlePhaseComplete}
                showAnalysis={showAnalysis}
                onReset={handleReset}
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
