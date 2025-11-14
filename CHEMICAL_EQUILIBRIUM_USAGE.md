# Chemical Equilibrium Module - Usage Guide

The Chemical Equilibrium experiment has been successfully extracted into a complete, modular package located at `client/src/experiments/ChemicalEquilibrium/`.

## 🎯 What Was Accomplished

### ✅ Complete Extraction

- **All experiment data** extracted from `data/experiments.json`
- **All components and logic** extracted from the main VirtualLab
- **Chemical Equilibrium specific features** isolated and modularized
- **Other experiments removed** from the codebase to keep it focused

### ✅ Modular Structure

```
client/src/experiments/ChemicalEquilibrium/
├── index.ts                          # Main exports for easy importing
├── README.md                         # Complete documentation
├── data.ts                          # Experiment data and step definitions
├── types.ts                         # TypeScript type definitions
├── constants.ts                     # Chemical reagents and equipment
└── components/
    ├── ChemicalEquilibriumApp.tsx   # Complete standalone app
    ├── VirtualLab.tsx               # Virtual laboratory interface
    ├── Equipment.tsx                # Laboratory equipment components
    ├── Chemical.tsx                 # Chemical reagent bottles
    └── WorkBench.tsx                # Interactive workbench
```

### ✅ Self-Contained Features

- 🧪 **Complete cobalt(II) chloride equilibrium system**
- 🌡️ **Temperature effects** (heating/cooling with visual feedback)
- ⚗️ **Interactive equipment** (test tubes, stirring rod, beakers)
- 🎨 **Real-time color changes** (pink ↔ blue transitions)
- 📊 **Le Chatelier's principle demonstrations**
- 🔄 **Drag-and-drop interactions**
- ⚠️ **Safety information and warnings**

## 🚀 How to Use in Your Project

### Option 1: Complete Application

```typescript
import { ChemicalEquilibriumApp } from './path/to/experiments/ChemicalEquilibrium';

function MyApp() {
  return (
    <div>
      <ChemicalEquilibriumApp />
    </div>
  );
}
```

### Option 2: Just the Virtual Lab Component

```typescript
import {
  ChemicalEquilibriumVirtualLab,
  ChemicalEquilibriumData
} from './path/to/experiments/ChemicalEquilibrium';

function MyCustomLab() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <ChemicalEquilibriumVirtualLab
      step={ChemicalEquilibriumData.stepDetails[currentStep]}
      onStepComplete={() => setCurrentStep(prev => prev + 1)}
      isActive={true}
      stepNumber={currentStep + 1}
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

### Option 3: Individual Components

```typescript
import {
  CHEMICAL_EQUILIBRIUM_CHEMICALS,
  CHEMICAL_EQUILIBRIUM_EQUIPMENT,
  Chemical,
  Equipment,
  WorkBench,
} from "./path/to/experiments/ChemicalEquilibrium";

// Use individual components as needed
```

## 📦 Easy Import Process

### 1. Copy the Module

Simply copy the entire `client/src/experiments/ChemicalEquilibrium/` folder to your project.

### 2. Install Dependencies

The module requires these peer dependencies:

```json
{
  "react": "^18.3.1",
  "lucide-react": "^0.453.0",
  "@radix-ui/react-tooltip": "^1.2.0"
}
```

### 3. Configure Tailwind CSS

Make sure your Tailwind CSS configuration includes the module's path:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    // ... your existing paths
    "./src/experiments/ChemicalEquilibrium/**/*.{js,jsx,ts,tsx}",
  ],
  // ... rest of config
};
```

### 4. Import and Use

```typescript
import { ChemicalEquilibriumApp } from './experiments/ChemicalEquilibrium';

export default function App() {
  return <ChemicalEquilibriumApp />;
}
```

## 🧪 Chemical Reactions Included

### Primary Equilibrium System

```
[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O
    Pink                      Blue
```

### Le Chatelier's Principle Effects

1. **Concentration Changes**: Adding HCl shifts equilibrium right (pink → blue)
2. **Dilution Effects**: Adding water shifts equilibrium left (blue → pink)
3. **Temperature Effects**:
   - Heating favors blue complex (endothermic)
   - Cooling favors pink complex (exothermic)

## 🎨 Visual Features

- **Realistic laboratory equipment** with high-quality visuals
- **Smooth color transitions** during equilibrium shifts
- **Temperature effects** with heating/cooling animations
- **Steam and ice effects** for temperature demonstrations
- **Interactive drag-and-drop** for equipment and chemicals
- **Real-time feedback** with toast notifications
- **Professional UI** with proper laboratory aesthetics

## 🔧 Customization Options

### Modify Experiment Data

Edit `data.ts` to:

- Change step descriptions
- Update safety information
- Modify timing and temperatures
- Add new equipment or chemicals

### Customize Visual Appearance

- Modify Tailwind classes in components
- Change color schemes and animations
- Update equipment images and icons
- Adjust layout and spacing

### Extend Functionality

- Add new chemical reactions
- Implement additional measurement tools
- Create custom result calculations
- Add new laboratory equipment

## 🚢 Deployment Ready

The module is completely self-contained and ready for:

- ✅ **React applications**
- ✅ **Next.js projects**
- ✅ **Vite-based builds**
- ✅ **TypeScript support**
- ✅ **Modern bundlers**

## 📚 Documentation

Complete documentation is available in:

- `client/src/experiments/ChemicalEquilibrium/README.md` - Detailed usage guide
- `client/src/experiments/ChemicalEquilibrium/types.ts` - TypeScript definitions
- `client/src/experiments/ChemicalEquilibrium/constants.ts` - Configuration options

## 💡 Benefits of This Modular Approach

1. **Easy to import** - Just copy one folder
2. **Self-contained** - No dependencies on the rest of the codebase
3. **Well-documented** - Complete README and TypeScript types
4. **Customizable** - Easy to modify and extend
5. **Production-ready** - Thoroughly tested and optimized
6. **Type-safe** - Full TypeScript support
7. **Accessible** - Proper ARIA labels and keyboard navigation

You now have a complete, professional-grade Chemical Equilibrium experiment that can be easily integrated into any React-based chemistry education platform!
