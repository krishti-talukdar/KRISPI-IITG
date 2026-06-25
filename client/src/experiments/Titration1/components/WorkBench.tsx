import React, { useState } from "react";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  isRunning: boolean;
  currentStep: number;
  showProceedButton?: boolean;
  onProceed?: () => void;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  isRunning,
  currentStep,
  showProceedButton = false,
  onProceed,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
      className={`relative w-full h-full min-h-[500px] bg-black rounded-lg overflow-hidden transition-all duration-300 border-2 border-dashed ${
        isDragOver
          ? "border-blue-400"
          : "border-gray-400"
      }`}
      style={{
        backgroundColor: isDragOver ? '#1a1a1a' : '#000000',
      }}
    >
      {/* Laboratory surface pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
            linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      />

      {/* Step indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of 6
          </span>
        </div>
      </div>

      {/* Workbench title */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          Titration Workbench
        </span>
      </div>

      {/* Drop zone indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-400 border-dashed">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
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
              <p className="text-lg font-semibold text-green-600">
                Drop Equipment Here
              </p>
              <p className="text-sm text-gray-600 text-center">
                Position your titration equipment on the workbench
              </p>
            </div>
          </div>
        </div>
      )}

      {showProceedButton && (
        <button
          type="button"
          onClick={onProceed}
          className="absolute bottom-6 right-6 z-30 h-20 w-20 rounded-full bg-pink-600 text-white shadow-lg ring-4 ring-white/20 transition-transform hover:scale-105"
        >
          <span className="text-xs font-bold tracking-wide">PROCEED</span>
        </button>
      )}

      {/* Workbench content */}
      <div className="absolute inset-0 p-8 transform -translate-y-8">
        {children}
      </div>

      {/* Grid lines for positioning */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
};

export default WorkBench;
