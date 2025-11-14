export const COLORS = {
  CLEAR: '#f0f8ff',
  HCL_PH2: '#e53935', // red/orange for pH ~2
  ACETIC_PH3: '#fbc02d', // amber/yellow for pH ~3
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
  { id: 2, title: 'Add 0.01 M HCl', description: 'Drag the HCL bottle in the work bench and add HCl solution into the test tube.', action: 'Add HCl', equipment: ['test-tube', 'hcl-0-01m'], completed: false },
  { id: 3, title: 'Add Universal Indicator', description: 'Add indicator and read the color. Expected ~pH 2 (red/orange).', action: 'Add indicator', equipment: ['test-tube', 'universal-indicator'], completed: false },
  { id: 4, title: 'Reset and Add CH3COOH', description: 'Reset, then add acetic acid to the test tube.', action: 'Reset then add CH3COOH', equipment: ['test-tube', 'acetic-0-01m'], completed: false },
  { id: 5, title: 'Add Universal Indicator', description: 'Add indicator; expect higher pH color (orange/yellow).', action: 'Add indicator', equipment: ['test-tube', 'universal-indicator'], completed: false },
  { id: 6, title: 'Compare and Conclude', description: 'Compare colors and conclude about acid strength.', action: 'Compare', equipment: ['test-tube'], completed: false },
];

export const ANIMATION = {
  DROPPER_DURATION: 1200,
  COLOR_TRANSITION_DURATION: 1200,
} as const;
