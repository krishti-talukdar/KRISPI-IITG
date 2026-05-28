import { useState } from "react";
import { useStats } from "@/hooks/use-experiments";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StatsSection() {
  const { data: stats, isLoading } = useStats();
  const { toast } = useToast();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  if (isLoading) {
    return (
      <section className="-mt-8 px-4 pb-12 sm:px-6 lg:px-8 relative" style={{backgroundImage: "url('https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Feef538cc6581401c9f7487580c2d0494?format=webp&width=800&height=1200')", backgroundSize: "cover", backgroundAttachment: "fixed"}}>
        <div className="mx-auto max-w-6xl rounded-[26px] border border-slate-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:divide-x md:divide-slate-200">
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
      value: "8",
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
      value: userRating.toFixed(1).replace(/\.0$/, ""),
      label: "Average Rating",
      tone: "text-emerald-600",
    },
  ];

  const activeRating = hoveredRating || selectedRating;

  const handleSubmitRating = () => {
    const ratingValue = selectedRating || 5;
    setUserRating(ratingValue);
    toast({
      title: "Thanks for your rating",
      description: `You rated ChemVerse IITG ${ratingValue} out of 5 stars.`,
    });
    setIsRatingOpen(false);
    setHoveredRating(0);
    setSelectedRating(0);
  };

  return (
    <>
      <section className="-mt-8 px-4 pb-12 sm:px-6 lg:px-8 relative" style={{backgroundImage: "url('https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Feef538cc6581401c9f7487580c2d0494?format=webp&width=800&height=1200')", backgroundSize: "cover", backgroundAttachment: "fixed"}}>
        <div className="mx-auto max-w-6xl rounded-[26px] border border-slate-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:divide-x md:divide-slate-200">
            {items.map((item) =>
              item.label === "Average Rating" ? (
                <Dialog key={item.label} open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                  <div className="text-center md:px-6">
                    <button
                      type="button"
                      onClick={() => setIsRatingOpen(true)}
                      className="group flex w-full flex-col items-center rounded-2xl px-3 py-2 text-center transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <div className={`text-3xl font-bold md:text-4xl ${item.tone}`}>{item.value}</div>
                      <div className="mt-2 text-sm text-slate-600 md:text-base">{item.label}</div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-700 opacity-0 transition group-hover:opacity-100">
                        Rate now
                      </div>
                    </button>
                  </div>

                  <DialogContent className="max-w-lg overflow-hidden border-slate-100 p-0 shadow-2xl">
                    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-emerald-950 px-6 py-6 text-white">
                      <DialogHeader className="space-y-2 text-left">
                        <DialogTitle className="text-2xl font-bold text-white">
                          Rate your experience
                        </DialogTitle>
                        <DialogDescription className="text-white/75">
                          Choose 1 to 5 stars based on your experience with ChemVerse IITG.
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="px-6 py-8">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const isActive = rating <= activeRating;
                          return (
                            <button
                              key={rating}
                              type="button"
                              onMouseEnter={() => setHoveredRating(rating)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => setSelectedRating(rating)}
                              className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                              aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                            >
                              <Star
                                className={`h-11 w-11 transition-colors ${
                                  isActive ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 text-center">
                        <div className="text-lg font-semibold text-slate-900">
                          {selectedRating ? `${selectedRating} out of 5 stars selected` : "Select a rating"}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Your feedback helps us improve the virtual lab experience.
                        </p>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                      <Button variant="outline" onClick={() => setIsRatingOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitRating}
                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        Submit Rating
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <div key={item.label} className="text-center md:px-6">
                  <div className={`text-3xl font-bold md:text-4xl ${item.tone}`}>{item.value}</div>
                  <div className="mt-2 text-sm text-slate-600 md:text-base">{item.label}</div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
