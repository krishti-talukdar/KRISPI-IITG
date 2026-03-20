import type { ChemicalEquilibriumExperiment, ExperimentStep } from "./types";

// Complete Chemical Equilibrium experiment data
const ChemicalEquilibriumData: ChemicalEquilibriumExperiment = {
  id: 3,
  title: "Salt Analysis",
  description:
    "Learn classical dry test techniques to identify common acid radicals (anions) such as carbonate, sulfate, chloride, nitrate and nitrite using a clean wire loop and heat. This qualitative analysis focuses on observation of color, smell, and residue characteristics in a safe virtual environment.",
  category: "Qualitative Analysis",
  difficulty: "Intermediate",
  duration: 40,
  steps: 12,
  rating: 4.7,
  imageUrl:
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
  equipment: [
    "Test Tubes",
    "Salt Sample",
    "Concentrated H₂SO₄",
    "Dil. H₂SO₄",
    "Bunsen Burner (virtual heat source)",
    "Glass Rod",
    "Glass container",
    "Dilute HCl",
    "Dilute HNO₃",
    "Soda extract",
    "CHCl3",
    "Acidified KMnO4",
    "MnO₂",
  ],
  stepDetails: [
    {
      id: 1,
      title: "Step 1 : Place the test tube in the workbench.",
      description:
        "Place the test tube in the workbench to begin the dry test.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 2,
      title: "Step 2 : Add Salt sample in the test tube. ",
      description:
        "Add the salt sample to the test tube before introducing any reagent.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 3,
      title: "Step 3 : Add concentrated H₂SO₄ in the test tube",
      description:
        "Add concentrated H₂SO₄ carefully to the test tube.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 4,
      title: "Step 4 : Add bunsen burner in the workbench",
      description:
        "Place the bunsen burner in the workbench for heating.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 5,
      title: "Step 5 : Press the start heating button",
      description:
        "Press the start heating button to begin the heating process.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 6,
      title: "Step 6 : Add MnO₂ in the test tube",
      description:
        "Add manganese dioxide to the test tube to continue the dry test sequence.",
      completed: false,
    duration: "3 minutes",
    },
    {
      id: 7,
      title: "Step 7 : Press reset workbench button",
      description: "Press the reset workbench button.",
      completed: false,
      duration: "3 minutes",
    },
    {
      id: 8,
      title: "Step 8 : Add test tube in the workbench",
      description: "Add the test tube in the workbench.",
      completed: false,
      duration: "3 minutes",
    },
    {
      id: 9,
      title: "Step 9 : Add salt sample in the test tube",
      description: "Add the salt sample in the test tube.",
      completed: false,
      duration: "3 minutes",
    },
    {
      id: 10,
      title: "Step 10 : Add Acidified Potassium Dichromate (K₂Cr₂O₇) in the test tube",
      description: "Add Acidified Potassium Dichromate (K₂Cr₂O₇) in the test tube.",
      completed: false,
      duration: "3 minutes",
    },
    {
      id: 11,
      title: "Step 11 : Add bunsen burner in the workbench",
      description: "Add bunsen burner in the workbench.",
      completed: false,
      duration: "3 minutes",
    },
    {
      id: 12,
      title: "Step 12 : Press the start heating button",
      description: "Press the start heating button.",
      completed: false,
      duration: "3 minutes",
    },
  ],
  safetyInfo:
    "This is a virtual simulation. In real laboratory practice, dry tests use hot wire loops and can produce toxic fumes (eg. NO2) or hot residues. Always use proper ventilation, a fume hood, safety goggles, heat-resistant gloves, and follow institutional safety protocols.",
};

export const BROMIDE_WET_TEST_STEPS: ExperimentStep[] = [
  {
    id: 1,
    title: "Step 1 : Add the test tube in the workbench. ",
    description:
      "Add the test tube to the workbench to begin the wet test sequence.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 2,
    title: "Step 2 : Add the salt sample in the test tube ",
    description:
      "Add the salt sample into the test tube before adding reagents.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 3,
    title: "Step 3 : Add the Soda extract in the test tube",
    description:
      "Add soda extract to the test tube for the bromide wet test.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 4,
    title: "Step 4 : Add Dilute HNO₃ in the test tube ",
    description:
      "Add dilute HNO₃ carefully to the test tube.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 5,
    title: "Step 5 : Add AgNO₃  in the test tube",
    description:
      "Add AgNO₃ to the test tube to observe the bromide reaction.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 6,
    title: "Step 6 : Add bunsen burner in the workbench ",
    description:
      "Place the bunsen burner in the workbench for heating.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 7,
    title: "Step 7 : Press the start heating button ",
    description:
      "Press the start heating button to begin heating the wet test setup.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 8,
    title: "Step 8 : Press the reset workbench button ",
    description:
      "Press the reset workbench button to clear the setup.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 9,
    title: "Step 9 : Add the test tube in the workbench",
    description:
      "Add the test tube again after reset to repeat the wet test sequence.",
    completed: false,
    duration: "3 minutes",
  },
];

