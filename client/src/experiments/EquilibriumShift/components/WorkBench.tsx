import React, { useState } from "react";

import { GUIDED_STEPS } from "../constants";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  isRunning: boolean;
  currentStep: number;
  onTestPH?: () => void;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  isRunning,
  currentStep,
  onTestPH,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

    // Support multiple drag data types for robustness across browsers and components
    let equipmentData = e.dataTransfer.getData("equipment");
    if (!equipmentData) equipmentData = e.dataTransfer.getData("text/plain");
    if (!equipmentData) {
      const json = e.dataTransfer.getData("application/json");
      if (json) {
        try {
          const parsed = JSON.parse(json);
          equipmentData = parsed?.id || (typeof parsed === 'string' ? parsed : '');
        } catch (err) {
          // fallback to raw json string
          equipmentData = json;
        }
      }
    }

    if (equipmentData) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDrop(equipmentData, x, y);
    }
  };

  const handleTestPHClick = () => {
    if (onTestPH) {
      onTestPH();
      return;
    }
    setMessage('No test available to measure pH');
    setTimeout(() => setMessage(null), 1800);
  };

  return (
    <div
      data-workbench="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-[500px] bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden transition-all duration-300 border-2 border-dashed ${
        isDragOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300"
      }`}
      style={{
        backgroundImage: `
          linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%),
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 25%),
          radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 25%)
        `,
      }}
    >

      {/* Step indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {GUIDED_STEPS.length}
          </span>
        </div>
      </div>

      {/* Workbench title and actions */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200 flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Laboratory Workbench</span>
      </div>

      {/* small inline message when no handler is provided */}
      {message && (
        <div className="absolute top-20 right-6 bg-white/95 border border-gray-200 rounded-md px-3 py-2 shadow-md text-sm text-gray-800">
          {message}
        </div>
      )}

      {/* Drop zone indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-400 border-dashed">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
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
              <p className="text-lg font-semibold text-blue-600">
                Drop Equipment Here
              </p>
              <p className="text-sm text-gray-600 text-center">
                Position your laboratory equipment on the workbench
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workbench content */}
      <div className="absolute inset-0 p-8 transform -translate-y-8">
        {children}
      </div>

    </div>
  );
};
