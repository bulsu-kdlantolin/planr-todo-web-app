import React, { useEffect, useRef } from 'react';

interface SoundwaveCanvasProps {
  isPlaying: boolean;
  color?: string;
  ambientType?: string;
}

export const SoundwaveCanvas: React.FC<SoundwaveCanvasProps> = ({
  isPlaying,
  color = 'rgba(101, 163, 13, 0.4)',
  ambientType = 'none'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        step += ambientType === 'drone' ? 0.02 : ambientType === 'rain' ? 0.06 : 0.035;
        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        ctx.beginPath();
        ctx.moveTo(0, midY);

        const waveAmplitude = ambientType === 'drone' ? 14 : ambientType === 'rain' ? 7 : 10;

        for (let x = 0; x < width; x++) {
          const y =
            midY +
            Math.sin(x * 0.02 + step) * waveAmplitude * Math.sin(step * 0.5) +
            Math.cos(x * 0.01 - step) * 5;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Secondary subtle echo wave
        ctx.beginPath();
        ctx.moveTo(0, midY);
        for (let x = 0; x < width; x++) {
          const y =
            midY +
            Math.cos(x * 0.015 - step * 0.8) * (waveAmplitude * 0.6) +
            Math.sin(x * 0.03 + step * 0.4) * 3;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(140, 130, 122, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, color, ambientType]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={140}
      className="pointer-events-none w-full h-full max-w-[280px] max-h-[140px]"
      aria-hidden="true"
    />
  );
};
