export const COLORS = {
  CLEAR: '#f0f8ff',
  NH4OH_BASE: '#1e88e5', // strong base → blue
  NH4_BUFFERED: '#7cb342', // buffered/basic → green-yellow
  NEUTRAL: '#4caf50',
} as const;

export const INITIAL_TESTTUBE = {
  id: 'main-tube',
  volume: 0,
  color: 'Clear',
  colorHex: COLORS.CLEAR,
  contents: [] as string[],
  temperature: 25,
};

export const GUIDED_STEPS = [
  { id: 1, title: 'Place Test Tube', description: 'Drag the test tube to the workbench.', action: 'Place test tube', equipment: ['test-tube'], completed: false },
  { id: 2, title: 'Add 0.1 M NH4OH', description: 'Drag the ammonium hydroxide bottle to the workbench and add NH4OH to the test tube.', action: 'Add NH4OH', equipment: ['test-tube', 'nh4oh-0-1m'], completed: false },
  { id: 3, title: 'Add pH Paper', description: 'Place pH paper on the workbench and use it to observe the pH change (no volume required).', action: 'Add pH paper', equipment: ['test-tube', 'ph-paper'], completed: false },
  { id: 4, title: 'Add NH4Cl (Common Ion)', description: 'Add ammonium chloride to shift equilibrium (common-ion effect).', action: 'Add NH4Cl', equipment: ['test-tube', 'nh4cl-0-1m'], completed: false },
  { id: 5, title: 'Measure and Observe pH', description: 'Measure pH after addition of NH4Cl. The pH should decrease compared to pure NH4OH.', action: 'Measure pH', equipment: ['test-tube'], completed: false },
  { id: 6, title: 'Compare and Conclude', description: 'Compare colors/measurements and conclude the effect of NH4+ on NH3/NH4+ equilibrium.', action: 'Compare', equipment: ['test-tube'], completed: false },
];

export const ANIMATION = {
  DROPPER_DURATION: 1200,
  COLOR_TRANSITION_DURATION: 1200,
} as const;
