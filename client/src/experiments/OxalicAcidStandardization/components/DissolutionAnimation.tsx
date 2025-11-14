import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DissolutionAnimationProps {
  isActive: boolean;
  onComplete: () => void;
  containerWidth?: number;
  containerHeight?: number;
}

interface Molecule {
  id: string;
  x: number;
  y: number;
  type: "oxalic" | "water" | "ion";
  formula: string;
  color: string;
  size: number;
}

export const DissolutionAnimation: React.FC<DissolutionAnimationProps> = ({
  isActive,
  onComplete,
  containerWidth = 200,
  containerHeight = 150,
}) => {
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [phase, setPhase] = useState<"initial" | "dissolving" | "dissolved">("initial");

  useEffect(() => {
    if (isActive) {
      // Initialize with oxalic acid crystals and water molecules
      const initialMolecules: Molecule[] = [
        // Oxalic acid crystals (clustered)
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `oxalic-${i}`,
          x: 50 + (i % 3) * 15 + Math.random() * 10,
          y: 50 + Math.floor(i / 3) * 15 + Math.random() * 10,
          type: "oxalic" as const,
          formula: "H₂C₂O₄",
          color: "#ffffff",
          size: 8,
        })),
        // Water molecules (dispersed)
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `water-${i}`,
          x: Math.random() * containerWidth,
          y: Math.random() * containerHeight,
          type: "water" as const,
          formula: "H₂O",
          color: "#87ceeb",
          size: 4,
        })),
      ];

      setMolecules(initialMolecules);
      setPhase("initial");

      // Start dissolution animation
      const timer1 = setTimeout(() => {
        setPhase("dissolving");
      }, 1000);

      // Complete dissolution
      const timer2 = setTimeout(() => {
        setPhase("dissolved");
        onComplete();
      }, 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isActive, onComplete, containerWidth, containerHeight]);

  useEffect(() => {
    if (phase === "dissolving") {
      // Animate dissolution: oxalic acid molecules break apart and disperse
      const dissolutionTimer = setInterval(() => {
        setMolecules(prev => 
          prev.map(molecule => {
            if (molecule.type === "oxalic") {
              // Break into ions and disperse
              return {
                ...molecule,
                x: Math.random() * containerWidth,
                y: Math.random() * containerHeight,
                type: "ion" as const,
                formula: "C₂O₄²⁻",
                color: "#ffeb3b",
                size: 6,
              };
            }
            // Water molecules move more actively
            return {
              ...molecule,
              x: Math.max(0, Math.min(containerWidth, molecule.x + (Math.random() - 0.5) * 20)),
              y: Math.max(0, Math.min(containerHeight, molecule.y + (Math.random() - 0.5) * 20)),
            };
          })
        );
      }, 200);

      setTimeout(() => {
        clearInterval(dissolutionTimer);
      }, 3000);

      return () => clearInterval(dissolutionTimer);
    }
  }, [phase, containerWidth, containerHeight]);

  if (!isActive) return null;

  return (
    <div 
      className="relative border-2 border-gray-300 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 overflow-hidden"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Molecular visualization */}
      <AnimatePresence>
        {molecules.map((molecule) => (
          <motion.div
            key={molecule.id}
            className="absolute rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
            style={{
              width: molecule.size * 2,
              height: molecule.size * 2,
              backgroundColor: molecule.color,
              border: `1px solid ${molecule.color === "#ffffff" ? "#ccc" : "transparent"}`,
              color: molecule.color === "#ffffff" ? "#333" : "#fff",
              fontSize: "6px",
            }}
            initial={{ 
              x: molecule.x, 
              y: molecule.y,
              scale: 1,
              opacity: 1,
            }}
            animate={{ 
              x: molecule.x, 
              y: molecule.y,
              scale: phase === "dissolving" && molecule.type === "oxalic" ? [1, 1.2, 0.8] : 1,
              opacity: 1,
            }}
            exit={{ 
              scale: 0, 
              opacity: 0 
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut",
              scale: {
                repeat: phase === "dissolving" ? Infinity : 0,
                repeatType: "reverse",
                duration: 0.5,
              }
            }}
            title={molecule.formula}
          >
            {molecule.type === "oxalic" && "OA"}
            {molecule.type === "water" && "W"}
            {molecule.type === "ion" && "I"}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Stirring effect */}
      {phase === "dissolving" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, transparent 30%, rgba(59, 130, 246, 0.1) 70%)",
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Phase labels */}
      <div className="absolute top-1 left-1 text-xs font-semibold text-gray-700 bg-white bg-opacity-80 px-1 rounded">
        {phase === "initial" && "Crystal Structure"}
        {phase === "dissolving" && "Dissolving..."}
        {phase === "dissolved" && "Homogeneous Solution"}
      </div>

      {/* Molecular legend */}
      <div className="absolute bottom-1 left-1 text-xs space-y-1">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white border border-gray-300 rounded-full"></div>
          <span className="text-gray-700 text-xs">H₂C₂O₄</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-gray-700 text-xs">H₂O</span>
        </div>
        {phase !== "initial" && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-700 text-xs">C₂O₄²⁻</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DissolutionAnimation;
