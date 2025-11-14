import React from "react";
import { Wrench } from "lucide-react";
import { Equipment, FESCN_EQUIPMENT } from "./Equipment";

interface EquipmentToolbarProps {
  experimentStarted: boolean;
  currentStep: number;
}

export const EquipmentToolbar: React.FC<EquipmentToolbarProps> = ({
  experimentStarted,
  currentStep,
}) => {
  // Determine which equipment should be available based on current step
  const getAvailableEquipment = () => {
    const baseEquipment = ['test-tube-rack-a', 'graduated-pipette'];
    
    if (currentStep >= 2) {
      baseEquipment.push('burette');
    }
    if (currentStep >= 5) {
      baseEquipment.push('test-tube-rack-b');
    }
    if (currentStep >= 7) {
      baseEquipment.push('colorimeter', 'volumetric-flask');
    }
    
    return FESCN_EQUIPMENT.filter(eq => baseEquipment.includes(eq.id));
  };

  const availableEquipment = getAvailableEquipment();

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center">
          <Wrench className="w-4 h-4 mr-2 text-red-600" />
          Laboratory Equipment
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">
            Drag equipment to workbench
          </span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        {availableEquipment.map((equipment) => (
          <div key={equipment.id} className="flex-shrink-0">
            <Equipment
              id={equipment.id}
              name={equipment.name}
              icon={equipment.icon}
              disabled={!experimentStarted}
            />
          </div>
        ))}
        
        {/* Equipment availability hints */}
        {currentStep < 2 && (
          <div className="flex-shrink-0 text-center p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-sm text-gray-500">
              More equipment unlocks<br />as you progress
            </div>
          </div>
        )}
      </div>
      
      {/* Equipment usage hints */}
      <div className="mt-3 text-xs text-gray-600 bg-blue-50 rounded-lg p-2">
        <div className="flex items-start space-x-2">
          <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <strong>Step {currentStep} Equipment:</strong>
            {currentStep <= 1 && " Start with test tube rack A and graduated pipette"}
            {currentStep === 2 && " Add burette for precise Fe³⁺ solution dispensing"}
            {currentStep >= 3 && currentStep < 5 && " Continue with Part A measurements"}
            {currentStep === 5 && " Add test tube rack B for Part B experiments"}
            {currentStep >= 6 && currentStep < 7 && " Complete Part B measurements"}
            {currentStep >= 7 && " Use colorimeter for quantitative analysis"}
          </div>
        </div>
      </div>
    </div>
  );
};
