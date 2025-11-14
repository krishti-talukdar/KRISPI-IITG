import type { OxalicAcidExperiment } from "./types";

// Restored Oxalic Acid Standardization experiment data (7 steps)
const OxalicAcidData: OxalicAcidExperiment = {
  id: 1,
  title: "Preparation of Standard Solution of Oxalic Acid",
  description:
    "Learn to prepare a standard solution of oxalic acid dihydrate with accurate concentration. Master fundamental quantitative analysis techniques including weighing, dissolution, and volumetric preparation.",
  category: "Quantitative Analysis",
  difficulty: "Beginner",
  duration: 35,
  steps: 7,
  rating: 4.5,
  imageUrl:
    "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
  equipment: [
    "Analytical Balance",
    "Volumetric Flask (250 mL)",
    "Beaker (100 mL)",
    "Glass Rod",
    "Funnel",
    "Wash Bottle",
    "Weighing Bottle",
    "Dropper",
  ],
  stepDetails: [
    {
      id: 1,
      title: "Calculate Required Mass",
      description:
        "Calculate the mass of oxalic acid dihydrate (H₂C₂O₄·2H₂O) needed to prepare 250 mL of 0.1 M solution. Use molecular weight 126.07 g/mol.",
      duration: "5 minutes",
      temperature: "Room temperature",
      completed: false,
    },
    {
      id: 2,
      title: "Weigh Oxalic Acid",
      description:
        "Using an analytical balance, accurately weigh the calculated amount of oxalic acid dihydrate in a weighing bottle. Record the exact mass.",
      duration: "8 minutes",
      safety: "Handle with care, avoid skin contact",
      completed: false,
    },
    {
      id: 3,
      title: "Dissolve in Beaker",
      description:
        "Transfer the weighed oxalic acid to a 100 mL beaker. Add about 50 mL of distilled water and stir with a glass rod until completely dissolved.",
      duration: "5 minutes",
      completed: false,
    },
    {
      id: 4,
      title: "Transfer to Volumetric Flask",
      description:
        "Drag the beaker, wash bottle and volumetric flask into the workspace and transfer the solution into the volumetric flask using a funnel.",
      duration: "7 minutes",
      completed: false,
    },
    {
      id: 5,
      title: "Add Water to Near Mark",
      description:
        "Add distilled water to the volumetric flask until the level is about 2-3 cm below the graduation mark. Swirl gently to mix.",
      duration: "3 minutes",
      completed: false,
    },
    {
      id: 6,
      title: "Mix Oxalic Acid with Distilled Water",
      description:
        "Mix oxalic acid with distilled water",
      duration: "5 minutes",
      completed: false,
    },
    {
      id: 7,
      title: "Final Mixing and Calculation",
      description:
        "Cap the flask and invert it 20-25 times to ensure complete mixing. Calculate the exact molarity using the actual mass weighed.",
      duration: "5 minutes",
      completed: false,
    },
  ],
  safetyInfo:
    "Oxalic acid is toxic and corrosive. Avoid skin contact and inhalation. Wear safety goggles and gloves. Work in a well-ventilated area. Wash hands thoroughly after handling.",
};

export default OxalicAcidData;
