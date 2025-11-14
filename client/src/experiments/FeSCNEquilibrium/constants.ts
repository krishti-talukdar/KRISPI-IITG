import { TestTubeState, Solution, StepDetails } from "./types";

// Color constants for [FeSCN]²⁺ complex
export const COLORS = {
  CLEAR: '#f8f9fa',
  VERY_LIGHT_RED: '#ffebee',
  LIGHT_RED: '#ffcdd2',
  MEDIUM_RED: '#ef5350',
  DARK_RED: '#c62828',
  BLOOD_RED: '#b71c1c',
  FE_YELLOW: '#fff9c4',
  SCN_CLEAR: '#f0f4f8',
  HNO3_CLEAR: '#fafafa'
} as const;

// Solutions used in the experiment
export const SOLUTIONS: Solution[] = [
  {
    id: 'fe-nitrate',
    name: 'Ferric Nitrate',
    formula: 'Fe(NO₃)₃',
    concentration: '0.002 M in 0.1 M HNO₃',
    color: COLORS.FE_YELLOW,
    description: 'Source of Fe³⁺ ions (prevents hydrolysis)'
  },
  {
    id: 'potassium-thiocyanate',
    name: 'Potassium Thiocyanate',
    formula: 'KSCN',
    concentration: '0.002 M',
    color: COLORS.SCN_CLEAR,
    description: 'Source of SCN⁻ ions'
  },
  {
    id: 'nitric-acid',
    name: 'Nitric Acid',
    formula: 'HNO₃',
    concentration: '0.1 M',
    color: COLORS.HNO3_CLEAR,
    description: 'Filler to maintain constant volume (10.0 mL)'
  }
];

// Part A: Effect of increasing [SCN⁻] at constant [Fe³⁺]
export const PART_A_TUBES: Omit<TestTubeState, 'colorIntensity' | 'colorHex' | 'isCompleted'>[] = [
  { id: 't1', label: 'T1', feVolume: 5.00, scnVolume: 0.00, hno3Volume: 5.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't2', label: 'T2', feVolume: 5.00, scnVolume: 0.50, hno3Volume: 4.50, totalVolume: 10.0, volume: 10.0 },
  { id: 't3', label: 'T3', feVolume: 5.00, scnVolume: 1.00, hno3Volume: 4.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't4', label: 'T4', feVolume: 5.00, scnVolume: 2.00, hno3Volume: 3.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't5', label: 'T5', feVolume: 5.00, scnVolume: 3.00, hno3Volume: 2.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't6', label: 'T6', feVolume: 5.00, scnVolume: 4.00, hno3Volume: 1.00, totalVolume: 10.0, volume: 10.0 }
];

// Part B: Effect of increasing [Fe³⁺] at constant [SCN⁻]
export const PART_B_TUBES: Omit<TestTubeState, 'colorIntensity' | 'colorHex' | 'isCompleted'>[] = [
  { id: 't7', label: 'T7', feVolume: 0.50, scnVolume: 1.00, hno3Volume: 8.50, totalVolume: 10.0, volume: 10.0 },
  { id: 't8', label: 'T8', feVolume: 1.00, scnVolume: 1.00, hno3Volume: 8.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't9', label: 'T9', feVolume: 2.00, scnVolume: 1.00, hno3Volume: 7.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't10', label: 'T10', feVolume: 3.00, scnVolume: 1.00, hno3Volume: 6.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't11', label: 'T11', feVolume: 4.00, scnVolume: 1.00, hno3Volume: 5.00, totalVolume: 10.0, volume: 10.0 },
  { id: 't12', label: 'T12', feVolume: 5.00, scnVolume: 1.00, hno3Volume: 4.00, totalVolume: 10.0, volume: 10.0 }
];

// Calculate color intensity based on Fe³⁺ and SCN⁻ concentrations
export const calculateColorIntensity = (feVolume: number, scnVolume: number): number => {
  // Using simplified equilibrium calculation
  // Higher concentrations of both reactants lead to more [FeSCN]²⁺ formation
  const feConc = (feVolume * 0.002) / 10.0; // diluted [Fe³⁺]
  const scnConc = (scnVolume * 0.002) / 10.0; // diluted [SCN⁻]
  
  // Assume Kc ≈ 100 for simplified calculation
  const limitingReagent = Math.min(feConc, scnConc);
  const intensity = Math.min(100, limitingReagent * 50000); // Scale to 0-100
  
  return Math.round(intensity);
};

// Convert intensity to hex color
export const intensityToColor = (intensity: number): string => {
  if (intensity === 0) return COLORS.CLEAR;
  if (intensity < 10) return COLORS.VERY_LIGHT_RED;
  if (intensity < 25) return COLORS.LIGHT_RED;
  if (intensity < 50) return COLORS.MEDIUM_RED;
  if (intensity < 75) return COLORS.DARK_RED;
  return COLORS.BLOOD_RED;
};

