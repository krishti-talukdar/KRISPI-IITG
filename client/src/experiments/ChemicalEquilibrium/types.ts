// Types specific to Chemical Equilibrium experiment

export interface ExperimentStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  temperature?: string;
  safety?: string;
  completed: boolean;
}

export interface ChemicalEquilibriumExperiment {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  steps: number;
  rating: number;
  imageUrl: string;
  equipment: string[];
  stepDetails: ExperimentStep[];
  safetyInfo: string;
}

export interface Chemical {
  id: string;
  name: string;
  formula: string;
  color: string;
  concentration: string;
  volume: number;
}

export interface Equipment {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface EquipmentPosition {
  id: string;
  x: number;
  y: number;
  chemicals: Array<{
    id: string;
    name: string;
    color: string;
    amount: number;
    concentration: string;
  }>;
}

export interface CobaltReactionState {
  cobaltChlorideAdded: boolean;
  distilledWaterAdded: boolean;
  stirrerActive: boolean;
  colorTransition: "blue" | "transitioning" | "pink";
  step3WaterAdded: boolean;
}

export interface Measurements {
  volume: number;
  concentration: number;
  ph: number;
  molarity: number;
  moles: number;
  temperature: number;
}

export interface Result {
  id: string;
  type: "success" | "warning" | "error" | "reaction";
  title: string;
  description: string;
  timestamp: string;
  calculation?: {
    volumeAdded?: number;
    totalVolume?: number;
    concentration?: string;
    molarity?: number;
    moles?: number;
    reaction?: string;
    yield?: number;
    ph?: number;
    balancedEquation?: string;
    reactionType?: string;
    products?: string[];
    mechanism?: string[];
    thermodynamics?: {
      deltaH?: number;
      deltaG?: number;
      equilibriumConstant?: number;
    };
  };
}
