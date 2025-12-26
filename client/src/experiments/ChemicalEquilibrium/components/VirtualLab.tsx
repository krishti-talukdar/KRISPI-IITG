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
} from "../types";

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
const DRY_WORKBENCH_TEST_TUBE_POSITION = { xPercent: 0.3, yPercent: 0.35 };
const DRY_WORKBENCH_GLASS_ROD_POSITION = { xPercent: 0.7, yPercent: 0.15 };
const DRY_WORKBENCH_BUNSEN_POSITION = { xPercent: 0.3, yPercent: 0.65 };
const DRY_WORKBENCH_GLASS_CONTAINER_POSITION = { xPercent: 0.55, yPercent: 0.37 };

const DRY_WORKBENCH_BOTTLE_LAYOUT: Record<string, { xPercent: number; yPercent: number }> = {
  "salt-sample": DRY_WORKBENCH_SALT_POSITION,
  "concentrated-h-so": {
    xPercent: DRY_WORKBENCH_SALT_POSITION.xPercent,
    yPercent: DRY_WORKBENCH_SALT_POSITION.yPercent + DRY_WORKBENCH_VERTICAL_SPACING,
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
  const [caseOneResult, setCaseOneResult] = useState("No result yet");
  const rinseTimerRef = useRef<number | null>(null);

  // Choose chemicals and equipment based on experiment
  const isPHExperiment = experimentTitle === PHHClExperiment.title;
  const isDryTestExperiment = experimentTitle === ChemicalEquilibriumData.title;
  const usePhStyleLayout = isPHExperiment || isDryTestExperiment;
  const totalGuidedSteps = experiment.stepDetails.length;
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
  const normalizedTitle = experimentTitle?.toLowerCase() ?? "";
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
  const isDryTestWorkbench =
    normalizedTitle.includes("dry tests for acid radicals") ||
    normalizedTitle.includes("dry tests for basic radicals") ||
    normalizedTitle.includes("salt analysis");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saltDialogOpen, setSaltDialogOpen] = useState(false);
  const [saltMass, setSaltMass] = useState("2.0");
  const [saltDialogError, setSaltDialogError] = useState<string | null>(null);
  const MIN_SALT_MASS = 3;
  const MAX_SALT_MASS = 5;
  const SALT_RANGE_LABEL = "3g-5g";
  const SALT_HEATING_STEP = 0.35;
  const SALT_HEATING_MIN_REMAINING = 0.5;
  const SALT_HEATING_INTERVAL_MS = 1200;
  const [acidDialogOpen, setAcidDialogOpen] = useState(false);
  const [acidVolume, setAcidVolume] = useState("4");
  const [acidDialogError, setAcidDialogError] = useState<string | null>(null);
  const MIN_ACID_DROPS = 3;
  const MAX_ACID_DROPS = 5;
  const ACID_RANGE_LABEL = "3-5 drops";
  const [ammoniumDialogOpen, setAmmoniumDialogOpen] = useState(false);
  const MIN_AMMONIUM_VOLUME = 5;
  const MAX_AMMONIUM_VOLUME = 10;
  const [ammoniumVolume, setAmmoniumVolume] = useState("5.0");
  const [ammoniumDialogError, setAmmoniumDialogError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [isWorkbenchHeating, setIsWorkbenchHeating] = useState(false);
  const saltHeatingIntervalRef = useRef<number | null>(null);
  const resolvedDryTestMode = dryTestMode ?? "acid";

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
    };
  }, []);

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
  });

  const DRY_TEST_BOTTLE_IDS = [
    "salt-sample",
    "concentrated-h-so",
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
        "Use the ADD buttons next to Salt Sample, Conc. H₂SO₄, and NH₄OH to load the test tube.",
      );
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

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
          return prev.map((pos) => (pos.id === id ? { ...pos, x, y } : pos));
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

        return [...prev, { id, x: dropX, y: dropY, chemicals: [] }];
      });
    },
    [currentStep, distilledWaterAdded, onStepComplete, isDryTestExperiment, pushHistorySnapshot],
  );

  const handleEquipmentRemove = useCallback((id: string) => {
    pushHistorySnapshot();
    setEquipmentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setToastMessage("Equipment removed from workbench");
    setTimeout(() => setToastMessage(null), 2000);
  }, [pushHistorySnapshot]);

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

  const handleAcidDialogOpen = () => {
    setAcidVolume("4");
    setAcidDialogError(null);
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


  const getQuickAddAction = (equipmentId: string) => {
    if (equipmentId.startsWith("salt-sample")) {
      return handleSaltDialogOpen;
    }
    if (equipmentId.startsWith("concentrated-h-so")) {
      return handleAcidDialogOpen;
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

    setToastMessage(`Added ${mass.toFixed(2)} g of Salt Sample to the test tube.`);
    setTimeout(() => setToastMessage(null), 3000);
    handleSaltDialogClose();
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

    pushHistorySnapshot();

    setEquipmentPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== "test_tubes") {
          return pos;
        }

        const existing = pos.chemicals.find((c) => c.id === "conc_h2so4");
        const updatedChemicals = existing
          ? pos.chemicals.map((c) =>
              c.id === "conc_h2so4"
                ? { ...c, amount: c.amount + drops }
                : c,
            )
          : [
              ...pos.chemicals,
              {
                id: "conc_h2so4",
                name: "Conc. H₂SO₄",
                color: "#fb7185",
                amount: drops,
                concentration: "Concentrated",
              },
            ];

        return { ...pos, chemicals: updatedChemicals };
      }),
    );

    setToastMessage(`Added ${drops} drops of Conc. H₂SO₄ to the test tube.`);
    setTimeout(() => setToastMessage(null), 3000);
    handleAcidDialogClose();
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

    setToastMessage(
      `Added ${volume.toFixed(1)} mL of Ammonium hydroxide to the glass container.`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    handleAmmoniumDialogClose();
  };

  const handleRinseAction = () => {
    if (!hasAmmoniumInGlassContainer || isRinsing) return;

    if (!hasRinsed) {
      setHasRinsed(true);
      setIsRinsing(true);
      setShowRinseAnimation(true);
      setToastMessage("Rinsing the glass rod with NH₄OH...");
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

    if (rodMoved) return;

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

    pushHistorySnapshot();
    setEquipmentPositions((prev) =>
      prev.map((pos) =>
        pos.id === glassRod.id
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
    setToastMessage("Glass rod moved above the test tube.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleStartExperiment = () => {
    onStartExperiment();
  };

  const handleReset = () => {
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
    setCaseOneResult("No result yet");
    if (rinseTimerRef.current) {
      window.clearTimeout(rinseTimerRef.current);
      rinseTimerRef.current = null;
    }
    setIsRinsing(false);
    setShowRinseAnimation(false);
    onResetTimer();
    if (onResetExperiment) onResetExperiment();
  };

  const handleClearWorkbench = () => {
    setEquipmentPositions([]);
    setRodMoved(false);
    setPostMoveFumesEnabled(false);
    setHasRinsed(false);
    setShowRinseAnimation(false);
    setToastMessage("Workbench cleared.");
    setTimeout(() => setToastMessage(null), 2500);
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

    setToastMessage("Reverted the last operation.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleViewResults = () => {
    setToastMessage("Results & analysis will appear after completing the steps.");
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
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition"
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
                showRinseButton={hasAmmoniumInGlassContainer}
                onRinse={handleRinseAction}
                isRinsing={isRinsing}
                hasRinsed={hasRinsed}
                rodMoved={rodMoved}
                showPostMoveFumes={postMoveFumesEnabled}
                onHeatingStateChange={handleBunsenHeatingChange}
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
                              : equipment.name.toLowerCase().includes("h2so4") ||
                                equipment.name.toLowerCase().includes("h₂so₄") ||
                                equipment.name.toLowerCase().includes("sulfuric")
                              ? handleAcidDialogOpen
                              : undefined
                            : undefined
                        }
                        cobaltReactionState={cobaltReactionState}
                        allEquipmentPositions={equipmentPositions}
                        currentStep={currentStep}
                        disabled={!experimentStarted}
                        isDryTest={isDryTestExperiment}
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
              <h4 className="text-sm font-semibold">Live Analysis</h4>
              <div className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Current Step</div>
              <div className="mt-1 text-sm">{allSteps[currentStep - 1]?.title ?? 'No step selected'}</div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              <div className="font-medium">Completed Steps</div>
              <ul className="list-disc list-inside mt-2">
                {allSteps.slice(0, Math.max(0, currentStep - 1)).map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            </div>

            <div className="mt-2 mb-4 p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium text-gray-600">Measured pH</div>
              <div className="text-2xl font-bold mt-1">{measurements.ph ? measurements.ph : 'No result yet'}</div>
            </div>

            <div className="text-sm font-semibold mb-2">Cases</div>
            <div className="space-y-2">
              <div className="p-2 border rounded">CASE 1
                <div className="text-xs text-gray-500">{caseOneResult}</div>
              </div>
              <div className="p-2 border rounded">CASE 2
                <div className="text-xs text-gray-500">No result yet</div>
              </div>
            </div>
            {caseOneResult !== "No result yet" && (
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
                showRinseButton={hasAmmoniumInGlassContainer}
                onRinse={handleRinseAction}
                isRinsing={isRinsing}
                hasRinsed={hasRinsed}
                rodMoved={rodMoved}
                showPostMoveFumes={postMoveFumesEnabled}
                onHeatingStateChange={handleBunsenHeatingChange}
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
        <Dialog open={acidDialogOpen} onOpenChange={(open) => !open && handleAcidDialogClose()}>
          <DialogContent className="max-w-sm space-y-4">
            <DialogHeader>
              <DialogTitle>Enter Volume</DialogTitle>
              <DialogDescription>
                Enter the volume of concentrated H₂SO₄ to add to the test tube.
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
              <p className="text-[11px] text-slate-500">Recommended range: 3-5 drops.</p>
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
    </TooltipProvider>
  );
}

export default ChemicalEquilibriumVirtualLab;
