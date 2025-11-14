import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Atom, Eye, RotateCcw } from "lucide-react";

interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
}

interface Bond {
  id: string;
  atom1: string;
  atom2: string;
  type: "single" | "double";
  length: number;
}

interface MolecularVisualizationProps {
  isVisible: boolean;
  molecule: "oxalic_acid" | "water" | "oxalate_ion";
  showHydration?: boolean;
  animate3D?: boolean;
}

export const MolecularVisualization: React.FC<MolecularVisualizationProps> = ({
  isVisible,
  molecule,
  showHydration = false,
  animate3D = true,
}) => {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
  const [currentView, setCurrentView] = useState<"3d" | "lewis" | "spacefilling">("3d");

  const moleculeData = {
    oxalic_acid: {
      name: "Oxalic Acid Dihydrate",
      formula: "H₂C₂O₄·2H₂O",
      atoms: [
        // Oxalic acid core
        { id: "C1", element: "C", x: 0, y: 0, z: 0, color: "#333", radius: 8 },
        { id: "C2", element: "C", x: 20, y: 0, z: 0, color: "#333", radius: 8 },
        { id: "O1", element: "O", x: -10, y: -10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O2", element: "O", x: -10, y: 10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O3", element: "O", x: 30, y: -10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O4", element: "O", x: 30, y: 10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "H1", element: "H", x: -15, y: 15, z: 0, color: "#ffffff", radius: 4 },
        { id: "H2", element: "H", x: 35, y: 15, z: 0, color: "#ffffff", radius: 4 },
        // Water molecules
        ...(showHydration ? [
          { id: "W1_O", element: "O", x: -25, y: 25, z: 10, color: "#3498db", radius: 7 },
          { id: "W1_H1", element: "H", x: -30, y: 30, z: 10, color: "#ffffff", radius: 4 },
          { id: "W1_H2", element: "H", x: -20, y: 30, z: 10, color: "#ffffff", radius: 4 },
          { id: "W2_O", element: "O", x: 45, y: 25, z: 10, color: "#3498db", radius: 7 },
          { id: "W2_H1", element: "H", x: 50, y: 30, z: 10, color: "#ffffff", radius: 4 },
          { id: "W2_H2", element: "H", x: 40, y: 30, z: 10, color: "#ffffff", radius: 4 },
        ] : [])
      ] as Atom[],
      bonds: [
        { id: "b1", atom1: "C1", atom2: "C2", type: "single", length: 20 },
        { id: "b2", atom1: "C1", atom2: "O1", type: "double", length: 14 },
        { id: "b3", atom1: "C1", atom2: "O2", type: "single", length: 14 },
        { id: "b4", atom1: "C2", atom2: "O3", type: "double", length: 14 },
        { id: "b5", atom1: "C2", atom2: "O4", type: "single", length: 14 },
        { id: "b6", atom1: "O2", atom2: "H1", type: "single", length: 10 },
        { id: "b7", atom1: "O4", atom2: "H2", type: "single", length: 10 },
        ...(showHydration ? [
          { id: "w1b1", atom1: "W1_O", atom2: "W1_H1", type: "single", length: 8 },
          { id: "w1b2", atom1: "W1_O", atom2: "W1_H2", type: "single", length: 8 },
          { id: "w2b1", atom1: "W2_O", atom2: "W2_H1", type: "single", length: 8 },
          { id: "w2b2", atom1: "W2_O", atom2: "W2_H2", type: "single", length: 8 },
        ] : [])
      ] as Bond[],
    },
    water: {
      name: "Water",
      formula: "H₂O",
      atoms: [
        { id: "O", element: "O", x: 0, y: 0, z: 0, color: "#3498db", radius: 8 },
        { id: "H1", element: "H", x: -8, y: 6, z: 0, color: "#ffffff", radius: 5 },
        { id: "H2", element: "H", x: 8, y: 6, z: 0, color: "#ffffff", radius: 5 },
      ] as Atom[],
      bonds: [
        { id: "b1", atom1: "O", atom2: "H1", type: "single", length: 10 },
        { id: "b2", atom1: "O", atom2: "H2", type: "single", length: 10 },
      ] as Bond[],
    },
    oxalate_ion: {
      name: "Oxalate Ion",
      formula: "C₂O₄²⁻",
      atoms: [
        { id: "C1", element: "C", x: 0, y: 0, z: 0, color: "#333", radius: 8 },
        { id: "C2", element: "C", x: 20, y: 0, z: 0, color: "#333", radius: 8 },
        { id: "O1", element: "O", x: -10, y: -10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O2", element: "O", x: -10, y: 10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O3", element: "O", x: 30, y: -10, z: 0, color: "#e74c3c", radius: 7 },
        { id: "O4", element: "O", x: 30, y: 10, z: 0, color: "#e74c3c", radius: 7 },
      ] as Atom[],
      bonds: [
        { id: "b1", atom1: "C1", atom2: "C2", type: "single", length: 20 },
        { id: "b2", atom1: "C1", atom2: "O1", type: "single", length: 14 },
        { id: "b3", atom1: "C1", atom2: "O2", type: "single", length: 14 },
        { id: "b4", atom1: "C2", atom2: "O3", type: "single", length: 14 },
        { id: "b5", atom1: "C2", atom2: "O4", type: "single", length: 14 },
      ] as Bond[],
    },
  };

  const currentMolecule = moleculeData[molecule];

  useEffect(() => {
    if (animate3D && isVisible) {
      const rotationInterval = setInterval(() => {
        setRotationY(prev => (prev + 1) % 360);
        setRotationX(prev => (prev + 0.5) % 360);
      }, 50);

      return () => clearInterval(rotationInterval);
    }
  }, [animate3D, isVisible]);

  const calculatePosition = (atom: Atom) => {
    // Simple 3D rotation matrices
    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;
    const radZ = (rotationZ * Math.PI) / 180;

    let x = atom.x;
    let y = atom.y;
    let z = atom.z;

    // Rotate around Y axis
    const newX = x * Math.cos(radY) - z * Math.sin(radY);
    const newZ = x * Math.sin(radY) + z * Math.cos(radY);
    x = newX;
    z = newZ;

    // Rotate around X axis
    const newY = y * Math.cos(radX) - z * Math.sin(radX);
    z = y * Math.sin(radX) + z * Math.cos(radX);
    y = newY;

    return { x: x + 150, y: y + 100, z };
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Atom className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">{currentMolecule.name}</h2>
              <p className="text-sm text-gray-300">{currentMolecule.formula}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView(currentView === "3d" ? "lewis" : currentView === "lewis" ? "spacefilling" : "3d")}
              className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {currentView.toUpperCase()}
            </button>
            
            <button
              onClick={() => {
                setRotationX(0);
                setRotationY(0);
                setRotationZ(0);
              }}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Molecular viewer */}
        <div className="relative w-full h-96 bg-gradient-to-b from-gray-100 to-gray-200 overflow-hidden">
          
          {/* 3D View */}
          {currentView === "3d" && (
            <svg className="absolute inset-0 w-full h-full">
              {/* Bonds */}
              {currentMolecule.bonds.map((bond) => {
                const atom1 = currentMolecule.atoms.find(a => a.id === bond.atom1);
                const atom2 = currentMolecule.atoms.find(a => a.id === bond.atom2);
                if (!atom1 || !atom2) return null;

                const pos1 = calculatePosition(atom1);
                const pos2 = calculatePosition(atom2);

                return (
                  <g key={bond.id}>
                    <line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke="#666"
                      strokeWidth={bond.type === "double" ? 3 : 2}
                      opacity={0.8}
                    />
                    {bond.type === "double" && (
                      <line
                        x1={pos1.x + 2}
                        y1={pos1.y + 2}
                        x2={pos2.x + 2}
                        y2={pos2.y + 2}
                        stroke="#666"
                        strokeWidth={2}
                        opacity={0.8}
                      />
                    )}
                  </g>
                );
              })}

              {/* Atoms */}
              {currentMolecule.atoms.map((atom) => {
                const pos = calculatePosition(atom);
                const zDepth = pos.z;
                const scale = 1 + zDepth * 0.002; // Perspective scaling
                
                return (
                  <g key={atom.id}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={atom.radius * scale}
                      fill={atom.color}
                      stroke="#333"
                      strokeWidth="1"
                      opacity={0.9}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 2}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={atom.color === "#ffffff" ? "#333" : "#fff"}
                    >
                      {atom.element}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Lewis Structure View */}
          {currentView === "lewis" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <h3 className="font-bold mb-4">Lewis Structure</h3>
                {molecule === "oxalic_acid" && (
                  <div className="font-mono text-lg space-y-2">
                    <div>O=C—C=O</div>
                    <div>|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|</div>
                    <div>OH&nbsp;&nbsp;&nbsp;OH</div>
                    <div className="text-sm text-gray-600 mt-4">
                      + 2H₂O (hydrogen bonding)
                    </div>
                  </div>
                )}
                {molecule === "water" && (
                  <div className="font-mono text-lg">
                    <div>H—O—H</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Bent molecular geometry<br/>
                      Bond angle: ~104.5°
                    </div>
                  </div>
                )}
                {molecule === "oxalate_ion" && (
                  <div className="font-mono text-lg space-y-2">
                    <div>⁻O—C—C—O⁻</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;||</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;O&nbsp;&nbsp;&nbsp;O</div>
                    <div className="text-sm text-gray-600 mt-4">
                      Net charge: -2<br/>
                      Resonance structures
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Space-filling Model */}
          {currentView === "spacefilling" && (
            <svg className="absolute inset-0 w-full h-full">
              {currentMolecule.atoms.map((atom) => {
                const pos = calculatePosition(atom);
                const vanDerWaalsRadius = {
                  C: 12, O: 11, H: 7
                }[atom.element] || 8;
                
                return (
                  <circle
                    key={atom.id}
                    cx={pos.x}
                    cy={pos.y}
                    r={vanDerWaalsRadius}
                    fill={atom.color}
                    opacity={0.8}
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                );
              })}
            </svg>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg">
            <div className="text-sm font-semibold mb-2">3D Controls</div>
            <div className="space-y-1 text-xs">
              <div>Auto-rotate: {animate3D ? "ON" : "OFF"}</div>
              <div>X: {rotationX.toFixed(0)}°</div>
              <div>Y: {rotationY.toFixed(0)}°</div>
            </div>
          </div>
        </div>

        {/* Molecular properties */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Molecular Formula</h4>
              <p className="font-mono">{currentMolecule.formula}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Key Properties</h4>
              {molecule === "oxalic_acid" && (
                <ul className="text-xs space-y-1">
                  <li>• Diprotic acid (2 H⁺)</li>
                  <li>• MW: 126.07 g/mol</li>
                  <li>• Forms stable dihydrate</li>
                </ul>
              )}
              {molecule === "water" && (
                <ul className="text-xs space-y-1">
                  <li>• Polar molecule</li>
                  <li>• Hydrogen bonding</li>
                  <li>• Universal solvent</li>
                </ul>
              )}
              {molecule === "oxalate_ion" && (
                <ul className="text-xs space-y-1">
                  <li>• Divalent anion</li>
                  <li>• Chelating ligand</li>
                  <li>• Resonance stabilized</li>
                </ul>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">In Solution</h4>
              <ul className="text-xs space-y-1">
                <li>• Hydration sphere formation</li>
                <li>• Ion-dipole interactions</li>
                <li>• Electrical conductivity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MolecularVisualization;
