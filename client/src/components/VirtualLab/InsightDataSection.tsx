import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Beaker, Thermometer, Droplets } from "lucide-react";

interface InsightDataSectionProps {
  onBack: () => void;
  onComplete: () => void;
}

export const InsightDataSection: React.FC<InsightDataSectionProps> = ({
  onBack,
  onComplete,
}) => {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-full p-2">
                <Beaker className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-800">
                  Color Change Analysis
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Understanding Le Chatelier's Principle
                </p>
              </div>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-6">
          {/* Color indicators section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                <Droplets className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <h3 className="font-semibold text-pink-800 text-center">
                  Pink Solution
                </h3>
                <p className="text-sm text-pink-600 text-center">
                  Hydrated cobalt complex
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Beaker className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800 text-center">
                  Blue Solution
                </h3>
                <p className="text-sm text-blue-600 text-center">
                  Chloride complex
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <Thermometer className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-800 text-center">
                  Temperature Effect
                </h3>
                <p className="text-sm text-orange-600 text-center">
                  Equilibrium shifts
                </p>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-center">
                <Beaker className="mr-2 h-6 w-6 text-blue-500" />
                Color Change Analysis Table
              </h2>

              {/* Table container with scroll */}
              <div className="w-full border border-gray-200 rounded-lg">
                <table className="w-full border-collapse border-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        S.No.
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Action / Condition Applied
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Observation (Colour Change)
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Explanation (Equilibrium Shift)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        1
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Prepared cobalt chloride solution in distilled water
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                          Pink
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Formation of hydrated cobalt complex [Co(H₂O)₆]²⁺
                      </td>
                    </tr>
                    <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        2
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Added concentrated HCl
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 mr-2">
                          Pink
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-2">
                          Blue
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Increase in Cl⁻ concentration shifts equilibrium towards
                        [CoCl₄]²⁻ (blue complex)
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        3
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Heated the solution (≈60°C)
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 mr-1">
                          Pink/Blue
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-1">
                          Darker Blue
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Endothermic forward reaction favoured at higher
                        temperature
                      </td>
                    </tr>
                    <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        4
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Cooled the solution in ice water
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">
                          Blue
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 ml-2">
                          Pink
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Exothermic reverse reaction favoured at lower
                        temperature
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        5
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Diluted blue solution with distilled water
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">
                          Blue
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 ml-2">
                          Pink
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        Decrease in Cl⁻ concentration shifts equilibrium back to
                        hydrated complex
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  🔬 Le Chatelier's Principle in Action
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  This experiment demonstrates how chemical equilibrium responds
                  to changes in concentration, temperature, and dilution. The
                  reversible reaction between [Co(H₂O)₆]²⁺ (pink) and [CoCl��]²⁻
                  (blue) complexes shifts according to Le Chatelier's principle,
                  helping us understand how systems maintain equilibrium when
                  disturbed.
                </p>
              </div>
            </div>
          </div>

          {/* Completion Button Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 text-center">
            <Button
              onClick={onComplete}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              size="lg"
            >
              Complete Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
