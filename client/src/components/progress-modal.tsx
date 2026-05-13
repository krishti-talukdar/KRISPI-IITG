import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Book, Trophy, Sparkles } from "lucide-react";
import { useExperiments } from "@/hooks/use-experiments";
import { getUserId } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ProgressModalProps {
  children: React.ReactNode;
}

export default function ProgressModal({ children }: ProgressModalProps) {
  const { data: experiments } = useExperiments();
  const userId = getUserId();

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress", userId],
    queryFn: async () => {
      const response = await fetch(`/api/progress/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
  });

  const getExperimentProgress = (experimentId: number) => {
    const progress = userProgress?.find((p: any) => p.experimentId === experimentId);
    return progress ? progress.currentStep ?? 0 : 0;
  };

  const getTotalProgress = () => {
    if (!experiments || !userProgress) return 0;

    const totalSteps = experiments.reduce(
      (sum: number, exp: any) => sum + (exp.stepDetails?.length ?? exp.steps ?? 0),
      0,
    );
    const completedSteps = userProgress.reduce(
      (sum: number, p: any) => sum + (p.currentStep ?? 0),
      0,
    );

    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  const getCompletedExperiments = () => {
    if (!experiments || !userProgress) return 0;

    return userProgress.filter((p: any) => {
      const experiment = experiments.find((exp: any) => exp.id === p.experimentId);
      const stepsCount = experiment ? (experiment.stepDetails?.length ?? experiment.steps ?? 0) : 0;
      return p.completed || (p.currentStep ?? 0) >= stepsCount;
    }).length;
  };

  const totalExperiments = experiments?.length || 0;
  const overallProgress = getTotalProgress();
  const completedExperiments = getCompletedExperiments();
  const totalStepsCompleted = userProgress?.reduce(
    (sum: number, p: any) => sum + (p.currentStep ?? 0),
    0,
  ) || 0;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden border-white/70 bg-gradient-to-b from-white to-slate-50 p-0 shadow-2xl sm:max-h-[88vh]">
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-emerald-950 px-6 py-6 text-white sm:px-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                <Trophy className="h-6 w-6 text-amber-300" />
              </span>
              My Learning Progress
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm text-white/80 sm:text-base">
              Track your progress across all chemistry experiments and see where you stand at a glance.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
                Overall Completion
              </div>
              <div className="mt-3 text-4xl font-black text-white">{overallProgress}%</div>
              <p className="mt-2 text-sm text-white/75">Your learning journey so far</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
                Experiments Completed
              </div>
              <div className="mt-3 text-4xl font-black text-emerald-300">{completedExperiments}</div>
              <p className="mt-2 text-sm text-white/75">Finished with all required steps</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
                Total Experiments
              </div>
              <div className="mt-3 text-4xl font-black text-violet-300">{totalExperiments}</div>
              <p className="mt-2 text-sm text-white/75">Available in the chemistry lab</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-8 px-6 py-6 sm:px-8">
            <section className="rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Overall Progress
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Your current summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[60%]">
                  {[
                    { label: "Completion", value: `${overallProgress}%`, tone: "text-blue-600" },
                    { label: "Done", value: completedExperiments, tone: "text-emerald-600" },
                    { label: "Total", value: totalExperiments, tone: "text-violet-600" },
                    { label: "Steps", value: totalStepsCompleted, tone: "text-slate-900" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white bg-white/80 p-4 text-center shadow-sm">
                      <div className={`text-2xl font-black ${item.tone}`}>{item.value}</div>
                      <div className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <Progress value={overallProgress} className="h-3 rounded-full" />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Experiment Progress
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    Where each experiment stands
                  </h3>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm sm:flex">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Keep going — progress updates live
                </div>
              </div>

              <div className="space-y-4">
                {experiments?.map((experiment: any) => {
                  const progress = getExperimentProgress(experiment.id);
                  const stepsCount = experiment.stepDetails?.length ?? experiment.steps ?? 0;
                  const progressPercentage = stepsCount > 0 ? Math.round((progress / stepsCount) * 100) : 0;
                  const isCompleted = progress >= stepsCount;

                  return (
                    <div
                      key={experiment.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-600"
                                : progress > 0
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : progress > 0 ? (
                              <Clock className="h-5 w-5" />
                            ) : (
                              <Book className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-slate-900 sm:text-lg">
                              {experiment.title}
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-3 py-1">{experiment.category}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">{experiment.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-500">
                          {progress}/{stepsCount} steps
                        </div>
                      </div>

                      <div className="mt-4">
                        <Progress value={progressPercentage} className="h-2.5 rounded-full" />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className={`${isCompleted ? "text-emerald-700" : progress > 0 ? "text-amber-700" : "text-slate-500"}`}>
                          {isCompleted ? "Completed!" : progress > 0 ? "In Progress" : "Not Started"}
                        </span>
                        <span className="font-semibold text-slate-900">{progressPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Learning Statistics
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-500">Total Steps Completed</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{totalStepsCompleted}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-500">Average Progress</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{overallProgress}%</div>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
