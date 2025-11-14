import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { X, Beaker, Droplets, FlaskConical, TestTube } from "lucide-react";

interface EquipmentProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onDrag?: (id: string, x: number, y: number) => void;
  position?: { x: number; y: number; fixed?: boolean } | null;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  color?: string;
  volume?: number;
  displayVolume?: number;
  onInteract?: (id: string) => void;
  isActive?: boolean;
}

export const Equipment: React.FC<EquipmentProps> = ({
  id,
  name,
  icon,
  onDrag,
  position,
  onRemove,
  disabled = false,
  color = "#e5e7eb",
  volume = 0,
  displayVolume,
  onInteract,
  isActive = false,
}) => {
  const isFixed = Boolean(position && (position as any).fixed);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled || isFixed) return;

    // compute offset between mouse and element top-left to preserve cursor position on drop
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const type = position ? 'move' : 'new';

    const payload = { id, type, offsetX, offsetY };
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
    } catch (err) {
      e.dataTransfer.setData('equipment', id);
    }

    // set a custom drag image (use a small transparent canvas to avoid default ghosting)
    try {
      const crt = document.createElement('canvas');
      crt.width = 1;
      crt.height = 1;
      e.dataTransfer.setDragImage(crt, 0, 0);
    } catch (err) {
      // ignore
    }
  };

  const handleClick = () => {
    if (onInteract && position) onInteract(id);
  };

  // Toolbar item
  if (!position) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable={!disabled}
            onDragStart={handleDragStart}
            onClick={() => { if (onInteract) onInteract(id); }}
            className={`flex flex-col items-center p-4 rounded-lg border-2 ${
              disabled ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg'
            }`}
          >
            <div className="text-3xl mb-2 text-blue-600">{icon}</div>
            <span className="text-sm font-medium text-gray-700 text-center">{name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Drag to workbench: {name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Placed item
  const lowerName = name.toLowerCase();
  const isAceticOrSodium = id === 'acetic-0-01m' || id === '0-1-m-ethanoic-acetic-acid' || lowerName.includes('ethanoic') || lowerName.includes('acetic') || lowerName.includes('sodium ethanoate') || lowerName.includes('sodium acetate');
  // Treat HCl and ammonium-related reagents as blue bottles
  const isHCl = id.toLowerCase().startsWith('hcl') || lowerName.includes('hcl');
  const isAmmoniumOrSodium = lowerName.includes('sodium') || lowerName.includes('ammonium hydroxide') || lowerName.includes('nh4oh') || lowerName.includes('ammonium chloride') || lowerName.includes('nh4cl');

  const bottleBgClass = isAceticOrSodium ? 'bg-bottle-yellow' : (isHCl || isAmmoniumOrSodium ? 'bg-bottle-blue' : 'bg-bottle-yellow');
  const dropletColorClass = isAceticOrSodium ? 'text-yellow-700' : (isHCl || isAmmoniumOrSodium ? 'text-blue-600' : 'text-yellow-700');
  const isPH = name.toLowerCase().includes('ph') || id.toLowerCase().includes('ph');

  const renderNameParts = (n: string) => {
    const m = /^(.*?)\s*\((.*)\)\s*$/.exec(n);
    if (m) {
      return (
        <>
          <span className="text-sm font-medium block text-center">{m[1].trim()}</span>
          <span className="text-xs text-gray-600 block text-center">({m[2].trim()})</span>
        </>
      );
    }
    return <span className="text-xs font-medium text-center">{n}</span>;
  };

  return (
    <div style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }} className="relative group" draggable={!disabled && !isFixed} onDragStart={handleDragStart}>
      <div className={`relative ${id === 'test-tube' ? 'min-w-[240px] min-h-[360px]' : isPH ? 'bg-transparent border-0 shadow-none p-0 min-w-0 min-h-0' : 'bg-white rounded-xl shadow-lg border-2 p-4 min-w-[90px] min-h-[120px]'} ${!isPH && id !== 'test-tube' ? (isActive ? 'border-blue-400 shadow-xl' : 'border-gray-200') : ''}`} onClick={handleClick}>
        {onRemove && !isPH && (
          <Button onClick={(e) => { e.stopPropagation(); onRemove(id); }} size="sm" variant="outline" className={`absolute w-6 h-6 p-0 bg-red-500 text-white border-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity ${id === 'test-tube' ? 'top-0 right-0' : '-top-2 -right-2'}`}>
            <X className="w-3 h-3" />
          </Button>
        )}

        <div className="flex flex-col items-center">
          {id === 'test-tube' ? (
            <div className="relative">
              <div className="relative w-32 h-72">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded-full border text-[10px] font-semibold text-gray-700">
                  {(displayVolume ?? volume ?? 0).toFixed(1)} mL
                </div>
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F3dd94cfaa2fc4876a1e3759c6d76db7e?format=webp&width=800" alt="Test tube" className="w-full h-full object-contain" />
                {(displayVolume ?? volume ?? 0) > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 transition-all" style={{ bottom: '28px', width: '28px', height: '150px', overflow: 'hidden', borderRadius: '0 0 14px 14px' }}>
                    <div
                      className="absolute left-0 right-0 bottom-0 transition-all duration-500"
                      style={{
                        height: `${Math.max(0, Math.min(150, ((Math.min(Math.max(displayVolume ?? volume ?? 0, 0), 20) / 20) * 150)))}px`,
                        backgroundColor: color,
                        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.25), 0 0 3px rgba(0,0,0,0.1)',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium mt-2 text-center block">{name}</span>
            </div>
          ) : (id === 'hcl-0-1m' || id === 'hcl-0-01m' || id === 'hcl-0-001m' || id === 'nh4oh-0-1m' || id === 'nh4cl-0-1m' || name.toLowerCase().includes('ammonium hydroxide') || name.toLowerCase().includes('ammonium chloride') || name.toLowerCase().includes('nh4oh') || name.toLowerCase().includes('nh4cl')) ? (
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 border-2 border-gray-300 relative overflow-hidden mb-2 shadow-sm ${bottleBgClass}`}>
                <Droplets className={`w-7 h-7 absolute top-2 left-1/2 -translate-x-1/2 ${dropletColorClass} opacity-70`} />
              </div>
              {renderNameParts(name)}
            </div>
          ) : isAceticOrSodium ? (
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 border-2 border-gray-300 relative overflow-hidden mb-2 shadow-sm ${bottleBgClass}`}>
                <Droplets className={`w-7 h-7 absolute top-2 left-1/2 -translate-x-1/2 ${dropletColorClass} opacity-70`} />
              </div>
              {renderNameParts(name)}
            </div>
          ) : (name.toLowerCase().includes('ph') || id.toLowerCase().includes('ph')) ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-8 relative overflow-visible mb-2 ph-paper" style={{ backgroundColor: color || 'transparent' }}>
                <img src="https://cdn.builder.io/api/v1/image/assets%2F3c8edf2c5e3b436684f709f440180093%2Fa1eea72a49464b2f93611a90f0edd819?format=webp&width=800" alt="pH Paper" className="w-full h-full object-contain transform rotate-0 scale-[5] origin-center max-w-none" style={{ mixBlendMode: 'multiply', opacity: 0.95 }} />
              </div>
            </div>
          ) : id === 'universal-indicator' ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border-2 border-gray-300 relative overflow-hidden mb-2 shadow-sm bg-universal-indicator">
                <FlaskConical className="w-7 h-7 absolute top-3 left-1/2 -translate-x-1/2 text-purple-700 opacity-70" />
              </div>
              <span className="text-xs font-medium text-center">Universal Indicator</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-2 text-blue-600">{icon}</div>
              {renderNameParts(name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PH_LAB_EQUIPMENT = [
  { id: 'test-tube', name: '25ml Test Tube', icon: <TestTube className="w-8 h-8" /> },
  { id: 'hcl-0-01m', name: '0.01 M HCl', icon: <Droplets className="w-8 h-8" /> },
  { id: 'acetic-0-01m', name: '0.1 M Ethanoic (Acetic) Acid', icon: <Droplets className="w-8 h-8" /> },
  { id: 'universal-indicator', name: 'Universal Indicator', icon: <FlaskConical className="w-8 h-8" /> },
];
