import React, { useState, useCallback, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import MonetCanvas from './components/MonetCanvas';
import { RenderParams, AppState, GeminiCritique, ArtisticMode } from './types';
import { DEFAULT_PARAMS } from './constants';
import { analyzeScene } from './services/geminiService';
import { Sparkles, Wand2, Info, Waves, Paintbrush } from 'lucide-react';

const App: React.FC = () => {
  const [params, setParams] = useState<RenderParams>(DEFAULT_PARAMS);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [critique, setCritique] = useState<GeminiCritique | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  const handleGesture = useCallback((newMode: ArtisticMode) => {
    // Only update if mode changes to avoid re-renders
    setParams(prev => {
        if (prev.mode !== newMode) {
            return { ...prev, mode: newMode };
        }
        return prev;
    });
  }, []);

  const handleInspireMe = async () => {
    if (!canvasRef.current) return;
    
    setAppState(AppState.ANALYZING);
    try {
      // Capture the current artistic render
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      const result = await analyzeScene(imageData);
      setCritique(result);
      
      // Auto-apply suggested params if available
      if (result.suggestedParams) {
         setParams(prev => ({
             ...prev,
             ...result.suggestedParams
         }));
      }
    } catch (e) {
      console.error(e);
      setCritique({ critique: "The muse is silent. Please check your API Key configuration." });
    } finally {
      setAppState(AppState.RUNNING);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-stone-200 flex flex-col items-center py-6 px-4 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Header */}
      <header className="mb-6 text-center space-y-1">
        <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-200 to-cyan-200 drop-shadow-lg tracking-tight">
          Monet Vision
        </h1>
        <p className="text-stone-500 font-light tracking-[0.2em] text-xs uppercase">
          Abstract Interactive Flow Generator
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-7xl items-start justify-center">
        
        {/* Left Column: Canvas */}
        <div className="flex-1 w-full flex flex-col items-center space-y-4">
          <MonetCanvas 
             params={params} 
             onCanvasRef={handleCanvasRef} 
             onGesture={handleGesture}
          />
          
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
             <button 
               onClick={handleInspireMe}
               disabled={appState === AppState.ANALYZING}
               className="flex-1 bg-gradient-to-r from-teal-800 to-emerald-800 hover:from-teal-700 hover:to-emerald-700 text-teal-50 font-serif italic py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-white/5"
             >
               {appState === AppState.ANALYZING ? (
                   <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
               ) : (
                   <Sparkles className="w-5 h-5 group-hover:text-yellow-200 transition-colors" />
               )}
               {appState === AppState.ANALYZING ? "Consulting Claude..." : "Ask Monet's Spirit"}
             </button>
             
             <div className="flex-1 bg-neutral-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-center text-xs text-stone-400 gap-4">
                 <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-500" />
                    <span>Gestures:</span>
                 </div>
                 <div className={`flex items-center gap-1 transition-colors ${params.mode === ArtisticMode.IMPRESSIONIST ? 'text-white font-bold' : ''}`}>
                    <Paintbrush className="w-3 h-3" />
                    <span>Wrists Close</span>
                 </div>
                 <span className="text-stone-600">|</span>
                 <div className={`flex items-center gap-1 transition-colors ${params.mode === ArtisticMode.WATER_LILIES ? 'text-cyan-300 font-bold' : ''}`}>
                    <Waves className="w-3 h-3" />
                    <span>Wrists Apart (Expand)</span>
                 </div>
             </div>
          </div>

          {/* Critique Section */}
          {critique && (
            <div className="w-full max-w-4xl bg-stone-800/40 border border-stone-700/50 p-6 rounded-xl shadow-inner animate-fade-in relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-cyan-500"></div>
                <h3 className="font-serif text-xl text-teal-100 mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> The Master Speaks:
                </h3>
                <p className="text-stone-300 italic text-lg leading-relaxed font-serif">
                    "{critique.critique}"
                </p>
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4">
          <ControlPanel 
            params={params} 
            onChange={setParams} 
            isAnalyzed={!!critique}
          />
          
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
             <div className="flex justify-center items-center gap-3 text-stone-600 font-bold text-xs uppercase tracking-widest">
                <span>Gemini 2.5</span>
                <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                <span>MediaPipe</span>
                <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                <span>Canvas API</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;