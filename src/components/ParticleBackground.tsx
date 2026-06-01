/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Particle } from '../types';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 100;
    
    // Mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120,
    };

    // Resize canvas
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const width = canvas.width;
      const height = canvas.height;
      for (let i = 0; i < particleCount; i++) {
        const baseAlpha = Math.random() * 0.4 + 0.1;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: (Math.random() - 0.5) * 0.25,
          alpha: baseAlpha,
          baseAlpha: baseAlpha,
        });
      }
    };

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      // Create a small burst of particles on click
      const width = canvas.width;
      const height = canvas.height;
      const burstCount = 15;
      for (let i = 0; i < burstCount; i++) {
        const baseAlpha = Math.random() * 0.6 + 0.4;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 2 + 0.5,
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          alpha: baseAlpha,
          baseAlpha: baseAlpha,
        });
        
        // Keep particle array size bounded
        if (particles.length > 200) {
          particles.shift();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Initial setup
    resizeCanvas();

    // Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw starry dust particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Move particle
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around margins
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Interactive mouse interaction
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Push away from mouse
          p.x += Math.cos(angle) * force * 1.5;
          p.y += Math.sin(angle) * force * 1.5;
          // Shimmer/brighten when close to cursor
          p.alpha = Math.min(1.0, p.baseAlpha + force * 0.5);
        } else {
          // Fade back to baseline alpha
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        // Draw particle
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // If extra-bright sparkles, paint subtle radial halo
        if (p.alpha > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      id="particles-ambient"
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 block"
    />
  );
}
