import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "./Equipment";
import { Chemical } from "./Chemical";
import { FlaskConical } from "lucide-react";
import StirringAnimation from "./StirringAnimation";
import type {
  EquipmentPosition,
  SolutionPreparationState,
  Measurements,
  Result,
  ExperimentStep,
  Chemical as ChemicalType,
  Equipment as EquipmentType,
} from "../types";

interface WorkBenchProps {
  step: ExperimentStep;
  experimentStarted: boolean;
  onStartExperiment: (run?: boolean) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  onStepAction: (opts?: { skipAnimation?: boolean }) => void;
  canProceed: boolean;
  equipmentPositions: EquipmentPosition[];
  setEquipmentPositions: React.Dispatch<React.SetStateAction<EquipmentPosition[]>>;
  preparationState: SolutionPreparationState;
  measurements: Measurements;
  results: Result[];
  chemicals: ChemicalType[];
  equipment: EquipmentType[];
  onEquipmentPlaced?: (id: string) => void;
  onUndoStep: () => void;
  onResetExperiment: () => void;
  currentStepIndex: number;
  completeStepPortalRef?: React.RefObject<HTMLDivElement>;
  step3ControlsPortalRef?: React.RefObject<HTMLDivElement>;
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  step,
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  onResetTimer,
  stepNumber,
  totalSteps,
  experimentTitle,
  onStepAction,
  canProceed,
  equipmentPositions,
  setEquipmentPositions,
  preparationState,
  measurements,
  results,
  chemicals,
  equipment,
  onEquipmentPlaced,
  onUndoStep,
  onResetExperiment,
  currentStepIndex,
  completeStepPortalRef,
  step3ControlsPortalRef,
}) => {
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [temperature, setTemperature] = useState(25);
  const [showCalculator, setShowCalculator] = useState(false);
  const [acidAmount, setAcidAmount] = useState<string>("");
  const [blinkAddButton, setBlinkAddButton] = useState<boolean>(false);
  const [completeStepPortalHost, setCompleteStepPortalHost] = useState<HTMLDivElement | null>(null);
  const [step3PortalHost, setStep3PortalHost] = useState<HTMLDivElement | null>(null);
  const [pouring, setPouring] = useState<{ boatId: string; x: number; y: number; active: boolean } | null>(null);
  const [washAnimation, setWashAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [mixingAnimation, setMixingAnimation] = useState<{ x: number; y: number; width?: number; height?: number; active: boolean } | null>(null);
  const pourTimeoutRef = useRef<number | null>(null);
  // rest of file ...