export const IODIDE_WET_TEST_STEPS: ExperimentStep[] = [
  {
    id: 1,
    title: "Step 1 : Place the test tube in the workbench. ",
    description: "Place the test tube in the workbench.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 2,
    title: "Step 2 : Add salt sample in the test tube",
    description: "Add salt sample in the test tube.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 3,
    title: "Step 3 : Add soda extract in the test tube .",
    description: "Add soda extract in the test tube.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 4,
    title: "Step 4 : Add Dilute HNO₃ in the test tube",
    description: "Add Dilute HNO₃ in the test tube.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 5,
    title: "Step 5 : Add  AgNO₃ in the test tube",
    description: "Add AgNO₃ in the test tube.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 6,
    title: "Step 6 : Add bunsen burner in the workbench",
    description: "Add bunsen burner in the workbench.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 7,
    title: "Step 7 : Press the start heating button ",
    description: "Press the start heating button.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 8,
    title: "Step 8 : Press the reset workbench button in the live analysis section ",
    description: "Press the reset workbench button in the live analysis section.",
    completed: false,
    duration: "3 minutes",
  },
];

export const BASIC_DRY_TEST_STEPS: ExperimentStep[] = [
  {
    id: 1,
    title: "Drag the test tube in the workbench",
    description:
      "Move a clean test tube from the rack onto the workbench to begin the basic radical dry test.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 2,
    title: "Add salt sample in the test tube",
    description:
      "Carefully drop a small portion of the dry salt sample into the test tube before adding any reagents.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 3,
    title: "Drag the bunsen burner in the workbench and warm the tube gently over a low flame",
    description:
      "Position the bunsen burner close to the tube and heat the sample gently with a low flame to observe the basic radicals.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 4,
    title: "Reset the workbench",
    description:
      "Use the reset control to clear the current setup so the follow-up steps start with fresh glassware.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 5,
    title: "Drag the test tube in the workbench",
    description:
      "Place another clean test tube on the workbench to continue the basic radical investigation.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 6,
    title: "Add salt sample in the test tube",
    description:
      "Add a second portion of the salt sample into the new tube to repeat the dry test.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 7,
    title: "Add NaOH solution in the test tube",
    description:
      "Introduce sodium hydroxide into the test tube using the NaOH control to reveal basic radical behavior.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 8,
    title: "Drag the bunsen burner in the workbench and warm the tube gently over a low flame",
    description:
      "Warm the NaOH-treated tube on a low flame so the evolved fumes or residues can be observed.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 9,
    title: "Drop the Glass Rod & Glass container in the workbench",
    description:
      "Place both the glass rod and glass container on the workbench to prepare for the spotting transfer.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 10,
    title: "Add conc. HCL in the glass container",
    description:
      "Add concentrated HCl into the glass container so the spotting acid is ready for transfer.",
    completed: false,
    duration: "3 minutes",
  },
  {
    id: 11,
    title: "Press the \"RINSE\" and \"MOVE\" buttons",
    description:
      "Use the RINSE control to clean the glass rod, then tap MOVE so it hovers above the test tube for the final observation.",
    completed: false,
    duration: "3 minutes",
  },
];

