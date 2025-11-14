import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Clock, ShieldAlert, TestTube2 } from "lucide-react";
import { useExperiment, useExperimentProgress, useUpdateProgress } from "@/hooks/use-experiments";

interface Props {
  experimentId: number;
  onBack?: () => void;
}

export default function GenericExperimentApp({ experimentId, onBack }: Props) {
  const { data: experiment } = useExperiment(experimentId);
  const { data: progress } = useExperimentProgress(experimentId);
  const updateProgress = useUpdateProgress();

  const totalSteps = experiment?.stepDetails?.length ?? 0;
  const initialStep = useMemo(() => Math.max(0, Math.min((progress?.currentStep ?? 0) - 1, totalSteps - 1)), [progress, totalSteps]);
  const [stepIndex, setStepIndex] = useState<number>(initialStep);

  useEffect(() => {
    setStepIndex(initialStep);
  }, [initialStep]);

  const percent = useMemo(() => (totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0), [stepIndex, totalSteps]);
  const isCompleted = useMemo(() => percent >= 100, [percent]);

  const commitProgress = (idx: number, completed = false) => {
    const currentStep = Math.min(totalSteps, Math.max(0, idx + 1));
    updateProgress.mutate({
      experimentId,
      currentStep,
      completed,
      progressPercentage: completed ? 100 : Math.min(100, Math.round((currentStep / Math.max(1, totalSteps)) * 100)),
    });
  };

  const next = () => {
    const nextIndex = Math.min(totalSteps - 1, stepIndex + 1);
    setStepIndex(nextIndex);
    commitProgress(nextIndex, nextIndex === totalSteps - 1);
  };
  const prev = () => {
    const prevIndex = Math.max(0, stepIndex - 1);
    setStepIndex(prevIndex);
    commitProgress(prevIndex, false);
  };
  const markComplete = () => {
    commitProgress(totalSteps - 1, true);
  };

  if (!experiment) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Experiment Not Found</h2>
          <p className="text-gray-600 mb-6">The requested experiment (ID: {experimentId}) is not available.</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white">Return</Button>
        </div>
      </div>
    );
  }

  const step = experiment.stepDetails[stepIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <span className="text-sm text-gray-600">ID: {experimentId}</span>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <img src={experiment.imageUrl} alt={experiment.title} className="w-full md:w-80 h-48 object-cover rounded" loading="lazy" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">{experiment.category}</span>
                <div className="flex items-center text-sm text-gray-600"><Clock className="mr-1 h-4 w-4" />{experiment.duration} min</div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{experiment.title}</h1>
              <p className="text-gray-700 mb-3">{experiment.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="text-sm text-gray-600 mt-1">Progress: {percent}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step {stepIndex + 1} of {totalSteps}: {step.title}</h2>
            <p className="text-gray-700 mb-4">{step.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {step.duration}</div>
              {step.temperature && <div className="inline-flex items-center gap-2"><TestTube2 className="h-4 w-4" /> {step.temperature}</div>}
              {step.safety && <div className="inline-flex items-center gap-2 text-red-600"><ShieldAlert className="h-4 w-4" /> {step.safety}</div>}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={prev} disabled={stepIndex === 0}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-3">
                {!isCompleted && (
                  <Button onClick={next} disabled={stepIndex >= totalSteps - 1}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button onClick={markComplete} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Equipment & Materials</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {experiment.equipment.map((eq, i) => (
                  <li key={i}>{eq}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Safety Information</h3>
              <p className="text-sm text-gray-700">{experiment.safetyInfo}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
