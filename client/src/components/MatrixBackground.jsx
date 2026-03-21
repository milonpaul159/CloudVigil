import { useEffect, useRef } from 'react';

/**
 * MatrixBackground — Full-screen canvas with falling binary rain effect.
 * Renders behind all content with a fixed position.
 */
export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    // Resize canvas to fill the viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Characters to display — binary digits + some hacker-style symbols
    const chars = '01';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Each column gets a random y position to start
    const drops = Array.from({ length: columns }, () =>
      Math.random() * -100
    );

    // Varying speeds for each column
    const speeds = Array.from({ length: columns }, () =>
      0.3 + Math.random() * 0.7
    );

    // Random brightness per column for depth effect
    const brightness = Array.from({ length: columns }, () =>
      0.15 + Math.random() * 0.45
    );

    const draw = () => {
      // Semi-transparent black overlay for trail effect
      ctx.fillStyle = 'rgba(5, 8, 15, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head character — bright green
        const headAlpha = brightness[i] + 0.3;
        ctx.fillStyle = `rgba(0, 255, 65, ${Math.min(headAlpha, 0.85)})`;
        ctx.fillText(char, x, y);

        // Trail glow — slightly dimmer
        ctx.fillStyle = `rgba(0, 255, 65, ${brightness[i] * 0.5})`;
        ctx.fillText(char, x, y - fontSize);

        // Move drop down
        drops[i] += speeds[i];

        // Reset when off screen (with some randomness)
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.3 + Math.random() * 0.7;
          brightness[i] = 0.15 + Math.random() * 0.45;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
