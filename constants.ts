import { RenderParams, ArtisticMode } from './types';

export const DEFAULT_PARAMS: RenderParams = {
  brushSize: 15,
  intensity: 85,
  saturation: 120,
  luminosity: 100,
  styleWeight: 50,
  flowInertia: 92,
  abstraction: 30,
  mode: ArtisticMode.IMPRESSIONIST
};

export const GEMINI_MODEL_VISION = 'gemini-2.5-flash';
export const GEMINI_MODEL_THINKING = 'gemini-2.5-flash';