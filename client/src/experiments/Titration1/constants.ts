import React from "react";
import { Beaker, FlaskConical, Pipette, Filter, TestTube, Droplets } from "lucide-react";
import type { ReagentBottle, ConicalFlask, Burette, GuidedStep, LabEquipment } from "./types";

// Colors for titration states
export const COLORS = {
  COLORLESS: "#F8F9FA",
  PINK: "#FFB6C1", 
  LIGHT_PINK: "#FFC0CB",
  OXALIC_ACID: "#F0F8FF",
  NAOH: "#E6F3FF",
  WATER: "#87CEEB"
};

// Initial flask state
export const INITIAL_FLASK: ConicalFlask = {
  id: "conical-flask",
  volume: 0,
  color: "colorless",
  colorHex: COLORS.COLORLESS,
  contents: [],
  hasIndicator: false,
  endpointReached: false
};

// Initial burette state  
export const INITIAL_BURETTE: Burette = {
  id: "burette",
  volume: 50,
  solution: "NaOH",
  color: COLORS.NAOH,
  reading: 0.0,
  isOpen: false
};

// Animation timing constants
export const ANIMATION = {
  COLOR_TRANSITION_DURATION: 2000,
  DROPPER_DURATION: 300,
  BURETTE_FLOW_DURATION: 1000,
  MIXING_DURATION: 2500
};

// Chemical reagents for Titration 1 experiment
export const TITRATION_REAGENTS: ReagentBottle[] = [
  {
    id: "oxalic_acid_std",
    name: "0.1N Oxalic Acid",
    formula: "H₂C₂O₄",
    color: COLORS.OXALIC_ACID,
    concentration: "0.1N",
    description: "Standard solution for titration"
  },
  {
    id: "naoh_solution",
    name: "NaOH Solution",
    formula: "NaOH",
    color: COLORS.NAOH,
    concentration: "Unknown",
    description: "Solution to be standardized"
  },
  {
    id: "distilled_water",
    name: "Distilled Water",
    formula: "H₂O", 
    color: COLORS.WATER,
    concentration: "Pure",
    description: "For rinsing and dilution"
  },
  {
    id: "phenolphthalein",
    name: "Phenolphthalein",
    formula: "C₂₀H₁₄O₄",
    color: COLORS.COLORLESS,
    concentration: "1% solution",
    description: "Indicator (colorless to pink)"
  }
];

// Laboratory equipment for titration
export const LAB_EQUIPMENT: Array<{
  id: string;
  name: string;
  icon: React.ReactElement;
  type: string;
}> = [
  {
    id: "burette",
    name: "Burette (50 mL)",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36", 
        viewBox: "0 0 36 36",
        fill: "none",
        className: "text-blue-600",
      },
      [
        React.createElement("rect", {
          key: "tube",
          x: "14",
          y: "4",
          width: "8",
          height: "28",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(59, 130, 246, 0.1)",
        }),
        React.createElement("path", {
          key: "graduations",
          d: "M14 8h4 M14 12h4 M14 16h4 M14 20h4 M14 24h4 M14 28h4",
          stroke: "currentColor",
          strokeWidth: "1",
        }),
        React.createElement("circle", {
          key: "stopcock",
          cx: "18",
          cy: "30",
          r: "2",
          fill: "currentColor",
        }),
        React.createElement("path", {
          key: "tip",
          d: "M17 32v2",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
      ],
    ),
    type: "burette"
  },
  {
    id: "pipette",
    name: "Pipette (25 mL)",
    icon: React.createElement(Pipette, { size: 36, className: "text-green-600" }),
    type: "pipette"
  },
  {
    id: "conical-flask",
    name: "Conical Flask",
    icon: React.createElement(FlaskConical, { size: 36, className: "text-gray-600" }),
    type: "flask"
  },
  {
    id: "funnel",
    name: "Funnel",
    icon: React.createElement(Filter, { size: 36, className: "text-yellow-600" }),
    type: "funnel"
  },
  {
    id: "wash-bottle",
    name: "Wash Bottle",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36",
        viewBox: "0 0 36 36",
        fill: "none",
        className: "text-blue-500",
      },
      [
        React.createElement("path", {
          key: "bottle",
          d: "M12 10h12v18a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V10z",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(59, 130, 246, 0.1)",
        }),
        React.createElement("path", {
          key: "neck",
          d: "M16 10V8a2 2 0 0 1 4 0v2",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          key: "spout",
          d: "M18 8l8-2",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          key: "water",
          d: "M14 12h8v14H14z",
          fill: "rgba(59, 130, 246, 0.3)",
        }),
      ],
    ),
    type: "wash_bottle"
  },
  {
    id: "oxalic-acid",
    name: "0.1N Oxalic Acid",
    icon: React.createElement(TestTube, { size: 36, className: "text-blue-400" }),
    type: "reagent"
  },
  {
    id: "naoh-solution",
    name: "NaOH Solution",
    icon: React.createElement(Beaker, { size: 36, className: "text-purple-600" }),
    type: "reagent"
  },
  {
    id: "phenolphthalein",
    name: "Phenolphthalein Indicator",
    icon: React.createElement(Droplets, { size: 36, className: "text-pink-600" }),
    type: "indicator"
  }
];

