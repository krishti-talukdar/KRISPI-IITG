import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorCalculationProps {
  actualMass: number;
  targetMass: number;
  actualMolarity: number;
  targetMolarity: number;
  isVisible: boolean;
  onAnalysisComplete: () => void;
}

interface ErrorAnalysis {
  massError: number;
  molarityError: number;
  accuracy: "Excellent" | "Good" | "Acceptable" | "Poor";
  precision: "High" | "Medium" | "Low";
  sources: string[];
  recommendations: string[];
}

export const ErrorCalculation: React.FC<ErrorCalculationProps> = ({
  actualMass,
  targetMass,
  actualMolarity,
  targetMolarity,
  isVisible,
  onAnalysisComplete,
}) => {
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const calculationSteps = [
    {
      title: "Mass Error Calculation",
      formula: "% Error = |Actual - Target| / Target × 100%",
      calculation: `|${actualMass.toFixed(4)} - ${targetMass.toFixed(4)}| / ${targetMass.toFixed(4)} × 100%`,
      result: Math.abs((actualMass - targetMass) / targetMass * 100),
      unit: "%",
    },
    {
      title: "Molarity Error Calculation",
      formula: "% Error = |Actual - Target| / Target × 100%",
      calculation: `|${actualMolarity.toFixed(6)} - ${targetMolarity.toFixed(3)}| / ${targetMolarity.toFixed(3)} × 100%`,
      result: Math.abs((actualMolarity - targetMolarity) / targetMolarity * 100),
      unit: "%",
    },
    {
      title: "Accuracy Assessment",
      formula: "Based on percentage error ranges",
      calculation: "Error classification and quality evaluation",
      result: 0, // Will be calculated based on error percentages
      unit: "",
    },
    {
      title: "Error Source Analysis",
      formula: "Systematic vs Random Error Identification",
      calculation: "Analysis of potential sources and recommendations",
      result: 0,
      unit: "",
    },
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      
      const massError = Math.abs((actualMass - targetMass) / targetMass * 100);
      const molarityError = Math.abs((actualMolarity - targetMolarity) / targetMolarity * 100);
      
      let accuracy: ErrorAnalysis["accuracy"];
      let precision: ErrorAnalysis["precision"];
      
      // Determine accuracy based on error percentage
      if (molarityError < 0.5) {
        accuracy = "Excellent";
        precision = "High";
      } else if (molarityError < 1.0) {
        accuracy = "Good";
        precision = "High";
      } else if (molarityError < 2.0) {
        accuracy = "Acceptable";
        precision = "Medium";
      } else {
        accuracy = "Poor";
        precision = "Low";
      }

      // Identify error sources
      const sources: string[] = [];
      const recommendations: string[] = [];

      if (massError > 0.5) {
        sources.push("Weighing technique error");
        recommendations.push("Use more precise analytical balance technique");
      }
      
      if (molarityError > massError * 1.2) {
        sources.push("Volumetric transfer losses");
        recommendations.push("Ensure complete transfer with thorough rinsing");
      }
      
      if (Math.abs(actualMass - targetMass) > 0.01) {
        sources.push("Balance precision limitations");
        recommendations.push("Use a more precise analytical balance");
      }

      // Add general sources and recommendations
      sources.push("Human error in measurement");
      sources.push("Environmental conditions (temperature, humidity)");
      sources.push("Instrument calibration variations");
      
      recommendations.push("Repeat the preparation for better precision");
      recommendations.push("Control environmental conditions");
      recommendations.push("Regular instrument calibration");

      setAnalysis({
        massError,
        molarityError,
        accuracy,
        precision,
        sources,
        recommendations,
      });

      // Step through the calculation
      const stepTimer = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= calculationSteps.length) {
            clearInterval(stepTimer);
            setTimeout(() => onAnalysisComplete(), 2000);
            return prev;
          }
          return next;
        });
      }, 2000);

      return () => clearInterval(stepTimer);
    }
  }, [isVisible, actualMass, targetMass, actualMolarity, targetMolarity, onAnalysisComplete]);

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case "Excellent": return "text-green-600 bg-green-100 border-green-300";
      case "Good": return "text-blue-600 bg-blue-100 border-blue-300";
      case "Acceptable": return "text-yellow-600 bg-yellow-100 border-yellow-300";
      case "Poor": return "text-red-600 bg-red-100 border-red-300";
      default: return "text-gray-600 bg-gray-100 border-gray-300";
    }
  };

  const getAccuracyIcon = (accuracy: string) => {
    switch (accuracy) {
      case "Excellent": return <CheckCircle className="w-5 h-5" />;
      case "Good": return <Target className="w-5 h-5" />;
      case "Acceptable": return <TrendingUp className="w-5 h-5" />;
      case "Poor": return <AlertTriangle className="w-5 h-5" />;
      default: return <TrendingDown className="w-5 h-5" />;
    }
  };

  if (!isVisible || !analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Error Analysis & Accuracy Assessment</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${getAccuracyColor(analysis.accuracy)}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getAccuracyIcon(analysis.accuracy)}
                <span className="font-semibold">Overall Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{analysis.accuracy}</div>
              <div className="text-sm">
                Molarity Error: {analysis.molarityError.toFixed(3)}%
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-600">Mass Precision</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {analysis.massError.toFixed(3)}%
              </div>
              <div className="text-sm text-blue-600">
                Δm = {(actualMass - targetMass).toFixed(4)} g
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-600">Precision</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {analysis.precision}
              </div>
              <div className="text-sm text-purple-600">
                Measurement quality
              </div>
            </div>
          </div>

          {/* Step-by-step calculations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Calculation Steps</h3>
            
            {calculationSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.3,
                  x: 0,
                }}
                className={`p-4 rounded-lg border transition-all ${
                  index <= currentStep 
                    ? "bg-white border-blue-200 shadow-sm" 
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                    
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm space-y-1">
                      <div className="text-blue-600 font-semibold">{step.formula}</div>
                      <div className="text-gray-700">{step.calculation}</div>
                      {step.result !== 0 && (
                        <div className="text-green-600 font-semibold">
                          = {step.result.toFixed(3)} {step.unit}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error sources and recommendations */}
          {currentStep >= calculationSteps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                  Potential Error Sources
                </h4>
                <ul className="space-y-2">
                  {analysis.sources.map((source, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{source}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Improvement Recommendations
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Statistical analysis */}
          {currentStep >= calculationSteps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 p-4 rounded-lg"
            >
              <h4 className="font-semibold text-gray-900 mb-3">Statistical Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Target Mass</div>
                  <div className="font-bold">{targetMass.toFixed(4)} g</div>
                </div>
                <div>
                  <div className="text-gray-600">Actual Mass</div>
                  <div className="font-bold">{actualMass.toFixed(4)} g</div>
                </div>
                <div>
                  <div className="text-gray-600">Target Molarity</div>
                  <div className="font-bold">{targetMolarity.toFixed(3)} M</div>
                </div>
                <div>
                  <div className="text-gray-600">Actual Molarity</div>
                  <div className="font-bold">{actualMolarity.toFixed(6)} M</div>
                </div>
              </div>
            </motion.div>
          )}

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ErrorCalculation;
