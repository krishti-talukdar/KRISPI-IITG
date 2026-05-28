import { Play, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import SafetyGuideModal from "./safety-guide-modal";

const HERO_BACKGROUND_IMAGE =
  "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F766443c4dfda4acdbbccf3e3a35b1953?format=webp&width=800&height=1200";

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
          className="h-full w-full object-cover object-center opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/15 to-white/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[64vh] flex-col items-center justify-center py-10 text-center">
          <h2 className="max-w-4xl text-[2.25rem] font-black leading-[1.05] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            Discover Chemistry Through Virtual Experiments
          </h2>

          <p className="hero-initiative hero-initiative-font mt-5 text-[1.7rem] font-semibold text-black md:text-2xl">
            An initiative by TIH, IITG
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button
              onClick={scrollToExperiments}
              className="rounded-md bg-green-600 px-9 py-5 text-sm font-medium text-white shadow-md shadow-green-600/20 hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/40 transition-all duration-200 hover:scale-105"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Experimenting
            </Button>

            <SafetyGuideModal>
              <Button
                variant="outline"
                className="rounded-md border-2 border-gray-400 bg-white px-9 py-5 text-sm font-medium text-slate-900 hover:bg-gray-50 hover:shadow-lg hover:scale-105 transition-all duration-200"
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
