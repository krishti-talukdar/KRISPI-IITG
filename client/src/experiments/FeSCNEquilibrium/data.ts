const FeSCNEquilibriumData = {
  id: 3,
  title: "Study of Equilibrium Shift between Ferric Ions and Thiocyanate Ions",
  description: "Comprehensive virtual lab to study the shift of chemical equilibrium in the Fe³⁺ + SCN⁻ ⇌ [FeSCN]²⁺ reaction. Observe formation of blood-red complex and measure color intensity changes using Le Chatelier's principle.",
  category: "Chemical Equilibrium",
  difficulty: "Intermediate",
  duration: 65,
  steps: 8,
  rating: 4.8,
  imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
  equipment: [
    "Test Tubes (12 pieces)",
    "Test Tube Racks (2 pieces)",
    "Graduated Pipettes",
    "Burettes",
    "Volumetric Flasks",
    "Beakers",
    "Colorimeter (optional)",
    "White Background"
  ],
  chemicals: [
    "0.002 M Ferric nitrate in 0.1 M HNO₃",
    "0.002 M Potassium thiocyanate",
    "0.1 M Nitric acid (filler)"
  ],
  objective: "To study the shift of chemical equilibrium in the reaction between ferric ions (Fe³⁺) and thiocyanate ions (SCN⁻), forming the blood-red complex [FeSCN]²⁺, by systematically varying the concentration of either ion.",
  theory: [
    "This reaction is a classic example of chemical equilibrium under Physical Chemistry.",
    "According to Le Chatelier's Principle, the position of equilibrium shifts to counter any change in concentration.",
    "Increasing Fe³⁺ or SCN⁻ concentration shifts the equilibrium towards the right, producing more blood-red [FeSCN]²⁺ complex.",
    "The intensity of the red color is proportional to the concentration of [FeSCN]²⁺, following Beer-Lambert's Law.",
    "This can be measured quantitatively using a colorimeter or spectrophotometer."
  ],
  reaction: {
    equation: "Fe³⁺(aq) + SCN⁻(aq) ⇌ [FeSCN]²⁺(aq)",
    type: "Complex formation equilibrium",
    colorChange: "Colorless → Blood-red",
    kc: "~100 (approximate equilibrium constant)"
  },
  procedure: {
    partA: {
      title: "Effect of Increasing [SCN⁻] at Constant [Fe³⁺]",
      description: "Systematic variation of SCN⁻ concentration while keeping Fe³⁺ constant",
      tubes: "T1-T6",
      feVolume: "5.00 mL constant",
      scnVolumes: ["0.00", "0.50", "1.00", "2.00", "3.00", "4.00"],
      totalVolume: "10.00 mL (filled with 0.1 M HNO₃)"
    },
    partB: {
      title: "Effect of Increasing [Fe³⁺] at Constant [SCN⁻]",
      description: "Systematic variation of Fe³⁺ concentration while keeping SCN⁻ constant",
      tubes: "T7-T12",
      scnVolume: "1.00 mL constant",
      feVolumes: ["0.50", "1.00", "2.00", "3.00", "4.00", "5.00"],
      totalVolume: "10.00 mL (filled with 0.1 M HNO₃)"
    }
  },
  stepDetails: [
    {
      id: 1,
      title: "Setup Solutions",
      description: "Prepare 0.002 M Fe³⁺ solution in 0.1 M HNO₃, 0.002 M KSCN solution, and 0.1 M HNO₃ filler. The HNO₃ prevents Fe³⁺ hydrolysis.",
      duration: "5 minutes",
      phase: "setup",
      completed: false
    },
    {
      id: 2,
      title: "Part A - Setup Test Tubes T1-T6",
      description: "Add exactly 5.00 mL of 0.002 M Fe³⁺ solution to each of the six test tubes labeled T1-T6.",
      duration: "8 minutes",
      phase: "part-a",
      completed: false
    },
    {
      id: 3,
      title: "Part A - Add Variable SCN⁻ Volumes",
      description: "Add varying volumes of SCN⁻ solution: T1(0mL), T2(0.5mL), T3(1mL), T4(2mL), T5(3mL), T6(4mL). Observe blood-red color formation.",
      duration: "10 minutes",
      phase: "part-a",
      completed: false
    },
    {
      id: 4,
      title: "Part A - Fill with HNO₃",
      description: "Fill each tube to exactly 10.00 mL total volume using 0.1 M HNO₃. Mix well and observe color intensity differences.",
      duration: "8 minutes",
      phase: "part-a",
      completed: false
    },
    {
      id: 5,
      title: "Part B - Setup Test Tubes T7-T12",
      description: "Add exactly 1.00 mL of 0.002 M SCN⁻ solution to each of the six test tubes labeled T7-T12.",
      duration: "6 minutes",
      phase: "part-b",
      completed: false
    },
    {
      id: 6,
      title: "Part B - Add Variable Fe³⁺ Volumes",
      description: "Add varying volumes of Fe³⁺ solution: T7(0.5mL), T8(1mL), T9(2mL), T10(3mL), T11(4mL), T12(5mL). Notice increasing red intensity.",
      duration: "10 minutes",
      phase: "part-b",
      completed: false
    },
    {
      id: 7,
      title: "Part B - Fill with HNO₃",
      description: "Fill each tube to exactly 10.00 mL total volume using 0.1 M HNO₃. Mix thoroughly and compare color intensities.",
      duration: "8 minutes",
      phase: "part-b",
      completed: false
    },
    {
      id: 8,
      title: "Analysis & Observations",
      description: "Document color intensity patterns, relate to Le Chatelier's principle, and optionally measure absorbance using colorimeter.",
      duration: "10 minutes",
      phase: "analysis",
      completed: false
    }
  ],
  expectedObservations: [
    "Part A: As SCN⁻ concentration increases (T1→T6), red color intensity deepens progressively",
    "Part B: As Fe³⁺ concentration increases (T7→T12), red color intensity also deepens progressively",
    "T1 shows minimal/no color (no SCN⁻), while T6 and T12 show deepest red colors",
    "Color intensity is proportional to [FeSCN]²⁺ concentration formed",
    "Both series demonstrate equilibrium shift towards product formation"
  ],
  conclusion: "The experiment successfully demonstrates Le Chatelier's Principle: equilibrium position shifts towards [FeSCN]²⁺ formation when either Fe³⁺ or SCN⁻ concentration is increased. The blood-red color intensity serves as a visual indicator of equilibrium position and can be quantified using spectrophotometry.",
  safetyInfo: "Virtual simulation - safe for all users. In real laboratory: Iron(III) compounds are corrosive and can stain. Potassium thiocyanate is toxic if ingested. Nitric acid is corrosive. Always wear safety goggles, gloves, and work in well-ventilated area. Handle all chemicals with appropriate care."
};

export default FeSCNEquilibriumData;
