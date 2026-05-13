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
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[66vh] flex-col items-center justify-center py-12 text-center">
          <h2 className="max-w-6xl text-[2.9rem] font-black leading-[1.05] tracking-tight text-slate-900 md:text-6xl lg:text-[4.6rem]">
            Discover Chemistry Through Virtual Experiments
          </h2>

          <p className="hero-initiative hero-initiative-font mt-6 text-xl font-semibold text-slate-800 md:text-2xl">
            An initiative by TIH, IITG
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button
              onClick={scrollToExperiments}
              className="rounded-md bg-emerald-500 px-9 py-6 text-base font-medium text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Experimenting
            </Button>

            <SafetyGuideModal>
              <Button
                variant="outline"
                className="rounded-md border-2 border-slate-700 bg-white px-9 py-6 text-base font-medium text-slate-900 hover:bg-slate-50"
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
