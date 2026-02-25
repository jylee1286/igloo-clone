import { createScene } from './scene.js';
import { setupAudio } from './audio.js';
import './style.css';

// DOM refs
const loaderEl = document.getElementById('loader');
const overlayEl = document.getElementById('ui-overlay');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundStateEl = document.getElementById('sound-state');
const soundIconEl = document.getElementById('sound-icon');

// Loading text animation
const loaderText = document.getElementById('loader-text');
const loadChars = ['--==+==--=', '==--=+==--', '-=+==--==+', '+=--==+==—', '--=+==--==', '=+==--==+='];
let loadIdx = 0;
const loadInterval = setInterval(() => {
  loaderText.textContent = loadChars[loadIdx % loadChars.length];
  loadIdx++;
}, 200);

// Init scene
const container = document.getElementById('webgl');
const { updateCamera, modelPromise } = createScene(container);

// Audio
const audio = setupAudio();

soundToggleBtn.addEventListener('click', () => {
  const playing = audio.toggle();
  soundStateEl.textContent = playing ? 'On' : 'Off';
  soundIconEl.textContent = playing ? '🔊' : '🔇';
});

// Wait for model, then reveal
modelPromise.then(() => {
  clearInterval(loadInterval);
  setTimeout(() => {
    loaderEl.classList.add('hidden');
    overlayEl.classList.add('visible');
  }, 500);
});

// Scroll-driven camera
let currentProgress = 0;
let targetProgress = 0;

function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
}

window.addEventListener('scroll', () => {
  targetProgress = getScrollProgress();
}, { passive: true });

function tick() {
  // Smooth lerp for buttery camera movement
  currentProgress += (targetProgress - currentProgress) * 0.05;
  updateCamera(currentProgress);
  requestAnimationFrame(tick);
}
tick();
