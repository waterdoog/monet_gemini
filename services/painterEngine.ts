import { RenderParams, Point, ArtisticMode } from '../types';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  size: number;
  hueOffset: number;
  
  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.life = 0;
    this.maxLife = random(50, 200);
    this.size = random(2, 10);
    this.hueOffset = random(-15, 15);
  }

  reset(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = random(50, 200);
  }
}

export class MonetPainter {
  private particles: Particle[] = [];
  private width: number = 0;
  private height: number = 0;
  private offCanvas: HTMLCanvasElement | null = null;
  private offCtx: CanvasRenderingContext2D | null = null;

  constructor() {}

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    
    // Initialize particles if needed
    const particleCount = 2000;
    if (this.particles.length < particleCount) {
      for (let i = this.particles.length; i < particleCount; i++) {
        this.particles.push(new Particle(w, h));
      }
    }

    if (!this.offCanvas) {
      this.offCanvas = document.createElement('canvas');
      this.offCtx = this.offCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (this.offCanvas) {
      this.offCanvas.width = Math.floor(w / 4); // Low res for color sampling
      this.offCanvas.height = Math.floor(h / 4);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    params: RenderParams,
    landmarks: Point[],
    prevLandmarks: Point[]
  ) {
    if (this.width === 0 || this.height === 0 || !this.offCtx || !this.offCanvas) return;

    // 1. Update Color Source (Low res)
    this.offCtx.drawImage(video, 0, 0, this.offCanvas.width, this.offCanvas.height);
    const frameData = this.offCtx.getImageData(0, 0, this.offCanvas.width, this.offCanvas.height);
    const data = frameData.data;
    const sw = this.offCanvas.width;
    const sh = this.offCanvas.height;

    // 2. Fade Background (Create trails)
    // The abstraction relies on NOT clearing the canvas completely.
    // Higher abstraction = less clearing (more smear).
    const fadeAlpha = 0.05 + ((100 - params.abstraction) / 100) * 0.15;
    
    ctx.globalCompositeOperation = 'source-over';
    
    if (params.mode === ArtisticMode.WATER_LILIES) {
        // Deep blue/green tint for water mode
        ctx.fillStyle = `rgba(10, 30, 40, ${fadeAlpha})`;
    } else {
        // Creamy tint for classic monet
        ctx.fillStyle = `rgba(245, 240, 230, ${fadeAlpha})`;
    }
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Calculate Flow Forces from Pose
    // Find moving limbs
    const forces: {x: number, y: number, r: number, strength: number}[] = [];
    
    if (landmarks.length > 0 && prevLandmarks.length > 0) {
      for (let i = 0; i < landmarks.length; i++) {
        // Focus on wrists(15,16) and hands for water ripples
        if (i < 15) continue; 
        
        const curr = landmarks[i];
        const prev = prevLandmarks[i];
        const dx = (curr.x - prev.x) * this.width;
        const dy = (curr.y - prev.y) * this.height;
        const speed = Math.sqrt(dx*dx + dy*dy);
        
        if (speed > 1) { // Only significant movement
           forces.push({
             x: curr.x * this.width,
             y: curr.y * this.height,
             r: params.mode === ArtisticMode.WATER_LILIES ? 150 : 80, // Larger ripples for water
             strength: speed * 0.5
           });
        }
      }
    }

    // 4. Update and Draw Particles
    const maxParticles = Math.floor(1000 + (params.intensity * 20)); // Up to 3000 particles
    
    ctx.lineCap = 'round';

    for (let i = 0; i < this.particles.length; i++) {
        if (i > maxParticles) break;
        const p = this.particles[i];

        // --- Physics ---
        
        // Reset if dead
        if (p.life > p.maxLife || p.x < -50 || p.x > this.width + 50 || p.y < -50 || p.y > this.height + 50) {
            p.reset(this.width, this.height);
        }
        p.life++;

        // Base flow (Perlin noise simulation or just simple drift)
        // Water mode has more horizontal drift
        if (params.mode === ArtisticMode.WATER_LILIES) {
            p.vx += random(-0.1, 0.1);
            p.vy += random(-0.05, 0.1); // Slight down/drift
        } else {
            p.vx += random(-0.2, 0.2);
            p.vy += random(-0.2, 0.2);
        }

        // Apply Forces from Pose
        for (const f of forces) {
            const dx = p.x - f.x;
            const dy = p.y - f.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < f.r) {
                // Direction away from movement or along with it?
                // "Drag" effect: push particles in direction of movement
                // We actually calculated force vectors earlier based on landmark velocity, 
                // but here we just have positions. Let's assume radial push for ripples
                // or drag for flow. Let's use Push.
                const force = (1 - dist / f.r) * f.strength * 0.2;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }

        // Inertia / Friction
        const friction = params.flowInertia / 100;
        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;

        // --- Color Sampling ---
        // Sample color from the source video at the particle's position
        const sx = Math.floor(p.x * (sw / this.width));
        const sy = Math.floor(p.y * (sh / this.height));
        
        let r = 100, g = 100, b = 100;
        
        if (sx >= 0 && sx < sw && sy >= 0 && sy < sh) {
            const idx = (sy * sw + sx) * 4;
            r = data[idx];
            g = data[idx + 1];
            b = data[idx + 2];
        }

        // Adjust Colors based on Params
        // Luminosity
        r = Math.min(255, r * (params.luminosity / 100));
        g = Math.min(255, g * (params.luminosity / 100));
        b = Math.min(255, b * (params.luminosity / 100));

        // Saturation (Simple approximation)
        const avg = (r + g + b) / 3;
        const satMult = params.saturation / 100;
        r = avg + (r - avg) * satMult;
        g = avg + (g - avg) * satMult;
        b = avg + (b - avg) * satMult;

        // Style Weight (Color Mixing)
        // If High Style Weight: Mix in Monet Palette (Blues, Purples, Greens)
        if (random(0, 100) < params.styleWeight * 0.3) {
             r += random(-20, 20);
             g += random(-20, 20);
             b += random(10, 40); // Monet loved blue/violet shadows
        }

        // Mode Specific Color Tweaks
        if (params.mode === ArtisticMode.WATER_LILIES) {
            // Bias towards greens and pinks if brightness is high (flowers) or low (pads)
            const brightness = (r+g+b)/3;
            if (brightness > 180) { // Flowers
                 r += 30; b += 20; 
            } else { // Water/Pads
                 g += 20; b += 40;
            }
        }

        // --- Drawing ---
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + params.intensity/500})`;
        ctx.beginPath();

        const s = Math.max(1, (params.brushSize * p.size) / 5);

        if (params.mode === ArtisticMode.WATER_LILIES) {
            // Round, pad-like shapes or ripples
            // Orientation aligns with velocity
            const angle = Math.atan2(p.vy, p.vx);
            ctx.ellipse(p.x, p.y, s * 2, s * 0.8, angle, 0, Math.PI * 2);
        } else {
            // Impressionist: Short, separate, chaotic strokes
            const angle = random(0, Math.PI * 2); 
            // Or use movement direction for flowy feel
            // const angle = Math.atan2(p.vy, p.vx);
            ctx.ellipse(p.x, p.y, s, s * 0.4, angle, 0, Math.PI * 2);
        }
        
        ctx.fill();
    }
  }
}