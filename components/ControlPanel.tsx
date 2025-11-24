import React from 'react';
import { RenderParams, ArtisticMode } from '../types';
import { Sliders, Paintbrush, Sun, Droplet, Zap, Wind, EyeOff, Palette } from 'lucide-react';

interface ControlPanelProps {
  params: RenderParams;
  onChange: (newParams: RenderParams) => void;
  isAnalyzed?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange, isAnalyzed }) => {
  const handleChange = (key: keyof RenderParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl space-y-5 text-white w-full max-w-sm h-fit">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-serif italic tracking-wide">Atelier Controls</h3>
        </div>
        <div className="text-xs px-2 py-1 rounded bg-white/10 font-mono text-teal-200">
            {params.mode === ArtisticMode.WATER_LILIES ? 'WATER LILIES' : 'IMPRESSIONIST'}
        </div>
      </div>

      {/* Brush Size */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-3 h-3" />
            <span>Brush Size</span>
          </div>
          <span>{params.brushSize}px</span>
        </div>
        <input
          type="range" min="5" max="50"
          value={params.brushSize}
          onChange={(e) => handleChange('brushSize', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
        />
      </div>

      {/* Flow Inertia */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Wind className="w-3 h-3" />
            <span>Flow Inertia</span>
          </div>
          <span>{params.flowInertia}%</span>
        </div>
        <input
          type="range" min="50" max="99"
          value={params.flowInertia}
          onChange={(e) => handleChange('flowInertia', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
        />
      </div>

      {/* Abstraction */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3 h-3" />
            <span>Abstraction (Blur)</span>
          </div>
          <span>{params.abstraction}%</span>
        </div>
        <input
          type="range" min="0" max="100"
          value={params.abstraction}
          onChange={(e) => handleChange('abstraction', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />
      </div>

      {/* Intensity */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Particle Density</span>
          </div>
          <span>{params.intensity}%</span>
        </div>
        <input
          type="range" min="10" max="100"
          value={params.intensity}
          onChange={(e) => handleChange('intensity', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
        />
      </div>

      {/* Saturation */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Droplet className="w-3 h-3" />
            <span>Vibrance</span>
          </div>
          <span>{params.saturation}%</span>
        </div>
        <input
          type="range" min="0" max="200"
          value={params.saturation}
          onChange={(e) => handleChange('saturation', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
        />
      </div>

      {/* Luminosity */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Sun className="w-3 h-3" />
            <span>Luminosity</span>
          </div>
          <span>{params.luminosity}%</span>
        </div>
        <input
          type="range" min="50" max="200"
          value={params.luminosity}
          onChange={(e) => handleChange('luminosity', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
        />
      </div>
      
       {/* Style Weight */}
       <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Palette className="w-3 h-3" />
            <span>Style Mix</span>
          </div>
          <span>{params.styleWeight}%</span>
        </div>
        <input
          type="range" min="0" max="100"
          value={params.styleWeight}
          onChange={(e) => handleChange('styleWeight', Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400"
        />
      </div>

    </div>
  );
};

export default ControlPanel;