// Guided steps for titration experiment
export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 1,
    title: "Setup Workspace",
    description: "drag the burette, pipette and the conical flask to the workbench",
    action: "Drag the burette, pipette and the conical flask to the workbench",
    equipment: ["burette", "pipette", "conical-flask"],
    completed: false
  },
  {
    id: 2,
    title: "Add Oxalic Acid",
    description: "Use the pipette to transfer exactly 25.0 mL of 0.1N oxalic acid to the conical flask.",
    action: "Click pipette to transfer solution",
    equipment: ["pipette", "oxalic-acid"],
    completed: false
  },
  {
    id: 3,
    title: "Add Indicator",
    description: "Drag the phenolphthalein to the workbench, then click the indicator to add 2–3 drops.",
    action: "Drag phenolphthalein to the workbench",
    equipment: ["phenolphthalein"],
    completed: false
  },
  {
    id: 4,
    title: "Fill Burette",
    description: "burette already filled with NaOH, Start the titration!",
    action: "burette already filled with NaOH, Start the titration!",
    equipment: ["naoh-solution"],
    completed: false
  },
  {
    id: 5,
    title: "Begin Titration",
    description: "Start adding NaOH solution drop by drop while swirling the flask.",
    action: "Click burette to release NaOH",
    equipment: ["burette"],
    completed: false
  },
  {
    id: 6,
    title: "Detect Endpoint",
    description: "Continue until a permanent light pink color appears for 30 seconds.",
    action: "Observe color change to pink",
    equipment: ["conical-flask"],
    completed: false
  }
];

// Titration calculation formulas
export const TITRATION_FORMULAS = [
  {
    name: "Normality Equation",
    formula: "N₁V₁ = N₂V₂",
    description: "N₁V₁ (oxalic acid) = N₂V₂ (NaOH)"
  },
  {
    name: "NaOH Normality",
    formula: "N₂ = (N₁ × V₁) / V₂",
    description: "N₂ = (0.1 × 25.0) / V₂"
  },
  {
    name: "NaOH Strength",
    formula: "Strength = N₂ × 40 g/L",
    description: "Strength in grams per liter"
  }
];

// Endpoint color transitions
export const ENDPOINT_COLORS = {
  BEFORE: COLORS.COLORLESS,
  APPROACHING: "#FFE4E6", // Very light pink
  ENDPOINT: COLORS.LIGHT_PINK,
  OVERSHOOT: "#C2185B"
};

// Default experimental conditions
export const DEFAULT_CONDITIONS = {
  temperature: 25, // °C
  pressure: 1, // atm
  oxalicAcidVolume: 25.0, // mL
  oxalicAcidNormality: 0.1, // N
  indicatorDrops: 3,
  expectedTitreVolume: 25.0 // mL (if NaOH is also 0.1N)
};

// Equipment positions on workbench
export const EQUIPMENT_POSITIONS = {
  'burette': { x: 120, y: 80 },
  'conical-flask': { x: 250, y: 300 },
  'pipette': { x: 380, y: 200 },
  'funnel': { x: 500, y: 150 },
  'wash-bottle': { x: 450, y: 350 },
  'oxalic-acid': { x: 80, y: 200 },
  'naoh-solution': { x: 80, y: 300 },
  'phenolphthalein': { x: 80, y: 380 }
};

// Step 4 specific positioning for better alignment
export const STEP_4_POSITIONS = {
  'burette': { x: 80, y: 100 },
  'conical-flask': { x: 140, y: 360 }
};

// Backwards-compatible aliases used in UI components
export const TITRATION_EQUIPMENT = LAB_EQUIPMENT;
export const TITRATION_CHEMICALS = TITRATION_REAGENTS;
export const SAFETY_GUIDELINES = [
  "Wear safety goggles and lab coat",
  "Handle acids and bases with care",
  "Keep workspace tidy and clean spills immediately",
];
