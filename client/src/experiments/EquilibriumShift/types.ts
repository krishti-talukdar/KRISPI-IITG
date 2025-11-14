// Types specific to Equilibrium Shift experiment

export interface ReagentBottle {
  id: string;
  name: string;
  formula: string;
  color: string;
  description: string;
  concentration: string;
}

export interface TestTube {
  id: string;
  volume: number;
  color: string;
  colorHex: string;
  contents: string[];
  temperature: number;
  isCobaltAnimation?: boolean;
}

export interface DropperAction {
  id: string;
  reagentId: string;
  targetId: string;
  amount: number;
  timestamp: number;
  isAnimating: boolean;
}

export interface EquilibriumState {
  dominantComplex: 'hydrated' | 'chloride' | 'transition';
  colorHex: string;
  explanation: string;
  equilibriumDirection: 'left' | 'right' | 'neutral';
}

export interface ExperimentMode {
  current: 'free' | 'guided';
  stepInstructions?: string[];
  currentGuidedStep?: number;
}

export interface LabEquipment {
  id: string;
  name: string;
  type: 'testtube' | 'reagent' | 'dropper' | 'thermometer' | 'stirrer';
  position: { x: number; y: number };
  isActive: boolean;
  properties?: Record<string, any>;
}

export interface ColorTransition {
  from: string;
  to: string;
  duration: number;
  currentStep: number;
  totalSteps: number;
  isAnimating: boolean;
}

export interface ExperimentLog {
  id: string;
  timestamp: number;
  action: string;
  reagent?: string;
  amount?: number;
  colorBefore: string;
  colorAfter: string;
  observation: string;
  equilibriumShift: 'left' | 'right' | 'none';
}

export interface GuidedStep {
  id: number;
  title: string;
  description: string;
  action: string;
  equipment: string[];
  completed: boolean;
}
