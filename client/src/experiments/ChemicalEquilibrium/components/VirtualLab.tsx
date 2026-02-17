import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FlaskConical, Atom, BookOpen, List, Play, Pause, TestTube, Droplet, Beaker } from "lucide-react";
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
import { Link, useLocation } from "wouter";

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
  activeHalide?: string;
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
  caseThreeResult: string;
  caseFourResult: string;
  caseFiveResult: string;
  caseSixResult: string;
  caseSevenResult: string;
  sodiumNitroprussideAdded: boolean;
  magnesiaAdded: boolean;
  caClAdded: boolean;
  dilH2SO4HeatingTriggered: boolean;
  feCl3Added: boolean;
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

type SaltAnalysisQuizItem = {
  id: string;
  label: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctOption: string;
  answer: string;
};

const SALT_ANALYSIS_ACID_RADICALS_QUIZ: SaltAnalysisQuizItem[] = [
  {
    id: "q1",
    label: "Question 1",
    prompt:
      "When a solid chloride salt is warmed with concentrated sulphuric acid in a dry test tube, which gas is evolved?",
    options: [
      { key: "a", text: "Sulphur dioxide" },
      { key: "b", text: "Hydrogen chloride" },
      { key: "c", text: "Chlorine" },
      { key: "d", text: "Oxygen" },
    ],
    correctOption: "b",
    answer: "Answer: b) Hydrogen chloride",
  },
  {
    id: "q2",
    label: "Question 2",
    prompt:
      "The dense white fumes formed when a glass rod dipped in ammonium hydroxide is brought near the mouth of a test tube containing HCl gas are due to:",
    options: [
      { key: "a", text: "Ammonium chloride" },
      { key: "b", text: "Ammonium sulphate" },
      { key: "c", text: "Ammonium nitrate" },
      { key: "d", text: "Ammonium carbonate" },
    ],
    correctOption: "a",
    answer: "Answer: a) Ammonium chloride",
  },
  {
    id: "q3",
    label: "Question 3",
    prompt:
      "A mixture of a solid chloride salt, manganese dioxide and conc. sulphuric acid is heated in a dry test tube. A greenish-yellow gas is evolved which bleaches moist litmus paper. This confirms the presence of:",
    options: [
      { key: "a", text: "Bromide ion" },
      { key: "b", text: "Iodide ion" },
      { key: "c", text: "Chloride ion" },
      { key: "d", text: "Nitrate ion" },
    ],
    correctOption: "c",
    answer: "Answer: c) Chloride ion",
  },
  {
    id: "q4",
    label: "Question 4",
    prompt:
      "In the chromyl chloride test, a chloride salt is heated with potassium dichromate and conc. sulphuric acid. The initial characteristic observation in the test tube is:",
    options: [
      { key: "a", text: "Colourless pungent gas" },
      { key: "b", text: "Reddish-brown vapours" },
      { key: "c", text: "Violet vapours" },
      { key: "d", text: "Brown ring at liquid–gas interface" },
    ],
    correctOption: "b",
    answer: "Answer: b) Reddish-brown vapours",
  },
  {
    id: "q5",
    label: "Question 5",
    prompt:
      "Which sequence correctly describes the confirmatory steps after obtaining red vapours in the chromyl chloride test for chloride?",
    options: [
      { key: "a", text: "Absorb vapours in water → add BaCl₂ → white ppt." },
      {
        key: "b",
        text: "Absorb vapours in NaOH → yellow solution → add lead acetate + acetic acid → yellow ppt.",
      },
      { key: "c", text: "Pass vapours into lime water → milky solution." },
      { key: "d", text: "Pass vapours into NH₃ → dense white fumes." },
    ],
    correctOption: "b",
    answer:
      "Answer: b) Absorb vapours in NaOH → yellow solution → add lead acetate + acetic acid → yellow ppt.",
  },
];

const SALT_ANALYSIS_WET_ACID_RADICALS_QUIZ: SaltAnalysisQuizItem[] = [
  {
    id: "wet_q1",
    label: "Question 1",
    prompt:
      "A pinch of salt is treated with dilute H₂SO₄ in a test tube. Colourless, odourless gas evolves which turns lime water milky. This confirms:",
    options: [
      { key: "a", text: "Sulphite" },
      { key: "b", text: "Sulphide" },
      { key: "c", text: "Carbonate" },
      { key: "d", text: "Nitrite" },
    ],
    correctOption: "c",
    answer: "Answer: c) Carbonate",
  },
  {
    id: "wet_q2",
    label: "Question 2",
    prompt:
      "Sodium carbonate extract of a salt + acetic acid produces a black ppt. with lead acetate. This indicates:",
    options: [
      { key: "a", text: "Chloride" },
      { key: "b", text: "Sulphide" },
      { key: "c", text: "Sulphate" },
      { key: "d", text: "Phosphate" },
    ],
    correctOption: "b",
    answer: "Answer: b) Sulphide",
  },
  {
    id: "wet_q3",
    label: "Question 3",
    prompt:
      "To the original solution of a salt, dilute H₂SO₄ is added, followed by freshly prepared ferrous sulphate. Conc. H₂SO₄ added along the sides forms a brown ring. This confirms:",
    options: [
      { key: "a", text: "Nitrite" },
      { key: "b", text: "Nitrate" },
      { key: "c", text: "Carbonate" },
      { key: "d", text: "Acetate" },
    ],
    correctOption: "b",
    answer: "Answer: b) Nitrate",
  },
  {
    id: "wet_q4",
    label: "Question 4",
    prompt:
      "A salt solution + dilute H₂SO₄ gives no gas evolution. On adding barium chloride, a white ppt. insoluble in dil. HCl forms. This confirms:",
    options: [
      { key: "a", text: "Sulphate" },
      { key: "b", text: "Carbonate" },
      { key: "c", text: "Sulphite" },
      { key: "d", text: "Phosphate" },
    ],
    correctOption: "a",
    answer: "Answer: a) Sulphate",
  },
  {
    id: "wet_q5",
    label: "Question 5",
    prompt:
      "Sodium carbonate extract + dil. HNO₃ + ammonium molybdate gives a yellow ppt. This indicates the presence of:",
    options: [
      { key: "a", text: "Phosphate" },
      { key: "b", text: "Arsenate" },
      { key: "c", text: "Borate" },
      { key: "d", text: "Silicate" },
    ],
    correctOption: "a",
    answer: "Answer: a) Phosphate",
  },
  {
    id: "wet_q6",
    label: "Question 6",
    prompt:
      "Original solution of salt + AgNO₃ gives a white ppt. soluble in dil. NH₄OH but insoluble in dil. HNO₃. This confirms:",
    options: [
      { key: "a", text: "Chloride" },
      { key: "b", text: "Bromide" },
      { key: "c", text: "Iodide" },
      { key: "d", text: "Sulphate" },
    ],
    correctOption: "a",
    answer: "Answer: a) Chloride",
  },
  {
    id: "wet_q7",
    label: "Question 7",
    prompt:
      "A solution of salt in dil. H₂SO₄ + KI + starch gives deep blue colour. This indicates:",
    options: [
      { key: "a", text: "Nitrate" },
      { key: "b", text: "Nitrite" },
      { key: "c", text: "Carbonate" },
      { key: "d", text: "Sulphite" },
    ],
    correctOption: "b",
    answer: "Answer: b) Nitrite",
  },
  {
    id: "wet_q8",
    label: "Question 8",
    prompt:
      "Chromyl chloride test: Vapours from salt + K₂Cr₂O₇ + conc. H₂SO₄ absorbed in NaOH give yellow solution. Addition of lead acetate + acetic acid gives:",
    options: [
      { key: "a", text: "White ppt." },
      { key: "b", text: "Yellow ppt." },
      { key: "c", text: "Black ppt." },
      { key: "d", text: "Red ppt." },
    ],
    correctOption: "b",
    answer: "Answer: b) Yellow ppt.",
  },
];

