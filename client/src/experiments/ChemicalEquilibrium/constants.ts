import React from "react";
import { TestTube, Thermometer, Beaker, FlaskConical } from "lucide-react";
import type { Chemical, Equipment } from "./types";

// Chemical reagents specific to Chemical Equilibrium experiment
export const CHEMICAL_EQUILIBRIUM_CHEMICALS: Chemical[] = [
  {
    id: "cocl2",
    name: "Cobalt(II) Chloride",
    formula: "CoCl₂",
    color: "#FFB6C1",
    concentration: "0.1 M",
    volume: 30,
  },
  {
    id: "hcl_conc",
    name: "Concentrated HCl",
    formula: "HCl",
    color: "#FFFF99",
    concentration: "12 M",
    volume: 20,
  },
  {
    id: "water",
    name: "Distilled Water",
    formula: "H₂O",
    color: "#87CEEB",
    concentration: "Pure",
    volume: 100,
  },
  {
    id: "ice",
    name: "Ice Bath",
    formula: "H₂O(s)",
    color: "#E0F6FF",
    concentration: "0°C",
    volume: 50,
  },
];

// Equipment specific to Chemical Equilibrium experiment
export const CHEMICAL_EQUILIBRIUM_EQUIPMENT: Equipment[] = [
  {
    id: "test_tubes",
    name: "Test Tubes",
    icon: React.createElement(TestTube, { size: 36 }),
  },
  {
    id: "beaker_hot_water",
    name: "Hot Water Beaker",
    icon: React.createElement(
      "svg",
      {
        width: "36",
        height: "36",
        viewBox: "0 0 36 36",
        fill: "none",
        className: "text-red-600",
      },
      [
        React.createElement("path", {
          key: "beaker",
          d: "M6 8h24v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(239, 68, 68, 0.1)",
        }),
        React.createElement("path", {
          key: "rim",
          d: "M4 8h28",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          key: "level",
          d: "M6 20h24",
          stroke: "currentColor",
          strokeWidth: "1",
        }),
        React.createElement("path", {
          key: "steam",
          d: "M10 4c0-1 1-2 2-2s2 1 2 2M16 4c0-1 1-2 2-2s2 1 2 2M22 4c0-1 1-2 2-2s2 1 2 2",
          stroke: "currentColor",
          strokeWidth: "1.5",
        }),
      ],
    ),
  },
  {
    id: "beaker_cold_water",
    name: "Cold Water Beaker",
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
          key: "beaker",
          d: "M6 8h24v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "rgba(59, 130, 246, 0.1)",
        }),
        React.createElement("path", {
          key: "rim",
          d: "M4 8h28",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          key: "level",
          d: "M6 20h24",
          stroke: "currentColor",
          strokeWidth: "1",
        }),
        React.createElement("path", {
          key: "ice",
          d: "M12 12l2 2 2-2 2 2 2-2 2 2M12 16l2 2 2-2 2 2 2-2 2 2",
          stroke: "currentColor",
          strokeWidth: "1",
        }),
      ],
    ),
  },
];

// Chemical formulas for the Chemical Equilibrium experiment
export const CHEMICAL_EQUILIBRIUM_FORMULAS = [
  {
    name: "Cobalt(II) Complex Equilibrium",
    formula: "[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O",
    description: "Pink hydrated complex ⇌ Blue chloride complex",
  },
  {
    name: "Forward Reaction",
    formula: "[Co(H₂O)₆]²⁺ + 4HCl → [CoCl₄]²⁻ + 4H₂O + 2H⁺",
    description: "Adding HCl shifts equilibrium right (pink → blue)",
  },
  {
    name: "Reverse Reaction",
    formula: "[CoCl₄]²⁻ + 6H₂O → [Co(H₂O)₆]²⁺ + 4Cl⁻",
    description: "Adding water shifts equilibrium left (blue → pink)",
  },
  {
    name: "Le Chatelier's Principle",
    formula: "ΔH > 0 (endothermic)",
    description: "Heat favors blue complex, cooling favors pink complex",
  },
];

// Default measurements for Chemical Equilibrium
export const PH_HCL_CHEMICALS: Chemical[] = [
  {
    id: "hcl_0_1",
    name: "Hydrochloric Acid 0.1 M",
    formula: "HCl",
    color: "#FFD2D2",
    concentration: "0.1 M",
    volume: 50,
  },
  {
    id: "hcl_0_01",
    name: "Hydrochloric Acid 0.01 M",
    formula: "HCl",
    color: "#FFEBEB",
    concentration: "0.01 M",
    volume: 50,
  },
  {
    id: "hcl_0_001",
    name: "Hydrochloric Acid 0.001 M",
    formula: "HCl",
    color: "#FFF5F5",
    concentration: "0.001 M",
    volume: 50,
  },
  {
    id: "universal_indicator",
    name: "Universal Indicator Solution",
    formula: "mixture",
    color: "#A7F3D0",
    concentration: "Indicator",
    volume: 30,
  },
];

export const PH_HCL_EQUIPMENT: Equipment[] = [
  {
    id: "beaker_small",
    name: "Beaker (50 mL)",
    icon: React.createElement(
      "svg",
      { width: "36", height: "36", viewBox: "0 0 36 36", fill: "none", className: "text-slate-600" },
      [
        React.createElement("rect", { key: "b1", x: 6, y: 8, width: 24, height: 16, stroke: "currentColor", fill: "rgba(15, 23, 42, 0.04)", strokeWidth: "2" }),
      ],
    ),
  },
  {
    id: "volumetric_flask",
    name: "Volumetric Flask",
    icon: React.createElement(FlaskConical, { size: 36 }),
  },
  {
    id: "wash_bottle",
    name: "Wash Bottle",
    icon: React.createElement("svg", { width: 36, height: 36, viewBox: "0 0 36 36", fill: "none", className: "text-blue-600" }, [React.createElement("path", { key: "w", d: "M6 8h24v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z", stroke: "currentColor", strokeWidth: "2", fill: "rgba(59,130,246,0.08)" })])
  },
  {
    id: "ph_paper",
    name: "pH Paper (Strip Pack)",
    icon: React.createElement("div", { style: { width: 36, height: 36, background: 'linear-gradient(90deg,#ff7a7a,#ffd27a)', borderRadius: 4 } })
  },
  {
    id: "dropper",
    name: "Dropper/Pipette",
    icon: React.createElement("svg", { width: 36, height: 36, viewBox: "0 0 36 36", fill: "none", className: "text-gray-700" }, [React.createElement("path", { key: "d", d: "M8 28c4-4 10-10 20-20", stroke: "currentColor", strokeWidth: "2" })])
  }
];

export const DEFAULT_MEASUREMENTS = {
  volume: 0,
  concentration: 0,
  ph: 7,
  molarity: 0,
  moles: 0,
  temperature: 25,
};
