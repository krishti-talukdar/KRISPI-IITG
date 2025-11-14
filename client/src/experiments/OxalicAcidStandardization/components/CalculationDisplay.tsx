import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalculationStep {
  id: string;
  title: string;
  formula: string;
  substitution: string;
  result: string;
  explanation: string;
  unit: string;
}

interface CalculationDisplayProps {
  isVisible: boolean;
  targetMolarity: number;
  targetVolume: number; // in L
  molecularWeight: number;
  onCalculationComplete: (mass: number) => void;
}

export const CalculationDisplay: React.FC<CalculationDisplayProps> = ({
  isVisible,
  targetMolarity,
  targetVolume,
  molecularWeight,
  onCalculationComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const calculationSteps: CalculationStep[] = [
    {
      id: "1",
      title: "Step 1: Identify Given Values",
      formula: "Given:",
      substitution: `M = ${targetMolarity} mol/L\nV = ${targetVolume} L\nMW = ${molecularWeight} g/mol`,
      result: "Values identified",
      explanation: "We need these three values to calculate the required mass",
      unit: "",
    },
    {
      id: "2",
      title: "Step 2: Apply Molarity Formula",
      formula: "M = n/V",
      substitution: `${targetMolarity} = n/${targetVolume}`,
      result: `n = ${(targetMolarity * targetVolume).toFixed(4)}`,
      explanation: "Calculate moles of solute needed",
      unit: "mol",
    },
    {
      id: "3",
      title: "Step 3: Convert Moles to Mass",
      formula: "m = n × MW",
      substitution: `m = ${(targetMolarity * targetVolume).toFixed(4)} × ${molecularWeight}`,
      result: `m = ${(targetMolarity * targetVolume * molecularWeight).toFixed(4)}`,
      explanation: "Convert moles to grams using molecular weight",
      unit: "g",
    },
    {
      id: "4",
      title: "Step 4: Final Result",
      formula: "Required mass of H₂C₂O₄·2H₂O",
      substitution: `m = ${(targetMolarity * targetVolume * molecularWeight).toFixed(4)} g`,
      result: `${(targetMolarity * targetVolume * molecularWeight).toFixed(4)} g`,
      explanation: `Weigh exactly ${(targetMolarity * targetVolume * molecularWeight).toFixed(4)} g of oxalic acid dihydrate`,
      unit: "",
    },
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          setCompletedSteps(current => {
            const nextSet = new Set(current);
            nextSet.add(prev);
            return nextSet;
          });
          
          if (next >= calculationSteps.length) {
            clearInterval(timer);
            setTimeout(() => {
              onCalculationComplete(targetMolarity * targetVolume * molecularWeight);
            }, 1000);
            return prev;
          }
          return next;
        });
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [isVisible, targetMolarity, targetVolume, molecularWeight, onCalculationComplete, calculationSteps.length]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            <span>Standard Solution Calculation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Objective</h3>
            <p className="text-blue-800 text-sm">
              Calculate the mass of oxalic acid dihydrate (H₂C₂O₄·2H₂O) needed to prepare{" "}
              {targetVolume * 1000} mL of {targetMolarity} M solution.
            </p>
          </div>

          <div className="space-y-3">
            {calculationSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.3,
                  x: 0,
                  scale: index === currentStep ? 1.02 : 1,
                }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  completedSteps.has(index) 
                    ? "bg-green-50 border-green-200" 
                    : index === currentStep
                    ? "bg-yellow-50 border-yellow-200 shadow-md"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    completedSteps.has(index)
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}>
                    {completedSteps.has(index) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    
                    <div className="bg-white p-3 rounded border font-mono text-sm">
                      <div className="text-blue-600 font-semibold mb-1">{step.formula}</div>
                      <div className="text-gray-700 whitespace-pre-line">{step.substitution}</div>
                      {step.result && (
                        <div className="mt-2 pt-2 border-t">
                          <ChevronRight className="w-4 h-4 inline mr-1 text-green-600" />
                          <span className="text-green-600 font-semibold">
                            {step.result} {step.unit}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600">{step.explanation}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {currentStep >= calculationSteps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border border-green-300 rounded-lg p-4 text-center"
            >
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 mb-1">Calculation Complete!</h3>
              <p className="text-green-700 text-sm">
                Proceed to weigh {(targetMolarity * targetVolume * molecularWeight).toFixed(4)} g of oxalic acid dihydrate.
              </p>
            </motion.div>
          )}

          {/* Formula reference */}
          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Key Formulas Used:</h4>
            <div className="space-y-1 text-sm font-mono">
              <div>M = n/V (Molarity = moles/volume)</div>
              <div>n = m/MW (moles = mass/molecular weight)</div>
              <div>∴ m = M × V × MW (combined formula)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CalculationDisplay;
