import React from "react";
import { Scale, FlaskConical, Beaker, Pipette } from "lucide-react";
import type { Chemical, Equipment } from "./types";

// Chemical reagents specific to Oxalic Acid Standardization experiment
export const OXALIC_ACID_CHEMICALS: Chemical[] = [
  {
    id: "oxalic_acid",
    name: "Oxalic Acid Dihydrate",
    formula: "H₂C₂O₄·2H₂O",
    color: "#FFFFFF",
    concentration: "Solid",
    volume: 0,
    molecularWeight: 126.07,
  },
  {
    id: "distilled_water",
    name: "Distilled Water",
    formula: "H₂O",
    color: "#87CEEB",
    concentration: "Pure",
    volume: 300,
  },
  // Added: 0.1 M Ethanoic (Acetic) Acid bottle for drag-and-drop
  {
    id: "ethanoic_acid_0_1m",
    name: "0.1 M Ethanoic (Acetic) Acid",
    formula: "CH₃COOH",
    color: "#FDE68A",
    concentration: "0.1 M",
    volume: 250,
    molecularWeight: 60.05,
  },
];

// Equipment specific to Oxalic Acid Standardization experiment
export const OXALIC_ACID_EQUIPMENT: Equipment[] = [
  {
    id: "analytical_balance",
    name: "Analytical Balance",
    icon: React.createElement(Scale, { size: 36 }),
  },
  {
    id: "volumetric_flask",
    name: "Volumetric Flask (250 mL)",
    icon: React.createElement(FlaskConical, { size: 36 }),
  },
  {
    id: "beaker",
    name: "Beaker (100 mL)",
    icon: React.createElement(Beaker, { size: 36 }),
  },
  {
    id: "weighing_boat",
    name: "Weighing Boat",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36",
        viewBox: "0 0 36 36",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        className: "text-gray-600",
      },
      [
        React.createElement("path", {
          key: "boat-body",
          d: "M6 18c0 2 5 6 12 6s12-4 12-6c0-2-5-6-12-6S6 16 6 18z",
          stroke: "currentColor",
          strokeWidth: "1.2",
          fill: "rgba(107, 114, 128, 0.06)",
        }),
        React.createElement("path", {
          key: "boat-rim",
          d: "M8 12h20",
          stroke: "currentColor",
          strokeWidth: "1.2",
          strokeLinecap: "round",
        }),
      ],
    ),
  },
  {
    id: "funnel",
    name: "Funnel",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36",
        viewBox: "0 0 36 36",
        fill: "none",
        className: "text-gray-600",
      },
      [
        React.createElement("path", {
          key: "funnel",
          d: "M8 8h20l-6 12v8l-2 2h-4l-2-2v-8L8 8z",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(107, 114, 128, 0.1)",
        }),
        React.createElement("path", {
          key: "rim",
          d: "M6 8h24",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
      ],
    ),
  },
  {
    id: "dropper",
    name: "Dropper",
    icon: React.createElement(Pipette, { size: 36 }),
  },
  {
    id: "stirrer",
    name: "Stirrer",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36",
        viewBox: "0 0 36 36",
        fill: "none",
        className: "text-gray-700",
      },
      [
        React.createElement("path", {
          key: "rod",
          d: "M10 4l16 28",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
        }),
        React.createElement("path", {
          key: "paddle",
          d: "M22 30c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z",
          stroke: "currentColor",
          strokeWidth: "1.2",
          fill: "rgba(107, 114, 128, 0.06)",
        }),
      ],
    ),
  },
  {
    id: "wash_bottle",
    name: "Wash Bottle",
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
        React.createElement("path", {
          key: "bottle",
          d: "M12 8h12v20a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8z",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(59, 130, 246, 0.1)",
        }),
        React.createElement("path", {
          key: "neck",
          d: "M16 8V6a2 2 0 0 1 4 0v2",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          key: "spout",
          d: "M18 6l6-2",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
      ],
    ),
  },
];


// Calculations and formulas for Oxalic Acid Standardization
export const OXALIC_ACID_FORMULAS = [
  {
    name: "Molarity Calculation",
    formula: "M = n/V",
    description: "Molarity = moles of solute / volume of solution (L)",
  },
  {
    name: "Moles Calculation",
    formula: "n = m/MW",
    description: "Moles = mass (g) / molecular weight (g/mol)",
  },
  {
    name: "Mass Required",
    formula: "m = M × V × MW",
    description: "Mass = Molarity × Volume (L) × Molecular Weight",
  },
  {
    name: "Percent Error",
    formula: "% Error = |actual - theoretical|/theoretical × 100%",
    description: "Accuracy measurement of the preparation",
  },
];

// Default measurements for Oxalic Acid Standardization
export const DEFAULT_MEASUREMENTS = {
  massWeighed: 0,
  targetMass: 1.5759,
  volume: 250,
  actualMolarity: 0,
  targetMolarity: 0.1,
  molecularWeight: 126.07,
  temperature: 25,
  ph: 1.3, // Oxalic acid is acidic
};

// Standard solution concentrations commonly used
export const STANDARD_CONCENTRATIONS = [
  { molarity: 0.05, description: "0.05 M - Dilute standard" },
  { molarity: 0.1, description: "0.1 M - Common standard" },
  { molarity: 0.2, description: "0.2 M - Concentrated standard" },
];

// Volume options for volumetric flasks
export const VOLUMETRIC_FLASK_SIZES = [
  { volume: 100, description: "100 mL flask" },
  { volume: 250, description: "250 mL flask" },
  { volume: 500, description: "500 mL flask" },
  { volume: 1000, description: "1000 mL flask" },
];
