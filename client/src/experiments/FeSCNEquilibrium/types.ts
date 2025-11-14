// Types specific to FeSCN Equilibrium experiment

export interface TestTubeState {
  id: string;
  label: string; // T1, T2, etc.
  feVolume: number; // mL of Fe³⁺ solution added
  scnVolume: number; // mL of SCN⁻ solution added
  hno3Volume: number; // mL of HNO₃ filler added
  totalVolume: number; // Should always be 10.0 mL
  volume: number; // aggregate volume in mL
  colorIntensity: number; // 0-100 scale representing [FeSCN]²⁺ concentration
  colorHex: string; // Calculated color based on intensity
  isCompleted: boolean;
}

export interface Solution {
  id: string;
  name: string;
  formula: string;
  concentration: string; // e.g., "0.002 M"
  color: string;
  description: string;
}

export interface ExperimentPhase {
  current: 'part-a' | 'part-b' | 'analysis';
  partACompleted: boolean;
  partBCompleted: boolean;
}

export interface PipetteAction {
  id: string;
  solutionId: string;
  targetTubeId: string;
  volume: number;
  timestamp: number;
  isAnimating: boolean;
}

export interface ColorimetryData {
  tubeId: string;
  wavelength: number; // nm, typically 447 nm for [FeSCN]²⁺
  absorbance: number;
  transmittance: number;
  concentration: number; // calculated [FeSCN]²⁺ in M
}

export interface EquilibriumCalculation {
  tubeId: string;
  initialFe: number; // initial [Fe³⁺] in M
  initialSCN: number; // initial [SCN⁻] in M
  equilibriumFeSCN: number; // equilibrium [FeSCN]²⁺ in M
  equilibriumFe: number; // equilibrium [Fe³⁺] in M
  equilibriumSCN: number; // equilibrium [SCN⁻] in M
  kc: number; // equilibrium constant
}

export interface ExperimentLog {
  id: string;
  timestamp: number;
  action: string;
  tubeId: string;
  solution: string;
  volume: number;
  colorBefore: string;
  colorAfter: string;
  observation: string;
}

export interface LabEquipment {
  id: string;
  name: string;
  // Make type permissive to accommodate different experiments
  type: string;
  isActive: boolean;
  position?: { x: number; y: number };
  currentVolume?: number;
  maxVolume?: number;
}

export interface StepDetails {
  id: number;
  title: string;
  description: string;
  duration: string;
  phase: 'setup' | 'part-a' | 'part-b' | 'analysis';
  completed: boolean;
  instructions?: string[];
}
