const PHComparisonData = {
  id: 8,
  title: "To determine and compare pH of 0.01 M HCl and 0.01 M CH3COOH solution using universal indicator",
  description: "Use universal indicator to estimate and compare the pH of 0.01 M HCl (strong acid) and 0.01 M CH3COOH (weak acid). Observe different indicator colors due to varying acid strengths.",
  category: "Acid-Base Chemistry",
  difficulty: "Beginner",
  duration: 20,
  steps: 6,
  rating: 4.6,
  imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  equipment: [
    "25ml Test Tube",
    "0.01 M HCl",
    "0.01 M CH3COOH",
    "Universal Indicator",
    "Dropper",
    "pH Color Chart",
    "Distilled Water"
  ],
  stepDetails: [
    { id: 1, title: "Setup Workbench", description: "Drag the test tube onto the workbench.", duration: "2 minutes", completed: false },
    { id: 2, title: "Add 0.01 M HCl", description: "Add HCl solution to the test tube using the equipment panel.", duration: "3 minutes", completed: false },
    { id: 3, title: "Add Universal Indicator", description: "Add 2–3 drops of universal indicator and match the color with the pH chart (expected ~pH 2, red–orange).", duration: "3 minutes", completed: false },
    { id: 4, title: "Rinse/Reset and Add 0.01 M CH3COOH", description: "Reset, then add acetic acid to the test tube.", duration: "3 minutes", completed: false },
    { id: 5, title: "Add Universal Indicator", description: "Add indicator to observe color (expected higher pH than HCl, typically orange–yellow).", duration: "3 minutes", completed: false },
    { id: 6, title: "Compare and Conclude", description: "Compare the observed colors and conclude why weak acid shows higher pH at same molarity.", duration: "6 minutes", completed: false }
  ],
  safetyInfo: "Acids are irritants; avoid contact with skin and eyes. Wear goggles and gloves. Do not ingest chemicals."
};

export default PHComparisonData;
