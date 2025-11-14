const AmmoniumBufferData = {
  id: 9,
  title: "To study the change in pH of ammonium hydroxide solution on addition of ammonium chloride",
  description: "Investigate how adding ammonium chloride (NH4Cl) to an ammonium hydroxide (NH4OH) solution affects pH via the common‑ion effect. Observe the color change using pH paper and note the drop in pH.",
  category: "Acid-Base Chemistry",
  difficulty: "Beginner",
  duration: 20,
  steps: 6,
  rating: 4.6,
  imageUrl: "https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2F5327b38ce28c44b4974f04c3fe6e309c?format=webp&width=800",
  equipment: [
    "25ml Test Tube",
    "0.1 M NH4OH",
    "0.1 M NH4Cl",
    "pH Paper",
    "Dropper",
    "pH Color Chart",
    "Distilled Water"
  ],
  stepDetails: [
    { id: 1, title: "Setup Workbench", description: "Drag the test tube onto the workbench.", duration: "2 minutes", completed: false },
    { id: 2, title: "Add 0.1 M NH4OH", description: "Add NH4OH to the test tube.", duration: "3 minutes", completed: false },
    { id: 3, title: "Add pH Paper", description: "Place pH paper in contact with the solution to observe the pH color (no drops required).", duration: "3 minutes", completed: false },
    { id: 4, title: "Add NH4Cl (Common Ion)", description: "Add NH4Cl to the same test tube (pH decreases due to common‑ion effect).", duration: "3 minutes", completed: false },
    { id: 5, title: "Measure pH", description: "Measure pH or compare color with the chart (expect lower than Step 3).", duration: "3 minutes", completed: false },
    { id: 6, title: "Compare and Conclude", description: "Explain why adding NH4+ lowers the pH of NH4OH.", duration: "6 minutes", completed: false }
  ],
  safetyInfo: "Ammonium hydroxide vapors are irritating; work in a ventilated area. NH4Cl is an irritant. Wear goggles and gloves. Avoid inhalation."
};

export default AmmoniumBufferData;
