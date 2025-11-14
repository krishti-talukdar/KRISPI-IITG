import { ReagentBottle, TestTube, EquilibriumState } from "./types";

// Color constants for the equilibrium system
export const COLORS = {
  PINK: '#EB7CDE',      // [Co(H₂O)₆]²⁺ - hydrated complex
  PURPLE: '#9370db',     // Transition state
  BLUE: '#4682b4',       // [CoCl₄]²⁻ - chloride complex
  CLEAR: '#f0f8ff',      // Water/neutral
  HCL: '#fffacd'         // HCl solution (pale yellow)
} as const;

// Reagent bottles data
export const REAGENT_BOTTLES: ReagentBottle[] = [
  {
    id: 'hcl',
    name: 'Concentrated HCl',
    formula: 'HCl (12M)',
    color: COLORS.HCL,
    description: 'Adds Cl⁻ ions → shifts equilibrium right �� blue color',
    concentration: '12.0 M'
  },
  {
    id: 'water',
    name: 'Distilled Water',
    formula: 'H₂O',
    color: COLORS.CLEAR,
    description: 'Dilutes Cl⁻ ions → shifts equilibrium left → pink color',
    concentration: 'Pure'
  }
];

// Initial test tube state
export const INITIAL_TESTTUBE: TestTube = {
  id: 'main-tube',
  volume: 0,
  color: 'Clear',
  colorHex: COLORS.CLEAR,
  contents: [],
  temperature: 25
};

// Equilibrium states mapping
export const EQUILIBRIUM_STATES: Record<string, EquilibriumState> = {
  hydrated: {
    dominantComplex: 'hydrated',
    colorHex: COLORS.PINK,
    explanation: 'Predominant complex: [Co(H₂O)₆]²⁺ (pink). Low Cl⁻ concentration favors the hydrated form.',
    equilibriumDirection: 'left'
  },
  transition: {
    dominantComplex: 'transition',
    colorHex: COLORS.PURPLE,
    explanation: 'Equilibrium shifting. Both complexes present in significant amounts.',
    equilibriumDirection: 'neutral'
  },
  chloride: {
    dominantComplex: 'chloride',
    colorHex: COLORS.BLUE,
    explanation: 'Predominant complex: [CoCl₄]²⁻ (blue). High Cl⁻ concentration favors the chloride form.',
    equilibriumDirection: 'right'
  }
};

// 7-step guided instructions
export const GUIDED_STEPS = [
  {
    id: 1,
    title: "Setup Laboratory Equipment",
    description: "Drag the test tube from the equipment section to the workbench. This will be your main reaction vessel.",
    action: "Drag test tube to workbench",
    equipment: ["test-tube"],
    completed: false
  },
  {
    id: 2,
    title: "Add Cobalt(II) Solution to Test Tube",
    description: "Drag the cobalt(II) solution bottle from the equipment section and add it to the test tube to prepare the initial pink [Co(H₂O)₆]²⁺ solution.",
    action: "Drag cobalt(II) solution to test tube",
    equipment: ["test-tube", "cobalt-ii-solution"],
    completed: false
  },
  {
    id: 3,
    title: "Observe Initial Pink Solution",
    description: "Observe the pink [Co(H₂O)₆]²⁺ hydrated complex present in the test tube.",
    action: "Observe pink solution",
    equipment: ["test-tube", "cobalt-ii-solution"],
    completed: false
  },
  {
    id: 4,
    title: "Prepare HCl Reagent",
    description: "Drag the concentrated HCl bottle to the workbench. This will provide Cl⁻ ions to shift the equilibrium.",
    action: "Drag HCl bottle to workbench",
    equipment: ["test-tube", "concentrated-hcl", "cobalt-ii-solution"],
    completed: false
  },
  {
    id: 5,
    title: "Add HCl and Observe Color Change",
    description: "Click the HCl bottle TWICE to add concentrated HCl. First click: pink → purple (equilibrium shifting). Second click: purple → blue (equilibrium fully shifted to [CoCl₄]²⁻).",
    action: "Click HCl bottle twice to add acid",
    equipment: ["test-tube", "concentrated-hcl", "cobalt-ii-solution"],
    completed: false
  },
  {
    id: 6,
    title: "Prepare Distilled Water",
    description: "Drag the distilled water bottle to the workbench. This will be used to dilute the solution and shift equilibrium back.",
    action: "Drag water bottle to workbench",
    equipment: ["test-tube", "concentrated-hcl", "distilled-water", "cobalt-ii-solution"],
    completed: false
  },
  {
    id: 7,
    title: "Add Water and Reverse Equilibrium",
    description: "Click the water bottle TWICE to add distilled water. First click: blue → purple (equilibrium shifting back). Second click: purple → pink (equilibrium fully reversed to [Co(H₂O)₆]²⁺).",
    action: "Click water bottle twice to add water",
    equipment: ["test-tube", "concentrated-hcl", "distilled-water", "cobalt-ii-solution"],
    completed: false
  }
];

// Animation durations (in milliseconds)
export const ANIMATION = {
  DROPPER_DURATION: 1500,
  COLOR_TRANSITION_DURATION: 2000,
  BUBBLE_EFFECT_DURATION: 1000,
  EXPLANATION_UPDATE_DELAY: 500
} as const;

// Lab equipment positions (relative to container)
export const EQUIPMENT_POSITIONS = {
  TEST_TUBE: { x: 50, y: 40 },
  HCL_BOTTLE: { x: 15, y: 20 },
  COBALT_BOTTLE: { x: 50, y: 20 },
  WATER_BOTTLE: { x: 85, y: 20 },
  EXPLANATION_PANEL: { x: 20, y: 75 }
} as const;

// Equilibrium equation
export const EQUILIBRIUM_EQUATION = {
  reactants: '[Co(H₂O)₆]²⁺ + 4Cl⁻',
  products: '[CoCl₄]²⁻ + 6H₂O',
  colors: {
    left: 'pink',
    right: 'blue'
  }
} as const;
