import { Play, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import SafetyGuideModal from "./safety-guide-modal";

const HERO_BACKGROUND_IMAGE =
  "https://images.pexels.com/photos/5428266/pexels-photo-5428266.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function HeroSection() {
  const scrollToExperiments = () => {
    const experimentsSection = document.getElementById("experiments");
    experimentsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <img
          src={HERO_BACKGROUND_IMAGE}
          alt="Chemistry laboratory background"
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-emerald-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72vh] flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/85 backdrop-blur">
            Virtual chemistry learning
          </div>

          <h2 className="max-w-5xl text-4xl font-extrabold leading-tight text-white drop-shadow-sm md:text-6xl lg:text-7xl">
            Discover Chemistry Through Virtual Experiments
          </h2>

          <p className="hero-initiative hero-initiative-font mt-6 max-w-2xl text-xl font-semibold text-white/95 md:text-2xl">
            An initiative by TIH, IITG
          </p>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/80 md:text-base">
            Explore guided simulations, observe laboratory reactions safely, and build confidence before entering the real lab.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button
              onClick={scrollToExperiments}
              className="rounded-full bg-emerald-500 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Experimenting
            </Button>

            <SafetyGuideModal>
              <Button
                variant="outline"
                className="rounded-full border-white/80 bg-white/10 px-8 py-6 text-base font-semibold text-white backdrop-blur hover:bg-white hover:text-slate-900"
              >
                <Book className="mr-2 h-4 w-4" />
                View Safety Guide
              </Button>
            </SafetyGuideModal>
          </div>
        </div>
      </div>
    </section>
  );
}
