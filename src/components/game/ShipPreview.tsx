import { useEffect, useRef, useState } from 'react';

interface ShipPreviewProps {
  filter: string;
  size?: number;
  showEngineGlow?: boolean;
}

const SHIP_IMAGE_URL = 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f3b62150-4a75-4f79-a287-beb738d7988f.webp';

export default function ShipPreview({ filter, size = 64, showEngineGlow = false }: ShipPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shipImage, setShipImage] = useState<HTMLImageElement | null>(null);

  // Load ship image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for filters
    img.onload = () => setShipImage(img);
    img.src = SHIP_IMAGE_URL;
  }, []);

  // Render ship with filter
  useEffect(() => {
    if (!canvasRef.current || !shipImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply skin filter
    if (filter && filter !== 'none' && filter !== 'undefined') {
      ctx.filter = filter;
    } else {
      ctx.filter = 'none';
    }

    // Draw ship centered
    const shipSize = size;
    const x = (canvas.width - shipSize) / 2;
    const y = (canvas.height - shipSize) / 2;

    ctx.drawImage(shipImage, x, y, shipSize, shipSize);

    ctx.restore();

    // Add engine glow if requested
    if (showEngineGlow) {
      ctx.save();
      const glowColor = filter.includes('hue-rotate(270deg)') ? '#ff6b6b'
        : filter.includes('hue-rotate(90deg)') ? '#51cf66'
        : filter.includes('hue-rotate(210deg)') ? '#a855f7'
        : filter.includes('hue-rotate(40deg)') ? '#ffd700'
        : '#22d3ee';

      ctx.shadowBlur = 20;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.6;

      // Engine particles at bottom
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + (Math.random() - 0.5) * 20,
          y + shipSize + 5 + i * 8,
          2 + Math.random() * 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }
  }, [shipImage, filter, size, showEngineGlow]);

  return (
    <canvas
      ref={canvasRef}
      width={size + 20}
      height={size + (showEngineGlow ? 40 : 20)}
      style={{ width: size + 20, height: size + (showEngineGlow ? 40 : 20) }}
    />
  );
}