// Experiment steps
export const EXPERIMENT_STEPS: StepDetails[] = [
  {
    id: 1,
    title: "Setup Solutions",
    description: "Prepare 0.002 M Fe³⁺ solution in 0.1 M HNO₃, 0.002 M KSCN solution, and 0.1 M HNO₃ filler.",
    duration: "5 minutes",
    phase: "setup",
    completed: false,
    instructions: [
      "Check all three solution bottles are properly labeled",
      "Verify concentrations: Fe³⁺ (0.002M), SCN⁻ (0.002M), HNO₃ (0.1M)",
      "Prepare graduated pipettes for accurate volume measurement"
    ]
  },
  {
    id: 2,
    title: "Part A - Setup Test Tubes T1-T6",
    description: "Add 5.00 mL of 0.002 M Fe³⁺ solution to each of the six test tubes T1-T6.",
    duration: "8 minutes",
    phase: "part-a",
    completed: false,
    instructions: [
      "Use graduated pipette to measure exactly 5.00 mL Fe³⁺ solution",
      "Add to each tube T1 through T6",
      "Rinse pipette between uses to avoid contamination"
    ]
  },
  {
    id: 3,
    title: "Part A - Add Variable SCN⁻ Volumes",
    description: "Add varying volumes of SCN⁻ solution: T1(0mL), T2(0.5mL), T3(1mL), T4(2mL), T5(3mL), T6(4mL).",
    duration: "10 minutes",
    phase: "part-a",
    completed: false,
    instructions: [
      "Use graduated pipette for precise measurements",
      "T1: 0.00 mL (control), T2: 0.50 mL, T3: 1.00 mL",
      "T4: 2.00 mL, T5: 3.00 mL, T6: 4.00 mL",
      "Observe color formation as you add SCN⁻"
    ]
  },
  {
    id: 4,
    title: "Part A - Fill with HNO₃",
    description: "Fill each tube to exactly 10.00 mL total volume using 0.1 M HNO₃.",
    duration: "8 minutes",
    phase: "part-a",
    completed: false,
    instructions: [
      "Calculate required HNO₃ volume: 10.0 - (Fe volume + SCN volume)",
      "Add HNO₃ carefully to reach exactly 10.0 mL mark",
      "Mix each tube thoroughly by gentle swirling"
    ]
  },
  {
    id: 5,
    title: "Part B - Setup Test Tubes T7-T12",
    description: "Add 1.00 mL of 0.002 M SCN⁻ solution to each of the six test tubes T7-T12.",
    duration: "6 minutes",
    phase: "part-b",
    completed: false,
    instructions: [
      "Use clean graduated pipette for 1.00 mL SCN⁻ solution",
      "Add to each tube T7 through T12",
      "Keep pipette clean to avoid cross-contamination"
    ]
  },
  {
    id: 6,
    title: "Part B - Add Variable Fe³⁺ Volumes",
    description: "Add varying volumes of Fe³⁺ solution: T7(0.5mL), T8(1mL), T9(2mL), T10(3mL), T11(4mL), T12(5mL).",
    duration: "10 minutes",
    phase: "part-b",
    completed: false,
    instructions: [
      "Use graduated pipette for precise Fe³⁺ measurements",
      "T7: 0.50 mL, T8: 1.00 mL, T9: 2.00 mL",
      "T10: 3.00 mL, T11: 4.00 mL, T12: 5.00 mL",
      "Notice increasing red color intensity"
    ]
  },
  {
    id: 7,
    title: "Part B - Fill with HNO₃",
    description: "Fill each tube to exactly 10.00 mL total volume using 0.1 M HNO₃.",
    duration: "8 minutes",
    phase: "part-b",
    completed: false,
    instructions: [
      "Calculate required HNO₃ volume for each tube",
      "Add HNO₃ to reach exactly 10.0 mL total volume",
      "Mix thoroughly and observe final colors"
    ]
  },
  {
    id: 8,
    title: "Color Analysis & Observations",
    description: "Compare color intensities and document observations about Le Chatelier's principle.",
    duration: "12 minutes",
    phase: "analysis",
    completed: false,
    instructions: [
      "Observe color gradient in both Part A and Part B series",
      "Note how increased reactant concentration affects [FeSCN]²⁺ formation",
      "Record observations about equilibrium shifts"
    ]
  }
];

// Equipment positions for the lab layout
export const EQUIPMENT_POSITIONS = {
  TEST_TUBE_RACK_A: { x: 25, y: 40 },
  TEST_TUBE_RACK_B: { x: 75, y: 40 },
  SOLUTION_BOTTLES: { x: 50, y: 15 },
  PIPETTES: { x: 20, y: 75 },
  COLORIMETER: { x: 80, y: 75 }
} as const;

// Animation settings
export const ANIMATION = {
  PIPETTE_DURATION: 2000,
  COLOR_CHANGE_DURATION: 1500,
  MIXING_DURATION: 1000,
  FILLING_DURATION: 2500
} as const;

// Equilibrium equation components
export const EQUILIBRIUM_EQUATION = {
  reactants: 'Fe³⁺ + SCN⁻',
  products: '[FeSCN]²⁺',
  colors: {
    reactants: 'colorless',
    products: 'blood-red'
  },
  description: 'Formation of blood-red iron(III) thiocyanate complex'
} as const;
