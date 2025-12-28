import React, { useState, useCallback, useEffect, useRef } from "react";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlaskConical, Atom, BookOpen, List, Play, Pause, TestTube, Droplet, Beaker } from "lucide-react";
import {
  CHEMICAL_EQUILIBRIUM_CHEMICALS,
  CHEMICAL_EQUILIBRIUM_EQUIPMENT,
  DEFAULT_MEASUREMENTS,
  GLASS_CONTAINER_IMAGE_URL,
  PH_HCL_CHEMICALS,
  PH_HCL_EQUIPMENT,
} from "../constants";
import ChemicalEquilibriumData, { PHHClExperiment } from "../data";
import type {
  Chemical as ChemicalDefinition,
  Equipment as EquipmentDefinition,
  EquipmentPosition,
  CobaltReactionState,
  Measurements,
  Result,
  ExperimentStep,
  ChemicalEquilibriumExperiment,
  DryTestMode,
  RodMoveAnimationConfig,
} from "../types";
import { useLocation } from "wouter";

interface ChemicalEquilibriumVirtualLabProps {
  step: ExperimentStep;
  onStepComplete: () => void;
  isActive: boolean;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  experiment: ChemicalEquilibriumExperiment;
  allSteps: ExperimentStep[];
  experimentStarted: boolean;
  onStartExperiment: () => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onResetTimer: () => void;
  onResetExperiment?: () => void;
  timer?: number;
  toggleTimer?: () => void;
  dryTestEquipment?: string[];
  dryTestMode?: DryTestMode;
}

type LabSnapshot = {
  equipmentPositions: EquipmentPosition[];
  currentStep: number;
  cobaltChlorideAdded: boolean;
  distilledWaterAdded: boolean;
  stirrerActive: boolean;
  colorTransition: "blue" | "transitioning" | "pink";
  step3WaterAdded: boolean;
  measurements: Measurements;
  selectedChemical: string | null;
  caseOneResult: string;
  caseTwoResult: string;
};

const MAX_HISTORY_ENTRIES = 25;

const DRY_TESTS_CHEMICALS: ChemicalDefinition[] = [
  {
    id: "ethanoic-acid-solution",
    name: "Ethanoic acid solution (CH₃COOH, 0.1 M)",
    formula: "CH₃COOH",
    color: "#FECACA",
    concentration: "0.1 M",
    volume: 30,
  },
  {
    id: "sodium-ethanoate-solution",
    name: "Sodium ethanoate solution (CH₃COONa, 0.1 M)",
    formula: "CH₃COONa",
    color: "#C4F1F9",
    concentration: "0.1 M",
    volume: 30,
  },
  {
    id: "universal-indicator",
    name: "Universal Indicator Solution",
    formula: "Indicator mix",
    color: "#C8E6C9",
    concentration: "Indicator",
    volume: 25,
  },
];

const DRY_WORKBENCH_SALT_POSITION = { xPercent: 0.88, yPercent: 0.18 };
const DRY_WORKBENCH_VERTICAL_SPACING = 0.22;
const DRY_WORKBENCH_TEST_TUBE_POSITION = { xPercent: 0.3, yPercent: 0.3 };
const DRY_WORKBENCH_GLASS_ROD_POSITION = { xPercent: 0.75, yPercent: 0.15 };
const DRY_WORKBENCH_BUNSEN_POSITION = { xPercent: 0.3, yPercent: 0.6 };
const DRY_WORKBENCH_GLASS_CONTAINER_POSITION = { xPercent: 0.65, yPercent: 0.45 };

type AcidTarget = "h2so4" | "hcl";

const ACID_CONFIG: Record<AcidTarget, { chemicalId: string; label: string; color: string }> = {
  h2so4: {
    chemicalId: "conc_h2so4",
    label: "Conc. H₂SO₄",
    color: "#fb7185",
  },
  hcl: {
    chemicalId: "conc_hcl",
    label: "Conc. HCl",
    color: "#f87171",
  },
};

const DRY_WORKBENCH_BOTTLE_LAYOUT: Record<string, { xPercent: number; yPercent: number }> = {
  "salt-sample": DRY_WORKBENCH_SALT_POSITION,
  "concentrated-h-so": {
    xPercent: DRY_WORKBENCH_SALT_POSITION.xPercent,
    yPercent: DRY_WORKBENCH_SALT_POSITION.yPercent + DRY_WORKBENCH_VERTICAL_SPACING,
  },
  "conc-h-cl": {
    xPercent: DRY_WORKBENCH_SALT_POSITION.xPercent + 0.08,
    yPercent: DRY_WORKBENCH_SALT_POSITION.yPercent + DRY_WORKBENCH_VERTICAL_SPACING * 1.5,
  },
  "ammonium-hydroxide-nh-oh": {
    xPercent: DRY_WORKBENCH_SALT_POSITION.xPercent,
    yPercent:
      DRY_WORKBENCH_SALT_POSITION.yPercent + DRY_WORKBENCH_VERTICAL_SPACING * 2,
  },
  "test_tubes": DRY_WORKBENCH_TEST_TUBE_POSITION,
  "glass-rod": DRY_WORKBENCH_GLASS_ROD_POSITION,
  "bunsen-burner-virtual-heat-source": DRY_WORKBENCH_BUNSEN_POSITION,
  "glass-container": DRY_WORKBENCH_GLASS_CONTAINER_POSITION,
};

const DRY_TEST_FIXED_EQUIPMENT_IDS = [
  "test_tubes",
  "bunsen-burner-virtual-heat-source",
  "glass-rod",
  "glass-container",
];

const DRY_TEST_BASIC_GLASS_AUTOPOSITION_IDS = [
  "glass-rod",
  "glass-container",
];

const getDryTestWorkbenchPosition = (rect: DOMRect | null, id: string) => {
  if (!rect) return null;
  const lookupId = stripEquipmentIdSuffix(id);
  const layout = DRY_WORKBENCH_BOTTLE_LAYOUT[lookupId];
  if (!layout) return null;

  const margin = 48;
  const maxX = Math.max(margin, rect.width - margin);
  const maxY = Math.max(margin, rect.height - margin);
  const targetX = rect.width * layout.xPercent;
  const targetY = rect.height * layout.yPercent;

  return {
    x: Math.round(Math.max(margin, Math.min(maxX, targetX))),
    y: Math.round(Math.max(margin, Math.min(maxY, targetY))),
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const stripEquipmentIdSuffix = (value: string) => value.replace(/-\d+$/, "");

const getEquipmentIcon = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes("test tube")) return <TestTube size={36} className="text-blue-600" />;
  if (key.includes("beaker")) return <Beaker size={36} className="text-cyan-600" />;
  if (key.includes("pipette") || key.includes("dropper")) return <Droplet size={36} className="text-amber-500" />;
  if (key.includes("stirrer")) return <Atom size={36} className="text-purple-600" />;
  if (key.includes("ph") || key.includes("indicator") || key.includes("meter")) return <FlaskConical size={36} className="text-emerald-600" />;
  return <Atom size={36} className="text-slate-500" />;
};

const mapDryTestEquipment = (names: string[] = []): EquipmentDefinition[] =>
  names.map((name, index) => {
    const normalized = name.toLowerCase();
    const isTestTube = normalized.includes("test tube");
    const id = isTestTube ? "test_tubes" : `${slugify(name)}-${index}`;
    const base: EquipmentDefinition = {
      id,
      name,
      icon: getEquipmentIcon(name),
    };

    if (normalized.includes("glass container")) {
      return {
        ...base,
        icon: (
          <div className="flex items-center justify-center w-20 h-20">
            <img
              src={GLASS_CONTAINER_IMAGE_URL}
              alt="Glass container"
              className="w-full h-full object-contain"
            />
          </div>
        ),
        imageUrl: GLASS_CONTAINER_IMAGE_URL,
      };
    }

    return base;
  });

