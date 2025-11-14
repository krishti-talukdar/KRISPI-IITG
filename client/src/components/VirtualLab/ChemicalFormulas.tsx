import React from "react";
import { FlaskConical, ArrowRight, CheckCircle } from "lucide-react";

interface ChemicalFormulasProps {
  experimentTitle: string;
}

export const ChemicalFormulas: React.FC<ChemicalFormulasProps> = ({
  experimentTitle,
}) => {
  if (!experimentTitle.includes("Equilibrium")) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center">
          <FlaskConical className="w-4 h-4 mr-2 text-blue-600" />
          Chemical Formulas
        </h3>
      </div>

      <div className="space-y-4">
        {/* Initial Reaction */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 text-xs mb-2 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            When we add cobalt chloride to water
          </h4>
          <div className="text-xs text-blue-700 leading-relaxed">
            <div className="font-mono text-xs bg-white p-2 rounded border mb-2">
              CoCl₂ + 6H₂O → [Co(H₂O)₆]²⁺ + 2Cl⁻
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Cobalt chloride dissolves in water</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Forms [Co(H₂O)₆]²⁺, which is pink in colour</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Releases Cl⁻ ions into solution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equilibrium Reaction */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 text-xs mb-2 flex items-center">
            ⭐ When we add concentrated HCl
          </h4>
          <div className="text-xs text-yellow-700 leading-relaxed">
            <div className="font-mono text-xs bg-white p-2 rounded border mb-2">
              [Co(H₂O)₆]²⁺ + 4Cl⁻ ⇋ [CoCl₄]²⁻ + 6H₂O
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Adding HCl increases Cl⁻ concentration in solution</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>
                  Equilibrium shifts to the right (Le Chatelier's Principle)
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Forms [CoCl₄]²⁻, which is blue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Change Indicator */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-pink-300 rounded-full border border-pink-400"></div>
              <span className="text-gray-700">Pink</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-300 rounded-full border border-blue-400"></div>
              <span className="text-gray-700">Blue</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-pink-300 rounded-full border border-pink-400"></div>
              <span className="text-gray-700">Pink</span>
            </div>
          </div>
          <div className="text-center text-xs text-gray-600 mt-1">
            Equilibrium shifts based on conditions
          </div>
        </div>
      </div>
    </div>
  );
};
