import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useExperiment, useUpdateProgress } from "@/hooks/use-experiments";
import VirtualLab from "./VirtualLab";

interface Props { onBack?: () => void }

export default function BufferPHApp({ onBack }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 9);
  const { data: experiment } = useExperiment(experimentId);
  const updateProgress = useUpdateProgress();

  const totalSteps = experiment?.stepDetails?.length ?? 0;
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && experimentStarted) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, experimentStarted]);

  useEffect(() => { setCurrentStep(1); setCompletedSteps([]); setTimer(0); }, [experimentId]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleStart = () => { setExperimentStarted(true); setIsRunning(true); };

  // Auto-start timer if ?autostart=1 present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (params.get('autostart') === '1') {
        handleStart();
      }
    } catch (e) {}
  }, []);
  const handleReset = () => {
    setIsRunning(false);
    setTimer(0);
    setCompletedSteps([]);
    setExperimentStarted(true);
    setResetKey(k => k+1);
    setCurrentStep(1);
    updateProgress.mutate({ experimentId, currentStep: 0, completed: false, progressPercentage: 0 });
  };

  const handleStepComplete = (stepId?: number) => {
    const id = stepId || currentStep;
    if (!completedSteps.includes(id)) setCompletedSteps(prev => [...prev, id]);
    if (currentStep < totalSteps) setCurrentStep(s => s + 1);
  };

  const handleStepUndo = () => {
    setCompletedSteps(prev => prev.slice(0, -1));
    setCurrentStep(s => Math.max(1, s - 1));
  };

  useEffect(() => {
    if (!experiment) return;
    const done = completedSteps.length;
    updateProgress.mutate({ experimentId, currentStep: done, completed: done >= totalSteps, progressPercentage: Math.round((done/Math.max(1,totalSteps))*100) });
  }, [completedSteps, totalSteps, experimentId, experiment]);

  const progressPercentage = Math.round((completedSteps.length / Math.max(1,totalSteps)) * 100);

  if (!experiment) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          {onBack ? (
            <button onClick={onBack} className="text-blue-600 hover:text-blue-700 flex items-center"><ArrowLeft className="mr-2 h-4 w-4" />Back to Experiments</button>
          ) : (
            <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center"><ArrowLeft className="mr-2 h-4 w-4" />Back to Experiments</Link>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{experiment.title}</h1>
          <p className="text-gray-600 mb-4">{experiment.description}</p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">Guided Mode</span>
              <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsRunning(!isRunning)} className="flex items-center bg-white/80">
                {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {formatTime(timer)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center bg-white/80">
                <RotateCcw className="h-4 w-4 mr-1" />Reset
              </Button>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Card className="min-h-[85vh] shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50">
            <CardTitle className="text-2xl">Buffer pH - Interactive Workbench</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VirtualLab
              key={resetKey}
              experiment={experiment}
              experimentStarted={experimentStarted}
              onStartExperiment={handleStart}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              currentStep={currentStep}
              onStepComplete={handleStepComplete}
              onStepUndo={handleStepUndo}
              onReset={handleReset}
              completedSteps={completedSteps}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
