import React, { useState, useEffect } from "react";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  selectedSolution: string | null;
  isRunning: boolean;
  experimentTitle: string;
  currentStep?: number;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  selectedSolution,
  isRunning,
  experimentTitle,
  currentStep = 1,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [temperature, setTemperature] = useState(25);

  useEffect(() => {
    if (isRunning) {
      const tempInterval = setInterval(() => {
        setTemperature((prev) => {
          const variation = (Math.random() - 0.5) * 0.5;
          return Math.round((prev + variation) * 10) / 10;
        });
      }, 2000);

      return () => clearInterval(tempInterval);
    }
  }, [isRunning]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const equipmentData = e.dataTransfer.getData("equipment");
    if (equipmentData) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDrop(equipmentData, x, y);
    }
  };

  return (
    <div
      data-workbench="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-red-50 rounded-lg overflow-hidden transition-all duration-300 ${
        isDragOver
          ? "bg-gradient-to-br from-red-100 to-orange-100 ring-4 ring-red-300 ring-opacity-50"
          : ""
      }`}
      style={{
        backgroundImage: isDragOver
          ? `
            radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%),
            radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 75% 75%, rgba(251, 146, 60, 0.1) 0%, transparent 25%),
            linear-gradient(45deg, transparent 45%, rgba(239, 68, 68, 0.05) 50%, transparent 55%)
          `
          : `
            linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%),
            radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 75% 75%, rgba(251, 146, 60, 0.1) 0%, transparent 25%),
            linear-gradient(45deg, transparent 45%, rgba(239, 68, 68, 0.05) 50%, transparent 55%)
          `,
      }}
    >
      {/* Laboratory surface pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #fed7aa 25%, transparent 25%),
            linear-gradient(-45deg, #fed7aa 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #fed7aa 75%),
            linear-gradient(-45deg, transparent 75%, #fed7aa 75%)
          `,
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0, 0 15px, 15px -15px, -15px 0px",
        }}
      />

      {/* Lab environment indicators */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Temperature indicator */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {temperature}°C
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="bg-red-500 text-white rounded-lg px-3 py-2 shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Step {currentStep}</span>
          </div>
        </div>

        {/* Solution selection indicator */}
        {selectedSolution && (
          <div className="bg-blue-500 text-white rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <span className="text-xs font-medium">Solution Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Experiment title */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            FeSCN²⁺ Equilibrium Lab
          </span>
        </div>
      </div>

      {/* Safety reminder */}
      <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-yellow-600">⚠️</div>
          <span className="text-xs font-medium text-yellow-800">
            Virtual Lab - Safe Environment
          </span>
        </div>
      </div>

      {/* Drop zone indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-red-400 border-dashed">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-red-600">
                Drop Equipment Here
              </p>
              <p className="text-sm text-gray-600 text-center">
                Position laboratory equipment on the workbench
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Equipment positions and children */}
      <div className="absolute inset-0 transform -translate-y-8">{children}</div>

      {/* Measurement grid (subtle) */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient lighting effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
};
