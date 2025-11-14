import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { TITRATION_EQUIPMENT, TITRATION_CHEMICALS, SAFETY_GUIDELINES } from '../constants';

interface WorkspaceEquipmentProps {
  onEquipmentSelect?: (equipmentId: string) => void;
  selectedEquipment?: string[];
}

export const WorkspaceEquipment: React.FC<WorkspaceEquipmentProps> = ({
  onEquipmentSelect,
  selectedEquipment = []
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equipment Section */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Required Equipment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Essential glassware and apparatus for accurate titration analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TITRATION_EQUIPMENT.map((equipment: any) => (
              <div
                key={equipment.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedEquipment.includes(equipment.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onEquipmentSelect?.(equipment.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0">
                    {equipment.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {equipment.name}
                    </h4>
                    {equipment.capacity && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {equipment.capacity}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {equipment.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chemicals & Solutions Section */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
            Chemicals & Solutions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Standard solutions and indicators required for the titration
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TITRATION_CHEMICALS.map((chemical: any) => (
              <div
                key={chemical.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: chemical.color }}
                  ></div>
                  <div>
                    <h4 className="font-medium text-sm">{chemical.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {chemical.formula}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {chemical.concentration}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{chemical.volume} mL</span>
                  {chemical.molecularWeight && (
                    <p className="text-xs text-muted-foreground">
                      MW: {chemical.molecularWeight} g/mol
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Guidelines Section */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Safety Guidelines
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Important safety precautions for handling chemicals and equipment
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAFETY_GUIDELINES.map((guideline: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                <p className="text-sm leading-relaxed">{guideline}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workspace Setup Instructions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Workspace Setup Instructions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Follow these steps to prepare your titration workspace properly
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600">1. Arrange Equipment</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Set up burette stand on stable surface</li>
                <li>• Position white tile under conical flask</li>
                <li>• Keep wash bottle within easy reach</li>
                <li>• Arrange pipette and funnel nearby</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">2. Prepare Solutions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Check 0.1N oxalic acid concentration</li>
                <li>• Ensure NaOH solution is well-mixed</li>
                <li>• Prepare phenolphthalein indicator</li>
                <li>• Have distilled water ready for rinsing</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-purple-600">3. Safety Check</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Wear appropriate safety equipment</li>
                <li>• Ensure proper ventilation</li>
                <li>• Check for any equipment damage</li>
                <li>• Keep emergency wash available</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceEquipment;
