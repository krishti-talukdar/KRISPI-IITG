// Types specific to Titration 1 experiment

export interface ReagentBottle {
  id: string;
  name: string;
  formula: string;
  color: string;
  description: string;
  concentration: string;
}

export interface Burette {
  id: string;
  volume: number;
  solution: string;
  color: string;
  reading: number;
  isOpen: boolean;
}

export interface ConicalFlask {
  id: string;
  volume: number;
  color: string;
  colorHex: string;
  contents: string[];
  hasIndicator: boolean;
  endpointReached: boolean;
}

export interface TitrationAction {
  id: string;
  actionType: 'add_solution' | 'add_indicator' | 'titrate' | 'endpoint';
  reagentId: string;
  targetId: string;
  amount: number;
  timestamp: number;
  isAnimating: boolean;
}

export interface TitrationState {
  currentPhase: 'preparation' | 'titration' | 'endpoint' | 'completed';
  buretteReading: number;
  flaskColor: string;
  explanation: string;
  titrationComplete: boolean;
}

export interface ExperimentMode {
  current: 'free' | 'guided';
  stepInstructions?: string[];
  currentGuidedStep?: number;
}

export interface LabEquipment {
  id: string;
  name: string;
  type: 'burette' | 'pipette' | 'flask' | 'reagent' | 'funnel' | 'wash_bottle';
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
  targetPhase?: TitrationState['currentPhase'];
}

export interface TitrationLog {
  id: string;
  timestamp: number;
  action: string;
  reagent?: string;
  volume?: number;
  buretteReading: number;
  colorBefore: string;
  colorAfter: string;
  observation: string;
  isEndpoint?: boolean;
}

export interface GuidedStep {
  id: number;
  title: string;
  description: string;
  action: string;
  equipment: string[];
  completed: boolean;
}

export interface TitrationData {
  trial: number;
  initialReading: number;
  finalReading: number;
  volume: number;
  isValid: boolean;
}

export interface ExperimentState {
  currentStep: number;
  isSetupComplete: boolean;
  buretteReading: number;
  endpointReached: boolean;
  titrationData: TitrationData[];
  normality: number;
  strength: number;
}
