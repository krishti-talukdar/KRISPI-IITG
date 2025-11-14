# Study of Equilibrium Shift between Ferric Ions and Thiocyanate Ions

## Overview

This comprehensive virtual chemistry lab experiment demonstrates Le Chatelier's principle through the systematic study of the equilibrium between ferric ions (Fe³⁺) and thiocyanate ions (SCN⁻), forming the distinctive blood-red iron(III) thiocyanate complex [FeSCN]²⁺.

## Chemical System

**Equilibrium Equation:**
```
Fe³⁺(aq) + SCN⁻(aq) ⇌ [FeSCN]²⁺(aq)
(colorless)           (blood-red)
```

**Equilibrium Constant:** Kc ≈ 100 (approximate)

## Experiment Objective

To study the shift of chemical equilibrium by systematically varying the concentration of either Fe³⁺ or SCN⁻ ions and observing the formation and intensity of the blood-red [FeSCN]²⁺ complex.

## Educational Theory

### Le Chatelier's Principle
- The position of equilibrium shifts to counter any change in concentration
- Increasing Fe³⁺ or SCN⁻ concentration shifts equilibrium toward product formation
- The intensity of red color is proportional to [FeSCN]²⁺ concentration

### Beer-Lambert Law
- Color intensity correlates with complex concentration
- Quantitative analysis possible using spectrophotometry
- Absorbance measurements at 447 nm wavelength

## Experimental Design

### Part A: Effect of Increasing [SCN⁻] at Constant [Fe³⁺]

**Test Tubes:** T1-T6
- **Constant:** 5.00 mL of 0.002 M Fe³⁺ solution in each tube
- **Variable:** SCN⁻ volumes (0.00, 0.50, 1.00, 2.00, 3.00, 4.00 mL)
- **Total Volume:** 10.00 mL (filled with 0.1 M HNO₃)

### Part B: Effect of Increasing [Fe³⁺] at Constant [SCN⁻]

**Test Tubes:** T7-T12
- **Constant:** 1.00 mL of 0.002 M SCN⁻ solution in each tube
- **Variable:** Fe³⁺ volumes (0.50, 1.00, 2.00, 3.00, 4.00, 5.00 mL)
- **Total Volume:** 10.00 mL (filled with 0.1 M HNO₃)

## Virtual Lab Features

### 🧪 Interactive Laboratory Interface

#### Test Tube Rack System
- **12 test tubes** arranged in two groups (T1-T6, T7-T12)
- **Real-time color visualization** based on [FeSCN]²⁺ concentration
- **Completion indicators** for each tube
- **Volume tracking** and measurement display

#### Solution Dispensing System
- **Three solution bottles:** Fe(NO₃)₃, KSCN, HNO₃
- **Graduated pipettes** with precise volume control
- **Animated solution addition** with visual feedback
- **Automatic volume calculation** for optimal concentrations

#### Color Intensity Visualization
- **Blood-red color gradient** from colorless to deep red
- **Intensity percentage** display (0-100%)
- **Real-time color transitions** during solution mixing
- **Visual mixing effects** for high-concentration tubes

### 📊 Analysis and Data Collection

#### Live Observations Panel
- **Experiment progress tracking** (Part A/B completion)
- **Color intensity monitoring** with maximum values
- **Phase progression** indicators
- **Completion statistics**

#### Colorimetry Data
- **Absorbance measurements** at 447 nm
- **Transmittance calculations**
- **Concentration estimates** for [FeSCN]²⁺
- **Spectrophotometric analysis** simulation

#### Experiment Logging
- **Action history** with timestamps
- **Volume additions** recorded per tube
- **Color changes** documented
- **Observation notes** for each step

### 🎯 Educational Modes

#### Step-by-Step Guided Mode
- **8 detailed steps** with specific instructions
- **Phase progression** from setup through analysis
- **Real-time hints** and educational explanations
- **Automatic advancement** based on completion

#### Free Exploration Mode
- **Unrestricted experimentation** with all solutions
- **Custom volume selections** for advanced users
- **Hypothesis testing** capabilities
- **Independent investigation** opportunities

## Technical Implementation

### Component Architecture
- **FeSCNEquilibriumApp:** Main application with timer and phase management
- **VirtualLab:** Core interactive laboratory interface
- **Constants:** Color calculations, tube configurations, and animations
- **Types:** Comprehensive TypeScript interfaces for type safety

### Color Calculation System
```typescript
calculateColorIntensity(feVolume: number, scnVolume: number): number
```
- **Equilibrium calculations** based on limiting reagent
- **Color intensity mapping** (0-100 scale)
- **Hex color conversion** for visual representation
- **Real-time recalculation** on solution addition

### Animation System
- **Pipette animations:** 2-second solution dispensing
- **Color transitions:** Smooth intensity changes
- **Mixing effects:** Bubble animations for high concentrations
- **Visual feedback:** Toast notifications and progress indicators

## Expected Observations

### Part A Results (Variable [SCN⁻])
- **T1 (0 mL SCN⁻):** Colorless - no complex formation
- **T2-T6:** Progressively deeper red color with increasing SCN⁻
- **Maximum intensity:** T6 with highest [SCN⁻] concentration

### Part B Results (Variable [Fe³⁺])
- **T7-T12:** Progressively deeper red color with increasing Fe³⁺
- **Color gradient:** Clear demonstration of concentration effects
- **Maximum intensity:** T12 with highest [Fe³⁺] concentration

### Le Chatelier's Principle Demonstration
- **Equilibrium shifts right** with increased reactant concentration
- **Color intensity proportional** to product formation
- **Quantitative relationship** between concentration and absorbance

## Conclusion

This experiment successfully demonstrates:
1. **Le Chatelier's Principle** through visual color changes
2. **Quantitative equilibrium analysis** using spectrophotometry
3. **Systematic experimental design** with controlled variables
4. **Real-world laboratory techniques** in virtual environment

## Safety Information

**Virtual Simulation - Safe for All Users**

In real laboratory conditions:
- **Iron(III) compounds:** Corrosive, can cause staining
- **Potassium thiocyanate:** Toxic if ingested
- **Nitric acid:** Corrosive, requires proper ventilation
- **Required PPE:** Safety goggles, gloves, lab coat
- **Work environment:** Well-ventilated area or fume hood

## Future Enhancements

- **Temperature effects** on equilibrium position
- **pH influence** on complex stability
- **Quantitative Kc calculations** with data export
- **3D molecular visualization** of complex formation
- **Real spectrophotometer** interface simulation
- **Statistical analysis** of experimental data

## Usage Instructions

1. **Start the experiment** and select guided or free mode
2. **Part A:** Add Fe³⁺ solutions to T1-T6, then variable SCN⁻ volumes
3. **Fill with HNO₃** to reach 10.0 mL total volume
4. **Part B:** Add SCN⁻ solutions to T7-T12, then variable Fe³⁺ volumes
5. **Fill with HNO₃** and complete the second series
6. **Analyze results** using the built-in colorimetry data
7. **Document observations** and relate to Le Chatelier's principle

The virtual lab provides an authentic laboratory experience while ensuring complete safety and unlimited experimentation opportunities.
