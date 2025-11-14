import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import VirtualLab from "./VirtualLab";
import PHComparisonData from "../data";
import { useUpdateProgress } from "@/hooks/use-experiments";

interface Props { onBack?: () => void }

export default function PHComparisonApp({ onBack }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [experimentStarted, setExperimentStarted] = useState(true);
  const [mode, setMode] = useState<{ current: 'guided'; currentGuidedStep: number }>({ current: 'guided', currentGuidedStep: 0 });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const experiment = PHComparisonData;
  const [match, params] = useRoute("/experiment/:id");
  const experimentId = Number(params?.id ?? 8);
  const updateProgress = useUpdateProgress();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && experimentStarted) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, experimentStarted]);

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
    setMode({ current: 'guided', currentGuidedStep: 0 });
    setExperimentStarted(true);
    setResetKey(k => k+1);
    updateProgress.mutate({ experimentId, currentStep: 0, completed: false, progressPercentage: 0 });
  };

  const handleStepComplete = (stepId?: number) => {
    const id = stepId || (mode.currentGuidedStep + 1);
    if (!completedSteps.includes(id)) setCompletedSteps(prev => [...prev, id]);
    if (mode.currentGuidedStep < experiment.stepDetails.length - 1) {
      setMode(m => ({ ...m, currentGuidedStep: m.currentGuidedStep + 1 }));
    }
  };

  const handleStepUndo = () => {
    setCompletedSteps(prev => prev.slice(0, -1));
    setMode(m => ({ ...m, currentGuidedStep: Math.max(0, m.currentGuidedStep - 1) }));
  };

  useEffect(() => {
    const total = experiment.stepDetails.length;
    const done = completedSteps.length;
    updateProgress.mutate({ experimentId, currentStep: done, completed: done >= total, progressPercentage: Math.round((done/total)*100) });
  }, [completedSteps, experiment.stepDetails.length, experimentId]);

  const progressPercentage = Math.round((completedSteps.length / experiment.stepDetails.length) * 100);

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
              <span className="text-sm text-gray-600">Step {(mode.currentGuidedStep || 0) + 1} of {experiment.stepDetails.length}</span>
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
            <CardTitle className="text-2xl">pH Comparison - Interactive Workbench</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VirtualLab key={resetKey} experimentStarted={experimentStarted} onStartExperiment={handleStart} isRunning={isRunning} setIsRunning={setIsRunning} mode={mode} onStepComplete={handleStepComplete} onStepUndo={handleStepUndo} onReset={handleReset} completedSteps={completedSteps} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