function ChemicalEquilibriumVirtualLab({
  step,
  onStepComplete,
  isActive,
  stepNumber,
  totalSteps,
  experimentTitle,
  experiment,
  allSteps,
  experimentStarted,
  onStartExperiment,
  isRunning,
  setIsRunning,
  onResetTimer,
  onResetExperiment,
  timer = 0,
  toggleTimer = () => {},
  dryTestEquipment,
  dryTestMode,
}: ChemicalEquilibriumVirtualLabProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const DEFAULT_CASE_RESULT = "No result yet";
  const [, setLocation] = useLocation();
  const CASE_TWO_BASIC_RESULT =
    "CASE 2: Strong pungent smell of NH₃ and white fumes with conc. HCl confirm the ammonium radical (NH₄⁺) in the salt.";
  const [equipmentPositions, setEquipmentPositions] = useState<
    EquipmentPosition[]
  >([]);
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [measurements, setMeasurements] =
    useState<Measurements>(DEFAULT_MEASUREMENTS);
  const historyRef = useRef<LabSnapshot[]>([]);
  const [undoStackLength, setUndoStackLength] = useState(0);
  const [isRinsing, setIsRinsing] = useState(false);
  const [showRinseAnimation, setShowRinseAnimation] = useState(false);
  const [hasRinsed, setHasRinsed] = useState(false);
  const [rodMoved, setRodMoved] = useState(false);
  const [postMoveFumesEnabled, setPostMoveFumesEnabled] = useState(false);
  const [testTubePlacementTracked, setTestTubePlacementTracked] = useState(false);
  const [sampleAddedTracked, setSampleAddedTracked] = useState(false);
  const [acidAddedTracked, setAcidAddedTracked] = useState(false);
  const [bunsenPlacedTracked, setBunsenPlacedTracked] = useState(false);
  const [glassRodContainerTracked, setGlassRodContainerTracked] = useState(false);
  const [ammoniumAddedTracked, setAmmoniumAddedTracked] = useState(false);
  const [workbenchResetStepTracked, setWorkbenchResetStepTracked] = useState(false);
  const [secondTestTubePlacementTracked, setSecondTestTubePlacementTracked] = useState(false);
  const [secondSampleAddedTracked, setSecondSampleAddedTracked] = useState(false);
  const [secondAcidAddedTracked, setSecondAcidAddedTracked] = useState(false);
  const [mno2AddedTracked, setMno2AddedTracked] = useState(false);
  const [basicSecondTubeTracked, setBasicSecondTubeTracked] = useState(false);
  const [basicSaltAddedTracked, setBasicSaltAddedTracked] = useState(false);
  const [basicNaOHAddedTracked, setBasicNaOHAddedTracked] = useState(false);
  const [basicSecondBunsenTracked, setBasicSecondBunsenTracked] = useState(false);
  const [basicGlassSetupTracked, setBasicGlassSetupTracked] = useState(false);
  const [basicGlassAcidAddedTracked, setBasicGlassAcidAddedTracked] = useState(false);
  const [rodMoveAnimationConfig, setRodMoveAnimationConfig] = useState<RodMoveAnimationConfig | null>(null);
  const rodMoveAnimationTimerRef = useRef<number | null>(null);
  const cancelRodMoveAnimation = useCallback(() => {
    if (rodMoveAnimationTimerRef.current) {
      window.clearTimeout(rodMoveAnimationTimerRef.current);
      rodMoveAnimationTimerRef.current = null;
    }
    setRodMoveAnimationConfig(null);
  }, [setRodMoveAnimationConfig]);
  const [caseOneResult, setCaseOneResult] = useState(DEFAULT_CASE_RESULT);
  const [caseTwoResult, setCaseTwoResult] = useState(DEFAULT_CASE_RESULT);
  const [showCase2ResultsModal, setShowCase2ResultsModal] = useState(false);
  const MNO2_CASE_TWO_RESULT =
    "CASE 2: Evolution of chlorine gas supports the presence of chloride ion in the salt.";
  const [workbenchResetTrigger, setWorkbenchResetTrigger] = useState(0);
  const workbenchResetTriggerRef = useRef(workbenchResetTrigger);
  const rinseTimerRef = useRef<number | null>(null);

  // Choose chemicals and equipment based on experiment
  const isPHExperiment = experimentTitle === PHHClExperiment.title;
  const isDryTestExperiment = experimentTitle === ChemicalEquilibriumData.title;
  const usePhStyleLayout = isPHExperiment || isDryTestExperiment;
  const totalGuidedSteps = allSteps.length;
  const dryTestEquipmentNames = dryTestEquipment ?? experiment.equipment;
  const chemicalsList = isPHExperiment
    ? PH_HCL_CHEMICALS
    : isDryTestExperiment
      ? DRY_TESTS_CHEMICALS
      : CHEMICAL_EQUILIBRIUM_CHEMICALS;
  const equipmentList = usePhStyleLayout
    ? isPHExperiment
      ? PH_HCL_EQUIPMENT
      : mapDryTestEquipment(dryTestEquipmentNames)
    : CHEMICAL_EQUILIBRIUM_EQUIPMENT;
  const glassContainerEquipmentId =
    equipmentList.find((eq) => eq.name.toLowerCase().includes("glass container"))?.id ?? null;
  const glassRodEquipmentId =
    equipmentList.find((eq) => eq.name.toLowerCase().includes("glass rod"))?.id ?? null;
  const glassContainerState = equipmentPositions.find((pos) => pos.id === glassContainerEquipmentId);
  const ammoniumAmountInGlassContainer = glassContainerState
    ? glassContainerState.chemicals
        .filter((chemical) => chemical.id === "nh4oh")
        .reduce((sum, chemical) => sum + (chemical.amount || 0), 0)
    : 0;
  const hasAmmoniumInGlassContainer = ammoniumAmountInGlassContainer > 0;
  const hasHClInGlassContainer = glassContainerState
    ? glassContainerState.chemicals.some((chemical) => chemical.id === "conc_hcl")
    : false;
  const shouldShowRinseButton = hasAmmoniumInGlassContainer || hasHClInGlassContainer;
  const normalizedTitle = experimentTitle?.toLowerCase() ?? "";
  const testTubeState = equipmentPositions.find((pos) => pos.id === "test_tubes");
  const mnO2Chemical = testTubeState?.chemicals.find((chemical) => chemical.id === "mno2");
  const hasMnO2InTestTube = (mnO2Chemical?.amount ?? 0) > 0;
  const dryTestInstructionMap: Record<DryTestMode, string> = {
    acid:
      "Use the acid radical reagents (salt sample, concentrated H₂SO₄, MnO₂, K₂Cr₂O₇) with a clean loop to compare color, smell, and residues after heating.",
    basic:
      "Arrange anhydrous Na₂CO₃ and NaOH on the clean loop, heat gently, and observe the characteristic fumes, residues, and colors of basic radicals.",
    wet:
      "Set up wet test reagents in clean test tubes, add dilute acid and indicator, warm gently over the Bunsen burner, and watch for color changes or precipitates that reveal acid radicals.",
    wetBasic:
      "Set up wet test reagents tailored for basic radicals: use dilute NaOH, indicator, and gentle heating to spot color shifts or precipitates that confirm the basic radicals.",
  };

  const instructionMessage = isDryTestExperiment
    ? dryTestInstructionMap[dryTestMode]
    : "Follow the steps shown. Use pH paper or the universal indicator to measure pH after adding HCl to a beaker.";
  const caseOneReady = caseOneResult !== DEFAULT_CASE_RESULT;
  const caseTwoReady = caseTwoResult !== DEFAULT_CASE_RESULT;
  const resultsReady = caseOneReady && caseTwoReady;
  const isDryTestWorkbench =
    normalizedTitle.includes("dry tests for acid radicals") ||
    normalizedTitle.includes("dry tests for basic radicals") ||
    normalizedTitle.includes("salt analysis");
  const MIN_SALT_MASS = 3;
  const MAX_SALT_MASS = 5;
  const SALT_RANGE_LABEL = "3g-5g";
  const MIN_MNO2_MASS = 1.0;
  const MAX_MNO2_MASS = 3.0;
  const MNO2_RANGE_LABEL = "1.0 g - 3.0 g";
  const MNO2_DEFAULT_MASS = "1.5";
  const SALT_HEATING_STEP = 0.35;
  const SALT_HEATING_MIN_REMAINING = 0.5;
  const SALT_HEATING_INTERVAL_MS = 1200;
  const ROD_MOVE_ANIMATION_DURATION = 1200;
  const NAOH_COLOR = "#bfdbfe";
  const NAOH_NAME = "NaOH";
  const NAOH_CONCENTRATION = "Reagent";
  const NAOH_CHEMICAL_ID = "naoh";
  const NAOH_VOLUME_LABEL = "2ml - 4ml";
  const MIN_NAOH_VOLUME = 2;
  const MAX_NAOH_VOLUME = 4;
  const MIN_ACID_DROPS = 3;
  const MAX_ACID_DROPS = 5;
  const ACID_RANGE_LABEL = "3-5 drops";
  const GLASS_CONTAINER_HCL_DEFAULT_VOLUME = 4;
  const MIN_GLASS_HCL_VOLUME = 1;
  const MAX_GLASS_HCL_VOLUME = 6;
  const GLASS_CONTAINER_HCL_VOLUME_LABEL = "1 - 6 mL";
  const MIN_AMMONIUM_VOLUME = 5;
  const MAX_AMMONIUM_VOLUME = 10;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saltDialogOpen, setSaltDialogOpen] = useState(false);
  const [saltMass, setSaltMass] = useState("2.0");
  const [saltDialogError, setSaltDialogError] = useState<string | null>(null);
  const [mno2DialogOpen, setMno2DialogOpen] = useState(false);
  const [mno2Mass, setMno2Mass] = useState(MNO2_DEFAULT_MASS);
  const [mno2DialogError, setMno2DialogError] = useState<string | null>(null);
  const [naohDialogOpen, setNaohDialogOpen] = useState(false);
  const [naohVolume, setNaohVolume] = useState("2.5");
  const [naohDialogError, setNaohDialogError] = useState<string | null>(null);
  const [acidDialogOpen, setAcidDialogOpen] = useState(false);
  const [acidVolume, setAcidVolume] = useState("4");
  const [acidDialogError, setAcidDialogError] = useState<string | null>(null);
  const [acidTarget, setAcidTarget] = useState<AcidTarget>("h2so4");
  const [glassAcidDialogOpen, setGlassAcidDialogOpen] = useState(false);
  const [glassAcidVolume, setGlassAcidVolume] = useState(
    GLASS_CONTAINER_HCL_DEFAULT_VOLUME.toString(),
  );
  const [glassAcidDialogError, setGlassAcidDialogError] = useState<string | null>(null);
  const [ammoniumDialogOpen, setAmmoniumDialogOpen] = useState(false);
  const [ammoniumVolume, setAmmoniumVolume] = useState("5.0");
  const [ammoniumDialogError, setAmmoniumDialogError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [isWorkbenchHeating, setIsWorkbenchHeating] = useState(false);
  const saltHeatingIntervalRef = useRef<number | null>(null);
  const resolvedDryTestMode = dryTestMode ?? "acid";
  const isAcidDryTest = isDryTestExperiment && resolvedDryTestMode === "acid";

  // Chemical Equilibrium specific states
  const [cobaltChlorideAdded, setCobaltChlorideAdded] = useState(false);
  const [distilledWaterAdded, setDistilledWaterAdded] = useState(false);
  const [stirrerActive, setStirrerActive] = useState(false);
  const [colorTransition, setColorTransition] = useState<
    "blue" | "transitioning" | "pink"
  >("pink");
  const [step3WaterAdded, setStep3WaterAdded] = useState(false);

  // Listen for automatic step completion events
  useEffect(() => {
    const handleStepComplete = (event: CustomEvent) => {
      if (event.detail?.nextStep === 5 && currentStep === 4) {
        setCurrentStep(5);
        onStepComplete();
        setToastMessage("Moving to Step 5...");
        setTimeout(() => setToastMessage(null), 3000);
      } else if (event.detail?.nextStep === 6 && currentStep === 5) {
        setCurrentStep(6);
        onStepComplete();
        setToastMessage("Solution turned pink! Moving to Step 6...");
        setTimeout(() => setToastMessage(null), 800);
      }
    };

    window.addEventListener(
      "stepComplete",
      handleStepComplete as EventListener,
    );

    return () => {
      window.removeEventListener(
        "stepComplete",
        handleStepComplete as EventListener,
      );
    };
  }, [currentStep, onStepComplete]);

  useEffect(() => {
    return () => {
      if (rinseTimerRef.current) {
        window.clearTimeout(rinseTimerRef.current);
      }
      cancelRodMoveAnimation();
    };
  }, [cancelRodMoveAnimation]);

  useEffect(() => {
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      resolvedDryTestMode !== "acid"
    ) {
      return;
    }

    const hasPlacedTestTube = equipmentPositions.some(
      (pos) => pos.id === "test_tubes",
    );

    const shouldAdvanceFirstTube = hasPlacedTestTube && !testTubePlacementTracked && currentStep === 1;
    const shouldAdvanceSecondTube = hasPlacedTestTube && !secondTestTubePlacementTracked && currentStep === 8;

    if (shouldAdvanceFirstTube) {
      setTestTubePlacementTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Test tube placed on the workbench. Moving to the next step.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (shouldAdvanceSecondTube) {
      setSecondTestTubePlacementTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Fresh test tube placed on the workbench. Moving to the next step.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!hasPlacedTestTube) {
      if (testTubePlacementTracked) {
        setTestTubePlacementTracked(false);
      }
      if (secondTestTubePlacementTracked) {
        setSecondTestTubePlacementTracked(false);
      }
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    testTubePlacementTracked,
    secondTestTubePlacementTracked,
    currentStep,
    totalSteps,
    onStepComplete,
  ]);

  useEffect(() => {
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      resolvedDryTestMode !== "basic"
    ) {
      return;
    }

    const hasPlacedTestTube = equipmentPositions.some(
      (pos) => pos.id === "test_tubes",
    );

    if (
      hasPlacedTestTube &&
      !testTubePlacementTracked &&
      currentStep === 1
    ) {
      setTestTubePlacementTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Test tube placed on the workbench. Moving to Step 2.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const shouldAdvanceSecondTubeStep =
      hasPlacedTestTube &&
      !basicSecondTubeTracked &&
      currentStep === 5;

    if (shouldAdvanceSecondTubeStep) {
      setBasicSecondTubeTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Test tube placed on the workbench. Moving to Step 6.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!hasPlacedTestTube) {
      if (testTubePlacementTracked) {
        setTestTubePlacementTracked(false);
      }
      if (basicSecondTubeTracked) {
        setBasicSecondTubeTracked(false);
      }
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    testTubePlacementTracked,
    basicSecondTubeTracked,
    currentStep,
    totalSteps,
    onStepComplete,
  ]);

  useEffect(() => {
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      resolvedDryTestMode !== "basic"
    ) {
      return;
    }

    if (currentStep !== 2) {
      if (sampleAddedTracked) {
        setSampleAddedTracked(false);
      }
      return;
    }

    const testTube = equipmentPositions.find((pos) => pos.id === "test_tubes");
    const hasSaltSample = Boolean(
      testTube?.chemicals.some(
        (chemical) => chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
      ),
    );

    if (hasSaltSample && !sampleAddedTracked) {
      setSampleAddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Salt sample added. Advancing to Step 3.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!hasSaltSample && sampleAddedTracked) {
      setSampleAddedTracked(false);
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    sampleAddedTracked,
    currentStep,
    totalSteps,
    onStepComplete,
  ]);

  useEffect(() => {
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      (resolvedDryTestMode !== "acid" && resolvedDryTestMode !== "basic")
    ) {
      return;
    }

    const expectedStep = resolvedDryTestMode === "acid" ? 4 : 3;
    const hasBunsen = equipmentPositions.some((pos) =>
      pos.id.includes("bunsen-burner-virtual-heat-source"),
    );

    if (
      hasBunsen &&
      !bunsenPlacedTracked &&
      currentStep === expectedStep
    ) {
      setBunsenPlacedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Bunsen burner placed. Moving to the next step.");
      setTimeout(() => setToastMessage(null), 3000);
    } else if (!hasBunsen && bunsenPlacedTracked) {
      setBunsenPlacedTracked(false);
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    bunsenPlacedTracked,
    currentStep,
    totalSteps,
    onStepComplete,
  ]);

  useEffect(() => {
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      resolvedDryTestMode !== "acid"
    ) {
      return;
    }

    const hasGlassRod = equipmentPositions.some((pos) =>
      stripEquipmentIdSuffix(pos.id) === "glass-rod",
    );
    const hasGlassContainer = equipmentPositions.some((pos) =>
      stripEquipmentIdSuffix(pos.id) === "glass-container",
    );

    const readyForGlassSetup = hasGlassRod && hasGlassContainer;

    if (
      readyForGlassSetup &&
      !glassRodContainerTracked &&
      currentStep === 5
    ) {
      setGlassRodContainerTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Glass rod and container placed. Moving to the next step.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!readyForGlassSetup && glassRodContainerTracked) {
      setGlassRodContainerTracked(false);
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    glassRodContainerTracked,
    currentStep,
    totalSteps,
    onStepComplete,
  ]);

  useEffect(() => {
    setTestTubePlacementTracked(false);
    setSecondTestTubePlacementTracked(false);
    setSampleAddedTracked(false);
    setSecondSampleAddedTracked(false);
    setAcidAddedTracked(false);
    setSecondAcidAddedTracked(false);
    setBunsenPlacedTracked(false);
    setGlassRodContainerTracked(false);
    setAmmoniumAddedTracked(false);
    setWorkbenchResetStepTracked(false);
    setMno2AddedTracked(false);
  }, [stepNumber, workbenchResetTrigger]);

  useEffect(() => {
    if (!experimentStarted || !isDryTestExperiment) {
      workbenchResetTriggerRef.current = workbenchResetTrigger;
      return;
    }

    const isAcidResetStep =
      resolvedDryTestMode === "acid" &&
      currentStep === 7 &&
      !workbenchResetStepTracked;
    const isBasicResetStep =
      resolvedDryTestMode === "basic" &&
      currentStep === 4 &&
      !workbenchResetStepTracked;

    if (
      workbenchResetTrigger !== workbenchResetTriggerRef.current &&
      (isAcidResetStep || isBasicResetStep)
    ) {
      setWorkbenchResetStepTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Workbench reset. Moving to the next step.");
      setTimeout(() => setToastMessage(null), 3000);
    }

    workbenchResetTriggerRef.current = workbenchResetTrigger;
  }, [
    workbenchResetTrigger,
    currentStep,
    workbenchResetStepTracked,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    totalSteps,
    onStepComplete,
  ]);

  const cobaltReactionState: CobaltReactionState = {
    cobaltChlorideAdded,
    distilledWaterAdded,
    stirrerActive,
    colorTransition,
    step3WaterAdded,
  };

  const captureLabSnapshot = () => ({
    equipmentPositions: equipmentPositions.map((pos) => ({
      ...pos,
      chemicals: pos.chemicals.map((chem) => ({ ...chem })),
    })),
    currentStep,
    cobaltChlorideAdded,
    distilledWaterAdded,
    stirrerActive,
    colorTransition,
    step3WaterAdded,
    measurements: { ...measurements },
    selectedChemical,
    caseOneResult,
    caseTwoResult,
  });

  const DRY_TEST_BOTTLE_IDS = [
  "salt-sample",
  "concentrated-h-so",
  "conc-h-cl",
  "mno",
  "ammonium-hydroxide-nh-oh",
];

  const isDryTestBottleEquipment = (equipmentId: string) =>
    DRY_TEST_BOTTLE_IDS.some((token) => equipmentId.startsWith(token));

  const pushHistorySnapshot = () => {
    if (!isDryTestExperiment) return;
    const snapshot = captureLabSnapshot();
    const updatedHistory = [...historyRef.current, snapshot];
    if (updatedHistory.length > MAX_HISTORY_ENTRIES) {
      updatedHistory.shift();
    }
    historyRef.current = updatedHistory;
    setUndoStackLength(updatedHistory.length);
  };

  const reduceSaltSampleOnHeat = useCallback(() => {
    setEquipmentPositions((prev) => {
      let changed = false;
      const updated = prev.map((pos) => {
        if (pos.id !== "test_tubes") return pos;
        let tubeUpdated = false;
        const updatedChemicals = pos.chemicals.map((chemical) => {
          if (chemical.id !== "salt_sample") return chemical;
          const currentAmount = chemical.amount ?? 0;
          if (currentAmount <= SALT_HEATING_MIN_REMAINING) return chemical;
          const nextAmount = Math.max(
            SALT_HEATING_MIN_REMAINING,
            Math.round((currentAmount - SALT_HEATING_STEP) * 100) / 100,
          );
          if (nextAmount === currentAmount) return chemical;
          tubeUpdated = true;
          return { ...chemical, amount: nextAmount };
        });
        if (!tubeUpdated) return pos;
        changed = true;
        return { ...pos, chemicals: updatedChemicals };
      });
      return changed ? updated : prev;
    });
  }, [setEquipmentPositions]);

  const handleEquipmentDrop = useCallback(
    (id: string, x: number, y: number) => {
      if (isDryTestBottleEquipment(id)) {
        setToastMessage(
          "Use the ADD buttons next to Salt Sample, Conc. H₂SO₄, Conc. HCl, MnO₂, and NH₄OH to load the test tube.",
        );
        setTimeout(() => setToastMessage(null), 2500);
        return;
      }

      const shouldCaptureBasicStep1Placement =
        experimentStarted &&
        isDryTestExperiment &&
        resolvedDryTestMode === "basic" &&
        id === "test_tubes" &&
        !testTubePlacementTracked &&
        currentStep === 1;

      if (shouldCaptureBasicStep1Placement) {
        setTestTubePlacementTracked(true);
        onStepComplete();
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        setToastMessage("Test tube placed on the workbench. Moving to Step 2.");
        setTimeout(() => setToastMessage(null), 3000);
      }

      const normalizedId = stripEquipmentIdSuffix(id);
      const shouldSnapBasicGlassPlacement =
        resolvedDryTestMode === "basic" &&
        DRY_TEST_BASIC_GLASS_AUTOPOSITION_IDS.includes(normalizedId);

      const workbenchRect =
        typeof document !== "undefined"
          ? document
              .querySelector('[data-workbench="true"]')
              ?.getBoundingClientRect() ?? null
          : null;
      const layoutPosition = isDryTestExperiment
        ? getDryTestWorkbenchPosition(workbenchRect, id)
        : null;
      const dropX = layoutPosition?.x ?? x;
      const dropY = layoutPosition?.y ?? y;

      const getSnappedPosition = (baseX: number, baseY: number) =>
        shouldSnapBasicGlassPlacement
          ? {
              x: layoutPosition?.x ?? baseX,
              y: layoutPosition?.y ?? baseY,
            }
          : { x: baseX, y: baseY };

      pushHistorySnapshot();
      setEquipmentPositions((prev) => {
        const existing = prev.find((pos) => pos.id === id);
        if (existing) {
          // Auto-alignment logic for Chemical Equilibrium
          if (id === "beaker_hot_water") {
            if (currentStep === 4) {
              setToastMessage("Drop the test tube into the hot water beaker!");
            }
          } else if (id === "beaker_cold_water") {
            if (currentStep === 5) {
              setToastMessage("Drop the test tube into the cold water beaker!");
            }

            const testTube = prev.find((pos) => pos.id === "test_tubes");
            if (testTube) {
              const distance = Math.sqrt(
                Math.pow(x - testTube.x, 2) + Math.pow(y - testTube.y, 2),
              );
              if (distance < 200) {
                return prev.map((pos) =>
                  pos.id === id
                    ? { ...pos, x: testTube.x, y: testTube.y + 35 }
                    : pos,
                );
              }
            }
          } else if (id === "test_tubes") {
            const hotWaterBeaker = prev.find(
              (pos) => pos.id === "beaker_hot_water",
            );
            const coldWaterBeaker = prev.find(
              (pos) => pos.id === "beaker_cold_water",
            );

            if (hotWaterBeaker) {
              const distance = Math.sqrt(
                Math.pow(x - hotWaterBeaker.x, 2) +
                  Math.pow(y - hotWaterBeaker.y, 2),
              );
              if (distance < 200) {
                if (currentStep === 4) {
                  setToastMessage(null);
                }
                return prev.map((pos) =>
                  pos.id === id
                    ? {
                        ...pos,
                        x: hotWaterBeaker.x,
                        y: hotWaterBeaker.y - 35,
                      }
                    : pos,
                );
              }
            }

            if (coldWaterBeaker && currentStep === 5) {
              const distance = Math.sqrt(
                Math.pow(x - coldWaterBeaker.x, 2) +
                  Math.pow(y - coldWaterBeaker.y, 2),
              );
              if (distance < 200) {
                setToastMessage(null);
                return prev.map((pos) =>
                  pos.id === id
                    ? {
                        ...pos,
                        x: coldWaterBeaker.x,
                        y: coldWaterBeaker.y - 35,
                      }
                    : pos,
                );
              }
            }
          }
          const snapped = getSnappedPosition(x, y);
          return prev.map((pos) =>
            pos.id === id ? { ...pos, x: snapped.x, y: snapped.y } : pos,
          );
        }

        // Stirring rod automation for Chemical Equilibrium
        if (id === "stirring_rod" && distilledWaterAdded) {
          setStirrerActive(true);
          setToastMessage("Stirrer activated! Mixing solution...");
          setTimeout(() => setToastMessage(null), 3000);

          setTimeout(() => {
            setEquipmentPositions((prev) =>
              prev.filter((pos) => pos.id !== "stirring_rod"),
            );
            setToastMessage("Stirrer removed - mixing complete!");
            setTimeout(() => setToastMessage(null), 3000);
          }, 2000);

          setTimeout(() => {
            setColorTransition("transitioning");
            setToastMessage("Solution slowly turning pink...");
            setTimeout(() => setToastMessage(null), 3000);

            setTimeout(() => {
              setColorTransition("pink");
              setToastMessage("Pink hydrated cobalt complex formed!");
              setTimeout(() => setToastMessage(null), 4000);

              setTimeout(() => {
                onStepComplete();
                setCurrentStep(currentStep + 1);
                setToastMessage("Step completed! Moving to next step...");
                setTimeout(() => setToastMessage(null), 3000);
              }, 1000);
            }, 2000);
          }, 1000);
        }

        const snappedDrop = getSnappedPosition(dropX, dropY);
        return [...prev, { id, x: snappedDrop.x, y: snappedDrop.y, chemicals: [] }];
      });
    },
    [currentStep, distilledWaterAdded, experimentStarted, onStepComplete, isDryTestExperiment, pushHistorySnapshot, resolvedDryTestMode, testTubePlacementTracked, totalSteps],
  );

  const handleEquipmentRemove = useCallback((id: string) => {
    pushHistorySnapshot();
    setEquipmentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setToastMessage("Equipment removed from workbench");
    setTimeout(() => setToastMessage(null), 2000);
  }, [pushHistorySnapshot]);

  useEffect(() => {
    if (!isDryTestExperiment || resolvedDryTestMode !== "basic") {
      return;
    }
    if (equipmentPositions.length === 0) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    const workbenchRect =
      document.querySelector('[data-workbench="true"]')
        ?.getBoundingClientRect() ?? null;
    if (!workbenchRect) {
      return;
    }

    let didUpdate = false;
    const alignedPositions = equipmentPositions.map((position) => {
      const normalizedId = stripEquipmentIdSuffix(position.id);
      if (!DRY_TEST_FIXED_EQUIPMENT_IDS.includes(normalizedId)) {
        return position;
      }

      const layoutPosition = getDryTestWorkbenchPosition(
        workbenchRect,
        position.id,
      );
      if (!layoutPosition) {
        return position;
      }

      if (
        layoutPosition.x === position.x &&
        layoutPosition.y === position.y
      ) {
        return position;
      }

      didUpdate = true;
      return {
        ...position,
        x: layoutPosition.x,
        y: layoutPosition.y,
      };
    });

    if (didUpdate) {
      setEquipmentPositions(alignedPositions);
    }
  }, [
    equipmentPositions,
    isDryTestExperiment,
    resolvedDryTestMode,
    setEquipmentPositions,
  ]);

  const handleChemicalSelect = (id: string) => {
    setSelectedChemical(selectedChemical === id ? null : id);
  };

  const handleChemicalDrop = (
    chemicalId: string,
    equipmentId: string,
    amount: number,
  ) => {
    const chemical = chemicalsList.find(
      (c) => c.id === chemicalId,
    );
    if (!chemical) return;

    pushHistorySnapshot();

    // helper: map known hcl ids to numeric concentrations
    const HCL_CONC_MAP: Record<string, number> = {
      hcl_0_1: 0.1,
      hcl_0_01: 0.01,
      hcl_0_001: 0.001,
    };

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === equipmentId) {
          const newChemicals = [
            ...pos.chemicals,
            {
              id: chemicalId,
              name: chemical.name,
              color: chemical.color,
              amount,
              concentration: chemical.concentration,
            },
          ];

          // PH experiment specific interactions
          if (isPHExperiment) {
            // If we added pH paper or indicator to a beaker that already contains HCl
            const containsHCl = newChemicals.some((c) => c.id.startsWith("hcl_")) ||
              pos.chemicals.some((c) => c.id.startsWith("hcl_"));

            // If pH paper added
            if (chemicalId === "ph_paper") {
              setToastMessage("pH paper added. Read the strip to estimate pH.");
              setTimeout(() => setToastMessage(null), 3000);

              if (containsHCl) {
                // find first hcl in this beaker
                const hcl = newChemicals.find((c) => c.id.startsWith("hcl_")) || pos.chemicals.find((c) => c.id.startsWith("hcl_"));
                if (hcl) {
                  const conc = HCL_CONC_MAP[hcl.id] ?? 0.01;
                  const phValue = Number((-(Math.log10(conc))).toFixed(2));
                  setMeasurements((m) => ({ ...m, ph: phValue }));
                }
              }

            } else if (chemicalId === "universal_indicator") {
              setToastMessage("Universal indicator added. Observe color change and compare to chart.");
              setTimeout(() => setToastMessage(null), 3000);

              if (containsHCl) {
                const hcl = newChemicals.find((c) => c.id.startsWith("hcl_")) || pos.chemicals.find((c) => c.id.startsWith("hcl_"));
                if (hcl) {
                  const conc = HCL_CONC_MAP[hcl.id] ?? 0.01;
                  const phValue = Number((-(Math.log10(conc))).toFixed(2));
                  setMeasurements((m) => ({ ...m, ph: phValue }));
                }
              }

            } else if (chemicalId.startsWith("hcl_") && (containsHCl || chemicalId.startsWith("hcl_"))) {
              // HCl added to beaker - if pH paper or indicator present in same beaker, update ph
              const hasPaperOrIndicator = newChemicals.some((c) => c.id === "ph_paper" || c.id === "universal_indicator") || pos.chemicals.some((c) => c.id === "ph_paper" || c.id === "universal_indicator");
              if (hasPaperOrIndicator) {
                const conc = HCL_CONC_MAP[chemicalId] ?? 0.01;
                const phValue = Number((-(Math.log10(conc))).toFixed(2));
                setMeasurements((m) => ({ ...m, ph: phValue }));
                setToastMessage(`Measured pH: ${phValue}`);
                setTimeout(() => setToastMessage(null), 3000);
              }
            }

            // generic add toast for PH experiment
            if (!(chemicalId === "ph_paper" || chemicalId === "universal_indicator")) {
              setToastMessage(`Added ${amount}mL of ${chemical.name} to ${equipmentId}`);
              setTimeout(() => setToastMessage(null), 3000);
            }

            return { ...pos, chemicals: newChemicals };
          }

          // Chemical Equilibrium reaction logic (original behavior)
          if (equipmentId === "test_tubes") {
            if (chemicalId === "cocl2") {
              setCobaltChlorideAdded(true);
              setToastMessage(
                "Blue cobalt chloride crystals formed in test tube!",
              );
              setTimeout(() => setToastMessage(null), 3000);
            } else if (chemicalId === "water" && cobaltChlorideAdded) {
              setDistilledWaterAdded(true);

              if (currentStep === 3) {
                setStep3WaterAdded(true);
                setToastMessage(
                  "Color changing back to pink as the equilibrium shifts in the reverse direction!",
                );
                setTimeout(() => {
                  setToastMessage(null);
                  setCurrentStep(4);
                  onStepComplete();
                }, 3000);
              } else {
                setToastMessage("Add the stirrer");
                setTimeout(() => setToastMessage(null), 5000);
              }
            } else if (
              chemicalId === "hcl_conc" &&
              cobaltChlorideAdded &&
              distilledWaterAdded
            ) {
              setToastMessage(
                "Color changed from pink to blue as the equilibrium changed!",
              );
              setTimeout(() => {
                setToastMessage(null);
                setCurrentStep(3);
                setToastMessage("Moving to the next step...");
                setTimeout(() => setToastMessage(null), 3000);
              }, 2000);
            } else {
              setToastMessage(
                `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
              );
              setTimeout(() => setToastMessage(null), 3000);
            }
          } else {
            setToastMessage(
              `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
            );
            setTimeout(() => setToastMessage(null), 3000);
          }

          return { ...pos, chemicals: newChemicals };
        }
        return pos;
      }),
    );

    setSelectedChemical(null);
  };

  useEffect(() => {
    if (!isDryTestExperiment || resolvedDryTestMode !== "basic") {
      if (saltHeatingIntervalRef.current) {
        window.clearInterval(saltHeatingIntervalRef.current);
        saltHeatingIntervalRef.current = null;
      }
      return;
    }

    if (!isWorkbenchHeating) {
      if (saltHeatingIntervalRef.current) {
        window.clearInterval(saltHeatingIntervalRef.current);
        saltHeatingIntervalRef.current = null;
      }
      return;
    }

    reduceSaltSampleOnHeat();
    saltHeatingIntervalRef.current = window.setInterval(
      reduceSaltSampleOnHeat,
      SALT_HEATING_INTERVAL_MS,
    );

    return () => {
      if (saltHeatingIntervalRef.current) {
        window.clearInterval(saltHeatingIntervalRef.current);
        saltHeatingIntervalRef.current = null;
      }
    };
  }, [
    isWorkbenchHeating,
    isDryTestExperiment,
    resolvedDryTestMode,
    reduceSaltSampleOnHeat,
  ]);

  const handleSaltDialogOpen = () => {
    setSaltMass("0.05");
    setSaltDialogError(null);
    setSaltDialogOpen(true);
  };

  const handleSaltDialogClose = () => {
    setSaltDialogOpen(false);
    setSaltDialogError(null);
  };

  const handleMnO2DialogOpen = () => {
    setMno2Mass(MNO2_DEFAULT_MASS);
    setMno2DialogError(null);
    setMno2DialogOpen(true);
  };

  const handleMnO2DialogClose = () => {
    setMno2DialogOpen(false);
    setMno2Mass(MNO2_DEFAULT_MASS);
    setMno2DialogError(null);
  };

  const handleAcidDialogOpen = (target: AcidTarget = "h2so4") => {
    setAcidVolume("4");
    setAcidDialogError(null);
    setAcidTarget(target);
    setAcidDialogOpen(true);
  };

  const handleAcidDialogClose = () => {
    setAcidDialogOpen(false);
    setAcidDialogError(null);
  };

  const handleAmmoniumDialogOpen = () => {
    setAmmoniumVolume("5.0");
    setAmmoniumDialogError(null);
    setAmmoniumDialogOpen(true);
  };

  const handleAmmoniumDialogClose = () => {
    setAmmoniumDialogOpen(false);
    setAmmoniumDialogError(null);
  };

  const handleBunsenHeatingChange = useCallback(
    (heating: boolean) => {
      setIsWorkbenchHeating(heating);

      if (
        heating &&
        experiment.id === ChemicalEquilibriumData.id &&
        resolvedDryTestMode === "basic"
      ) {
        setCaseOneResult(
          "Formation of white sublimate (ammonium chloride) shows NH₄⁺ is present.",
        );
      }
    },
    [experiment.id, resolvedDryTestMode],
  );

  useEffect(() => {
    if (
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      isWorkbenchHeating &&
      hasMnO2InTestTube
    ) {
      setCaseTwoResult(MNO2_CASE_TWO_RESULT);
    }
  }, [
    isDryTestExperiment,
    resolvedDryTestMode,
    isWorkbenchHeating,
    hasMnO2InTestTube,
  ]);

  const handleNaOHDialogOpen = () => {
    setNaohVolume("2.5");
    setNaohDialogError(null);
    setNaohDialogOpen(true);
  };

  const handleNaOHDialogClose = () => {
    setNaohDialogOpen(false);
    setNaohDialogError(null);
  };

  const handleGlassAcidDialogOpen = () => {
    setGlassAcidVolume(GLASS_CONTAINER_HCL_DEFAULT_VOLUME.toString());
    setGlassAcidDialogError(null);
    setGlassAcidDialogOpen(true);
  };

  const handleGlassAcidDialogClose = () => {
    setGlassAcidDialogOpen(false);
    setGlassAcidDialogError(null);
  };

  const addHClToGlassContainer = (volume: number) => {
    if (!glassContainerEquipmentId) {
      return;
    }

    pushHistorySnapshot();
    const acidConfig = ACID_CONFIG.hcl;
    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== glassContainerEquipmentId) {
          return pos;
        }

        const existing = pos.chemicals.find(
          (chemical) => chemical.id === acidConfig.chemicalId,
        );
        const updatedChemicals = existing
          ? pos.chemicals.map((chemical) =>
              chemical.id === acidConfig.chemicalId
                ? { ...chemical, amount: (chemical.amount ?? 0) + volume }
                : chemical,
            )
          : [
              ...pos.chemicals,
              {
                id: acidConfig.chemicalId,
                name: acidConfig.label,
                color: acidConfig.color,
                amount: volume,
                concentration: "Concentrated",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    setToastMessage(
      `Added ${volume.toFixed(1)} mL of ${acidConfig.label} to the glass container.`,
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddGlassAcidToContainer = () => {
    const volume = parseFloat(glassAcidVolume);
    if (Number.isNaN(volume) || volume <= 0) {
      setGlassAcidDialogError("Enter a valid volume.");
      return;
    }

    if (volume < MIN_GLASS_HCL_VOLUME || volume > MAX_GLASS_HCL_VOLUME) {
      setGlassAcidDialogError(
        `Keep the value within ${GLASS_CONTAINER_HCL_VOLUME_LABEL}.`,
      );
      return;
    }

    if (!glassContainerEquipmentId) {
      setGlassAcidDialogError("Glass container is not available in this layout.");
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === glassContainerEquipmentId)) {
      setGlassAcidDialogError("Place the glass container on the workbench first.");
      return;
    }

    addHClToGlassContainer(volume);
    handleGlassAcidDialogClose();
  };

  const handleAddNaOHToTestTube = () => {
    const volume = parseFloat(naohVolume);
    if (Number.isNaN(volume) || volume <= 0) {
      setNaohDialogError("Enter a valid volume.");
      return;
    }

    if (volume < MIN_NAOH_VOLUME || volume > MAX_NAOH_VOLUME) {
      setNaohDialogError(`Enter a volume within ${NAOH_VOLUME_LABEL}.`);
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === "test_tubes")) {
      setNaohDialogError("Place the test tube on the workbench first.");
      return;
    }

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((chemical) => chemical.id === NAOH_CHEMICAL_ID);
        const updatedChemicals = existing
          ? pos.chemicals.map((chemical) =>
              chemical.id === NAOH_CHEMICAL_ID
                ? {
                    ...chemical,
                    amount: (chemical.amount ?? 0) + volume,
                  }
                : chemical,
            )
          : [
              ...pos.chemicals,
              {
                id: NAOH_CHEMICAL_ID,
                name: NAOH_NAME,
                color: NAOH_COLOR,
                amount: volume,
                concentration: NAOH_CONCENTRATION,
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    const shouldAdvanceAfterBasicNaOH =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "basic" &&
      currentStep === 7 &&
      !basicNaOHAddedTracked;
    const naohToast = shouldAdvanceAfterBasicNaOH
      ? "NaOH solution added. Moving to Step 8."
      : `Added ${volume.toFixed(2)} mL of NaOH to the test tube.`;

    setToastMessage(naohToast);
    setTimeout(() => setToastMessage(null), 3000);

    handleNaOHDialogClose();

    if (shouldAdvanceAfterBasicNaOH) {
      setBasicNaOHAddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const getQuickAddAction = (equipmentId: string) => {
    if (
      isDryTestExperiment &&
      resolvedDryTestMode === "basic" &&
      equipmentId.startsWith("naoh")
    ) {
      return handleNaOHDialogOpen;
    }
    if (equipmentId.startsWith("salt-sample")) {
      return handleSaltDialogOpen;
    }
    if (
      isDryTestExperiment &&
      resolvedDryTestMode === "basic" &&
      (equipmentId.startsWith("conc-hcl") || equipmentId.startsWith("conc-h-cl"))
    ) {
      return handleGlassAcidDialogOpen;
    }
    if (equipmentId.startsWith("concentrated-h-so")) {
      return () => handleAcidDialogOpen("h2so4");
    }
    if (
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      equipmentId.startsWith("mno")
    ) {
      return handleMnO2DialogOpen;
    }
    if (equipmentId.startsWith("ammonium-hydroxide-nh-oh") ||
      equipmentId.startsWith("ammonium-hydroxide")
    ) {
      return handleAmmoniumDialogOpen;
    }
    return undefined;
  };

  const handleAddSaltToTestTube = () => {
    const mass = parseFloat(saltMass);
    if (Number.isNaN(mass) || mass <= 0) {
      setSaltDialogError("Enter a valid amount.");
      return;
    }

    if (mass < MIN_SALT_MASS || mass > MAX_SALT_MASS) {
      setSaltDialogError(`Salt mass must stay within ${SALT_RANGE_LABEL}.`);
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === "test_tubes")) {
      setSaltDialogError("Place the test tube on the workbench first.");
      return;
    }

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === "salt_sample");
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === "salt_sample"
                ? { ...c, amount: c.amount + mass }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: "salt_sample",
                name: "Salt Sample",
                color: "#fbbf24",
                amount: mass,
                concentration: "Dry",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    const shouldAdvanceAfterFirstSample =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 2 &&
      !sampleAddedTracked;
    const shouldAdvanceAfterSecondSample =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 9 &&
      !secondSampleAddedTracked;
    const shouldAdvanceAfterBasicSalt =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "basic" &&
      currentStep === 6 &&
      !basicSaltAddedTracked;

    const shouldAdvanceAfterSample =
      shouldAdvanceAfterFirstSample || shouldAdvanceAfterSecondSample;

    const toastMessageText = shouldAdvanceAfterSample
      ? "Salt sample added. Moving to the next step."
      : shouldAdvanceAfterBasicSalt
        ? "Salt sample added. Moving to Step 7."
        : `Added ${mass.toFixed(2)} g of Salt Sample to the test tube.`;

    setToastMessage(toastMessageText);
    setTimeout(() => setToastMessage(null), 3000);
    handleSaltDialogClose();

    if (shouldAdvanceAfterSample) {
      if (shouldAdvanceAfterFirstSample) {
        setSampleAddedTracked(true);
      } else {
        setSecondSampleAddedTracked(true);
      }
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else if (shouldAdvanceAfterBasicSalt) {
      setBasicSaltAddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleAddMnO2ToTestTube = () => {
    const mass = parseFloat(mno2Mass);
    if (Number.isNaN(mass) || mass <= 0) {
      setMno2DialogError("Enter a valid amount.");
      return;
    }

    if (mass < MIN_MNO2_MASS || mass > MAX_MNO2_MASS) {
      setMno2DialogError(`Use between ${MNO2_RANGE_LABEL}.`);
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === "test_tubes")) {
      setMno2DialogError("Place the test tube on the workbench first.");
      return;
    }

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === "mno2");
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === "mno2"
                ? { ...c, amount: (c.amount ?? 0) + mass }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: "mno2",
                name: "MnO₂",
                color: "#a855f7",
                amount: mass,
                concentration: "Dry",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    const shouldAdvanceAfterMnO2 =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 11 &&
      !mno2AddedTracked;

    setToastMessage(
      shouldAdvanceAfterMnO2
        ? "MnO₂ added. Moving to the next step."
        : `Added ${mass.toFixed(2)} g of MnO₂ to the test tube.`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    handleMnO2DialogClose();

    if (shouldAdvanceAfterMnO2) {
      setMno2AddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleAddAcidToTestTube = () => {
    const drops = Number(acidVolume);
    if (Number.isNaN(drops) || !Number.isInteger(drops) || drops <= 0) {
      setAcidDialogError("Enter a valid whole number of drops.");
      return;
    }

    if (drops < MIN_ACID_DROPS || drops > MAX_ACID_DROPS) {
      setAcidDialogError(`Use between ${ACID_RANGE_LABEL}.`);
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === "test_tubes")) {
      setAcidDialogError("Place the test tube on the workbench first.");
      return;
    }

    const acidConfig = ACID_CONFIG[acidTarget];

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === acidConfig.chemicalId);
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === acidConfig.chemicalId
                ? { ...c, amount: (c.amount ?? 0) + drops }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: acidConfig.chemicalId,
                name: acidConfig.label,
                color: acidConfig.color,
                amount: drops,
                concentration: "Concentrated",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    const shouldAdvanceAfterFirstAcid =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 3 &&
      !acidAddedTracked;
    const shouldAdvanceAfterSecondAcid =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 10 &&
      !secondAcidAddedTracked;

    const shouldAdvanceAfterAcid =
      shouldAdvanceAfterFirstAcid || shouldAdvanceAfterSecondAcid;

    setToastMessage(
      shouldAdvanceAfterAcid
        ? "Concentrated acid added. Moving to the next step."
        : `Added ${drops} drops of ${acidConfig.label} to the test tube.`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    handleAcidDialogClose();

    if (shouldAdvanceAfterAcid) {
      if (shouldAdvanceAfterFirstAcid) {
        setAcidAddedTracked(true);
      } else {
        setSecondAcidAddedTracked(true);
      }
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleAddAmmoniumToGlassContainer = () => {
    const volume = parseFloat(ammoniumVolume);
    if (Number.isNaN(volume)) {
      setAmmoniumDialogError("Enter a valid numeric volume.");
      return;
    }
    if (volume < MIN_AMMONIUM_VOLUME || volume > MAX_AMMONIUM_VOLUME) {
      setAmmoniumDialogError(
        `Enter a volume between ${MIN_AMMONIUM_VOLUME} mL and ${MAX_AMMONIUM_VOLUME} mL.`,
      );
      return;
    }

    if (!glassContainerEquipmentId) {
      setAmmoniumDialogError("Glass container is not available in this layout.");
      return;
    }

    if (!equipmentPositions.some((pos) => pos.id === glassContainerEquipmentId)) {
      setAmmoniumDialogError("Place the glass container on the workbench first.");
      return;
    }

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== glassContainerEquipmentId) {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === "nh4oh");
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === "nh4oh"
                ? { ...c, amount: c.amount + volume }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: "nh4oh",
                name: "Ammonium hydroxide",
                color: "#4ade80",
                amount: volume,
                concentration: "Dilute",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    const shouldAdvanceAfterAmmonium =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "acid" &&
      currentStep === 6 &&
      !ammoniumAddedTracked;

    const ammoniumToast = shouldAdvanceAfterAmmonium
      ? "NH₄OH solution ready. Moving to the next step."
      : `Added ${volume.toFixed(1)} mL of Ammonium hydroxide to the glass container.`;

    setToastMessage(ammoniumToast);
    setTimeout(() => setToastMessage(null), 3000);
    handleAmmoniumDialogClose();

    if (shouldAdvanceAfterAmmonium) {
      setAmmoniumAddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleRinseAction = () => {
    if (!shouldShowRinseButton || isRinsing) return;

    const rinseSourceLabel = hasAmmoniumInGlassContainer
      ? "NH₄OH"
      : hasHClInGlassContainer
        ? "Conc. HCl"
        : "solution";

    if (!hasRinsed) {
      setHasRinsed(true);
      setIsRinsing(true);
      setShowRinseAnimation(true);
      setToastMessage(`Rinsing the glass rod with ${rinseSourceLabel}...`);
      if (rinseTimerRef.current) {
        window.clearTimeout(rinseTimerRef.current);
      }
      rinseTimerRef.current = window.setTimeout(() => {
        setIsRinsing(false);
        setShowRinseAnimation(false);
        setToastMessage("Rinsing complete.");
        rinseTimerRef.current = null;
        setTimeout(() => setToastMessage(null), 2000);
      }, 2200);
      return;
    }

    if (rodMoved || rodMoveAnimationConfig) return;

    const glassRod = equipmentPositions.find((pos) => pos.id.includes("glass-rod"));
    const testTube = equipmentPositions.find((pos) => pos.id === "test_tubes");

    if (!glassRod || !testTube) {
      setToastMessage("Place both the glass rod and test tube on the workbench first.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const workbenchRect =
      typeof document !== "undefined"
        ? document
            .querySelector('[data-workbench="true"]')
            ?.getBoundingClientRect() ?? null
        : null;
    const clampX = (value: number) => {
      if (!workbenchRect) return value;
      return Math.max(32, Math.min(value, Math.max(32, workbenchRect.width - 32)));
    };
    const clampY = (value: number) => {
      if (!workbenchRect) return value;
      return Math.max(32, Math.min(value, Math.max(32, workbenchRect.height - 32)));
    };
    const targetX = clampX(testTube.x + 40);
    const targetY = clampY(testTube.y - 150);
    const startX = glassRod.x;
    const startY = glassRod.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;

    cancelRodMoveAnimation();
    setRodMoveAnimationConfig({
      startX,
      startY,
      deltaX,
      deltaY,
      durationMs: ROD_MOVE_ANIMATION_DURATION,
    });

    setToastMessage("Moving the glass rod above the test tube...");

    const rodId = glassRod.id;
    if (rodMoveAnimationTimerRef.current) {
      window.clearTimeout(rodMoveAnimationTimerRef.current);
    }
    rodMoveAnimationTimerRef.current = window.setTimeout(() => {
      setRodMoveAnimationConfig(null);
      pushHistorySnapshot();
      setEquipmentPositions((prev) =>
        prev.map((pos) =>
          pos.id === rodId
            ? {
                ...pos,
                x: targetX,
                y: targetY,
              }
            : pos,
        ),
      );
      setRodMoved(true);
      setPostMoveFumesEnabled(true);
      setCaseOneResult("Cl⁻ radical may be present in the given salt.");
      if (isDryTestExperiment && resolvedDryTestMode === "basic") {
        setCaseTwoResult(CASE_TWO_BASIC_RESULT);
      }
      setToastMessage("Glass rod moved above the test tube.");
      setTimeout(() => setToastMessage(null), 2500);
      rodMoveAnimationTimerRef.current = null;
    }, ROD_MOVE_ANIMATION_DURATION);
  };

  const handleStartExperiment = () => {
    onStartExperiment();
  };

  const currentAcidLabel = ACID_CONFIG[acidTarget].label;

  const handleReset = () => {
    cancelRodMoveAnimation();
    setEquipmentPositions([]);
    setSelectedChemical(null);
    setIsRunning(false);
    setResults([]);
    setCurrentStep(stepNumber);
    setMeasurements(DEFAULT_MEASUREMENTS);
    setToastMessage(null);
    setCobaltChlorideAdded(false);
    setDistilledWaterAdded(false);
    setStirrerActive(false);
    setColorTransition("pink");
    setStep3WaterAdded(false);
    historyRef.current = [];
    setUndoStackLength(0);
    setHasRinsed(false);
    setRodMoved(false);
    setPostMoveFumesEnabled(false);
    setCaseOneResult(DEFAULT_CASE_RESULT);
    setCaseTwoResult(DEFAULT_CASE_RESULT);
    setShowCase2ResultsModal(false);
    setGlassAcidDialogOpen(false);
    setGlassAcidVolume(GLASS_CONTAINER_HCL_DEFAULT_VOLUME.toString());
    setGlassAcidDialogError(null);
    setMno2DialogOpen(false);
    setMno2Mass(MNO2_DEFAULT_MASS);
    setMno2DialogError(null);
    if (rinseTimerRef.current) {
      window.clearTimeout(rinseTimerRef.current);
      rinseTimerRef.current = null;
    }
    setIsRinsing(false);
    setShowRinseAnimation(false);
    setTestTubePlacementTracked(false);
    onResetTimer();
    setWorkbenchResetTrigger((prev) => prev + 1);
    if (onResetExperiment) onResetExperiment();
  };

  const handleClearWorkbench = () => {
    cancelRodMoveAnimation();
    setEquipmentPositions([]);
    setRodMoved(false);
    setPostMoveFumesEnabled(false);
    setMno2DialogOpen(false);
    setMno2Mass(MNO2_DEFAULT_MASS);
    setMno2DialogError(null);
    setHasRinsed(false);
    setCaseTwoResult(DEFAULT_CASE_RESULT);
    setShowCase2ResultsModal(false);
    setShowRinseAnimation(false);
    setToastMessage("Workbench cleared.");
    setTimeout(() => setToastMessage(null), 2500);
    setWorkbenchResetTrigger((prev) => prev + 1);
  };

  const handleUndoStep = () => {
    if (historyRef.current.length === 0) {
      setToastMessage("No operations to undo yet.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    if (rinseTimerRef.current) {
      window.clearTimeout(rinseTimerRef.current);
      rinseTimerRef.current = null;
    }
    setIsRinsing(false);
    setShowRinseAnimation(false);
    cancelRodMoveAnimation();

    const lastSnapshot = historyRef.current.pop();
    if (!lastSnapshot) {
      setUndoStackLength(historyRef.current.length);
      return;
    }

    setUndoStackLength(historyRef.current.length);

    setEquipmentPositions(
      lastSnapshot.equipmentPositions.map((pos) => ({
        ...pos,
        chemicals: pos.chemicals.map((chem) => ({ ...chem })),
      })),
    );
    setCurrentStep(lastSnapshot.currentStep);
    setSelectedChemical(lastSnapshot.selectedChemical);
    setCobaltChlorideAdded(lastSnapshot.cobaltChlorideAdded);
    setDistilledWaterAdded(lastSnapshot.distilledWaterAdded);
    setStirrerActive(lastSnapshot.stirrerActive);
    setColorTransition(lastSnapshot.colorTransition);
    setStep3WaterAdded(lastSnapshot.step3WaterAdded);
    setMeasurements({ ...lastSnapshot.measurements });
    setCaseOneResult(lastSnapshot.caseOneResult);
    setCaseTwoResult(lastSnapshot.caseTwoResult);

    setToastMessage("Reverted the last operation.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleViewResults = () => {
    if (!resultsReady) {
      const missing = !caseOneReady
        ? "Case 1 observations"
        : !caseTwoReady
          ? "Case 2 observations"
          : "observations";
      setToastMessage(`Complete ${missing} before viewing the analysis.`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    setShowCase2ResultsModal(true);
  };

  const handleReturnToExperiments = () => {
    setShowCase2ResultsModal(false);
    setLocation("/");
    setToastMessage("Return to the experiments list to try another activity.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLaunchQuiz = () => {
    setShowCase2ResultsModal(false);
    setToastMessage("Quiz coming soon for this experiment.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <TooltipProvider>
      {usePhStyleLayout ? (
        <div className="w-full flex gap-4" style={{ minHeight: '75vh' }}>
          {/* Left Equipment Column */}
          <aside className="w-64 flex-shrink-0 bg-white/90 border border-gray-200 rounded-lg p-4 flex flex-col">
            <h4 className="text-sm font-semibold mb-3">Equipment</h4>

            {/* Experiment progress above equipment (PH experiment) */}
            {!isDryTestWorkbench && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Experiment Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: totalSteps }).map((_, i) => {
                    const stepIndex = i + 1;
                    const active = stepIndex <= currentStep;
                    return (
                      <div
                        key={stepIndex}
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${active ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                      >
                        {stepIndex}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                {equipmentList.map((equipment) => {
                  const quickAddAction = getQuickAddAction(equipment.id);
                  const isQuickAddCard = Boolean(quickAddAction);
                  return (
                    <div
                      key={equipment.id}
                      data-testid={equipment.id}
                      className="equipment-card justify-between"
                      draggable={!isQuickAddCard}
                      onDragStart={(e) => {
                        if (isQuickAddCard) return;
                        e.dataTransfer.setData("equipment", equipment.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDoubleClick={() => {
                        if (!isQuickAddCard) {
                          handleEquipmentDrop(equipment.id, 200, 200);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <div className="equipment-icon">
                            <div className="equipment-icon-inner">{equipment.icon}</div>
                          </div>
                          <div className="text-sm font-medium text-gray-700">{equipment.name}</div>
                        </div>
                        {isQuickAddCard && quickAddAction && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              quickAddAction();
                            }}
                            className="px-3 py-1 text-xs font-semibold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">Tip: Drag equipment from the left panel to the workbench.</div>

            {isDryTestExperiment && (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleUndoStep}
                  disabled={undoStackLength === 0}
                  className={`w-full px-3 py-2 rounded shadow-sm transition ${
                    undoStackLength === 0
                      ? "bg-white border border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Undo
                </button>
                <button
                  onClick={handleViewResults}
                  className={`w-full px-3 py-2 rounded shadow-sm transition ${
                    resultsReady
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-200 text-blue-800 opacity-80"
                  }`}
                >
                  View Results &amp; Analysis
                </button>
              </div>
            )}

            <div className="mt-4">
              <button onClick={handleReset} className="w-full px-3 py-2 bg-red-50 text-red-600 rounded">Reset Experiment</button>
            </div>
          </aside>

          {/* Center Workbench Area */}
          <main className="flex-[2] flex flex-col">
          {!isDryTestWorkbench && (
            <div className="mb-4">
              <div className="rounded-lg bg-gradient-to-b from-yellow-50 to-white border p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{experimentTitle} - Interactive Workbench</h3>
                    <p className="text-xs text-gray-500 mt-1">Follow the guided steps below to complete the experiment and record observations.</p>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                          {Array.from({ length: totalSteps }).map((_, i) => {
                            const stepIndex = i + 1;
                            const active = stepIndex <= currentStep;
                            return (
                              <div key={stepIndex} className="flex flex-col items-center mr-2">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${active ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                  {stepIndex}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-xs text-gray-600">Step {currentStep} of {totalSteps}</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-600">Current Step</div>
                          <div className="font-semibold text-sm mt-1">{allSteps[currentStep - 1]?.title ?? 'No step selected'}</div>
                          <div className="text-xs text-gray-500 mt-1">{allSteps[currentStep - 1]?.description ?? ''}</div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <button onClick={toggleTimer} className="text-xs px-2 py-1 bg-white border rounded flex items-center space-x-2">
                            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span className="text-xs">{formatTime(timer ?? 0)}</span>
                          </button>
                          <button onClick={handleReset} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">Reset</button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} className="text-xs px-2 py-1 bg-gray-100 rounded">Undo</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            <div className="flex-1 p-2">
              <WorkBench
                onDrop={experimentStarted ? handleEquipmentDrop : () => {}}
                selectedChemical={experimentStarted ? selectedChemical : null}
                isRunning={isRunning}
                experimentTitle={experimentTitle}
                equipmentPositions={equipmentPositions}
                currentGuidedStep={currentStep}
                totalGuidedSteps={isDryTestExperiment ? totalGuidedSteps : undefined}
                showRinseButton={shouldShowRinseButton}
                onRinse={handleRinseAction}
                isRinsing={isRinsing}
                hasRinsed={hasRinsed}
                rodMoved={rodMoved}
                rodMoveAnimation={rodMoveAnimationConfig}
                isRodMoving={Boolean(rodMoveAnimationConfig)}
                showPostMoveFumes={postMoveFumesEnabled}
                onHeatingStateChange={handleBunsenHeatingChange}
                workbenchResetTrigger={workbenchResetTrigger}
              >
                {equipmentPositions
                  .filter((pos) => !isDryTestBottleEquipment(pos.id))
                  .map((pos) => {
                    const equipment = equipmentList.find((eq) => eq.id === pos.id);
                    return equipment ? (
                      <Equipment
                        key={pos.id}
                        id={pos.id}
                        name={equipment.name}
                        icon={equipment.icon}
                        onDrag={experimentStarted ? handleEquipmentDrop : () => {}}
                        position={pos}
                        chemicals={pos.chemicals}
                        onChemicalDrop={experimentStarted ? handleChemicalDrop : () => {}}
                        onRemove={experimentStarted ? handleEquipmentRemove : () => {}}
                        onInteract={
                          experimentStarted
                            ? equipment.name.toLowerCase().includes("salt sample")
                              ? handleSaltDialogOpen
                              : equipment.name.toLowerCase().includes("ammonium") ||
                                equipment.name.toLowerCase().includes("nh₄oh") ||
                                equipment.name.toLowerCase().includes("nh4oh")
                              ? handleAmmoniumDialogOpen
                              : equipment.name.toLowerCase().includes("hcl")
                                ? () => handleAcidDialogOpen("hcl")
                                : equipment.name.toLowerCase().includes("h2so4") ||
                                  equipment.name.toLowerCase().includes("h₂so₄") ||
                                  equipment.name.toLowerCase().includes("sulfuric")
                                ? () => handleAcidDialogOpen("h2so4")
                                : undefined
                            : undefined
                        }
                        cobaltReactionState={cobaltReactionState}
                        allEquipmentPositions={equipmentPositions}
                        currentStep={currentStep}
                        disabled={!experimentStarted}
                        isDryTest={isDryTestExperiment}
                        dryTestMode={resolvedDryTestMode}
                        isRinseActive={pos.id === glassRodEquipmentId && showRinseAnimation}
                        imageUrl={equipment.imageUrl}
                      />
                    ) : null;
                  })}
              </WorkBench>
            </div>

            <div className="mt-4 bg-white p-3 border rounded">
              <h4 className="text-sm font-semibold mb-2">Instructions</h4>
              <p className="text-xs text-gray-600">{instructionMessage}</p>
            </div>
          </main>

          {/* Right Live Analysis Column */}
          <aside className="w-56 flex-shrink-0 bg-white/90 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-lime-300 rounded-full shadow-lg shadow-lime-200 animate-pulse" />
                <h4 className="text-base font-bold text-slate-900">Live Analysis</h4>
              </div>
              <div className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Current Step</div>
              <div className="mt-1 text-sm">{allSteps[currentStep - 1]?.title ?? 'No step selected'}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Completed Steps</div>
              <ul
                className={`list-disc list-inside mt-2 ${
                  isAcidDryTest ? "text-lime-300 font-bold text-sm" : ""
                }`}
              >
                {allSteps.slice(0, Math.max(0, currentStep - 1)).map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            </div>

            {!isAcidDryTest && (
              <div className="mt-2 mb-4 p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium text-gray-600">Measured pH</div>
                <div className="text-2xl font-bold mt-1">{measurements.ph ? measurements.ph : 'No result yet'}</div>
              </div>
            )}

            <div className="text-sm font-bold mb-2 text-slate-900">Cases</div>
            <div className="space-y-2">
              <div className="p-3 border rounded bg-white text-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">CASE 1</div>
                <div className="mt-1 text-sm text-slate-800">{caseOneResult}</div>
              </div>
              <div className="p-3 border rounded bg-white text-slate-900">
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">CASE 2</div>
                <div className="mt-1 text-sm text-slate-800">{caseTwoResult}</div>
              </div>
            </div>
            {caseOneResult !== DEFAULT_CASE_RESULT && (
              <button
                type="button"
                onClick={handleClearWorkbench}
                className="mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold tracking-[0.3em] uppercase text-white bg-red-600 shadow-lg hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 transition-colors"
              >
                RESET WORKBENCH
              </button>
            )}
          </aside>
        </div>
      ) : (
        <div
        className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden flex"
        style={{ minHeight: "75vh" }}
      >
        {/* Main Lab Content */}
        <div className="flex-1 flex flex-col">
          {/* Equipment Bar - Top Horizontal */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center">
                <Atom className="w-4 h-4 mr-2 text-blue-600" />
                  {experimentTitle} - Equipment
                </h4>
                <span className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                  STEP {currentStep}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-2 overflow-x-auto pb-2">
              {equipmentList.map((equipment) => (
                <div key={equipment.id} className="flex-shrink-0">
                  <Equipment
                    id={equipment.id}
                    name={equipment.name}
                    icon={equipment.icon}
                    onDrag={experimentStarted ? handleEquipmentDrop : () => {}}
                    position={null}
                    chemicals={[]}
                    onChemicalDrop={
                      experimentStarted ? handleChemicalDrop : () => {}
                    }
                    allEquipmentPositions={equipmentPositions}
                    currentStep={currentStep}
                    disabled={!experimentStarted}
                    isDryTest={isDryTestExperiment}
                    dryTestMode={resolvedDryTestMode}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Main Work Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 relative">
              <WorkBench
                onDrop={experimentStarted ? handleEquipmentDrop : () => {}}
                selectedChemical={experimentStarted ? selectedChemical : null}
                isRunning={isRunning}
                experimentTitle={experimentTitle}
                equipmentPositions={equipmentPositions}
                currentGuidedStep={currentStep}
                totalGuidedSteps={isDryTestExperiment ? totalGuidedSteps : undefined}
                showRinseButton={shouldShowRinseButton}
                onRinse={handleRinseAction}
                isRinsing={isRinsing}
                hasRinsed={hasRinsed}
                rodMoved={rodMoved}
                rodMoveAnimation={rodMoveAnimationConfig}
                isRodMoving={Boolean(rodMoveAnimationConfig)}
                showPostMoveFumes={postMoveFumesEnabled}
                onHeatingStateChange={handleBunsenHeatingChange}
                workbenchResetTrigger={workbenchResetTrigger}
              >
                {equipmentPositions.map((pos) => {
                  const equipment = equipmentList.find(
                    (eq) => eq.id === pos.id,
                  );
                  return equipment ? (
                    <Equipment
                      key={pos.id}
                      id={pos.id}
                      name={equipment.name}
                      icon={equipment.icon}
                      onDrag={
                        experimentStarted ? handleEquipmentDrop : () => {}
                      }
                      position={pos}
                      chemicals={pos.chemicals}
                      onChemicalDrop={
                        experimentStarted ? handleChemicalDrop : () => {}
                      }
                      onRemove={
                        experimentStarted ? handleEquipmentRemove : () => {}
                      }
                      cobaltReactionState={cobaltReactionState}
                      allEquipmentPositions={equipmentPositions}
                      currentStep={currentStep}
                      disabled={!experimentStarted}
                      isDryTest={isDryTestExperiment}
                      dryTestMode={resolvedDryTestMode}
                      imageUrl={equipment.imageUrl}
                    />
                  ) : null;
                })}
              </WorkBench>
            </div>
          </div>

          {!isDryTestExperiment && (
            <>
              {/* Reagents Bar - Bottom Horizontal */}
              <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                  Chemical Reagents
                </h4>
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {chemicalsList.map((chemical) => (
                    <div key={chemical.id} className="flex-shrink-0">
                      <Chemical
                        id={chemical.id}
                        name={chemical.name}
                        formula={chemical.formula}
                        color={chemical.color}
                        concentration={chemical.concentration}
                        volume={chemical.volume}
                        onSelect={
                          experimentStarted ? handleChemicalSelect : () => {}
                        }
                        selected={
                          experimentStarted && selectedChemical === chemical.id
                        }
                        disabled={!experimentStarted}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
      )}

      {isDryTestExperiment && (
        <Dialog open={saltDialogOpen} onOpenChange={(open) => !open && handleSaltDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Mass</DialogTitle>
              <DialogDescription>
                Enter the mass of the Salt Sample to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Mass (g)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                type="number"
                min={MIN_SALT_MASS}
                max={MAX_SALT_MASS}
                step="0.1"
                value={saltMass}
                onChange={(event) => setSaltMass(event.target.value)}
                placeholder="2.5"
              />
              <p className="text-[11px] text-slate-500">Recommended range: {SALT_RANGE_LABEL}.</p>
              {saltDialogError && (
                <p className="text-[11px] text-red-500">{saltDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleSaltDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSaltToTestTube}>
                  Add to test tube
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && (
        <Dialog
          open={mno2DialogOpen}
          onOpenChange={(open) => !open && handleMnO2DialogClose()}
        >
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Mass</DialogTitle>
              <DialogDescription>
                Enter the mass of MnO₂ to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Mass (g)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                type="number"
                min={MIN_MNO2_MASS}
                max={MAX_MNO2_MASS}
                step="0.1"
                value={mno2Mass}
                onChange={(event) => setMno2Mass(event.target.value)}
                placeholder="1.5"
              />
              <p className="text-[11px] text-slate-500">Recommended range: {MNO2_RANGE_LABEL}.</p>
              {mno2DialogError && (
                <p className="text-[11px] text-red-500">{mno2DialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleMnO2DialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddMnO2ToTestTube}>
                  Add to test tube
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && resolvedDryTestMode === "basic" && (
        <Dialog open={naohDialogOpen} onOpenChange={(open) => !open && handleNaOHDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Volume</DialogTitle>
              <DialogDescription>
                Enter the volume of NaOH to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Volume (mL)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                type="number"
                min={MIN_NAOH_VOLUME}
                max={MAX_NAOH_VOLUME}
                step="0.1"
                value={naohVolume}
                onChange={(event) => setNaohVolume(event.target.value)}
                placeholder="2.5"
              />
              <p className="text-[11px] text-slate-500">Recommended range: {NAOH_VOLUME_LABEL}.</p>
              {naohDialogError && (
                <p className="text-[11px] text-red-500">{naohDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleNaOHDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddNaOHToTestTube}>
                  Add to test tube
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && resolvedDryTestMode === "basic" && (
        <Dialog open={glassAcidDialogOpen} onOpenChange={(open) => !open && handleGlassAcidDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Volume</DialogTitle>
              <DialogDescription>
                Enter the volume of Conc. HCl to add to the glass container.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Volume (mL)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                type="number"
                min={MIN_GLASS_HCL_VOLUME}
                max={MAX_GLASS_HCL_VOLUME}
                step="0.1"
                value={glassAcidVolume}
                onChange={(event) => setGlassAcidVolume(event.target.value)}
                placeholder="4.0"
              />
              <p className="text-[11px] text-slate-500">
                Recommended range: {GLASS_CONTAINER_HCL_VOLUME_LABEL}.
              </p>
              {glassAcidDialogError && (
                <p className="text-[11px] text-red-500">{glassAcidDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleGlassAcidDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddGlassAcidToContainer}>
                  Add to glass container
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && (
        <Dialog open={acidDialogOpen} onOpenChange={(open) => !open && handleAcidDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Volume</DialogTitle>
              <DialogDescription>
                Enter the volume of {currentAcidLabel} to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Volume (mL)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                type="number"
                min="3"
                max="5"
                step="1"
                value={acidVolume}
                onChange={(event) => setAcidVolume(event.target.value)}
                placeholder="4"
              />
              <p className="text-[11px] text-slate-500">Recommended range: {ACID_RANGE_LABEL}.</p>
              {acidDialogError && (
                <p className="text-[11px] text-red-500">{acidDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleAcidDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddAcidToTestTube}>
                  Add to test tube
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && (
        <Dialog open={ammoniumDialogOpen} onOpenChange={(open) => !open && handleAmmoniumDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Volume</DialogTitle>
              <DialogDescription>
                Enter the volume of Ammonium hydroxide (NH₄OH) to add to the test tube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Volume (mL)
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                type="number"
                min={MIN_AMMONIUM_VOLUME}
                max={MAX_AMMONIUM_VOLUME}
                step="0.1"
                value={ammoniumVolume}
                onChange={(event) => setAmmoniumVolume(event.target.value)}
                placeholder="5.0"
              />
              <p className="text-[11px] text-slate-500">
                Recommended range: {MIN_AMMONIUM_VOLUME} - {MAX_AMMONIUM_VOLUME} mL.
              </p>
              {ammoniumDialogError && (
                <p className="text-[11px] text-red-500">{ammoniumDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleAmmoniumDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddAmmoniumToGlassContainer}>
                  Add to glass container
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDryTestExperiment && (
        <Dialog open={showCase2ResultsModal} onOpenChange={setShowCase2ResultsModal}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-white">Experiment Results &amp; Analysis</DialogTitle>
              <DialogDescription className="text-white/80">
                Complete summary of Case 1 and Case 2 observations for the Salt Analysis dry acid radicals test.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6 pt-4 space-y-6 text-slate-900">
              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-lg border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-lg shadow-rose-100">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-500">Case 1 • Initial Clues</div>
                  <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
                    {caseOneResult}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    White residues and a faint halide scent on the loop suggested the presence of chloride radicals before any heating with MnO₂.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600">
                    Residue detected
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </div>
                </section>
                <section className="rounded-lg border border-lime-200 bg-gradient-to-br from-lime-50 to-white p-5 shadow-lg shadow-lime-100">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-lime-600">Case 2 • Confirmatory Gas</div>
                  <p className="mt-3 text-base font-semibold text-slate-900 leading-relaxed">{caseTwoResult}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    The greenish-yellow fumes released during heating confirm chlorine evolution from MnO₂-oxidized chloride ions.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-lime-100 bg-lime-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    Chlorine gas detected
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
                  </div>
                </section>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-sky-50 via-indigo-50 to-white p-5 text-indigo-900 shadow-inner">
                <div className="font-semibold text-indigo-800">Case Comparison</div>
                <p className="mt-2 text-sm leading-relaxed text-indigo-900">
                  Case 1 establishes the likelihood of chloride radicals while Case 2 captures the oxidizing reaction that releases chlorine gas. Together they validate chloride ions in the salt, matching the classic dry test evidence for acid radicals.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  <span className="rounded-full bg-indigo-100 px-3 py-1">Residue trace</span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1">Gas evolution</span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1">Qualitative proof</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
                    <span>Case 1 Indicator</span>
                    <span>Chloride residue</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700">Loop film</span>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
                    <span>Case 2 Indicator</span>
                    <span>Greenish-yellow plume</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-500 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700">Chlorine</span>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Final Insight</div>
                  <p className="mt-2 text-sm text-slate-700">
                    Saving both case results preserves the entire dry test narrative so you can compare residues, odors, and gas evolution in reported conclusions.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/70 bg-white/90 p-5 text-sm text-slate-900 shadow-xl backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Observation Highlights</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-900">
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-2 w-2 rounded-full bg-pink-500" />Residues on the loop indicated chloride ions even before the oxidizing reagent was introduced.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-2 w-2 rounded-full bg-lime-500" />MnO₂ accelerated chloride oxidation under the bunsen flame, releasing pungent greenish chlorine gas.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-2 w-2 rounded-full bg-sky-500" />Both cases now display a complete qualitative analysis for the acid radical dry test.
                  </li>
                </ul>
              </div>
            </div>

            <DialogFooter className="px-6 pb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReturnToExperiments}
                    className="bg-white text-slate-800 border border-slate-200 shadow-sm hover:bg-slate-50"
                  >
                    Return to Experiments
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLaunchQuiz}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 hover:opacity-90"
                  >
                    QUIZ
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCase2ResultsModal(false)}>
                  Close Analysis
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}

export default ChemicalEquilibriumVirtualLab;
