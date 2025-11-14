import React from "react";
export { Equipment } from "@/experiments/PHComparison/components/Equipment";
import { Droplets, FlaskConical, TestTube } from "lucide-react";

export const AB_LAB_EQUIPMENT = [
  { id: 'test-tube', name: '25ml Test Tube', icon: <TestTube className="w-8 h-8" /> },
  { id: 'nh4oh-0-1m', name: '0.1 M Ammonium Hydroxide', icon: <Droplets className="w-8 h-8" /> },
  { id: 'nh4cl-0-1m', name: '0.1 M Ammonium Chloride', icon: <Droplets className="w-8 h-8" /> },
  { id: 'ph-paper', name: 'pH Paper', icon: <FlaskConical className="w-8 h-8" /> },
];
