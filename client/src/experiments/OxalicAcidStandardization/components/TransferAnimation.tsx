import React, { useEffect, useState } from "react";
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

      const dropInterval = setInterval(() => {
        const newDrop: LiquidDrop = {
          id: `drop-${Date.now()}-${Math.random()}`,
          x: 50 + Math.random() * 20,
          y: 0,
          size: 3 + Math.random() * 2,
          delay: Math.random() * 0.2,
        };

        setDrops((prev) => [...prev, newDrop]);
        setTransferredVolume((prev) => prev + 2);

        setTimeout(() => {
          setDrops((prev) => prev.filter((d) => d.id !== newDrop.id));
        }, 1500);
      }, 150);

      setTimeout(() => {
        setTransferPhase("rinsing");
      }, 3000);

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

  if (!isActive) {
    return null;
  }

  const effectiveVolume = transferVolume > 0 ? transferVolume : 1;
  const progressPercent = Math.min((transferredVolume / effectiveVolume) * 100, 100);
  const stageStyles = { "--solution-color": solutionColor } as React.CSSProperties;

  return (
    <div className="transfer-animation-layout flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div
        className="transfer-animation-stage relative w-full max-w-[320px] h-[384px] rounded-lg border-2 border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200 overflow-hidden"
        style={stageStyles}
      >
        <motion.div
          className="transfer-source absolute top-8 left-8 w-20 h-24 border-2 border-gray-400 rounded-b-lg bg-gradient-to-b from-transparent to-blue-100"
          animate={{
            rotate: transferPhase === "pouring" ? 25 : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="transfer-solution-fill absolute bottom-1 left-1 right-1 rounded-b-lg"
            animate={{
              height: transferPhase === "pouring" ? "20%" : "60%",
            }}
            transition={{ duration: 2 }}
          />

          {transferPhase === "pouring" && (
            <motion.div
              className="transfer-pour-stream transfer-solution-fill absolute -right-1 bottom-4 w-1 h-8 rounded-full"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.8, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
            />
          )}
        </motion.div>

        <div className="transfer-funnel absolute top-32 left-32 w-16 h-12">
          <div className="transfer-funnel-top h-8 border-2 border-gray-500 bg-gray-100" />
          <div className="transfer-funnel-neck mx-auto h-4 w-2 border-x-2 border-gray-500 bg-gray-100" />
        </div>

        <motion.div
          className="transfer-target absolute bottom-8 left-28 w-24 h-32 border-2 border-gray-400 rounded-b-full bg-gradient-to-b from-transparent to-blue-50"
        >
          <motion.div
            className="transfer-solution-fill absolute bottom-1 left-1 right-1 rounded-b-full"
            animate={{
              height: `${Math.min((transferredVolume / effectiveVolume) * 80, 80)}%`,
            }}
            transition={{ duration: 0.3 }}
          />

          <div className="absolute right-1 flex h-full flex-col justify-end text-xs text-gray-600 space-y-1">
            {[50, 100, 150, 200, 250].map((vol) => (
              <div key={vol} className="flex items-center h-4">
                <div className="w-2 h-0.5 bg-gray-400" />
                <span className="ml-1 text-xs">{vol}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {drops.map((drop) => (
            <motion.div
              key={drop.id}
              className="transfer-drop absolute rounded-full"
              style={{
                width: drop.size,
                height: drop.size,
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

        <div className="transfer-animation-grid absolute inset-0 opacity-10 pointer-events-none" aria-hidden />
      </div>

      <motion.div
        className="transfer-progress-card w-full max-w-[320px] rounded-xl border border-gray-200 bg-white shadow-lg p-4 text-sm text-gray-700"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3">
          <FlaskConical className="w-4 h-4 text-blue-600" />
          <span>Transfer Progress</span>
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
          <div className="w-full rounded-full bg-gray-200 h-2 mt-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          {transferPhase === "pouring" && (
            <div className="transfer-phase-tip bg-blue-100 text-blue-700">
              <Droplets className="w-3 h-3" />
              <span>Transferring solution via funnel</span>
            </div>
          )}
          {transferPhase === "rinsing" && (
            <div className="transfer-phase-tip bg-green-100 text-green-700">
              <ArrowDown className="w-3 h-3" />
              <span>Rinsing beaker and funnel</span>
            </div>
          )}
          {transferPhase === "complete" && (
            <div className="transfer-phase-tip bg-gray-100 text-gray-700">
              <span aria-hidden>✓</span>
              <span>Transfer complete</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransferAnimation;