const SALT_ANALYSIS_BASIC_RADICALS_QUIZ: SaltAnalysisQuizItem[] = [
  {
    id: "q1_basic",
    label: "Question 1",
    prompt:
      "A salt is heated strongly in a dry test tube, and ammonia gas is evolved without any sublimate. This indicates the presence of:",
    options: [
      { key: "a", text: "Ammonium carbonate" },
      { key: "b", text: "Ammonium chloride" },
      { key: "c", text: "Ammonium sulphate" },
      { key: "d", text: "Ammonium nitrate" },
    ],
    correctOption: "a",
    answer: "Answer: a) Ammonium carbonate",
  },
  {
    id: "q2_basic",
    label: "Question 2",
    prompt:
      "In the flame test, a small amount of salt moistened with conc. HCl gives a golden yellow colour through cobalt blue glass. This confirms:",
    options: [
      { key: "a", text: "Sodium ion" },
      { key: "b", text: "Potassium ion" },
      { key: "c", text: "Barium ion" },
      { key: "d", text: "Calcium ion" },
    ],
    correctOption: "a",
    answer: "Answer: a) Sodium ion",
  },
  {
    id: "q3_basic",
    label: "Question 3",
    prompt:
      "In the charcoal cavity test, a mixture of salt + Na₂CO₃ heated in reducing flame leaves a white infusible mass. This indicates:",
    options: [
      { key: "a", text: "Copper ion" },
      { key: "b", text: "Zinc ion" },
      { key: "c", text: "Lead ion" },
      { key: "d", text: "Iron ion" },
    ],
    correctOption: "b",
    answer: "Answer: b) Zinc ion",
  },
  {
    id: "q4_basic",
    label: "Question 4",
    prompt:
      "The white infusible mass from charcoal cavity test turns pink when moistened with cobalt nitrate solution and heated. This confirms:",
    options: [
      { key: "a", text: "Aluminium ion" },
      { key: "b", text: "Magnesium ion" },
      { key: "c", text: "Zinc ion" },
      { key: "d", text: "Calcium ion" },
    ],
    correctOption: "b",
    answer: "Answer: b) Magnesium ion",
  },
  {
    id: "q5_basic",
    label: "Question 5",
    prompt:
      "In the borax bead test, the bead is blue when hot and green when cold in oxidising flame. This indicates the presence of:",
    options: [
      { key: "a", text: "Iron" },
      { key: "b", text: "Copper" },
      { key: "c", text: "Chromium" },
      { key: "d", text: "Manganese" },
    ],
    correctOption: "b",
    answer: "Answer: b) Copper",
  },
];

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

