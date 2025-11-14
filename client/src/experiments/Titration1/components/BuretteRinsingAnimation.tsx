import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, FlaskConical, Play, FastForward } from "lucide-react";

interface BuretteRinsingAnimationProps {
  onComplete: () => void;
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  duration: number;
}

const animationSteps: AnimationStep[] = [
  {
    id: 1,
    title: "Rinse with Distilled Water",
    description: "Filling burette with distilled water to clean",
    duration: 6000,
  },
  {
    id: 2,
    title: "Discard Water Rinse",
    description: "Draining water through the tip to remove impurities",
    duration: 5000,
  },
  {
    id: 3,
    title: "Rinse with NaOH Solution",
    description: "Conditioning burette with small amount of NaOH",
    duration: 6000,
  },
  {
    id: 4,
    title: "Discard NaOH Rinse",
    description: "Removing conditioning solution",
    duration: 5000,
  },
  {
    id: 5,
    title: "Fill with NaOH Solution",
    description: "Filling burette completely with titrant",
    duration: 8000,
  },
  {
    id: 6,
    title: "Remove Air Bubbles",
    description: "Eliminating air bubbles from the tip",
    duration: 5000,
  },
  {
    id: 7,
    title: "Set Initial Reading",
    description: "Adjusting meniscus to zero mark (50mL capacity)",
    duration: 3000,
  }
];

