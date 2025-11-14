import React, { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FlaskConical, Beaker, Droplets, Info, ArrowRight, BarChart3 } from "lucide-react";
import { WorkBench } from "./WorkBench";
import { Equipment } from "./Equipment";
import { EquipmentToolbar } from "./EquipmentToolbar";
import { 
  SOLUTIONS, 
  PART_A_TUBES, 
  PART_B_TUBES, 
  calculateColorIntensity, 
  intensityToColor, 
  EXPERIMENT_STEPS,
  ANIMATION,
  EQUILIBRIUM_EQUATION 
} from "../constants";
import { 
  TestTubeState, 
  PipetteAction, 
  ExperimentPhase, 
  ExperimentLog,
  ColorimetryData,
  LabEquipment 
} from "../types";

interface VirtualLabProps {
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  currentStep: number;
  onStepComplete: () => void;
  phase: ExperimentPhase;
  onPhaseComplete: (phase: 'part-a' | 'part-b') => void;
  showAnalysis: boolean;
  onReset: () => void;
}

export default function VirtualLab({
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  currentStep,
  onStepComplete,
  phase,
  onPhaseComplete,
  showAnalysis,
  onReset,
}: VirtualLabProps) {
  // Lab state
  const [testTubes, setTestTubes] = useState<TestTubeState[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<string>("");
  const [pipetteAction, setPipetteAction] = useState<PipetteAction | null>(null);
  const [experimentLog, setExperimentLog] = useState<ExperimentLog[]>([]);
  const [showToast, setShowToast] = useState<string>("");
  const [selectedTube, setSelectedTube] = useState<string>("");
  const [volumeToAdd, setVolumeToAdd] = useState<number>(0);
  const [colorimetryData, setColorimetryData] = useState<ColorimetryData[]>([]);
  
  // Equipment positioning state
  const [equipmentPositions, setEquipmentPositions] = useState<LabEquipment[]>([]);
  const [draggingSolution, setDraggingSolution] = useState<{ id: string; volume: number } | null>(null);

  // Stop timer once the analysis panel is visible
  useEffect(() => {
    if (showAnalysis) {
      setIsRunning(false);
    }
  }, [showAnalysis, setIsRunning]);

  // Initialize test tubes when experiment starts
  useEffect(() => {
    if (experimentStarted && testTubes.length === 0) {
      const initialTubes: TestTubeState[] = [
        ...PART_A_TUBES.map(tube => ({
          ...tube,
          colorIntensity: 0, // Start colorless
          colorHex: '#f8f9fa', // Clear color
          isCompleted: false
        })),
        ...PART_B_TUBES.map(tube => ({
          ...tube,
          colorIntensity: 0, // Start colorless
          colorHex: '#f8f9fa', // Clear color
          isCompleted: false
        }))
      ];
      setTestTubes(initialTubes);
    }
  }, [experimentStarted, testTubes.length]);

  // Handle equipment drop on workbench
  const handleEquipmentDrop = useCallback((equipmentId: string, x: number, y: number) => {
    setEquipmentPositions(prev => {
      // Remove existing equipment of same type
      const filtered = prev.filter(eq => eq.id !== equipmentId);
      
      // Add new equipment at position
      const newEquipment: LabEquipment = {
        id: equipmentId,
        name: equipmentId.replace('-', ' '),
        type: equipmentId.includes('rack') ? 'testtube' : 
              equipmentId.includes('pipette') ? 'dropper' : 
              equipmentId.includes('colorimeter') ? 'thermometer' : 'stirrer',
        position: { x, y },
        isActive: true
      };
      
      setShowToast(`${equipmentId.replace('-', ' ')} placed on workbench`);
      setTimeout(() => setShowToast(""), 2000);
      
      return [...filtered, newEquipment];
    });
  }, []);

  // Handle equipment removal
  const handleEquipmentRemove = useCallback((equipmentId: string) => {
    setEquipmentPositions(prev => prev.filter(eq => eq.id !== equipmentId));
    setShowToast(`${equipmentId.replace('-', ' ')} removed from workbench`);
    setTimeout(() => setShowToast(""), 2000);
  }, []);

  // Handle solution selection for dragging
  const handleSolutionDragStart = (solutionId: string, volume: number) => {
    setDraggingSolution({ id: solutionId, volume });
  };

  // Handle solution drop on equipment
  const handleSolutionDrop = useCallback((solutionId: string, equipmentId: string, volume: number) => {
    const solution = SOLUTIONS.find(s => s.id === solutionId);
    if (!solution) return;

    // Start pipette animation
    setPipetteAction({
      id: Date.now().toString(),
      solutionId: solutionId,
      targetTubeId: equipmentId,
      volume: volume,
      timestamp: Date.now(),
      isAnimating: true
    });

    setShowToast(`Adding ${volume} mL of ${solution.name}...`);

    // Complete the addition after animation
    setTimeout(() => {
      setPipetteAction(null);
      
      // Update test tubes if adding to racks
      if (equipmentId.includes('rack')) {
        // Handle solution addition logic here
        const isPartA = equipmentId === 'test-tube-rack-a';
        const tubeRange = isPartA ? [1, 6] : [7, 12];
        
        setTestTubes(prev => prev.map(tube => {
          const tubeNum = parseInt(tube.id.slice(1));
          if (tubeNum >= tubeRange[0] && tubeNum <= tubeRange[1]) {
            let updatedTube = { ...tube };
            
            // Update volumes based on solution type
            if (solutionId === 'fe-nitrate') {
              updatedTube.feVolume = volume;
            } else if (solutionId === 'potassium-thiocyanate') {
              updatedTube.scnVolume = volume;
            } else if (solutionId === 'nitric-acid') {
              updatedTube.hno3Volume = volume;
              updatedTube.totalVolume = 10.0;
              updatedTube.isCompleted = true;
            }
            
            // Recalculate color
            if (updatedTube.feVolume > 0 && updatedTube.scnVolume > 0) {
              updatedTube.colorIntensity = calculateColorIntensity(updatedTube.feVolume, updatedTube.scnVolume);
              updatedTube.colorHex = intensityToColor(updatedTube.colorIntensity);
            }
            
            return updatedTube;
          }
          return tube;
        }));
      }

      // Log the action
      const logEntry: ExperimentLog = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        action: `Added ${solution.name}`,
        tubeId: equipmentId,
        solution: solution.name,
        volume: volume,
        colorBefore: '#f8f9fa',
        colorAfter: intensityToColor(calculateColorIntensity(volume, 0)),
        observation: `${solution.name} added to ${equipmentId}`
      };
      setExperimentLog(prev => [...prev, logEntry]);

      setTimeout(() => setShowToast(""), 2000);
    }, ANIMATION.PIPETTE_DURATION);
  }, []);

  // Generate colorimetry data for analysis
  const generateColorimetryData = useCallback(() => {
    const data: ColorimetryData[] = testTubes
      .filter(tube => tube.isCompleted)
      .map(tube => ({
        tubeId: tube.id,
        wavelength: 447, // nm - typical for [FeSCN]²⁺
        absorbance: tube.colorIntensity / 100 * 2, // Scaled absorbance
        transmittance: 100 - tube.colorIntensity,
        concentration: (tube.colorIntensity / 100) * 0.001 // Estimated [FeSCN]²⁺ in M
      }));
    
    setColorimetryData(data);
  }, [testTubes]);

  // Auto-generate colorimetry data when tubes are completed
  useEffect(() => {
    if (showAnalysis) {
      generateColorimetryData();
    }
  }, [showAnalysis, generateColorimetryData]);

  // Reset experiment
  const handleResetExperiment = () => {
    setTestTubes([]);
    setSelectedSolution("");
    setSelectedTube("");
    setVolumeToAdd(0);
    setPipetteAction(null);
    setExperimentLog([]);
    setColorimetryData([]);
    setEquipmentPositions([]);
    setDraggingSolution(null);
    setShowToast("");
    onReset();
  };

  // Check if current phase is completed
  const checkPhaseCompletion = () => {
    if (phase.current === 'part-a') {
      const partATubes = testTubes.filter(t => t.id.startsWith('t') && parseInt(t.id.slice(1)) <= 6);
      return partATubes.length === 6 && partATubes.every(t => t.isCompleted);
    } else if (phase.current === 'part-b') {
      const partBTubes = testTubes.filter(t => t.id.startsWith('t') && parseInt(t.id.slice(1)) >= 7);
      return partBTubes.length === 6 && partBTubes.every(t => t.isCompleted);
    }
    return false;
  };

  // Handle phase completion
  useEffect(() => {
    if (checkPhaseCompletion()) {
      if (phase.current === 'part-a' && !phase.partACompleted) {
        setShowToast("Part A completed! Moving to Part B...");
        setTimeout(() => {
          onPhaseComplete('part-a');
          setShowToast("");
        }, 2000);
      } else if (phase.current === 'part-b' && !phase.partBCompleted) {
        setShowToast("Part B completed! Ready for analysis...");
        setTimeout(() => {
          onPhaseComplete('part-b');
          setShowToast("");
        }, 2000);
      }
    }
  }, [testTubes, phase, onPhaseComplete]);

  return (
    <TooltipProvider>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 via-red-50 to-orange-50">
        {/* Equipment Toolbar */}
        <EquipmentToolbar
          experimentStarted={experimentStarted}
          currentStep={currentStep}
        />

        {/* Current Step Instructions */}
        <div className="m-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  {EXPERIMENT_STEPS[currentStep]?.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {EXPERIMENT_STEPS[currentStep]?.description}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStepComplete}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Solutions Panel - Left Sidebar */}
          <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Beaker className="w-5 h-5 mr-2 text-red-600" />
              Solutions
            </h3>
            
            {SOLUTIONS.map((solution) => (
              <div key={solution.id} className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      draggable={experimentStarted}
                      onDragStart={() => handleSolutionDragStart(solution.id, 1.0)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                        !experimentStarted
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div 
                          className="w-16 h-20 mx-auto mb-3 rounded-lg border-2 border-gray-300 relative overflow-hidden"
                          style={{ backgroundColor: solution.color }}
                        >
                          <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-current to-transparent opacity-40"></div>
                          <FlaskConical className="w-8 h-8 absolute top-1 left-1/2 transform -translate-x-1/2 text-gray-600 opacity-50" />
                        </div>
                        <h4 className="font-semibold text-sm text-gray-800">{solution.name}</h4>
                        <p className="text-xs text-gray-600">{solution.formula}</p>
                        <p className="text-xs text-red-600 mt-1 font-medium">{solution.concentration}</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>{solution.description}</p>
                    <p className="text-xs text-blue-600 mt-1">Drag to equipment on workbench</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}

            {/* Reset Button */}
            <Button
              onClick={handleResetExperiment}
              variant="outline"
              className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              Reset Experiment
            </Button>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col">
            {/* Equilibrium Equation Header */}
            <div className="m-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Chemical Equilibrium</h4>
              <div className="text-lg font-mono">
                <span className="text-blue-600">Fe³⁺</span>
                <span className="mx-2">+</span>
                <span className="text-green-600">SCN⁻</span>
                <span className="mx-3">⇌</span>
                <span className="text-red-600">[FeSCN]²⁺</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {EQUILIBRIUM_EQUATION.description}
              </p>
            </div>

            {/* Workbench */}
            <div className="flex-1 m-4">
              <WorkBench
                onDrop={handleEquipmentDrop}
                selectedSolution={selectedSolution}
                isRunning={isRunning}
                experimentTitle="FeSCN Equilibrium"
                currentStep={currentStep}
              >
                {/* Positioned Equipment */}
                {equipmentPositions.map((equipment) => (
                  <Equipment
                    key={equipment.id}
                    id={equipment.id}
                    name={equipment.name}
                    icon={<div />} // Will be handled by Equipment component
                    position={equipment.position}
                    onRemove={handleEquipmentRemove}
                    onSolutionDrop={handleSolutionDrop}
                    testTubes={testTubes}
                  />
                ))}
              </WorkBench>
            </div>
          </div>

          {/* Analysis Panel - Right Sidebar */}
          <div className="w-80 bg-white/90 backdrop-blur-sm border-l border-gray-200 p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Analysis
            </h3>

            {/* Phase Progress */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Experiment Progress</h4>
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 ${phase.partACompleted ? 'text-green-600' : phase.current === 'part-a' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${phase.partACompleted ? 'bg-green-500' : phase.current === 'part-a' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Part A: [SCN⁻] variation</span>
                </div>
                <div className={`flex items-center space-x-2 ${phase.partBCompleted ? 'text-green-600' : phase.current === 'part-b' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${phase.partBCompleted ? 'bg-green-500' : phase.current === 'part-b' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Part B: [Fe³⁺] variation</span>
                </div>
                <div className={`flex items-center space-x-2 ${phase.current === 'analysis' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${phase.current === 'analysis' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Analysis & Conclusions</span>
                </div>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Equipment Status</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Equipment on Bench:</span>
                  <span className="font-semibold">{equipmentPositions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Test Tubes Ready:</span>
                  <span className="font-semibold text-green-600">
                    {testTubes.filter(t => t.isCompleted).length}/12
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Color Intensity:</span>
                  <span className="font-semibold text-red-600">
                    {Math.max(...testTubes.map(t => t.colorIntensity), 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Actions Log */}
            {experimentLog.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Recent Actions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {experimentLog.slice(-5).reverse().map((log) => (
                    <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-gray-600">{log.volume} mL → {log.tubeId}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Color Intensity Chart */}
            {showAnalysis && colorimetryData.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Colorimetry Data</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {colorimetryData.slice(0, 6).map((data) => (
                    <div key={data.tubeId} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{data.tubeId.toUpperCase()}:</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: testTubes.find(t => t.id === data.tubeId)?.colorHex }}
                        ></div>
                        <span>{data.absorbance.toFixed(3)} abs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pipette Animation */}
        {pipetteAction && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="animate-bounce bg-white rounded-lg p-4 shadow-xl border-2 border-blue-300">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-sm text-center mt-2">Adding solution...</p>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{showToast}</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
