import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X, FlaskConical, TestTube2, Beaker, Pipette, BarChart3 } from "lucide-react";

interface EquipmentProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onDrag?: (id: string, x: number, y: number) => void;
  position?: { x: number; y: number } | null;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  solutions?: Array<{
    id: string;
    name: string;
    volume: number;
    color: string;
  }>;
  onSolutionDrop?: (solutionId: string, equipmentId: string, volume: number) => void;
  testTubes?: Array<{
    id: string;
    label: string;
    colorHex: string;
    volume: number;
    isCompleted: boolean;
  }>;
}

export const Equipment: React.FC<EquipmentProps> = ({
  id,
  name,
  icon,
  onDrag,
  position,
  onRemove,
  disabled = false,
  solutions = [],
  onSolutionDrop,
  testTubes = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    e.dataTransfer.setData("equipment", id);
    
    // Calculate offset for smoother dragging
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSolutionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const solutionData = e.dataTransfer.getData("solution");
    const volumeData = e.dataTransfer.getData("volume");
    
    if (solutionData && onSolutionDrop) {
      onSolutionDrop(solutionData, id, parseFloat(volumeData) || 1.0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Render toolbar version (draggable source)
  if (!position) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable={!disabled}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
              flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 cursor-grab active:cursor-grabbing
              ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
              ${disabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                : 'border-gray-300 bg-white hover:border-red-300 hover:shadow-md hover:scale-105'
              }
            `}
          >
            <div className="text-2xl mb-2 text-red-600">
              {icon}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">
              {name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Drag to workbench: {name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Render workbench version (positioned equipment)
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onDrop={handleSolutionDrop}
      onDragOver={handleDragOver}
      className="relative group"
    >
      {/* Equipment container */}
      <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 min-w-[120px] min-h-[120px]">
        {/* Remove button */}
        {onRemove && (
          <Button
            onClick={() => onRemove(id)}
            size="sm"
            variant="outline"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 text-white border-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* Equipment content based on type */}
        {id === 'test-tube-rack-a' || id === 'test-tube-rack-b' ? (
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              {id === 'test-tube-rack-a' ? 'Rack A (T1-T6)' : 'Rack B (T7-T12)'}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {testTubes
                .filter(tube => 
                  id === 'test-tube-rack-a' 
                    ? parseInt(tube.id.slice(1)) <= 6 
                    : parseInt(tube.id.slice(1)) >= 7
                )
                .map((tube) => (
                  <div key={tube.id} className="flex flex-col items-center">
                    <div className="relative w-8 h-16 bg-gray-200 rounded-t-full rounded-b-sm border border-gray-400 overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                        style={{ 
                          height: `${Math.max(20, tube.volume * 8)}%`,
                          backgroundColor: tube.colorHex
                        }}
                      />
                      {tube.isCompleted && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium">{tube.label}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : id === 'graduated-pipette' ? (
          <div className="flex flex-col items-center">
            <Pipette className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
            <div className="text-xs text-gray-600 mt-1">
              Precision: ±0.1 mL
            </div>
            {solutions.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-green-600">Ready</span>
              </div>
            )}
          </div>
        ) : id === 'burette' ? (
          <div className="flex flex-col items-center">
            <div className="w-4 h-16 bg-gray-200 border border-gray-400 rounded-sm relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gray-400 rounded-t-sm"></div>
              {solutions.length > 0 && (
                <div 
                  className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                  style={{ 
                    height: '60%',
                    backgroundColor: solutions[0]?.color || '#e5e7eb'
                  }}
                />
              )}
            </div>
            <h4 className="text-sm font-semibold text-gray-800 mt-2">{name}</h4>
            <div className="text-xs text-gray-600">25 mL</div>
          </div>
        ) : id === 'colorimeter' ? (
          <div className="flex flex-col items-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
            <div className="text-xs text-gray-600 mt-1">
              λ = 447 nm
            </div>
          </div>
        ) : id === 'volumetric-flask' ? (
          <div className="flex flex-col items-center">
            <FlaskConical className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
            <div className="text-xs text-gray-600 mt-1">
              100 mL
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2 text-red-600">
              {icon}
            </div>
            <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
          </div>
        )}

        {/* Solution contents indicator */}
        {solutions.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {solutions.slice(0, 3).map((solution, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: solution.color }}
                  title={`${solution.name}: ${solution.volume} mL`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drop zone indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
    </div>
  );
};

// Equipment definitions for FeSCN experiment
export const FESCN_EQUIPMENT = [
  {
    id: 'test-tube-rack-a',
    name: 'Test Tube Rack A',
    icon: <TestTube2 className="w-6 h-6" />,
    description: 'Holds test tubes T1-T6 for Part A'
  },
  {
    id: 'test-tube-rack-b',
    name: 'Test Tube Rack B',
    icon: <TestTube2 className="w-6 h-6" />,
    description: 'Holds test tubes T7-T12 for Part B'
  },
  {
    id: 'graduated-pipette',
    name: 'Graduated Pipette',
    icon: <Pipette className="w-6 h-6" />,
    description: 'Precise volume measurement (±0.1 mL)'
  },
  {
    id: 'burette',
    name: 'Burette',
    icon: <Beaker className="w-6 h-6" />,
    description: '25 mL burette for titration'
  },
  {
    id: 'volumetric-flask',
    name: 'Volumetric Flask',
    icon: <FlaskConical className="w-6 h-6" />,
    description: '100 mL volumetric flask'
  },
  {
    id: 'colorimeter',
    name: 'Colorimeter',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Measures absorbance at 447 nm'
  }
];
