# Equilibrium Shift: [Co(H₂O)₆]²⁺ vs Cl⁻ Ions

## Overview

This interactive virtual chemistry lab experiment demonstrates Le Chatelier's principle through the dramatic color changes in the cobalt chloride equilibrium system. Students can observe real-time equilibrium shifts by adding reagents and watching the solution change from pink to blue and back.

## Chemical System

**Equilibrium Equation:**
```
[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O
   (pink)              (blue)
```

## Features

### 🧪 Interactive Laboratory Interface
- **Test Tube Display**: Central reaction vessel showing real-time color changes
- **Reagent Bottles**: Clickable HCl and distilled water bottles with tooltips
- **Animated Droppers**: Visual feedback when adding reagents
- **Live Analysis Panel**: Dynamic explanation of current equilibrium state

### 🎨 Color Transition System
- **Pink (hexadecimal: #ffb6c1)**: [Co(H₂O)₆]²⁺ hydrated complex
- **Purple (hexadecimal: #9370db)**: Transition state with both complexes
- **Blue (hexadecimal: #4682b4)**: [CoCl₄]²⁻ chloride complex
- **Smooth animations**: 20-step color interpolation over 2 seconds

### 📚 Two Operation Modes

#### Free Mode
- Unrestricted experimentation
- Click reagent bottles to add HCl or water
- Observe equilibrium shifts in real-time
- Perfect for exploring Le Chatelier's principle

#### Guided Mode
- Step-by-step instructions
- Educational progression through the experiment
- Built-in explanations for each action
- Ideal for structured learning

### 📊 Real-Time Analysis

#### Current State Panel
- Dominant complex identification
- Color indicator
- Equilibrium explanation

#### Equilibrium Direction Indicator
- Visual arrows showing shift direction
- Left arrow: favoring hydrated complex
- Right arrow: favoring chloride complex

#### Action Log
- Records recent additions
- Shows before/after colors
- Documents equilibrium shifts

## Educational Objectives

1. **Understand Le Chatelier's Principle**: See how concentration changes affect equilibrium position
2. **Observe Chemical Equilibrium**: Watch reversible reactions in action
3. **Connect Color to Chemistry**: Relate visible changes to molecular structure
4. **Practice Lab Skills**: Virtual experience with reagent addition and observation

## Technical Implementation

### Component Structure
- **EquilibriumShiftApp**: Main application wrapper with timer and mode control
- **VirtualLab**: Core interactive laboratory interface
- **Constants**: Color definitions, animations, and equilibrium states
- **Types**: TypeScript interfaces for type safety

### Animation System
- **Dropper Animation**: 1.5-second animated reagent addition
- **Color Transitions**: Smooth 2-second color interpolation
- **Bubble Effects**: Visual feedback during equilibrium shifts

### State Management
- React hooks for experiment state
- Color transition tracking
- Experiment logging system
- Mode switching capabilities

## Usage Instructions

### Starting the Experiment
1. Click "Start Virtual Lab" to begin
2. Choose between Free Mode or Guided Mode
3. Observe the initial pink solution

### Adding Reagents
1. **Adding HCl**: Click the HCl bottle to shift equilibrium right (pink → blue)
2. **Adding Water**: Click the water bottle to shift equilibrium left (blue → pink)
3. Watch the dropper animation and color change

### Understanding Results
- Monitor the Live Analysis panel for real-time explanations
- Check the equilibrium direction arrows
- Review the action log for experiment history

## Safety Information

This is a virtual simulation safe for all users. In real laboratory conditions:
- Concentrated HCl is highly corrosive and produces toxic vapors
- Cobalt compounds are toxic and potentially carcinogenic
- Always use proper ventilation, safety goggles, and gloves
- Handle all chemicals in a fume hood

## Future Enhancements

- Temperature effects on equilibrium
- Quantitative measurements (Kc calculations)
- Additional equilibrium systems
- 3D molecular visualization
- Data export functionality
