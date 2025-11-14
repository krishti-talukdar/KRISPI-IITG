import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { Link, useRoute } from "wouter";
import OxalicAcidVirtualLab from "./VirtualLab";
import OxalicAcidData from "../data";
import type { ExperimentStep } from "../types";
import { useUpdateProgress } from "@/hooks/use-experiments";
import { Equipment } from "./Equipment";
import { Chemical } from "./Chemical";
import { OXALIC_ACID_CHEMICALS, OXALIC_ACID_EQUIPMENT } from "../constants";

interface OxalicAcidAppProps {
  onBack?: () => void;
}

export default function OxalicAcidApp({ onBack }: OxalicAcidAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [usedEquipment, setUsedEquipment] = useState<string[]>([]);

  const handleEquipmentPlaced = (id: string) => {
    setUsedEquipment(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const experiment = OxalicAcidData;
  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 2);
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

  const handleStepComplete = () => {
    if (currentStep < experiment.stepDetails.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepChange = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < experiment.stepDetails.length) {
      setCurrentStep(stepIndex);
    }
  };

  const handleStartExperiment = (run = true) => {
    setExperimentStarted(true);
    setIsRunning(run);
    setTimer(0);
  };

  // Auto-start timer when this component mounts for the Oxalic Acid experiment
  useEffect(() => {
    handleStartExperiment(true);
    // run only once on mount
  }, []);

  const handleResetTimer = () => {
    setTimer(0);
    setIsRunning(false);
  };

  const handleUndoStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleResetExperiment = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setTimer(0);
    setExperimentStarted(false);
    setResetKey((k) => k + 1);
  };

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

  const progress = ((currentStep + 1) / experiment.stepDetails.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {experiment.title}
              </CardTitle>
              <p className="text-gray-600">{experiment.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Experiments
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Step {currentStep + 1} of {experiment.stepDetails.length}</span>
                  <span>•</span>
                  <span>{experiment.category}</span>
                  <span>•</span>
                  <span>{experiment.difficulty}</span>
                  <span>��</span>
                  <span>Duration: {experiment.duration} min</span>
                </div>
                <Progress value={progress} className="w-64" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatTime(timer)}</p>
                  <p className="text-sm text-gray-600">Elapsed Time</p>
                </div>
                <Button
                  onClick={toggleTimer}
                  variant={isRunning ? "secondary" : "default"}
                  size="sm"
                  disabled={!experimentStarted}
                >
                  {isRunning ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiment Steps - moved below heading */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Experiment Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[experiment.stepDetails[currentStep]].map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors bg-blue-50 border-blue-200`}
                onClick={() => handleStepChange(currentStep)}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-gray-600">{step.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Content - now left column shows Equipment & Chemicals */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Equipment & Chemicals</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Equipment</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {OXALIC_ACID_EQUIPMENT.filter(eq => ((eq.id === 'analytical_balance' || eq.id === 'weighing_boat') || !usedEquipment.includes(eq.id))).map((eq) => (
                  <Equipment key={eq.id} id={eq.id} name={eq.name} icon={eq.icon} position={null} />
                ))}
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-3">Chemicals</h3>
              <div className="space-y-3">
                {OXALIC_ACID_CHEMICALS.filter(c => !usedEquipment.includes(c.id)).map((chemical) => (
                  <Chemical
                    key={chemical.id}
                    id={chemical.id}
                    name={chemical.name}
                    formula={chemical.formula}
                    color={chemical.color}
                    concentration={chemical.concentration}
                    volume={chemical.volume}
                    molecularWeight={chemical.molecularWeight}
                    onSelect={() => {}}
                    selected={false}
                    disabled={false}
                    blink={currentStep + 1 === 3 && !usedEquipment.includes(chemical.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Virtual Lab */}
          <div className="lg:col-span-3">
            <OxalicAcidVirtualLab
              key={resetKey}
              step={experiment.stepDetails[currentStep]}
              onStepComplete={handleStepComplete}
              isActive={true}
              stepNumber={currentStep + 1}
              totalSteps={experiment.stepDetails.length}
              experimentTitle={experiment.title}
              allSteps={experiment.stepDetails}
              experimentStarted={experimentStarted}
              onStartExperiment={handleStartExperiment}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              onResetTimer={handleResetTimer}
              onUndoStep={handleUndoStep}
              onResetExperiment={handleResetExperiment}
              currentStepIndex={currentStep + 1}
              onEquipmentPlaced={handleEquipmentPlaced}
            />
          </div>
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <Button
              variant="outline"
              onClick={() => handleStepChange(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Step
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Step {currentStep + 1}: {experiment.stepDetails[currentStep].title}
              </p>
            </div>

            {/* Show Results & analysis button when all steps are completed */}
            {experimentStarted && currentStep === experiment.stepDetails.length - 1 ? (
              <Link to={`/experiment/${experimentId}/results`}>
                <Button className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white hover:opacity-95">
                  Results &amp; analysis
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => handleStepChange(currentStep + 1)}
                disabled={currentStep === experiment.stepDetails.length - 1}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
