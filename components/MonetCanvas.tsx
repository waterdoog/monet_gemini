import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { RenderParams, Point, ArtisticMode } from '../types';
import { MonetPainter } from '../services/painterEngine';

interface MonetCanvasProps {
  params: RenderParams;
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  onGesture?: (mode: ArtisticMode) => void;
}

const MonetCanvas: React.FC<MonetCanvasProps> = ({ params, onCanvasRef, onGesture }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const painterRef = useRef<MonetPainter>(new MonetPainter());
  const requestRef = useRef<number | null>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  
  // Track history for velocity calculation
  const poseLandmarksRef = useRef<Point[]>([]);
  const prevPoseLandmarksRef = useRef<Point[]>([]);
  
  // Gesture Debounce
  const lastGestureTime = useRef<number>(0);

  // Initialize Pose Landmarker
  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        setPoseLandmarker(landmarker);
        console.log("Pose Landmarker loaded");
      } catch (error) {
        console.error("Failed to load Pose Landmarker:", error);
      }
    };
    createPoseLandmarker();
  }, []);

  // Main Render Loop
  const animate = (time: number) => {
    if (webcamRef.current && webcamRef.current.video && canvasRef.current && painterRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === 4) {
        // Resize canvas if needed
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          painterRef.current.resize(canvas.width, canvas.height);
        }

        // Store previous landmarks before updating
        prevPoseLandmarksRef.current = [...poseLandmarksRef.current];

        // Detect Pose
        if (poseLandmarker) {
          const results = poseLandmarker.detectForVideo(video, performance.now());
          if (results.landmarks && results.landmarks.length > 0) {
            // Flip x because webcam is mirrored usually
            poseLandmarksRef.current = results.landmarks[0].map(lm => ({ x: 1 - lm.x, y: lm.y }));
            
            // --- Gesture Recognition ---
            // Detect "Arms Open" / "Expansion"
            // Landmarks: 15 (Left Wrist), 16 (Right Wrist)
            if (poseLandmarksRef.current[15] && poseLandmarksRef.current[16]) {
                const lw = poseLandmarksRef.current[15];
                const rw = poseLandmarksRef.current[16];
                const dist = Math.sqrt(Math.pow(lw.x - rw.x, 2) + Math.pow(lw.y - rw.y, 2));
                
                // If wrists are far apart (> 70% of screen width)
                if (dist > 0.7) {
                    const now = Date.now();
                    if (now - lastGestureTime.current > 2000) { // 2s debounce
                        lastGestureTime.current = now;
                        if (onGesture) onGesture(ArtisticMode.WATER_LILIES);
                    }
                } 
                // If wrists are close (< 25%)
                else if (dist < 0.25) {
                    const now = Date.now();
                    if (now - lastGestureTime.current > 2000) {
                        lastGestureTime.current = now;
                        if (onGesture) onGesture(ArtisticMode.IMPRESSIONIST);
                    }
                }
            }

          } else {
             poseLandmarksRef.current = [];
          }
        }

        // Draw Monet Effect
        if (ctx) {
          painterRef.current.render(
            ctx, 
            video, 
            params, 
            poseLandmarksRef.current,
            prevPoseLandmarksRef.current // Pass history for velocity
          );
        }
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [poseLandmarker, params]);

  useEffect(() => {
    if (canvasRef.current) {
        onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  return (
    <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-neutral-800 bg-black">
        {/* Source video is HIDDEN - Input only */}
        <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="absolute opacity-0 pointer-events-none"
            width={1280}
            height={720}
            videoConstraints={{ facingMode: "user" }}
            mirrored={true}
        />
        {/* The Artistic Output */}
        <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
        />
        
        {!poseLandmarker && (
            <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                Loading Vision Model...
            </div>
        )}
    </div>
  );
};

export default MonetCanvas;