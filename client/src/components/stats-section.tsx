import { useStats } from "@/hooks/use-experiments";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsSection() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <section className="-mt-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:divide-x md:divide-slate-200">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center md:px-6">
                <Skeleton className="mx-auto mb-2 h-8 w-16" />
                <Skeleton className="mx-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const items = [
    {
      value: stats.experiments.toLocaleString(),
      label: "Available Experiments",
      tone: "text-slate-900",
    },
    {
      value: stats.students.toLocaleString(),
      label: "Active Students",
      tone: "text-emerald-600",
    },
    {
      value: stats.completed.toLocaleString(),
      label: "Experiments Completed",
      tone: "text-slate-900",
    },
    {
      value: stats.rating,
      label: "Average Rating",
      tone: "text-emerald-600",
    },
  ];

  return (
    <section className="-mt-10 px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:divide-x md:divide-slate-200">
          {items.map((item) => (
            <div key={item.label} className="text-center md:px-6">
              <div className={`text-3xl font-extrabold md:text-4xl ${item.tone}`}>{item.value}</div>
              <div className="mt-2 text-sm text-slate-600 md:text-base">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
