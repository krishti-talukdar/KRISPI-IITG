import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, TrendingUp, Check } from "lucide-react";

interface WeighingAnimationProps {
  isActive: boolean;
  targetMass: number;
  onWeighingComplete: (actualMass: number) => void;
  precision?: number; // decimal places
}

export const WeighingAnimation: React.FC<WeighingAnimationProps> = ({
  isActive,
  targetMass,
  onWeighingComplete,
  precision = 4,
}) => {
  const [currentMass, setCurrentMass] = useState(0);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [fluctuation, setFluctuation] = useState(0);
  const [weighingPhase, setWeighingPhase] = useState<"adding" | "stabilizing" | "complete">("adding");

  useEffect(() => {
    if (isActive) {
      setCurrentMass(0);
      setIsStabilizing(false);
      setIsStable(false);
      setWeighingPhase("adding");

      // Phase 1: Adding material with gradual mass increase
      const addingInterval = setInterval(() => {
        setCurrentMass(prev => {
          const increment = targetMass * 0.02 + Math.random() * targetMass * 0.01;
          const newMass = Math.min(prev + increment, targetMass + 0.005);
          
          if (newMass >= targetMass - 0.01) {
            clearInterval(addingInterval);
            setWeighingPhase("stabilizing");
            setIsStabilizing(true);
          }
          
          return newMass;
        });
      }, 200);

      return () => clearInterval(addingInterval);
    }
  }, [isActive, targetMass]);

  useEffect(() => {
    if (weighingPhase === "stabilizing") {
      // Phase 2: Balance fluctuation and stabilization
      const fluctuationInterval = setInterval(() => {
        setFluctuation((Math.random() - 0.5) * 0.002);
      }, 100);

      // Gradually reduce fluctuation
      const stabilizationTimer = setTimeout(() => {
        clearInterval(fluctuationInterval);
        setFluctuation(0);
        setIsStabilizing(false);
        setIsStable(true);
        setWeighingPhase("complete");
        
        // Final mass with slight variation for realism
        const finalMass = targetMass + (Math.random() - 0.5) * 0.004;
        setCurrentMass(finalMass);
        
        setTimeout(() => {
          onWeighingComplete(finalMass);
        }, 1000);
      }, 3000);

      return () => {
        clearInterval(fluctuationInterval);
        clearTimeout(stabilizationTimer);
      };
    }
  }, [weighingPhase, targetMass, onWeighingComplete]);

  const displayMass = currentMass + fluctuation;
  const accuracy = Math.abs((displayMass - targetMass) / targetMass) * 100;

  if (!isActive) return null;

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg border-2 border-gray-700 font-mono">
      {/* Balance header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5" />
          <span className="text-sm font-semibold">Analytical Balance</span>
        </div>
        <div className="text-xs text-gray-400">
          Model: AB-220-4M
        </div>
      </div>

      {/* Main display */}
      <div className="bg-black p-4 rounded border border-gray-600 mb-4">
        <div className="text-center">
          <motion.div
            className="text-3xl font-bold mb-2"
            animate={{
              color: isStable ? "#10b981" : isStabilizing ? "#f59e0b" : "#10b981",
            }}
          >
            {displayMass.toFixed(precision)} g
          </motion.div>
          
          <div className="flex justify-center space-x-4 text-xs">
            <div>Target: {targetMass.toFixed(precision)} g</div>
            <div>Error: ±{accuracy.toFixed(3)}%</div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Status:</span>
          <div className="flex items-center space-x-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${
                weighingPhase === "adding" ? "bg-blue-400" :
                weighingPhase === "stabilizing" ? "bg-yellow-400" : "bg-green-400"
              }`}
              animate={{
                scale: isStabilizing ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: isStabilizing ? Infinity : 0,
              }}
            />
            <span className="capitalize">{weighingPhase}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Stability:</span>
          <div className="flex items-center space-x-2">
            {isStabilizing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <TrendingUp className="w-4 h-4" />
              </motion.div>
            )}
            {isStable && <Check className="w-4 h-4 text-green-400" />}
            <span>{isStable ? "Stable" : isStabilizing ? "Stabilizing..." : "Adding"}</span>
          </div>
        </div>
      </div>

      {/* Precision indicators */}
      <div className="mt-4 p-2 bg-gray-800 rounded">
        <div className="text-xs text-gray-400 mb-2">Precision Indicators:</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {['±0.0001g', 'CAL', 'ZERO', 'TARE'].map((indicator, index) => (
            <div
              key={indicator}
              className={`p-1 text-center rounded ${
                (weighingPhase === "complete" && index === 0) ? 'bg-green-700 text-green-200' : 'bg-gray-700'
              }`}
            >
              {indicator}
            </div>
          ))}
        </div>
      </div>

      {/* Environmental conditions */}
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Temperature:</span>
          <span>20.1°C</span>
        </div>
        <div className="flex justify-between">
          <span>Humidity:</span>
          <span>45.2%</span>
        </div>
        <div className="flex justify-between">
          <span>Air Pressure:</span>
          <span>1013.2 mBar</span>
        </div>
      </div>

      {/* Instructions */}
      <AnimatePresence>
        {weighingPhase === "adding" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-2 bg-blue-900 border border-blue-700 rounded text-xs"
          >
            <div className="font-semibold mb-1">Instructions:</div>
            <div>Add oxalic acid crystals slowly until near target mass</div>
          </motion.div>
        )}
        
        {weighingPhase === "stabilizing" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-2 bg-yellow-900 border border-yellow-700 rounded text-xs"
          >
            <div className="font-semibold mb-1">Please Wait:</div>
            <div>Balance is stabilizing... Do not touch the balance pan</div>
          </motion.div>
        )}
        
        {weighingPhase === "complete" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-2 bg-green-900 border border-green-700 rounded text-xs"
          >
            <div className="font-semibold mb-1">Weighing Complete:</div>
            <div>Record the exact mass: {displayMass.toFixed(precision)} g</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeighingAnimation;
