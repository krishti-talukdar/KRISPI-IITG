const EquilibriumShiftData = {
  id: 5,
  title: "To study the shift in equilibrium between [Co(H2O)6]²+ and Cl- by changing the concentration of either ions.",
  description: "Interactive virtual lab to study equilibrium shifts between cobalt complexes. Observe dramatic color changes from pink to blue as you add HCl or water, demonstrating Le Chatelier's principle in real-time.",
  category: "Equilibrium",
  difficulty: "Intermediate",
  duration: 25,
  steps: 7,
  rating: 4.9,
  imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
  equipment: [
    "25ml Test Tube",
    "Reagent Bottles",
    "Graduated Droppers",
    "Stirring Rod",
    "Thermometer",
    "Color Chart"
  ],
  stepDetails: [
    {
      id: 1,
      title: "Setup and Observe",
      description: "Set up the apparatus. You will observe the solution state after adding the cobalt(II) solution in the next step.",
      duration: "2 minutes",
      temperature: "Room temperature",
      completed: false
    },
    {
      id: 2,
      title: "Add Cobalt(II) Solution",
      description: "From the equipment section, drag the cobalt(II) solution to the test tube to prepare the initial pink [Co(H₂O)₆]²⁺ solution.",
      duration: "2 minutes",
      completed: false
    },
    {
      id: 3,
      title: "Add Concentrated HCl",
      description: "Click the HCl reagent bottle twice. First click: observe pink to purple transition. Second click: complete the shift from purple to blue as Cl⁻ ions fully shift equilibrium right.",
      duration: "4 minutes",
      safety: "HCl is corrosive - handle with care",
      completed: false
    },
    {
      id: 4,
      title: "Observe Blue Complex",
      description: "Study the blue [CoCl₄]²⁻ complex that forms. Read the dynamic explanation panel to understand the equilibrium shift.",
      duration: "3 minutes",
      completed: false
    },
    {
      id: 5,
      title: "Add Distilled Water",
      description: "Click the water bottle twice. First click: observe blue to purple transition. Second click: complete the reverse shift from purple to pink as dilution shifts equilibrium left.",
      duration: "4 minutes",
      completed: false
    },
    {
      id: 6,
      title: "Repeat and Experiment",
      description: "Alternate between adding HCl (2 clicks: pink→purple→blue) and water (2 clicks: blue→purple→pink) to observe multiple equilibrium shifts. Notice the gradual color transitions through purple intermediate state.",
      duration: "8 minutes",
      completed: false
    },
    {
      id: 7,
      title: "Step-by-Step Mode",
      description: "Use guided mode for structured learning with detailed instructions at each step. Perfect for understanding the underlying chemistry.",
      duration: "4 minutes",
      completed: false
    }
  ],
  safetyInfo: "This is a virtual simulation. In real lab conditions: Concentrated HCl is highly corrosive and produces toxic vapors. Cobalt compounds are toxic and potentially carcinogenic. Always use proper ventilation, safety goggles, and gloves. Handle all chemicals in a fume hood."
};

export default EquilibriumShiftData;