const BA_CL_CHEMICAL_ID = "bacl2_solution";
const BA_CL_CHEMICAL_NAME = "BaCl₂ Solution";
const BA_CL_CHEMICAL_COLOR = "#38bdf8";
const BA_CL_DROP_VOLUME_ML = 0.25;
const MAGNESIA_CHEMICAL_ID = "magnesia_mixture";
const MAGNESIA_CHEMICAL_NAME = "Magnesia mixture (PO₄³⁻)";
const MAGNESIA_CHEMICAL_COLOR = "#7dd3fc";
const MAGNESIA_DROP_VOLUME_ML = 0.2;
const CA_CL_CHEMICAL_ID = "cacl2_solution";
const CA_CL_CHEMICAL_NAME = "CaCl₂ Solution";
const CA_CL_CHEMICAL_COLOR = "#c4f1f9";
const CA_CL_DROP_VOLUME_ML = 0.25;
const K2CR2O7_DROP_VOLUME_ML = 0.25;
const K2CR2O7_CHEMICAL_ID = "k2cr2o7_solution";
const K2CR2O7_CHEMICAL_NAME = "Acidified Potassium Dichromate Solution (K₂Cr₂O₇)";
const K2CR2O7_CHEMICAL_COLOR = "#fb923c";
const FE_CL3_DROP_VOLUME_ML = 0.25;
const FE_CL3_CHEMICAL_ID = "fecl3_solution";
const FE_CL3_CHEMICAL_NAME = "FeCl₃ Solution";
const FE_CL3_CHEMICAL_COLOR = "#ef4444";

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
  activeHalide,
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
  const CASE_ONE_WET_NO_PRECIPITATE_RESULT =
    "No precipitate appears, so sulphate, sulphite, carbonate and sulphide ions are absent.";
  const CASE_TWO_WET_NO_PURPLE_RESULT =
    "Normally a violet/purple colour indicates sulphide; in your table no purple colour forms, so S²⁻ is absent.";
  const CASE_THREE_WET_NO_GREEN_RESULT =
    "a green colour would indicate sulphite, but the table shows no green colour, so SO₃²⁻ is absent.";
  const CASE_THREE_WET_MAGNESIA_RESULT =
    "A white precipitate would show PO₄³⁻; the table reports no precipitate, so phosphate is absent";
  const CASE_FOUR_WET_CACL_RESULT =
    "A white precipitate would indicate oxalate; the table shows no precipitate, so C₂O₄²⁻ is absent.";
  const CASE_FIVE_WET_NO_BROWN_RESULT =
    "A brown colour of NO gas or complex would indicate nitrite; observation says no brown colour, so NO₂⁻ is absent.";
  const CASE_FIVE_WET_ACETATE_RESULT =
    "A red or reddish-brown colour would indicate acetate due to ferric acetate; according to your table no red colour appears, so CH₃COO⁻ is absent.";
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
  const [mno2AddedDuringHeating, setMno2AddedDuringHeating] = useState(false);
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
  const [caseThreeResult, setCaseThreeResult] = useState(DEFAULT_CASE_RESULT);
  const [caseFourResult, setCaseFourResult] = useState(DEFAULT_CASE_RESULT);
  const [caseFiveResult, setCaseFiveResult] = useState(DEFAULT_CASE_RESULT);
  const [caseSixResult, setCaseSixResult] = useState(DEFAULT_CASE_RESULT);
  const [caseSevenResult, setCaseSevenResult] = useState(DEFAULT_CASE_RESULT);
  const [sodiumNitroprussideAdded, setSodiumNitroprussideAdded] = useState(false);
  const [magnesiaAdded, setMagnesiaAdded] = useState(false);
  const [caClAdded, setCaClAdded] = useState(false);
  const [dilH2SO4HeatingTriggered, setDilH2SO4HeatingTriggered] = useState(false);
  const [feCl3Added, setFeCl3Added] = useState(false);
  const [baClUsed, setBaClUsed] = useState(false);
  const [sodiumNitroprussideUsed, setSodiumNitroprussideUsed] = useState(false);
  const [nh4ohUsed, setNh4ohUsed] = useState(false);
  const [magnesiaUsed, setMagnesiaUsed] = useState(false);
  const [caClUsed, setCaClUsed] = useState(false);
  const [feCl3Used, setFeCl3Used] = useState(false);
  const [showCase2ResultsModal, setShowCase2ResultsModal] = useState(false);
  const [hasAutoOpenedResults, setHasAutoOpenedResults] = useState(false);
  const MNO2_CASE_TWO_RESULT =
    "CASE 2: Evolution of chlorine gas supports the presence of chloride ion in the salt.";
  const [workbenchResetTrigger, setWorkbenchResetTrigger] = useState(0);
  const workbenchResetTriggerRef = useRef(workbenchResetTrigger);
  const rinseTimerRef = useRef<number | null>(null);

  // Choose chemicals and equipment based on experiment
  const isPHExperiment = experimentTitle === PHHClExperiment.title;
  const isDryTestExperiment = experimentTitle === ChemicalEquilibriumData.title;
  const isSaltAnalysisExperiment = experiment.id === ChemicalEquilibriumData.id;
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
  const resolvedDryTestMode = dryTestMode ?? "acid";
  const testTubeState = equipmentPositions.find((pos) => pos.id === "test_tubes");
  const mnO2Chemical = testTubeState?.chemicals.find((chemical) => chemical.id === "mno2");
  const hasMnO2InTestTube = (mnO2Chemical?.amount ?? 0) > 0;
  const baClChemical = testTubeState?.chemicals.find((chemical) => chemical.id === BA_CL_CHEMICAL_ID);
  const baClAmountInTestTube = baClChemical?.amount ?? 0;
  const isBaClAddedToTestTube = baClAmountInTestTube > 0;
  const ammoniumAmountInTestTube = testTubeState
    ? testTubeState.chemicals
        .filter((chemical) => chemical.id === "nh4oh")
        .reduce((sum, chemical) => sum + (chemical.amount || 0), 0)
    : 0;
  const hasAmmoniumInTestTube = ammoniumAmountInTestTube > 0;
  const shouldBlinkObserveButtonForBaCl =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    isBaClAddedToTestTube &&
    caseOneResult === DEFAULT_CASE_RESULT;
  const shouldBlinkObserveButtonForSodiumNitroprusside =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    sodiumNitroprussideAdded &&
    caseTwoResult === DEFAULT_CASE_RESULT;
  const shouldBlinkObserveButtonForMagnesia =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    magnesiaAdded;
  const shouldBlinkObserveButtonForCaCl =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    caClAdded &&
    caseFourResult === DEFAULT_CASE_RESULT;
  const shouldBlinkObserveButtonForDilH2SO4Heat =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    dilH2SO4HeatingTriggered;
  const shouldBlinkObserveButtonForFeCl3 =
    isDryTestExperiment &&
    resolvedDryTestMode === "wet" &&
    feCl3Added &&
    caseFiveResult === DEFAULT_CASE_RESULT;
  const shouldBlinkObserveButton =
    shouldBlinkObserveButtonForBaCl ||
    shouldBlinkObserveButtonForSodiumNitroprusside ||
    shouldBlinkObserveButtonForMagnesia ||
    shouldBlinkObserveButtonForCaCl ||
    shouldBlinkObserveButtonForDilH2SO4Heat ||
    shouldBlinkObserveButtonForFeCl3;
  const isWetAcidTestMode = isDryTestExperiment && resolvedDryTestMode === "wet";
  const hasBaClBeenUsed = isWetAcidTestMode && baClUsed;
  const hasSodiumNitroprussideBeenUsed = isWetAcidTestMode && sodiumNitroprussideUsed;
  const hasNH4OHBeenUsed = isWetAcidTestMode && (nh4ohUsed || hasAmmoniumInTestTube);
  const hasMagnesiaBeenUsed = isWetAcidTestMode && magnesiaUsed;
  const hasCaClBeenUsed = isWetAcidTestMode && caClUsed;
  const hasFeCl3BeenUsed = isWetAcidTestMode && feCl3Used;
  const dryTestInstructionMap: Record<DryTestMode, string> = {
    acid:
      "Use the acid radical reagents (salt sample, concentrated H₂SO₄, MnO₂, K₂Cr₂O₇, NaOH solution, acetic acid, acetate solution) with a clean loop to compare color, smell, and residues after heating.",
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

  useEffect(() => {
    if (!isSaltAnalysisExperiment) {
      return;
    }

    if (!resultsReady) {
      if (hasAutoOpenedResults) {
        setHasAutoOpenedResults(false);
      }
      return;
    }

    if (!showCase2ResultsModal && !hasAutoOpenedResults) {
      setShowCase2ResultsModal(true);
      setHasAutoOpenedResults(true);
    }
  }, [
    hasAutoOpenedResults,
    isSaltAnalysisExperiment,
    resultsReady,
    showCase2ResultsModal,
  ]);
  const caseSummaryEntries = [
    {
      label: "CASE 1",
      result: caseOneResult,
      indicator: "Residue",
      borderClass: "border-rose-200",
      bgClass: "from-white via-rose-50 to-rose-100",
      titleColorClass: "text-rose-400",
      resultTextClass: "text-rose-900",
      indicatorColorClass: "text-rose-500",
    },
    {
      label: "CASE 2",
      result: caseTwoResult,
      indicator: "Gas evolution",
      borderClass: "border-amber-200",
      bgClass: "from-white via-amber-50 to-orange-100",
      titleColorClass: "text-amber-500",
      resultTextClass: "text-orange-900",
      indicatorColorClass: "text-orange-500",
    },
    {
      label: "CASE 3",
      result: caseThreeResult,
      indicator: "Phosphate",
      borderClass: "border-emerald-200",
      bgClass: "from-white via-emerald-50 to-emerald-100",
      titleColorClass: "text-emerald-500",
      resultTextClass: "text-emerald-900",
      indicatorColorClass: "text-emerald-500",
    },
    {
      label: "CASE 4",
      result: caseFourResult,
      indicator: "Oxalate",
      borderClass: "border-cyan-200",
      bgClass: "from-white via-cyan-50 to-sky-100",
      titleColorClass: "text-cyan-500",
      resultTextClass: "text-cyan-900",
      indicatorColorClass: "text-sky-500",
    },
    {
      label: "CASE 5",
      result: caseFiveResult,
      indicator: "Acetate",
      borderClass: "border-purple-200",
      bgClass: "from-white via-purple-50 to-indigo-100",
      titleColorClass: "text-purple-500",
      resultTextClass: "text-purple-900",
      indicatorColorClass: "text-indigo-500",
    },
  ];
  const detailedInsights = [
    {
      title: "Initial chloride clues",
      hint: "Case 1",
      description: caseOneResult,
    },
    {
      title: "Chlorine confirmation",
      hint: "Case 2",
      description: caseTwoResult,
    },
    {
      title: "Phosphate check",
      hint: "Case 3",
      description: caseThreeResult,
    },
    {
      title: "Oxalate check",
      hint: "Case 4",
      description: caseFourResult,
    },
    {
      title: "Acetate check",
      hint: "Case 5",
      description: caseFiveResult,
    },
  ];
  const observationHighlights = [
    `Case 1 & 2 confirm chloride radicals: ${caseOneResult} ${caseTwoResult}`,
    `Case 3 signals phosphate absence: ${caseThreeResult}`,
    `Case 4 confirms oxalate is absent: ${caseFourResult}`,
    `Case 5 dismisses acetate radicals: ${caseFiveResult}`,
  ];
  const analysisGuidance = [
    {
      label: "Wet test focus",
      description:
        "Drop-in reagents highlight which acid radicals remain absent even after the dry sequence.",
      accent: "from-fuchsia-50 to-purple-50",
      textColor: "text-fuchsia-600",
    },
    {
      label: "Next steps",
      description:
        "Record Cases 3–5 while observing color shifts or precipitates to finish the acid radical map.",
      accent: "from-emerald-50 to-sky-50",
      textColor: "text-sky-600",
    },
    {
      label: "Confidence",
      description: "Chloride residue and chlorine gas confirm the identity before reporting conclusions.",
      accent: "from-amber-50 to-amber-100",
      textColor: "text-amber-600",
    },
  ];
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

  const DILUTE_HNO3_CHEMICAL_ID = "dil_hno3";
  const DILUTE_HNO3_LABEL = "Dil. HNO₃";
  const DILUTE_HNO3_COLOR = "#0ea5e9";
  const DILUTE_HNO3_VOLUME_INCREMENT = 4;
  const DILUTE_H2SO4_CHEMICAL_ID = "dil_h2so4";
  const DILUTE_H2SO4_LABEL = "Dil. H₂SO₄";
  const DILUTE_H2SO4_COLOR = "#fb7185";
  const DILUTE_H2SO4_VOLUME_INCREMENT = 4;

  const GLASS_CONTAINER_HCL_DEFAULT_VOLUME = 4;
  const MIN_GLASS_HCL_VOLUME = 1;
  const MAX_GLASS_HCL_VOLUME = 6;
  const GLASS_CONTAINER_HCL_VOLUME_LABEL = "1 - 6 mL";
  const MIN_AMMONIUM_VOLUME = 5;
  const MAX_AMMONIUM_VOLUME = 10;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addDialogEquipment, setAddDialogEquipment] = useState<{ id: string; name: string } | null>(null);
  const [addDialogAmount, setAddDialogAmount] = useState("3.0");
  const [addDialogError, setAddDialogError] = useState<string | null>(null);
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
  const [showSaltAnalysisQuizModal, setShowSaltAnalysisQuizModal] = useState(false);
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const handleSaltQuizSelect = (questionId: string, optionKey: string) => {
    if (quizSubmitted) return;
    setQuizSelections((prev) => ({ ...prev, [questionId]: optionKey }));
  };
  const resetSaltQuiz = () => {
    setQuizSelections({});
    setQuizSubmitted(false);
  };
  const activeSaltQuizItems = useMemo(() => {
    if (resolvedDryTestMode === "basic") {
      return SALT_ANALYSIS_BASIC_RADICALS_QUIZ;
    }
    if (resolvedDryTestMode === "wet") {
      return SALT_ANALYSIS_WET_ACID_RADICALS_QUIZ;
    }
    return SALT_ANALYSIS_ACID_RADICALS_QUIZ;
  }, [resolvedDryTestMode]);
  const saltQuizHeaderTitle =
    resolvedDryTestMode === "basic"
      ? "Dry Test for Basic Radicals — Quiz"
      : resolvedDryTestMode === "wet"
        ? "Wet Test for Acid Radicals — Quiz"
        : "Dry Test for Acid Radicals — Quiz";
  const saltQuizDescription =
    resolvedDryTestMode === "basic"
      ? "Recap the characteristic fumes, colors, and residues that identify basic radicals in the dry test. Select one option per question and submit to reveal the answers."
      : resolvedDryTestMode === "wet"
        ? "Review the wet test observations and confirmation steps for acid radicals before submitting the answers."
        : "Step through the quiz that reinforces the dry-test observations for acid radicals.";

  useEffect(() => {
    setQuizSelections({});
    setQuizSubmitted(false);
  }, [activeSaltQuizItems]);
  const allSaltQuizAnswered = useMemo(
    () => activeSaltQuizItems.every((item) => Boolean(quizSelections[item.id])),
    [activeSaltQuizItems, quizSelections],
  );
  const saltQuizScore = useMemo(
    () =>
      activeSaltQuizItems.reduce(
        (total, item) => (quizSelections[item.id] === item.correctOption ? total + 1 : total),
        0,
      ),
    [activeSaltQuizItems, quizSelections],
  );
  const handleSaltQuizSubmit = () => {
    if (!allSaltQuizAnswered) return;
    setQuizSubmitted(true);
  };
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [isWorkbenchHeating, setIsWorkbenchHeating] = useState(false);
  const saltHeatingIntervalRef = useRef<number | null>(null);
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
      resolvedDryTestMode !== "basic"
    ) {
      return;
    }

    if (currentStep !== 8) {
      if (basicSecondBunsenTracked) {
        setBasicSecondBunsenTracked(false);
      }
      return;
    }

    const hasBunsen = equipmentPositions.some((pos) =>
      pos.id.includes("bunsen-burner-virtual-heat-source"),
    );

    if (hasBunsen && !basicSecondBunsenTracked) {
      setBasicSecondBunsenTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Bunsen burner placed. Moving to Step 9.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!hasBunsen && basicSecondBunsenTracked) {
      setBasicSecondBunsenTracked(false);
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    basicSecondBunsenTracked,
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
    if (
      !experimentStarted ||
      !isDryTestExperiment ||
      resolvedDryTestMode !== "basic"
    ) {
      return;
    }

    if (currentStep !== 9) {
      if (basicGlassSetupTracked) {
        setBasicGlassSetupTracked(false);
      }
      return;
    }

    const hasGlassRod = equipmentPositions.some((pos) =>
      stripEquipmentIdSuffix(pos.id) === "glass-rod",
    );
    const hasGlassContainer = equipmentPositions.some((pos) =>
      stripEquipmentIdSuffix(pos.id) === "glass-container",
    );

    if (
      hasGlassRod &&
      hasGlassContainer &&
      !basicGlassSetupTracked
    ) {
      setBasicGlassSetupTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setToastMessage("Glass rod and container placed. Moving to Step 10.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!(hasGlassRod && hasGlassContainer) && basicGlassSetupTracked) {
      setBasicGlassSetupTracked(false);
    }
  }, [
    equipmentPositions,
    experimentStarted,
    isDryTestExperiment,
    resolvedDryTestMode,
    basicGlassSetupTracked,
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
    setMno2AddedDuringHeating(false);
    setBasicSecondTubeTracked(false);
    setBasicSaltAddedTracked(false);
    setBasicNaOHAddedTracked(false);
    setBasicSecondBunsenTracked(false);
    setBasicGlassSetupTracked(false);
    setBasicGlassAcidAddedTracked(false);
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
    caseThreeResult,
    caseFourResult,
    caseFiveResult,
    caseSixResult,
    caseSevenResult,
    sodiumNitroprussideAdded,
    magnesiaAdded,
    caClAdded,
    dilH2SO4HeatingTriggered,
    feCl3Added,
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

  const handleEquipmentAddButton = useCallback(
    (equipmentId: string) => {
      const workbenchRect =
        typeof document !== "undefined"
          ? document
              .querySelector('[data-workbench="true"]')
              ?.getBoundingClientRect() ?? null
          : null;
      const targetX = workbenchRect
        ? workbenchRect.left + workbenchRect.width / 2
        : 200;
      const targetY = workbenchRect
        ? workbenchRect.top + workbenchRect.height / 2
        : 200;
      handleEquipmentDrop(equipmentId, targetX, targetY);
    },
    [handleEquipmentDrop],
  );

  const handleAddButtonClick = useCallback(
    (equipment: EquipmentDefinition, quickAdd?: () => void) => {
      // If a quickAdd is provided, prefer that behavior
      if (quickAdd) {
        quickAdd();
        return;
      }

      // Special-case: when performing Dry Tests for Acid Radicals in the Bromide Check,
      // clicking ADD on the Test Tubes or the Bunsen burner should immediately place the
      // equipment on the workbench without opening the amount dialog. This applies only to
      // these two pieces of equipment and no others.
      const isTestTubeId = equipment.id === "test_tubes";
      const isBunsenId = equipment.id === "bunsen-burner-virtual-heat-source" || equipment.name.toLowerCase().includes("bunsen");
      const isBromideDryAcid = isDryTestExperiment && (dryTestMode === "acid") && (activeHalide ?? "").toLowerCase() === "br";
      if ((isTestTubeId || isBunsenId) && isBromideDryAcid) {
        handleEquipmentAddButton(equipment.id);
        return;
      }

      setAddDialogEquipment({ id: equipment.id, name: equipment.name });
      setAddDialogAmount("3.0");
      setAddDialogError(null);
    },
    [handleEquipmentAddButton, isDryTestExperiment, dryTestMode, activeHalide],
  );

  const handleEquipmentAddDialogClose = useCallback(() => {
    setAddDialogEquipment(null);
    setAddDialogAmount("3.0");
    setAddDialogError(null);
  }, []);

  const handleEquipmentAddDialogConfirm = useCallback(() => {
    if (!addDialogEquipment) return;

    const parsedAmount = parseFloat(addDialogAmount);
    const requiresDropValidation =
      isDryTestExperiment && resolvedDryTestMode === "wet";

    if (requiresDropValidation) {
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setAddDialogError("Enter a valid number of drops between 3 and 6.");
        return;
      }
      if (parsedAmount < 3 || parsedAmount > 6) {
        setAddDialogError("Enter a value between 3 and 6 drops.");
        return;
      }
    }

    const lowerName = addDialogEquipment.name.toLowerCase();
    const isBaClAddition = lowerName.includes("bacl");
    const isSodiumNitroprussideAddition = lowerName.includes("nitroprusside");
    const isDichromateAddition = lowerName.includes("dichromate");
    const isMagnesiaAddition = lowerName.includes("magnesia");
    const isCaClAddition = lowerName.includes("cacl");
    const isFeCl3Addition = lowerName.includes("fecl");

    if (requiresDropValidation && isBaClAddition) {
      const dropVolume = parsedAmount * BA_CL_DROP_VOLUME_ML;
      if (dropVolume > 0) {
        setEquipmentPositions((prev) => {
          let updated = false;
          const next = prev.map((pos) => {
            if (pos.id !== "test_tubes") {
              return pos;
            }

            const hasSaltSample = pos.chemicals.some(
              (chemical) =>
                chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
            );
            if (!hasSaltSample) {
              return pos;
            }

            updated = true;
            const existing = pos.chemicals.find(
              (chemical) => chemical.id === BA_CL_CHEMICAL_ID,
            );
            const updatedChemicals = existing
              ? pos.chemicals.map((chemical) =>
                  chemical.id === BA_CL_CHEMICAL_ID
                    ? {
                        ...chemical,
                        amount: (chemical.amount ?? 0) + dropVolume,
                      }
                    : chemical,
                )
              : [
                  ...pos.chemicals,
                  {
                    id: BA_CL_CHEMICAL_ID,
                    name: BA_CL_CHEMICAL_NAME,
                    color: BA_CL_CHEMICAL_COLOR,
                    amount: dropVolume,
                    concentration: "0.1 M",
                  },
                ];

            return { ...pos, chemicals: updatedChemicals };
          });
          if (updated) {
            setBaClUsed(true);
            return next;
          }
          return prev;
        });
      }
    }

    if (requiresDropValidation && isDichromateAddition) {
      const dropVolume = parsedAmount * K2CR2O7_DROP_VOLUME_ML;
      if (dropVolume > 0) {
        setEquipmentPositions((prev) => {
          let updated = false;
          const next = prev.map((pos) => {
            if (pos.id !== "test_tubes") {
              return pos;
            }

            const hasSaltSample = pos.chemicals.some(
              (chemical) =>
                chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
            );
            if (!hasSaltSample) {
              return pos;
            }

            updated = true;
            const existing = pos.chemicals.find(
              (chemical) => chemical.id === K2CR2O7_CHEMICAL_ID,
            );
            const updatedChemicals = existing
              ? pos.chemicals.map((chemical) =>
                  chemical.id === K2CR2O7_CHEMICAL_ID
                    ? {
                        ...chemical,
                        amount: (chemical.amount ?? 0) + dropVolume,
                      }
                    : chemical,
                )
              : [
                  ...pos.chemicals,
                  {
                    id: K2CR2O7_CHEMICAL_ID,
                    name: K2CR2O7_CHEMICAL_NAME,
                    color: K2CR2O7_CHEMICAL_COLOR,
                    amount: dropVolume,
                    concentration: "Reagent",
                  },
                ];

            return { ...pos, chemicals: updatedChemicals };
          });
          return updated ? next : prev;
        });
      }
    }

    if (requiresDropValidation && isMagnesiaAddition) {
      const dropVolume = parsedAmount * MAGNESIA_DROP_VOLUME_ML;
      if (dropVolume > 0) {
        setEquipmentPositions((prev) => {
          let updated = false;
          const next = prev.map((pos) => {
            if (pos.id !== "test_tubes") {
              return pos;
            }

            const hasSaltSample = pos.chemicals.some(
              (chemical) =>
                chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
            );
            if (!hasSaltSample) {
              return pos;
            }

            updated = true;
            const existing = pos.chemicals.find(
              (chemical) => chemical.id === MAGNESIA_CHEMICAL_ID,
            );
            const updatedChemicals = existing
              ? pos.chemicals.map((chemical) =>
                  chemical.id === MAGNESIA_CHEMICAL_ID
                    ? {
                        ...chemical,
                        amount: (chemical.amount ?? 0) + dropVolume,
                      }
                    : chemical,
                )
              : [
                  ...pos.chemicals,
                  {
                    id: MAGNESIA_CHEMICAL_ID,
                    name: MAGNESIA_CHEMICAL_NAME,
                    color: MAGNESIA_CHEMICAL_COLOR,
                    amount: dropVolume,
                    concentration: "Reagent",
                  },
                ];

            return { ...pos, chemicals: updatedChemicals };
          });
          if (updated) {
            setMagnesiaUsed(true);
          }
          return updated ? next : prev;
        });
        setMagnesiaAdded(true);
      }
    }

    if (requiresDropValidation && isCaClAddition) {
      const dropVolume = parsedAmount * CA_CL_DROP_VOLUME_ML;
      if (dropVolume > 0) {
        setEquipmentPositions((prev) => {
          let updated = false;
          const next = prev.map((pos) => {
            if (pos.id !== "test_tubes") {
              return pos;
            }

            const hasSaltSample = pos.chemicals.some(
              (chemical) =>
                chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
            );
            if (!hasSaltSample) {
              return pos;
            }

            updated = true;
            const existing = pos.chemicals.find(
              (chemical) => chemical.id === CA_CL_CHEMICAL_ID,
            );
            const updatedChemicals = existing
              ? pos.chemicals.map((chemical) =>
                  chemical.id === CA_CL_CHEMICAL_ID
                    ? {
                        ...chemical,
                        amount: (chemical.amount ?? 0) + dropVolume,
                      }
                    : chemical,
                )
              : [
                  ...pos.chemicals,
                  {
                    id: CA_CL_CHEMICAL_ID,
                    name: CA_CL_CHEMICAL_NAME,
                    color: CA_CL_CHEMICAL_COLOR,
                    amount: dropVolume,
                    concentration: "Reagent",
                  },
                ];

            return { ...pos, chemicals: updatedChemicals };
          });
          if (updated) {
            setCaClUsed(true);
          }
          return updated ? next : prev;
        });
        setCaClAdded(true);
      }
    }

    if (requiresDropValidation && isFeCl3Addition) {
      const dropVolume = parsedAmount * FE_CL3_DROP_VOLUME_ML;
      if (dropVolume > 0) {
        let addedFeCl3 = false;
        setEquipmentPositions((prev) => {
          let updated = false;
          const next = prev.map((pos) => {
            if (pos.id !== "test_tubes") {
              return pos;
            }

            const hasSaltSample = pos.chemicals.some(
              (chemical) =>
                chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
            );
            if (!hasSaltSample) {
              return pos;
            }

            updated = true;
            const existing = pos.chemicals.find(
              (chemical) => chemical.id === FE_CL3_CHEMICAL_ID,
            );
            const updatedChemicals = existing
              ? pos.chemicals.map((chemical) =>
                  chemical.id === FE_CL3_CHEMICAL_ID
                    ? {
                        ...chemical,
                        amount: (chemical.amount ?? 0) + dropVolume,
                      }
                    : chemical,
                )
              : [
                  ...pos.chemicals,
                  {
                    id: FE_CL3_CHEMICAL_ID,
                    name: FE_CL3_CHEMICAL_NAME,
                    color: FE_CL3_CHEMICAL_COLOR,
                    amount: dropVolume,
                    concentration: "0.1 M",
                  },
                ];

            return { ...pos, chemicals: updatedChemicals };
          });
          if (updated) {
            addedFeCl3 = true;
            if (!feCl3Used) {
              setFeCl3Used(true);
            }
            return next;
          }
          return prev;
        });
        if (addedFeCl3) {
          setFeCl3Added(true);
        }
      }
    }

    if (requiresDropValidation && isSodiumNitroprussideAddition) {
      setSodiumNitroprussideAdded(true);
      setSodiumNitroprussideUsed(true);
    }

    handleEquipmentAddButton(addDialogEquipment.id);
    setToastMessage(`Added ${addDialogAmount} of ${addDialogEquipment.name} to the workbench.`);
    setTimeout(() => setToastMessage(null), 2500);
    handleEquipmentAddDialogClose();
  }, [
    addDialogAmount,
    addDialogEquipment,
    handleEquipmentAddButton,
    handleEquipmentAddDialogClose,
    isDryTestExperiment,
    resolvedDryTestMode,
    setEquipmentPositions,
    setBaClUsed,
    setSodiumNitroprussideAdded,
    setSodiumNitroprussideUsed,
    setMagnesiaAdded,
    setMagnesiaUsed,
    setCaClAdded,
    setCaClUsed,
    setFeCl3Added,
    setFeCl3Used,
  ]);

  const handleEquipmentRemove = useCallback((id: string) => {
    pushHistorySnapshot();
    setEquipmentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setToastMessage("Equipment removed from workbench");
    setTimeout(() => setToastMessage(null), 2000);
  }, [pushHistorySnapshot]);

  const handleObserveWetTest = useCallback(() => {
    if (isBaClAddedToTestTube && caseOneResult === DEFAULT_CASE_RESULT) {
      setCaseOneResult(CASE_ONE_WET_NO_PRECIPITATE_RESULT);
    }
    if (sodiumNitroprussideAdded && caseTwoResult === DEFAULT_CASE_RESULT) {
      setCaseTwoResult(CASE_TWO_WET_NO_PURPLE_RESULT);
      setSodiumNitroprussideAdded(false);
    }
    if (magnesiaAdded) {
      setMagnesiaAdded(false);
    }
    const hasH2SO4InTestTube = testTubeState?.chemicals.some(
      (chemical) => chemical.id === ACID_CONFIG.h2so4.chemicalId,
    );
    if (magnesiaAdded) {
      setCaseThreeResult(CASE_THREE_WET_MAGNESIA_RESULT);
      setMagnesiaAdded(false);
    } else if (hasH2SO4InTestTube && caseThreeResult !== CASE_THREE_WET_NO_GREEN_RESULT) {
      setCaseThreeResult(CASE_THREE_WET_NO_GREEN_RESULT);
    }
    if (caClAdded && caseFourResult === DEFAULT_CASE_RESULT) {
      setCaseFourResult(CASE_FOUR_WET_CACL_RESULT);
      setCaClAdded(false);
    }
    if (feCl3Added && caseFiveResult === DEFAULT_CASE_RESULT) {
      setCaseFiveResult(CASE_FIVE_WET_ACETATE_RESULT);
      setFeCl3Added(false);
    }
    if (dilH2SO4HeatingTriggered && caseFiveResult === DEFAULT_CASE_RESULT) {
      setCaseFiveResult(CASE_FIVE_WET_NO_BROWN_RESULT);
    }
    setDilH2SO4HeatingTriggered(false);
    setToastMessage("Observation noted for the Wet Acid Test.");
    setTimeout(() => setToastMessage(null), 2500);
  }, [
    caseOneResult,
    caseTwoResult,
    caseThreeResult,
    caseFourResult,
    caseFiveResult,
    isBaClAddedToTestTube,
    sodiumNitroprussideAdded,
    magnesiaAdded,
    feCl3Added,
    caClAdded,
    dilH2SO4HeatingTriggered,
    setCaseOneResult,
    setCaseTwoResult,
    setCaseThreeResult,
    setCaseFourResult,
    setCaseFiveResult,
    setSodiumNitroprussideAdded,
    setMagnesiaAdded,
    setFeCl3Added,
    setCaClAdded,
    setDilH2SO4HeatingTriggered,
    setToastMessage,
    testTubeState,
  ]);

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

      if (heating && isDryTestExperiment && resolvedDryTestMode === "wet") {
        const hasDiluteH2SO4InTestTube = Boolean(
          testTubeState?.chemicals.some(
            (chemical) => chemical.id === DILUTE_H2SO4_CHEMICAL_ID,
          ),
        );
        if (hasDiluteH2SO4InTestTube) {
          setDilH2SO4HeatingTriggered(true);
        }
      }

      if (!heating) {
        setDilH2SO4HeatingTriggered(false);
      }
    },
    [experiment.id, resolvedDryTestMode, isDryTestExperiment, testTubeState],
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

    const shouldAdvanceAfterBasicGlassAcid =
      experimentStarted &&
      isDryTestExperiment &&
      resolvedDryTestMode === "basic" &&
      currentStep === 10 &&
      !basicGlassAcidAddedTracked;
    const acidToast = shouldAdvanceAfterBasicGlassAcid
      ? "Concentrated HCl added to the glass container. Moving to Step 11."
      : `Added ${volume.toFixed(1)} mL of ${acidConfig.label} to the glass container.`;

    setToastMessage(acidToast);
    setTimeout(() => setToastMessage(null), 3000);

    if (shouldAdvanceAfterBasicGlassAcid) {
      setBasicGlassAcidAddedTracked(true);
      onStepComplete();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
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

    // Track whether MnO2 was added while the bunsen burner was already heating
    setMno2AddedDuringHeating(isWorkbenchHeating);

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

  const handleAddDiluteHNO3ToTestTube = useCallback(() => {
    if (!isDryTestExperiment || resolvedDryTestMode !== "wet") {
      return;
    }

    const testTube = equipmentPositions.find((pos) => pos.id === "test_tubes");
    if (!testTube) {
      setToastMessage("Place the test tube on the workbench first.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const hasSaltSample = testTube.chemicals.some(
      (chemical) => chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
    );
    if (!hasSaltSample) {
      setToastMessage("Add the salt sample before dil. HNO₃.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    pushHistorySnapshot();
    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find(
          (chemical) => chemical.id === DILUTE_HNO3_CHEMICAL_ID,
        );
        const updatedChemicals = existing
          ? pos.chemicals.map((chemical) =>
              chemical.id === DILUTE_HNO3_CHEMICAL_ID
                ? { ...chemical, amount: chemical.amount + DILUTE_HNO3_VOLUME_INCREMENT }
                : chemical,
            )
          : [
              ...pos.chemicals,
              {
                id: DILUTE_HNO3_CHEMICAL_ID,
                name: DILUTE_HNO3_LABEL,
                color: DILUTE_HNO3_COLOR,
                amount: DILUTE_HNO3_VOLUME_INCREMENT,
                concentration: "Dilute",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    setToastMessage(`Added ${DILUTE_HNO3_VOLUME_INCREMENT} mL of dil. HNO₃ to the test tube.`);
    setTimeout(() => setToastMessage(null), 2500);
  }, [
    equipmentPositions,
    isDryTestExperiment,
    resolvedDryTestMode,
    pushHistorySnapshot,
    setEquipmentPositions,
    setToastMessage,
  ]);

  const handleAddDiluteH2SO4ToTestTube = useCallback(() => {
    if (!isDryTestExperiment || resolvedDryTestMode !== "wet") {
      return;
    }

    const testTube = equipmentPositions.find((pos) => pos.id === "test_tubes");
    if (!testTube) {
      setToastMessage("Place the test tube on the workbench first.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const hasSaltSample = testTube.chemicals.some(
      (chemical) => chemical.id === "salt_sample" && (chemical.amount ?? 0) > 0,
    );
    if (!hasSaltSample) {
      setToastMessage("Add the salt sample before Dil. H₂SO₄.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    pushHistorySnapshot();
    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find(
          (chemical) => chemical.id === DILUTE_H2SO4_CHEMICAL_ID,
        );
        const updatedChemicals = existing
          ? pos.chemicals.map((chemical) =>
              chemical.id === DILUTE_H2SO4_CHEMICAL_ID
                ? { ...chemical, amount: chemical.amount + DILUTE_H2SO4_VOLUME_INCREMENT }
                : chemical,
            )
          : [
              ...pos.chemicals,
              {
                id: DILUTE_H2SO4_CHEMICAL_ID,
                name: DILUTE_H2SO4_LABEL,
                color: DILUTE_H2SO4_COLOR,
                amount: DILUTE_H2SO4_VOLUME_INCREMENT,
                concentration: "Dilute",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    setToastMessage(`Added ${DILUTE_H2SO4_VOLUME_INCREMENT} mL of ${DILUTE_H2SO4_LABEL} to the test tube.`);
    setTimeout(() => setToastMessage(null), 2500);
  }, [
    equipmentPositions,
    isDryTestExperiment,
    resolvedDryTestMode,
    pushHistorySnapshot,
    setEquipmentPositions,
    setToastMessage,
  ]);
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
    setNh4ohUsed(true);

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
      if (!caseOneReady) {
        setCaseOneResult("Cl⁻ radical may be present in the given salt.");
      }
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
    setCaseThreeResult(DEFAULT_CASE_RESULT);
    setCaseFourResult(DEFAULT_CASE_RESULT);
    setCaseFiveResult(DEFAULT_CASE_RESULT);
    setCaseSixResult(DEFAULT_CASE_RESULT);
    setCaseSevenResult(DEFAULT_CASE_RESULT);
    setSodiumNitroprussideAdded(false);
    setMagnesiaAdded(false);
    setCaClAdded(false);
    setDilH2SO4HeatingTriggered(false);
    setFeCl3Added(false);
    setBaClUsed(false);
    setSodiumNitroprussideUsed(false);
    setNh4ohUsed(false);
    setMagnesiaUsed(false);
    setCaClUsed(false);
    setFeCl3Used(false);
    setShowCase2ResultsModal(false);
    setShowSaltAnalysisQuizModal(false);
    resetSaltQuiz();
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
    setCaseFiveResult(DEFAULT_CASE_RESULT);
    setCaseSixResult(DEFAULT_CASE_RESULT);
    setCaseSevenResult(DEFAULT_CASE_RESULT);
    setSodiumNitroprussideAdded(false);
    setMagnesiaAdded(false);
    setCaClAdded(false);
    setDilH2SO4HeatingTriggered(false);
    setFeCl3Added(false);
    setShowCase2ResultsModal(false);
    setShowSaltAnalysisQuizModal(false);
    resetSaltQuiz();
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
    setCaseThreeResult(lastSnapshot.caseThreeResult);
    setCaseFourResult(lastSnapshot.caseFourResult);
    setCaseFiveResult(lastSnapshot.caseFiveResult);
    setCaseSixResult(lastSnapshot.caseSixResult);
    setCaseSevenResult(lastSnapshot.caseSevenResult);
    setSodiumNitroprussideAdded(lastSnapshot.sodiumNitroprussideAdded);
    setMagnesiaAdded(lastSnapshot.magnesiaAdded);
    setCaClAdded(lastSnapshot.caClAdded);
    setDilH2SO4HeatingTriggered(lastSnapshot.dilH2SO4HeatingTriggered);
    setFeCl3Added(lastSnapshot.feCl3Added);

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
    resetSaltQuiz();
    setShowSaltAnalysisQuizModal(true);
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
                  const normalizedEquipmentName = equipment.name.toLowerCase();
                  const hideAddButton = (() => {
    // Normally hide add button for test tubes and bunsen burners, and for some glass items
    // during dry test flows. However, allow adding Test Tubes and the Bunsen burner when
    // performing the Dry Tests for Acid Radicals specifically for the Bromide Check (Br).
    // Only hide Test Tubes and Bunsen burners during the *dry* test flows (acid/basic).
    // For wet test flows (e.g. "Wet Test for Acid Radicals") we want the ADD button to be available
    // (the wet test equipment list explicitly includes the Bunsen burner), so include the
    // dry-test check here.
    const isTestTube =
      isDryTestExperiment && (dryTestMode === "acid" || dryTestMode === "basic") && normalizedEquipmentName.includes("test tube");
    const isBunsen =
      isDryTestExperiment && (dryTestMode === "acid" || dryTestMode === "basic") && normalizedEquipmentName.includes("bunsen");
    const isGlassLimit =
      isDryTestExperiment &&
      (dryTestMode === "acid" || dryTestMode === "basic") &&
      (normalizedEquipmentName.includes("glass rod") ||
        normalizedEquipmentName.includes("glass container"));
    const allowTestTubeInBromideDryAcid =
      isDryTestExperiment &&
      dryTestMode === "acid" &&
      (activeHalide ?? "").toLowerCase() === "br" &&
      normalizedEquipmentName.includes("test tube");
    const allowBunsenInBromideDryAcid =
      isDryTestExperiment &&
      dryTestMode === "acid" &&
      (activeHalide ?? "").toLowerCase() === "br" &&
      normalizedEquipmentName.includes("bunsen");
    return (isTestTube && !allowTestTubeInBromideDryAcid) || (isBunsen && !allowBunsenInBromideDryAcid) || isGlassLimit;
  })();
                  const showAddButton = !hideAddButton;
                  const isBaClCard = normalizedEquipmentName.includes("bacl");
                  const isSodiumNitroprussideCard = normalizedEquipmentName.includes("nitroprusside");
                  const isAmmoniumCard =
                    normalizedEquipmentName.includes("ammonium") ||
                    normalizedEquipmentName.includes("nh₄oh") ||
                    normalizedEquipmentName.includes("nh4oh");
                  const isMagnesiaCard = normalizedEquipmentName.includes("magnesia");
                  const isCaClCard = normalizedEquipmentName.includes("cacl");
                  const isFeCl3Card = normalizedEquipmentName.includes("fecl");
                  const shouldDisableAddButton =
                    isWetAcidTestMode &&
                    ((isBaClCard && hasBaClBeenUsed) ||
                      (isSodiumNitroprussideCard && hasSodiumNitroprussideBeenUsed) ||
                      (isAmmoniumCard && hasNH4OHBeenUsed) ||
                      (isMagnesiaCard && hasMagnesiaBeenUsed) ||
                      (isCaClCard && hasCaClBeenUsed) ||
                      (isFeCl3Card && hasFeCl3BeenUsed));
                  const addButtonDisabled = showAddButton && shouldDisableAddButton;
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
                        {showAddButton && (
                          <button
                            type="button"
                            disabled={addButtonDisabled}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleAddButtonClick(equipment, quickAddAction);
                            }}
                            className={`px-3 py-1 text-xs font-semibold text-white rounded-full transition ${
                              addButtonDisabled
                                ? "bg-orange-300 opacity-60 cursor-not-allowed"
                                : "bg-orange-500 hover:bg-orange-600"
                            }`}
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
                // Pass dry test context for fume coloring
                activeHalide={activeHalide}
                dryTestMode={resolvedDryTestMode}
                mno2AddedDuringHeating={mno2AddedDuringHeating}
              >
                {equipmentPositions
                  .filter((pos) => !isDryTestBottleEquipment(pos.id))
                  .map((pos) => {
                    const equipment = equipmentList.find((eq) => eq.id === pos.id);
                    const normalizedEquipmentName = equipment.name.toLowerCase();
                    const isAmmoniumEquipment =
                      normalizedEquipmentName.includes("ammonium") ||
                      normalizedEquipmentName.includes("nh₄oh") ||
                      normalizedEquipmentName.includes("nh4oh");
                    const shouldDisableAmmoniumInteraction = isAmmoniumEquipment && hasNH4OHBeenUsed;
                    const interactHandler = experimentStarted
                      ? normalizedEquipmentName.includes("salt sample")
                        ? handleSaltDialogOpen
                        : normalizedEquipmentName.includes("dil") &&
                          (normalizedEquipmentName.includes("h2so4") ||
                            normalizedEquipmentName.includes("h₂so₄"))
                          ? handleAddDiluteH2SO4ToTestTube
                          : normalizedEquipmentName.includes("dil") && normalizedEquipmentName.includes("hno")
                            ? handleAddDiluteHNO3ToTestTube
                            : normalizedEquipmentName.includes("ammonium") ||
                              normalizedEquipmentName.includes("nh₄oh") ||
                              normalizedEquipmentName.includes("nh4oh")
                              ? handleAmmoniumDialogOpen
                              : normalizedEquipmentName.includes("hcl")
                                ? () => handleAcidDialogOpen("hcl")
                                : normalizedEquipmentName.includes("h2so4") ||
                                  normalizedEquipmentName.includes("h₂so₄") ||
                                  normalizedEquipmentName.includes("sulfuric")
                                  ? () => handleAcidDialogOpen("h2so4")
                                  : undefined
                      : undefined;
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
                        onInteract={interactHandler}
                        cobaltReactionState={cobaltReactionState}
                        allEquipmentPositions={equipmentPositions}
                        currentStep={currentStep}
                        disabled={!experimentStarted}
                        isDryTest={isDryTestExperiment}
                        dryTestMode={resolvedDryTestMode}
                        isRinseActive={pos.id === glassRodEquipmentId && showRinseAnimation}
                        onObserve={isDryTestExperiment && resolvedDryTestMode === "wet" ? handleObserveWetTest : undefined}
                        observeBlinking={shouldBlinkObserveButton && equipment.id === "test_tubes"}
                        imageUrl={equipment.imageUrl}
                        interactDisabled={shouldDisableAmmoniumInteraction}
                        // Special: show reddish-brown reaction color when heating conc H2SO4 with salt present under Bromide Check
                        color={
                          pos.id === "test_tubes" &&
                          isDryTestExperiment &&
                          resolvedDryTestMode === "acid" &&
                          activeHalide === "Br" &&
                          isWorkbenchHeating &&
                          pos.chemicals.some((c) => c.id === "salt_sample") &&
                          pos.chemicals.some((c) => c.id === "conc_h2so4")
                            ? "#A52A2A"
                            : undefined
                        }
                        volume={
                          pos.id === "test_tubes"
                            ? Math.min(100, Math.round((pos.chemicals.reduce((s, c) => s + (c.amount || 0), 0) / 25) * 100))
                            : undefined
                        }
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

            <div className="text-sm font-bold mb-2 text-slate-900">Cases</div>
            <div className="space-y-2">
              {[
                { label: "CASE 1", result: caseOneResult },
                { label: "CASE 2", result: caseTwoResult },
                { label: "CASE 3", result: caseThreeResult },
                { label: "CASE 4", result: caseFourResult },
                { label: "CASE 5", result: caseFiveResult },
              ].map((entry) => (
                <div key={entry.label} className="p-3 border rounded bg-white text-slate-900">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{entry.label}</div>
                  <div className="mt-1 text-sm text-slate-800">{entry.result}</div>
                </div>
              ))}
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
                // Pass dry test context for fume coloring
                activeHalide={activeHalide}
                dryTestMode={resolvedDryTestMode}
                mno2AddedDuringHeating={mno2AddedDuringHeating}
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
                      // Special: color/volume for test tube reaction when heating conc H2SO4 with salt under Bromide Check
                      color={
                          pos.id === "test_tubes" &&
                          isDryTestExperiment &&
                          resolvedDryTestMode === "acid" &&
                          activeHalide === "Br" &&
                          isWorkbenchHeating &&
                          pos.chemicals.some((c) => c.id === "salt_sample") &&
                          pos.chemicals.some((c) => c.id === "conc_h2so4")
                            ? "#A52A2A"
                            : undefined
                        }
                      volume={
                        pos.id === "test_tubes"
                          ? Math.min(100, Math.round((pos.chemicals.reduce((s, c) => s + (c.amount || 0), 0) / 25) * 100))
                          : undefined
                      }
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

      {Boolean(addDialogEquipment) && (
        <Dialog
          open={Boolean(addDialogEquipment)}
          onOpenChange={(open) => !open && handleEquipmentAddDialogClose()}
        >
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Amount</DialogTitle>
              <DialogDescription>
                Add {addDialogEquipment?.name} to the workbench.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Quantity
              </label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                type="number"
                min="0.1"
                step="0.1"
                value={addDialogAmount}
                onChange={(event) => setAddDialogAmount(event.target.value)}
                placeholder="3.0"
              />
              <p className="text-[11px] text-slate-500">
                Equipment will be placed near the center of the workbench.
              </p>
              <p className="text-[11px] text-slate-500">Recommended range: 3 - 6 drops.</p>
              {addDialogError && (
                <p className="text-[11px] text-red-500">{addDialogError}</p>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleEquipmentAddDialogClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEquipmentAddDialogConfirm}>
                  Add to workbench
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              Overview of the Salt Analysis acid radical narrative across the dry and wet tests.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4 text-slate-900">
            <div className="space-y-6 rounded-[32px] border border-white/70 bg-gradient-to-br from-white to-slate-100 p-6 shadow-2xl shadow-indigo-200/30">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-xl">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Detailed Insights</div>
                <p className="mt-2 text-sm text-white/80">
                  These focused notes highlight how the additional wet-case drop-injections confirm which acid radicals remain absent after the primary dry tests.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {detailedInsights.map((insight) => (
                    <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-white/10">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">{insight.hint}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{insight.title}</div>
                      <p className="mt-1 text-xs text-white/70 leading-tight">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {analysisGuidance.map((note) => (
                  <div
                    key={note.label}
                    className={`rounded-2xl border border-white/30 bg-gradient-to-br ${note.accent} bg-opacity-80 p-4 shadow-lg shadow-slate-200/60`}
                  >
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${note.textColor}`}>{note.label}</div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 leading-relaxed">{note.description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-5 shadow-lg">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Full Case Results</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {caseSummaryEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className={`rounded-2xl border ${entry.borderClass} bg-gradient-to-br ${entry.bgClass} p-4 shadow-sm`}
                    >
                      <div className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${entry.titleColorClass}`}>{entry.label}</div>
                      <p className={`mt-2 text-lg font-bold ${entry.resultTextClass} leading-relaxed`}>{entry.result}</p>
                      <div className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] ${entry.indicatorColorClass}`}>
                        {entry.indicator}
                      </div>
                    </div>
                  ))}
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

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Observation Highlights</div>
                <ul className="mt-4 space-y-3">
                  {observationHighlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <span className="mt-[3px] h-2.5 w-2.5 rounded-full bg-slate-900" />
                      <span className="text-base font-bold text-slate-900 leading-snug">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
      {isDryTestExperiment && (
        <Dialog
          open={showSaltAnalysisQuizModal}
          onOpenChange={(open) => {
            if (!open) {
              resetSaltQuiz();
            }
            setShowSaltAnalysisQuizModal(open);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <Card className="shadow-xl">
              <CardHeader className="space-y-2 pb-0">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-2xl text-slate-900">{saltQuizHeaderTitle}</CardTitle>
                  {quizSubmitted && (
                    <div className="text-blue-600 font-semibold">
                      Marks obtained ({saltQuizScore} / {activeSaltQuizItems.length})
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500">{saltQuizDescription}</p>
              </CardHeader>
              <CardContent className="pt-2 text-slate-900">
                <div className="space-y-6">
                  {activeSaltQuizItems.map((item) => {
                    const selectedKey = quizSelections[item.id];
                    const selectedOption = item.options.find((option) => option.key === selectedKey);
                    const answerColorClass =
                      selectedKey && selectedKey === item.correctOption ? "text-emerald-700" : "text-rose-600";
                    const selectionText = selectedOption
                      ? `${selectedOption.key}) ${selectedOption.text}`
                      : "No answer selected";
                    return (
                      <section
                        key={item.id}
                        className="quiz-section-card rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200"
                      >
                        <h3 className="text-base font-semibold text-slate-900">{`${item.label}. ${item.prompt}`}</h3>
                        <div className="mt-3 space-y-2">
                          {item.options.map((option) => (
                            <label
                              key={option.key}
                              className="quiz-option flex items-start space-x-2 text-sm text-slate-700"
                            >
                              <input
                                type="radio"
                                name={item.id}
                                value={option.key}
                                className="mt-1"
                                checked={quizSelections[item.id] === option.key}
                                onChange={() => handleSaltQuizSelect(item.id, option.key)}
                                disabled={quizSubmitted}
                              />
                              <span>{`${option.key}) ${option.text}`}</span>
                            </label>
                          ))}
                        </div>
                        {quizSubmitted && (
                          <>
                            <div className={`mt-2 text-sm font-semibold ${answerColorClass}`}>
                              Your answer: {selectionText}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-emerald-700">{item.answer}</div>
                          </>
                        )}
                      </section>
                    );
                  })}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center space-x-2"
                        onClick={() => {
                          setShowSaltAnalysisQuizModal(false);
                          setShowCase2ResultsModal(true);
                        }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Experiment</span>
                      </Button>
                      <Link href="/">
                        <Button className="bg-gray-700 text-white hover:bg-gray-800">
                          Return to Experiments
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleSaltQuizSubmit}
                        className={`bg-amber-600 hover:bg-amber-700 text-white ${
                          !allSaltQuizAnswered ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={!allSaltQuizAnswered || quizSubmitted}
                      >
                        Submit
                      </Button>
                      <Button variant="outline" onClick={resetSaltQuiz}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}

export default ChemicalEquilibriumVirtualLab;
