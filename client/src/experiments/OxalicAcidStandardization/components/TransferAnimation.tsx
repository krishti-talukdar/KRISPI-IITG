import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Droplets, FlaskConical } from "lucide-react";

interface TransferAnimationProps {
  isActive: boolean;
  fromContainer: "beaker" | "flask";
  toContainer: "beaker" | "flask";
  solutionColor?: string;
  transferVolume?: number;
  onTransferComplete: () => void;
}

interface LiquidDrop {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export const TransferAnimation: React.FC<TransferAnimationProps> = ({
  isActive,
  fromContainer,
  toContainer,
  solutionColor = "#87ceeb",
  transferVolume = 100,
  onTransferComplete,
}) => {
  const [drops, setDrops] = useState<LiquidDrop[]>([]);
  const [transferPhase, setTransferPhase] = useState<"pouring" | "rinsing" | "complete">("pouring");
  const [transferredVolume, setTransferredVolume] = useState(0);

  useEffect(() => {
    if (isActive) {
      setDrops([]);
      setTransferredVolume(0);
      setTransferPhase("pouring");

      // Create liquid drops animation
      const dropInterval = setInterval(() => {
        const newDrop: LiquidDrop = {
          id: `drop-${Date.now()}-${Math.random()}`,
          x: 50 + Math.random() * 20, // Funnel opening area
          y: 0,
          size: 3 + Math.random() * 2,
          delay: Math.random() * 0.2,
        };

        setDrops(prev => [...prev, newDrop]);
        setTransferredVolume(prev => prev + 2);

        // Remove drop after it reaches bottom
        setTimeout(() => {
          setDrops(prev => prev.filter(d => d.id !== newDrop.id));
        }, 1500);
      }, 150);

      // Phase 1: Main transfer
      setTimeout(() => {
        setTransferPhase("rinsing");
      }, 3000);

      // Phase 2: Rinsing
      setTimeout(() => {
        clearInterval(dropInterval);
        setTransferPhase("complete");
        setTimeout(() => {
          onTransferComplete();
        }, 1000);
      }, 5000);

      return () => clearInterval(dropInterval);
    }
  }, [isActive, onTransferComplete]);

  if (!isActive) return null;

  return (
    <div className="relative w-80 h-96 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden">
      
      {/* Source container (beaker) */}
      <motion.div
        className="absolute top-8 left-8 w-20 h-24 border-2 border-gray-400 rounded-b-lg bg-gradient-to-b from-transparent to-blue-100"
        animate={{
          rotate: transferPhase === "pouring" ? 25 : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute bottom-1 left-1 right-1 rounded-b-lg"
          style={{ backgroundColor: solutionColor }}
          animate={{
            height: transferPhase === "pouring" ? "20%" : "60%",
          }}
          transition={{ duration: 2 }}
        />
        
        {/* Pouring stream */}
        {transferPhase === "pouring" && (
          <motion.div
            className="absolute -right-1 bottom-4 w-1 h-8 rounded-full"
            style={{ backgroundColor: solutionColor }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 0.8, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
          />
        )}
      </motion.div>

      {/* Funnel */}
      <div className="absolute top-32 left-32 w-16 h-12">
        <div className="w-16 h-8 border-2 border-gray-500 bg-gray-100" style={{
          clipPath: "polygon(20% 0%, 80% 0%, 90% 100%, 10% 100%)"
        }} />
        <div className="w-2 h-4 bg-gray-100 border-x-2 border-gray-500 mx-auto" />
      </div>

      {/* Target container (volumetric flask) */}
      <motion.div
        className="absolute bottom-8 left-28 w-24 h-32 border-2 border-gray-400 rounded-b-full bg-gradient-to-b from-transparent to-blue-50"
      >
        <motion.div
          className="absolute bottom-1 left-1 right-1 rounded-b-full"
          style={{ backgroundColor: solutionColor }}
          animate={{
            height: `${Math.min((transferredVolume / transferVolume) * 80, 80)}%`,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Volume markings */}
        <div className="absolute right-1 h-full flex flex-col justify-end text-xs text-gray-600">
          {[50, 100, 150, 200, 250].map(vol => (
            <div key={vol} className="flex items-center h-4">
              <div className="w-2 h-0.5 bg-gray-400" />
              <span className="ml-1 text-xs">{vol}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Animated liquid drops */}
      <AnimatePresence>
        {drops.map((drop) => (
          <motion.div
            key={drop.id}
            className="absolute rounded-full"
            style={{
              width: drop.size,
              height: drop.size,
              backgroundColor: solutionColor,
              left: drop.x,
            }}
            initial={{ y: 130, opacity: 1 }}
            animate={{ y: 280, opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.2,
              delay: drop.delay,
              ease: "easeIn",
            }}
          />
        ))}
      </AnimatePresence>

      {/* Rinse water (clear) */}
      {transferPhase === "rinsing" && (
        <AnimatePresence>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`rinse-${i}`}
              className="absolute rounded-full bg-blue-200 opacity-60"
              style={{
                width: 2,
                height: 2,
                left: 52 + Math.random() * 16,
              }}
              initial={{ y: 130, opacity: 1 }}
              animate={{ y: 280, opacity: 0 }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                ease: "easeIn",
              }}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Status panel */}
      <motion.div
        className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="text-sm font-semibold mb-2 flex items-center">
          <FlaskConical className="w-4 h-4 mr-1" />
          Transfer Progress
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Phase:</span>
            <span className="capitalize font-medium">{transferPhase}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Volume:</span>
            <span className="font-mono">{transferredVolume.toFixed(0)} mL</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              animate={{
                width: `${Math.min((transferredVolume / transferVolume) * 100, 100)}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Phase-specific instructions */}
        <div className="mt-3 p-2 rounded text-xs">
          {transferPhase === "pouring" && (
            <div className="text-blue-700 bg-blue-100 p-2 rounded">
              <Droplets className="w-3 h-3 inline mr-1" />
              Transferring solution via funnel
            </div>
          )}
          
          {transferPhase === "rinsing" && (
            <div className="text-green-700 bg-green-100 p-2 rounded">
              <ArrowDown className="w-3 h-3 inline mr-1" />
              Rinsing beaker and funnel
            </div>
          )}
          
          {transferPhase === "complete" && (
            <div className="text-gray-700 bg-gray-100 p-2 rounded">
              ✓ Transfer complete
            </div>
          )}
        </div>
      </motion.div>

      {/* Background grid for reference */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
      </div>
    </div>
  );
};

export default TransferAnimation;
