import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Sets up scroll-driven camera orbit around the igloo.
 * Maps scroll position (0–100%) to a 360° orbit.
 */
export function setupScrollControls(camera, target = { x: 0, y: 1.5, z: 0 }) {
  const radius = 14;
  const baseY = 4;
  const startAngle = 0;

  // Current and target orbit state (for smooth interpolation)
  const state = {
    angle: startAngle,
    targetAngle: startAngle,
    y: baseY,
    targetY: baseY,
  };

  // ScrollTrigger to map scroll → orbit angle
  ScrollTrigger.create({
    trigger: '#scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress;

      // Full 360° orbit
      state.targetAngle = startAngle + progress * Math.PI * 2;

      // Subtle vertical bob as we orbit
      state.targetY = baseY + Math.sin(progress * Math.PI * 4) * 0.8;

      // Update scroll progress display
      const progressEl = document.querySelector('.ui-scroll-progress');
      if (progressEl) {
        progressEl.textContent = `${Math.round(progress * 100)}%`;
      }

      // Hide scroll hint after scrolling
      if (progress > 0.02) {
        const hintEl = document.querySelector('.ui-scroll-hint');
        if (hintEl) hintEl.style.opacity = '0';
      }
    },
  });

  // Smooth interpolation in the render loop
  function update() {
    state.angle += (state.targetAngle - state.angle) * 0.08;
    state.y += (state.targetY - state.y) * 0.08;

    camera.position.x = Math.sin(state.angle) * radius;
    camera.position.z = Math.cos(state.angle) * radius;
    camera.position.y = state.y;

    camera.lookAt(target.x, target.y, target.z);

    requestAnimationFrame(update);
  }

  update();

  return state;
}
