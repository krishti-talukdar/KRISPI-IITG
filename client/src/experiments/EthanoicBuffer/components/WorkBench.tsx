import React, { useState } from "react";

interface WorkBenchProps {
  // action will be 'new' when dragging from toolbar, 'move' when repositioning an existing item
  onDrop: (id: string, x: number, y: number, action?: "new" | "move") => void;
  children: React.ReactNode;
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  isRunning,
  currentStep,
  totalSteps,
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

    // read structured data if available
    const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("equipment");
    let parsed: { id?: string; type?: string; offsetX?: number; offsetY?: number } | null = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (err) {
      // if not JSON, treat raw as id
      parsed = raw ? { id: raw, type: "new" } : null;
    }

    if (parsed && parsed.id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Use the drop point as the center coordinates for placement to match the component's centering transform
      let x = clientX - rect.left;
      let y = clientY - rect.top;

      // Normalize id for checks
      const idLower = (parsed.id || "").toLowerCase();

      // If the user drops the test tube, always place it at the designated bench location
      if (idLower === "test-tube" || idLower.includes("test")) {
        x = Math.round(rect.width * 0.35);
        y = Math.round(rect.height * 0.25);
      }

      // Anchor specific reagents to the right side of the bench regardless of drop point
      else if (idLower.includes("ethanoic") || idLower.includes("acetic")) {
        x = rect.width - 80; // right column
        y = 200; // moved up to create space
      } else if ((idLower.includes("sodium") && idLower.includes("ethanoate")) || idLower.includes("sodium-acetate")) {
        x = rect.width - 80; // right column
        y = 420; // lowered further below the acid
      }

      const action = parsed.type === "move" ? "move" : "new";
      onDrop(parsed.id, x, y, action);
    }
  };

  return (
    <div
      data-workbench="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`lab-workbench ethanoic-workbench ${isDragOver ? "ethanoic-workbench--dragover" : ""}`}
    >
      <div className="workbench-header workbench-step-badge">
        <span className="text-xs font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
      </div>

      <div className="workbench-header workbench-label">
        <span className="text-sm font-medium text-gray-700">Laboratory Workbench</span>
      </div>

      {isDragOver && (
        <div className="workbench-overlay">
          <div className="workbench-overlay-card">
            <div className="workbench-overlay-content">
              <div className="workbench-overlay-icon" aria-hidden>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="workbench-overlay-title">Drop Equipment Here</p>
              <p className="workbench-overlay-desc">Position your laboratory equipment on the workbench</p>
            </div>
          </div>
        </div>
      )}

      <div className="workbench-children">{children}</div>
    </div>
  );
};
