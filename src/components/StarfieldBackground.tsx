import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  layer: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Create parallax star layers
    const layers = [
      { count: 100, speedMult: 0.2, sizeRange: [0.5, 1], color: 'rgba(100, 150, 200, ' },
      { count: 80, speedMult: 0.5, sizeRange: [1, 1.5], color: 'rgba(147, 197, 253, ' },
      { count: 50, speedMult: 1, sizeRange: [1.5, 2.5], color: 'rgba(200, 230, 255, ' }
    ];

    const stars: Star[] = [];

    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
          speed: (Math.random() * 0.5 + 0.3) * layer.speedMult,
          opacity: 0.3 + Math.random() * 0.7,
          layer: layerIndex
        });
      }
    });

    // Nebula clouds
    const nebulae = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3, radius: 150, color: 'rgba(139, 92, 246, 0.03)' },
      { x: canvas.width * 0.7, y: canvas.height * 0.6, radius: 200, color: 'rgba(236, 72, 153, 0.02)' },
      { x: canvas.width * 0.5, y: canvas.height * 0.8, radius: 180, color: 'rgba(34, 211, 238, 0.02)' }
    ];

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      // Clear with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#050014');
      gradient.addColorStop(0.5, '#0a0028');
      gradient.addColorStop(1, '#1a0040');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebulae
      nebulae.forEach(nebula => {
        const nebulaGradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
        nebulaGradient.addColorStop(0, nebula.color);
        nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Draw stars by layer (parallax)
      stars.forEach((star) => {
        // Twinkling effect
        star.opacity += (Math.random() - 0.5) * 0.03;
        star.opacity = Math.max(0.2, Math.min(1, star.opacity));

        const layer = layers[star.layer];
        
        // Draw star with glow
        ctx.save();
        ctx.shadowBlur = star.size * 3;
        ctx.shadowColor = layer.color + star.opacity + ')';
        ctx.fillStyle = layer.color + star.opacity + ')';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Add bright core for larger stars
        if (star.size > 1.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Move star (parallax)
        star.y += star.speed;

        // Reset star position
        if (star.y > canvas.height + 10) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }} />
  );
}