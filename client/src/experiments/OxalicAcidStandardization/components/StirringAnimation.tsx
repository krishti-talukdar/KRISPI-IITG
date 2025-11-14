import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StirringAnimationProps {
  isActive: boolean;
  containerWidth?: number;
  containerHeight?: number;
  stirringSpeed?: "slow" | "medium" | "fast";
  solutionColor?: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  size: number;
  color: string;
}

export const StirringAnimation: React.FC<StirringAnimationProps> = ({
  isActive,
  containerWidth = 100,
  containerHeight = 120,
  stirringSpeed = "medium",
  solutionColor = "#87ceeb",
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stirringAngle, setStirringAngle] = useState(0);

  const speedConfig = {
    slow: { duration: 3, particleSpeed: 0.02 },
    medium: { duration: 2, particleSpeed: 0.04 },
    fast: { duration: 1, particleSpeed: 0.06 },
  };

  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  useEffect(() => {
    if (isActive) {
      // Initialize particles in circular motion
      const initialParticles: Particle[] = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        const radius = 20 + Math.random() * 15;
        return {
          id: `particle-${i}`,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          angle,
          radius,
          size: 2 + Math.random() * 3,
          color: i % 3 === 0 ? solutionColor : i % 3 === 1 ? "#ffffff" : "#ffeb3b",
        };
      });

      setParticles(initialParticles);
    }
  }, [isActive, centerX, centerY, solutionColor]);

  useEffect(() => {
    if (isActive) {
      const animationLoop = setInterval(() => {
        setStirringAngle(prev => prev + speedConfig[stirringSpeed].particleSpeed * 10);
        
        setParticles(prev => 
          prev.map(particle => {
            const newAngle = particle.angle + speedConfig[stirringSpeed].particleSpeed;
            return {
              ...particle,
              angle: newAngle,
              x: centerX + Math.cos(newAngle) * particle.radius,
              y: centerY + Math.sin(newAngle) * particle.radius,
            };
          })
        );
      }, 50);

      return () => clearInterval(animationLoop);
    }
  }, [isActive, stirringSpeed, centerX, centerY, speedConfig]);

  if (!isActive) return null;

  return (
    <div 
      className="relative overflow-hidden rounded-lg"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Solution background with swirl effect */}

      {/* Particle system */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            border: particle.color === "#ffffff" ? "1px solid #ccc" : "none",
          }}
          animate={{
            x: particle.x - particle.size / 2,
            y: particle.y - particle.size / 2,
          }}
          transition={{
            duration: 0.1,
            ease: "linear",
          }}
        />
      ))}

      {/* Glass rod */}
      <motion.div
        className="absolute bg-gray-400 rounded-full"
        style={{
          width: 4,
          height: containerHeight * 0.7,
          left: centerX - 2,
          top: containerHeight * 0.15,
          transformOrigin: `2px ${containerHeight * 0.65}px`,
        }}
        animate={{
          rotate: [0, 12, -12, 0],
        }}
        transition={{
          duration: speedConfig[stirringSpeed].duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Vortex effect */}
      <motion.div
        className="absolute rounded-full border-2 border-gray-300 opacity-20"
        style={{
          width: 40,
          height: 40,
          left: centerX - 20,
          top: centerY - 20,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.08, 0.25],
        }}
        transition={{
          duration: speedConfig[stirringSpeed].duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Speed indicator */}
      <div className="absolute top-1 right-1 text-xs font-semibold text-gray-700 bg-white bg-opacity-80 px-1 rounded">
        {stirringSpeed.toUpperCase()}
      </div>
    </div>
  );
};

export default StirringAnimation;
