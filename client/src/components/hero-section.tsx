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
    <section className="relative overflow-hidden bg-white text-slate-900">
      <div className="absolute inset-0">
        <img
          src={HERO_BACKGROUND_IMAGE}
          alt="Chemistry laboratory background"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[68vh] flex-col items-center justify-center py-14 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-600 shadow-sm backdrop-blur">
            Virtual chemistry learning
          </div>

          <h2 className="max-w-5xl text-4xl font-black leading-tight text-slate-950 drop-shadow-sm md:text-6xl lg:text-[4.5rem]">
            Discover Chemistry Through Virtual Experiments
          </h2>

          <p className="hero-initiative hero-initiative-font mt-6 max-w-2xl text-xl font-semibold text-slate-800 md:text-2xl">
            An initiative by TIH, IITG
          </p>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
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
                className="rounded-full border-2 border-slate-900 bg-white/80 px-8 py-6 text-base font-semibold text-slate-900 backdrop-blur hover:bg-slate-900 hover:text-white"
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
