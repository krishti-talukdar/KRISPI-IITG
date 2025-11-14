# Chemical Equilibrium Experiment Module

A complete, self-contained Chemical Equilibrium experiment module that can be easily imported into any React application.

## Overview

This module contains everything needed to run the Chemical Equilibrium experiment, including:

- 🧪 Complete experiment data and step definitions
- ⚗️ All necessary laboratory equipment components
- 🎯 Interactive chemical reagents and reactions
- 🎨 Custom UI components for the virtual laboratory
- 📊 Real-time measurements and visual feedback
- 🔄 Le Chatelier's principle demonstrations

## Quick Start

### 1. Basic Usage

```typescript
import { ChemicalEquilibriumApp } from './experiments/ChemicalEquilibrium';

function App() {
  return (
    <div>
      <ChemicalEquilibriumApp />
    </div>
  );
}
```

### 2. Using Individual Components

```typescript
import {
  ChemicalEquilibriumData,
  ChemicalEquilibriumVirtualLab,
  CHEMICAL_EQUILIBRIUM_CHEMICALS,
  CHEMICAL_EQUILIBRIUM_EQUIPMENT
} from './experiments/ChemicalEquilibrium';

function MyCustomLab() {
  return (
    <ChemicalEquilibriumVirtualLab
      step={ChemicalEquilibriumData.stepDetails[0]}
      onStepComplete={() => console.log('Step completed')}
      isActive={true}
      stepNumber={1}
      totalSteps={6}
      experimentTitle="Chemical Equilibrium"
      allSteps={ChemicalEquilibriumData.stepDetails}
      experimentStarted={true}
      onStartExperiment={() => console.log('Started')}
      isRunning={true}
      setIsRunning={(running) => console.log(running)}
      onResetTimer={() => console.log('Reset')}
    />
  );
}
```

## Module Structure

```
ChemicalEquilibrium/
├── index.ts                          # Main exports
├── README.md                         # This documentation
├── data.ts                          # Experiment data
├── types.ts                         # TypeScript definitions
├── constants.ts                     # Chemical and equipment constants
└��─ components/
    ├── ChemicalEquilibriumApp.tsx   # Main experiment application
    ├── VirtualLab.tsx               # Virtual laboratory interface
    ├── Equipment.tsx                # Laboratory equipment components
    ├── Chemical.tsx                 # Chemical reagent components
    └── WorkBench.tsx                # Laboratory workbench
```

## Available Exports

### Main Components

- `ChemicalEquilibriumApp` - Complete experiment application
- `ChemicalEquilibriumVirtualLab` - Virtual laboratory component

### Data & Configuration

- `ChemicalEquilibriumData` - Complete experiment data
- `CHEMICAL_EQUILIBRIUM_CHEMICALS` - Available chemical reagents
- `CHEMICAL_EQUILIBRIUM_EQUIPMENT` - Laboratory equipment
- `CHEMICAL_EQUILIBRIUM_FORMULAS` - Chemical formulas and equations
- `DEFAULT_MEASUREMENTS` - Default measurement values

### Types

- `ChemicalEquilibriumExperiment` - Experiment data type
- `ExperimentStep` - Individual step definition
- `Chemical` - Chemical reagent type
- `Equipment` - Equipment item type
- `EquipmentPosition` - Equipment positioning
- `CobaltReactionState` - Reaction state tracking
- `Measurements` - Real-time measurements
- `Result` - Experiment results

## Key Features

### 🎯 Interactive Chemical Reactions

- Cobalt(II) chloride equilibrium system
- Real-time color changes (pink ↔ blue)
- Temperature effects on equilibrium
- Concentration effects demonstration

### 🌡️ Temperature Control

- Hot water bath heating effects
- Ice bath cooling effects
- Visual temperature indicators
- Endothermic/exothermic reaction messages

### ⚗️ Laboratory Equipment

- Test tubes with realistic visuals
- Stirring rod with smooth dragging
- Hot and cold water beakers
- Interactive drag-and-drop interface

### 📊 Real-time Measurements

- Temperature monitoring
- Solution color tracking
- Volume measurements
- pH and molarity calculations

### 🎨 Visual Effects

- Smooth color transitions
- Heating/cooling animations
- Steam and ice crystal effects
- Professional laboratory aesthetics

## Chemical Reactions

The module demonstrates the cobalt(II) chloride equilibrium system:

```
[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O
    Pink                      Blue
```

### Le Chatelier's Principle Effects:

1. **Concentration**: Adding HCl shifts equilibrium right (pink → blue)
2. **Dilution**: Adding water shifts equilibrium left (blue → pink)
3. **Temperature**: Heating favors blue complex, cooling favors pink

## Safety Information

The module includes built-in safety reminders:

- Concentrated HCl handling warnings
- Cobalt compound toxicity information
- Temperature safety guidelines
- Proper PPE requirements

## Dependencies

Required peer dependencies:

- React 18+
- Lucide React (icons)
- Tailwind CSS (styling)
- @radix-ui/react-tooltip

## Customization

### Styling

The module uses Tailwind CSS classes and can be customized by:

- Modifying color schemes in component classes
- Adjusting animations and transitions
- Customizing laboratory equipment visuals

### Data

Experiment data can be modified in `data.ts`:

- Add/remove experiment steps
- Modify chemical properties
- Update safety information
- Change equipment lists

### Behavior

Component behavior can be customized through props:

- Custom step completion handlers
- Modified timer functionality
- Custom measurement calculations
- Alternative UI layouts

## Integration Examples

### With Next.js

```typescript
// pages/experiments/chemical-equilibrium.tsx
import dynamic from 'next/dynamic';

const ChemicalEquilibriumApp = dynamic(
  () => import('../components/experiments/ChemicalEquilibrium'),
  { ssr: false }
);

export default function ChemicalEquilibriumPage() {
  return <ChemicalEquilibriumApp />;
}
```

### With Custom State Management

```typescript
import { useState } from 'react';
import { ChemicalEquilibriumVirtualLab, ChemicalEquilibriumData } from './experiments/ChemicalEquilibrium';

function CustomExperiment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <ChemicalEquilibriumVirtualLab
      step={ChemicalEquilibriumData.stepDetails[currentStep]}
      onStepComplete={() => setCurrentStep(prev => prev + 1)}
      // ... other props
    />
  );
}
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This module is part of the larger virtual laboratory project and follows the same licensing terms.
