import React, { useEffect, useState } from "react";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  selectedChemical: string | null;
  isRunning: boolean;
  experimentTitle: string;
  currentGuidedStep?: number;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  selectedChemical,
  isRunning,
  experimentTitle,
  currentGuidedStep = 1,
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

  const isPHExperiment = experimentTitle
    ? experimentTitle.toLowerCase().includes("hydrochloric") ||
      experimentTitle.toLowerCase().includes("pH") ||
      experimentTitle.toLowerCase().includes("ph ")
    : false;

  // PH-specific classes
  const phRootClass =
    "relative w-full h-full min-h-[500px] bg-white rounded-lg overflow-hidden transition-all duration-300 border border-gray-200";

  const defaultRootClass =
    `relative w-full h-full min-h-[500px] bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden transition-all duration-300 ${
      isDragOver
        ? "bg-gradient-to-br from-blue-100 to-purple-100 ring-4 ring-blue-300 ring-opacity-50"
        : ""
    }`;

  return (
    <div
      data-workbench="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={isPHExperiment ? phRootClass : defaultRootClass}
    >
      {/* PH Experiment layout (center dashed work area + ambient widgets) */}
      {isPHExperiment ? (
        <>
          <div className="absolute inset-0 p-6">
            <div className="mx-auto h-full w-full max-w-3xl">
              <div className={`h-full border-2 border-dashed border-gray-300 rounded-md bg-white/50 p-6 flex flex-col`}>
                <div className="flex-1 relative">
                  {/* Children (equipment placed) */}
                  <div className="absolute inset-0">{children}</div>
                </div>
                <div className="mt-4 text-xs text-gray-500">Tip: Drag equipment from the left panel into the workspace.</div>
              </div>
            </div>
          </div>

          {/* Right top ambient indicators */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">{temperature}°C</span>
              </div>
            </div>

            {isRunning && (
              <div className="bg-green-500 text-white rounded-lg px-3 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            )}

            {selectedChemical && (
              <div className="bg-blue-500 text-white rounded-lg px-3 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <span className="text-xs font-medium">Chemical Selected</span>
                </div>
              </div>
            )}
          </div>

          {/* Safety box bottom-left */}
          <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-yellow-600">⚠️</div>
              <span className="text-xs font-medium text-yellow-800">Acid-Base Lab</span>
            </div>
          </div>
        </>
      ) : (
        // Default (original) workbench layout preserved for other experiments
        <>
          {/* Laboratory surface pattern */}
          <div
            className="absolute inset-0 opacity-30"
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

          {/* Ambient laboratory indicators */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {/* Temperature indicator */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">{temperature}°C</span>
              </div>
            </div>

            {/* Running indicator */}
            {isRunning && (
              <div className="bg-green-500 text-white rounded-lg px-3 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            )}

            {/* Chemical selection indicator */}
            {selectedChemical && (
              <div className="bg-blue-500 text-white rounded-lg px-3 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <span className="text-xs font-medium">Chemical Selected</span>
                </div>
              </div>
            )}
          </div>

          {/* Safety guidelines overlay */}
          <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-yellow-600">⚠️</div>
              <span className="text-xs font-medium text-yellow-800">Chemical Equilibrium Lab</span>
            </div>
          </div>

          {/* Drop zone indicator */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-400 border-dashed">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">Drop Equipment Here</p>
                  <p className="text-sm text-gray-600 text-center">Position your laboratory equipment on the workbench</p>
                </div>
              </div>
            </div>
          )}

          {/* Experiment step indicator - specific to Chemical Equilibrium */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Chemical Equilibrium</span>
            </div>
          </div>

          {/* Equipment positions and children */}
          <div className="absolute inset-0 transform -translate-y-8">{children}</div>

          {/* Grid lines for precise positioning (subtle) */}
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

          {/* Ambient light effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
          `,
            }}
          />
        </>
      )}
    </div>
  );
};

export default WorkBench;
