// Types specific to Oxalic Acid Standardization experiment

export interface ExperimentStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  temperature?: string;
  safety?: string;
  completed: boolean;
}

export interface OxalicAcidExperiment {
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
  molecularWeight?: number;
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
  // Optional flag for items created from chemicals (e.g., bottles)
  isBottle?: boolean;
  typeId?: string;
  name?: string;
  imageSrc?: string;
}

export interface SolutionPreparationState {
  oxalicAcidAdded: boolean;
  waterAdded: boolean;
  stirrerActive: boolean;
  dissolved: boolean;
  transferredToFlask: boolean;
  nearMark: boolean;
  finalVolume: boolean;
  mixed: boolean;
}

export interface Measurements {
  massWeighed: number;
  targetMass: number;
  volume: number;
  actualMolarity: number;
  targetMolarity: number;
  molecularWeight: number;
  temperature: number;
  ph: number;
}

export interface Calculation {
  requiredMass: number;
  actualMass: number;
  molarity: number;
  moles: number;
  percentError: number;
  volumeUsed: number;
}

export interface Result {
  id: string;
  type: "success" | "warning" | "error" | "calculation";
  title: string;
  description: string;
  timestamp: string;
  calculation?: {
    massWeighed?: number;
    molarity?: number;
    moles?: number;
    percentError?: number;
    accuracy?: string;
    procedure?: string;
    notes?: string[];
  };
}
