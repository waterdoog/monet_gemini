export enum ArtisticMode {
  IMPRESSIONIST = 'IMPRESSIONIST',
  WATER_LILIES = 'WATER_LILIES'
}

export interface RenderParams {
  brushSize: number;
  intensity: number; // 0-100 (Particle count / density)
  saturation: number; // 0-200
  luminosity: number; // 0-200
  styleWeight: number; // 0-100 (Color accuracy vs Noise)
  flowInertia: number; // 0-100 (Physics damping)
  abstraction: number; // 0-100 (Diffusion/Blur amount)
  mode: ArtisticMode;
}

export interface GeminiCritique {
  critique: string;
  suggestedParams?: Partial<RenderParams>;
}

export enum AppState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ANALYZING = 'ANALYZING',
  ERROR = 'ERROR'
}

export interface Point {
  x: number;
  y: number;
}