export default function BuretteRinsingAnimation({ onComplete }: BuretteRinsingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [liquidLevel, setLiquidLevel] = useState(0);
  const [liquidColor, setLiquidColor] = useState('#87CEEB');
  const [isDraining, setIsDraining] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [showStopcockFlow, setShowStopcockFlow] = useState(false);
  const [stepAnimationComplete, setStepAnimationComplete] = useState(false);
  const [isStepAnimating, setIsStepAnimating] = useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setShowComplete(false);
    setLiquidLevel(0);
    setLiquidColor('#87CEEB');
    setIsDraining(false);
    setShowBubbles(false);
    setShowStopcockFlow(false);
    startFirstStep();
  };

  const startFirstStep = () => {
    setCurrentStep(0);
    setStepAnimationComplete(false);
    animateStepVisuals(0);
  };

  const skipAnimation = () => {
    // Skip directly to completion state
    setIsAnimating(false);
    setShowComplete(true);
    setCompletedSteps([0, 1, 2, 3, 4, 5, 6]); // Mark all steps as completed
    setLiquidLevel(100); // Set final liquid level
    setLiquidColor('#FFB6C1'); // Set final NaOH color
    setIsDraining(false);
    setShowBubbles(false);
    setShowStopcockFlow(false);
  };

  const goToNextStep = () => {
    const nextStepIndex = currentStep + 1;

    // Mark current step as completed
    setCompletedSteps(prev => [...prev, currentStep]);

    if (nextStepIndex >= animationSteps.length) {
      setIsAnimating(false);
      setShowComplete(true);
      return;
    }

    setCurrentStep(nextStepIndex);
    setStepAnimationComplete(false);
    animateStepVisuals(nextStepIndex);
  };

  const animateStepVisuals = (stepIndex: number) => {
    setIsStepAnimating(true);
    setStepAnimationComplete(false);

    switch(stepIndex) {
      case 0: // Rinse with water
        setLiquidColor('#87CEEB'); // Light blue water
        fillBurette(90, () => setStepAnimationComplete(true));
        break;
      case 1: // Discard water
        drainBurette(() => setStepAnimationComplete(true));
        break;
      case 2: // Rinse with NaOH
        setLiquidColor('#FFB6C1'); // Light pink NaOH
        fillBurette(30, () => setStepAnimationComplete(true));
        break;
      case 3: // Discard NaOH rinse
        drainBurette(() => setStepAnimationComplete(true));
        break;
      case 4: // Fill with NaOH
        setLiquidColor('#FFB6C1'); // Pink NaOH solution
        fillBurette(98, () => setStepAnimationComplete(true));
        break;
      case 5: // Remove air bubbles
        setShowBubbles(true);
        setShowStopcockFlow(true);
        setTimeout(() => {
          setShowBubbles(false);
          setShowStopcockFlow(false);
          setStepAnimationComplete(true);
        }, 4000);
        break;
      case 6: // Set initial reading
        setLiquidLevel(100); // Adjust to zero mark - liquid should be at the top (0 mL mark)
        setTimeout(() => setStepAnimationComplete(true), 2000);
        break;
    }
    setIsStepAnimating(false);
  };

  const fillBurette = (targetLevel: number, onComplete?: () => void) => {
    let currentLevel = 0;
    const fillInterval = setInterval(() => {
      currentLevel += 1; // Slower filling
      setLiquidLevel(currentLevel);
      if (currentLevel >= targetLevel) {
        clearInterval(fillInterval);
        if (onComplete) onComplete();
      }
    }, 80); // Slower interval
  };

  const drainBurette = (onComplete?: () => void) => {
    setIsDraining(true);
    setShowStopcockFlow(true);
    let currentLevel = liquidLevel;
    const drainInterval = setInterval(() => {
      currentLevel -= 2; // Slower draining
      setLiquidLevel(Math.max(0, currentLevel));
      if (currentLevel <= 0) {
        clearInterval(drainInterval);
        setIsDraining(false);
        setShowStopcockFlow(false);
        if (onComplete) onComplete();
      }
    }, 100); // Slower interval
  };

  const currentStepData = animationSteps[currentStep];
  const progress = ((completedSteps.length + (stepAnimationComplete ? 1 : 0)) / animationSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[85vh]">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b p-4">
          <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Burette Preparation Protocol
          </CardTitle>
          <p className="text-center text-gray-600 mt-1 text-sm">
            Watch the proper technique for accurate titration setup
          </p>
        </CardHeader>

        <CardContent className="p-4 max-h-[70vh] overflow-y-auto">
          {!isAnimating && !showComplete && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <FlaskConical className="w-12 h-12 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Interactive Burette Preparation
                </h3>
                <p className="text-gray-600 mb-4">
                  Watch realistic animations of proper burette cleaning, conditioning,
                  and filling procedures for accurate volumetric analysis.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  ✨ <strong>Tip:</strong> You can skip the animation if you're already familiar with burette preparation.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This visual demonstration shows each critical step 
                    for achieving ±0.01 mL measurement precision.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={startAnimation}
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-5 py-2 font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Animation
                </Button>
                <Button
                  onClick={skipAnimation}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 font-semibold"
                >
                  <FastForward className="w-5 h-5 mr-2" />
                  Skip Animation
                </Button>
              </div>
            </div>
          )}

          {isAnimating && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Animation Visual */}
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="relative">
                  {/* Burette Stand */}
                  <div className="w-6 h-48 bg-gray-600 rounded-sm mx-auto relative">
                    {/* Clamp */}
                    <div className="absolute top-12 -left-1 w-8 h-4 bg-gray-700 rounded"></div>
                  </div>

                  {/* Burette */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                    <div className="relative w-8 h-48 bg-gray-100 border-2 border-gray-300 rounded-sm">
                      {/* Volume markings */}
                      {[0, 10, 20, 30, 40, 50].map((mark) => (
                        <div
                          key={mark}
                          className="absolute right-full mr-2 -translate-y-1/2 text-xs font-mono text-gray-600 font-semibold"
                          style={{ top: `${(mark / 50) * 100}%` }}
                        >
                          {50 - mark}
                        </div>
                      ))}

                      {/* Minor graduations */}
                      {[5, 15, 25, 35, 45].map((mark) => (
                        <div
                          key={`minor-${mark}`}
                          className="absolute right-full mr-1 -translate-y-1/2 text-[10px] font-mono text-gray-400"
                          style={{ top: `${(mark / 50) * 100}%` }}
                        >
                          {50 - mark}
                        </div>
                      ))}
                      
                      {/* Liquid inside burette */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-in-out rounded-b-sm"
                        style={{ 
                          height: `${liquidLevel}%`, 
                          backgroundColor: liquidColor,
                          opacity: 0.8
                        }}
                      >
                        {/* Liquid surface animation */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white opacity-30 animate-pulse"></div>
                      </div>
                      
                      {/* Air bubbles */}
                      {showBubbles && (
                        <>
                          <div className="absolute bottom-10 left-1 w-1 h-1 bg-white rounded-full animate-bounce" 
                               style={{ animationDelay: '0s' }}></div>
                          <div className="absolute bottom-16 right-1 w-1 h-1 bg-white rounded-full animate-bounce" 
                               style={{ animationDelay: '0.2s' }}></div>
                          <div className="absolute bottom-8 left-1/2 w-1 h-1 bg-white rounded-full animate-bounce" 
                               style={{ animationDelay: '0.4s' }}></div>
                        </>
                      )}
                    </div>
                    
                    {/* Stopcock */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full relative">
                        <div className="w-2 h-2 bg-gray-600 rounded-full absolute top-1 left-1"></div>
                      </div>
                      
                      {/* Liquid flow from stopcock */}
                      {showStopcockFlow && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                          <div className="w-0.5 h-12 animate-pulse"
                               style={{ backgroundColor: liquidColor, opacity: 0.8 }}>
                            {/* Flow droplets */}
                            <div className="w-1 h-1 rounded-full absolute -left-0.25 top-0 animate-ping" 
                                 style={{ backgroundColor: liquidColor }}></div>
                            <div className="w-1 h-1 rounded-full absolute -left-0.25 top-4 animate-ping" 
                                 style={{ backgroundColor: liquidColor, animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-1 rounded-full absolute -left-0.25 top-8 animate-ping" 
                                 style={{ backgroundColor: liquidColor, animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Funnel (appears during filling) */}
                  {(currentStep === 0 || currentStep === 2 || currentStep === 4) && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-6 bg-gray-300 rounded-t-full border-2 border-gray-400 relative">
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-gray-400"></div>
                        {/* Liquid flowing through funnel */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-6 animate-pulse"
                             style={{ backgroundColor: liquidColor, opacity: 0.6 }}></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Beaker for waste (appears during draining) */}
                  {(currentStep === 1 || currentStep === 3) && (
                    <div className="absolute top-48 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-8 bg-gray-200 border-2 border-gray-400 rounded-b-lg relative">
                        {/* Waste liquid collecting */}
                        {isDraining && (
                          <div className="absolute bottom-0 left-0 right-0 h-2 rounded-b-lg transition-all duration-1000" 
                               style={{ backgroundColor: liquidColor, opacity: 0.6 }}></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Animation Info */}
              <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Step {currentStep + 1} of {animationSteps.length}
                    </span>
                    <span className="text-sm text-blue-600 font-semibold">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Current Step */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2">
                    {currentStepData?.title}
                  </h4>
                  <p className="text-gray-600 mb-3 text-sm">
                    {currentStepData?.description}
                  </p>

                  {/* Step-specific instructions */}
                  <div className="bg-white rounded-lg p-2 text-sm text-gray-700 mb-3">
                    {currentStep === 0 && "💧 Water fills the burette from top to bottom, washing away any residues."}
                    {currentStep === 1 && "🚿 Opening stopcock allows water to drain, carrying impurities away."}
                    {currentStep === 2 && "🧪 Small amount of NaOH solution conditions the glass surface."}
                    {currentStep === 3 && "♻️ Conditioning solution is discarded to prevent dilution."}
                    {currentStep === 4 && "📏 Burette fills completely with the titrant solution."}
                    {currentStep === 5 && "💨 Air bubbles rise and escape through the stopcock opening."}
                    {currentStep === 6 && "🎯 Final adjustment brings meniscus to the zero mark - burette filled to 50mL capacity."}
                  </div>

                  {/* Next Step Button */}
                  <div className="flex flex-wrap items-center gap-3 sm:justify-center">
                    <Button
                      onClick={goToNextStep}
                      disabled={!stepAnimationComplete}
                      size="sm"
                      className={`w-full sm:w-auto px-5 py-2 font-semibold transition-all ${
                        stepAnimationComplete
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {stepAnimationComplete ? (
                        currentStep === animationSteps.length - 1 ? (
                          <>Complete Preparation</>
                        ) : (
                          <>Next Step <ArrowRight className="w-4 h-4 ml-1" /></>
                        )
                      ) : (
                        <>Please wait... <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div></>
                      )}
                    </Button>
                    <Button
                      onClick={skipAnimation}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto px-5 py-2 font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <FastForward className="w-4 h-4 mr-2" />
                      Skip Animation
                    </Button>
                  </div>
                </div>

                {/* Completed Steps */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-700">Progress:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {animationSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center space-x-3 p-2 rounded text-sm transition-all ${
                          completedSteps.includes(index)
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : index === currentStep
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs">
                          {completedSteps.includes(index) ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : index === currentStep ? (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          ) : (
                            <span className="text-gray-400">{index + 1}</span>
                          )}
                        </div>
                        <span className="flex-1">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showComplete && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Burette Preparation Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  Perfect! Your burette is now properly prepared with NaOH solution.
                  The meniscus is at 0.00 mL mark (50mL total capacity) with ±0.01 mL precision.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      Burette Reading: 0.00 mL (50mL Capacity) | Ready for Titration
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={startAnimation}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Replay Animation
                </Button>
                <Button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 font-semibold"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Proceed to Titration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
