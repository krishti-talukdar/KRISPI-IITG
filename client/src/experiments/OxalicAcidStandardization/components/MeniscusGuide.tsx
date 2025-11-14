import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Target, CheckCircle } from "lucide-react";

interface MeniscusGuideProps {
  isActive: boolean;
  targetVolume: number;
  currentVolume: number;
  onVolumeReached: () => void;
  flaskHeight?: number;
  flaskWidth?: number;
}

export const MeniscusGuide: React.FC<MeniscusGuideProps> = ({
  isActive,
  targetVolume,
  currentVolume,
  onVolumeReached,
  flaskHeight = 150,
  flaskWidth = 80,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [eyeLevel, setEyeLevel] = useState(false);
  const [meniscusPosition, setMeniscusPosition] = useState(0);

  // Calculate liquid level based on volume
  const maxVolume = 250; // mL
  const volumeRatio = Math.min(currentVolume / maxVolume, 1);
  const liquidHeight = volumeRatio * flaskHeight * 0.8;
  const graduationMarkPosition = (targetVolume / maxVolume) * flaskHeight * 0.8;

  useEffect(() => {
    if (isActive) {
      setShowGuide(true);
      
      // Simulate gradual volume increase
      const interval = setInterval(() => {
        setMeniscusPosition(prev => {
          const newPos = Math.min(prev + 1, graduationMarkPosition);
          if (newPos >= graduationMarkPosition - 2) {
            clearInterval(interval);
            setTimeout(() => onVolumeReached(), 500);
          }
          return newPos;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isActive, graduationMarkPosition, onVolumeReached]);

  const isNearTarget = Math.abs(meniscusPosition - graduationMarkPosition) < 5;
  const isAtTarget = Math.abs(meniscusPosition - graduationMarkPosition) < 2;

  if (!isActive) return null;

  return (
    <div 
      className="relative"
      style={{ width: flaskWidth, height: flaskHeight }}
    >
      {/* Flask outline */}
      <div className="absolute inset-0 border-2 border-gray-400 rounded-b-full bg-gradient-to-b from-transparent to-blue-50">
        
        {/* Graduation marks */}
        <div className="absolute right-1 top-0 h-full flex flex-col justify-end">
          {[100, 150, 200, 250].map((volume) => {
            const position = (volume / maxVolume) * flaskHeight * 0.8;
            const isTarget = volume === targetVolume;
            
            return (
              <div
                key={volume}
                className={`absolute right-0 flex items-center ${
                  isTarget ? 'text-red-600 font-bold' : 'text-gray-600'
                }`}
                style={{ bottom: position }}
              >
                <div className={`w-3 h-0.5 ${
                  isTarget ? 'bg-red-600' : 'bg-gray-400'
                }`} />
                <span className="text-xs ml-1">{volume}</span>
                {isTarget && (
                  <Target className="w-3 h-3 ml-1 text-red-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Liquid */}
        <motion.div
          className="absolute bottom-0 left-1 right-1 rounded-b-full"
          style={{
            backgroundColor: "rgba(135, 206, 235, 0.6)",
            height: meniscusPosition,
          }}
          animate={{
            height: meniscusPosition,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        />

        {/* Meniscus */}
        <motion.div
          className="absolute left-1 right-1 h-1"
          style={{
            bottom: meniscusPosition,
            background: "linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.8), transparent)",
            borderRadius: "50%",
          }}
          animate={{
            bottom: meniscusPosition,
            boxShadow: isNearTarget 
              ? "0 0 10px rgba(59, 130, 246, 0.8)" 
              : "none",
          }}
        />

        {/* Target line */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-red-500"
          style={{ bottom: graduationMarkPosition }}
          animate={{
            backgroundColor: isAtTarget ? "#10b981" : "#ef4444",
            boxShadow: isAtTarget 
              ? "0 0 8px rgba(16, 185, 129, 0.6)" 
              : "0 0 8px rgba(239, 68, 68, 0.6)",
          }}
        />

        {/* Eye level indicator */}
        <motion.div
          className="absolute -left-12 flex items-center"
          style={{ bottom: graduationMarkPosition }}
          animate={{
            x: eyeLevel ? 0 : -10,
          }}
          onMouseEnter={() => setEyeLevel(true)}
          onMouseLeave={() => setEyeLevel(false)}
        >
          <Eye className="w-6 h-6 text-blue-600" />
          <div className="ml-2 text-xs text-blue-600 whitespace-nowrap">
            Eye Level
          </div>
        </motion.div>
      </div>

      {/* Instructions panel */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute -right-48 top-0 w-40 bg-white border border-gray-300 rounded-lg p-3 shadow-lg"
          >
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Meniscus Reading
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className={`flex items-center space-x-1 ${
                eyeLevel ? 'text-green-600' : 'text-orange-600'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>Position eye at mark level</span>
              </div>
              
              <div className={`flex items-center space-x-1 ${
                isNearTarget ? 'text-green-600' : 'text-gray-600'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>Read bottom of meniscus</span>
              </div>
              
              <div className={`flex items-center space-x-1 ${
                isAtTarget ? 'text-green-600' : 'text-gray-600'
              }`}>
                {isAtTarget ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
                <span>Align with {targetVolume} mL mark</span>
              </div>
            </div>

            {/* Volume display */}
            <div className="mt-3 p-2 bg-gray-100 rounded text-center">
              <div className="text-xs text-gray-600">Current Volume</div>
              <div className={`font-bold ${
                isAtTarget ? 'text-green-600' : 'text-blue-600'
              }`}>
                {(meniscusPosition / graduationMarkPosition * targetVolume).toFixed(1)} mL
              </div>
            </div>

            {isAtTarget && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-center"
              >
                <CheckCircle className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <div className="text-xs text-green-700 font-semibold">
                  Volume Reached!
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parallax effect for proper viewing angle */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: eyeLevel 
            ? "none" 
            : "linear-gradient(45deg, transparent 48%, rgba(59, 130, 246, 0.1) 50%, transparent 52%)",
        }}
        animate={{
          opacity: eyeLevel ? 0 : 0.5,
        }}
      />
    </div>
  );
};

export default MeniscusGuide;