export const PHHClExperiment: ChemicalEquilibriumExperiment = {
  id: 4,
  title: "To determine pH values of hydrochloric acid of different strengths using pH paper and universal indicator",
  description: "Determine and compare the pH of hydrochloric acid solutions of varying concentrations using pH paper and a universal indicator solution.",
  category: "Acid-Base",
  difficulty: "Beginner",
  duration: 40,
  steps: 7,
  rating: 4.6,
  imageUrl: "https://images.pexels.com/photos/416035/pexels-photo-416035.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=400",
  equipment: [
    "Beakers (50 mL and 100 mL)",
    "Volumetric Flasks",
    "Droppers/Pipettes",
    "Graduated Cylinders",
    "pH Paper (universal pH strips)",
    "Universal Indicator Solution",
    "Glass Rods",
    "Wash Bottle (distilled water)",
    "Safety Goggles and Gloves",
    "Labels and Marker"
  ],
  stepDetails: [
    { id: 1, title: "Prepare Acid Solutions", description: "Prepare three different strengths of hydrochloric acid solutions (e.g. 0.1 M, 0.01 M, 0.001 M) by appropriate dilution of a standard HCl stock using volumetric flasks and distilled water. Label each flask clearly.", duration: "8 minutes", completed: false },
    { id: 2, title: "Arrange Workspace and Safety", description: "Put on safety goggles and gloves. Place beakers on a clean bench, keep a wash bottle handy, and ensure all containers are labeled.", duration: "3 minutes", safety: "Handle acids with care; avoid spills and skin contact", completed: false },
    { id: 3, title: "Measure pH with pH Paper", description: "Dip a strip of universal pH paper into each acid solution, or place a drop of solution onto the pH paper. Compare the resulting color with the pH chart to estimate pH and record the value for each concentration.", duration: "6 minutes", completed: false },
    { id: 4, title: "Measure with Universal Indicator", description: "Add a few drops of universal indicator solution to separate small aliquots of each acid strength in clean beakers. Observe and record the color change and compare to the indicator chart to determine pH range.", duration: "6 minutes", completed: false },
    { id: 5, title: "Compare and Analyze Results", description: "Compare pH readings obtained from pH paper and universal indicator for each concentration. Note discrepancies and discuss reasons (precision, indicator ranges, concentration effects).", duration: "8 minutes", completed: false },
    { id: 6, title: "Clean Up", description: "Neutralize any small acid spills with sodium bicarbonate solution, rinse glassware thoroughly with distilled water, and properly dispose of used pH paper and indicator solutions as per laboratory guidelines.", duration: "5 minutes", safety: "Neutralize spills immediately and dispose of waste safely", completed: false },
    { id: 7, title: "Record Observations and Conclusion", description: "Prepare a short report listing prepared concentrations, measured pH values (from both methods), discuss accuracy and sources of error, and conclude on the relationship between HCl concentration and pH.", duration: "4 minutes", completed: false }
  ],
  safetyInfo: "Here’s a *comprehensive safety guide* for the experiment:  *“To determine pH values of hydrochloric acid of different strengths using pH paper and universal indicator.”*  ---  ## 🔰 *SAFETY GUIDE*  ### *1. Objective*  To ensure safe handling and use of *hydrochloric acid (HCl)* solutions of different concentrations during pH determination using *pH paper* and *universal indicator*.  ---  ### *2. Chemical Information*  * *Chemical name:* Hydrochloric acid (HCl) * *Nature:* Strong acid; corrosive * *Hazard classification:*    * Corrosive to skin, eyes, and mucous membranes   * Produces irritating and toxic fumes (HCl vapour)  ---  ### *3. Personal Protective Equipment (PPE)*  ✅ *Mandatory PPE:*  * Lab coat or apron (acid-resistant if available) * Safety goggles or face shield * Nitrile or rubber gloves * Closed shoes (no sandals) * Long pants and tied-back hair  ---  ### *4. Laboratory Safety Precautions*  * Work in a *well-ventilated area* or *fume hood* when handling concentrated acid. * *Never* pipette by mouth; use a pipette filler or bulb. * Always *add acid to water*, not water to acid — prevents splashing or violent reaction. * Use *labeled containers* for each concentration to avoid mix-up. * Keep *neutralizing agents* (e.g., sodium bicarbonate or sodium carbonate) nearby. * Keep a *source of running water* or an *eye-wash station* accessible.  ---  ### *5. Handling Procedures*  1. *Preparation of dilute acids:*     * Carefully measure the required volume of stock HCl.    * Slowly pour the acid into water with gentle stirring.    * Allow solutions to cool before testing.  2. *Testing with indicators:*     * Use small quantities of solution (5–10 mL).    * Avoid touching pH paper or universal indicator with bare hands.    * Do not reuse contaminated indicator droppers or strips.  3. *Observation:*     * Observe color changes on white background for clarity.    * Dispose of used strips in a designated waste bin.  ---  ### *6. Spill and Accident Procedures*  * *Minor acid spill:*   Sprinkle sodium bicarbonate or carbonate powder to neutralize; wipe with plenty of water. * *Skin contact:*   Immediately flush with *copious running water* for at least *10–15 minutes*. * *Eye contact:*   Rinse eyes in *eye-wash station* for *15–20 minutes* and seek medical help. * *Inhalation:*   Move to fresh air immediately; seek medical attention if irritation persists. * *Ingestion:*   Do *not* induce vomiting; rinse mouth with water and call for medical help.  ---  ### *7. Waste Disposal*  * Collect all acid wastes in a labeled *“Acid Waste”* container. * Neutralize before disposal if permitted by lab rules. * Rinse all glassware thoroughly with water before returning.  ---  ### *8. Emergency Equipment to Keep Nearby*  * First aid kit * Eye wash and safety shower * Sodium bicarbonate (NaHCO₃) for neutralization * Fire extinguisher (CO₂ type) * Clean water supply  ---  ### *9. Good Laboratory Practices*  * Do not eat, drink, or use mobile phones in the laboratory. * Label all beakers and flasks clearly. * Keep workspace organized and dry. * Report all accidents or spills immediately to the instructor or lab supervisor. * Wash hands thoroughly after completing the experiment.  ---  ### *10. Disposal and Clean-up*  * Neutralize any residual acid before pouring into sink (if allowed by instructor). * Dispose of pH paper and indicator-stained samples in *non-recyclable chemical waste*. * Clean the bench with a wet cloth to remove traces of acid.  ---  ✅ *Summary of Key Rules*  | DO’s                          | DON’Ts                              | | ----------------------------- | ----------------------------------- | | Wear full PPE                 | Never mix acid with base directly   | | Add acid to water slowly      | Don’t pipette by mouth              | | Work in ventilated area       | Don’t touch acid with bare skin     | | Neutralize spills immediately | Don’t dispose acid directly in sink |  ---"
};

export default ChemicalEquilibriumData;
