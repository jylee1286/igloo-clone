import { createScene } from './scene.js';
import { setupAudio } from './audio.js';
import './style.css';

// DOM refs
const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const overlayEl = document.getElementById('ui-overlay');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundStateEl = document.getElementById('sound-state');
const soundIconEl = document.getElementById('sound-icon');

// Loading animation
const loaderText = document.getElementById('loader-text');
const loadChars = ['--==+==--=', '==--=+==--', '-=+==--==+', '+=--==+==—', '--=+==--=='];
let loadIdx = 0;
const loadInterval = setInterval(() => {
  loaderText.textContent = loadChars[loadIdx % loadChars.length];
  loadIdx++;
}, 180);

// Fake progress bar
let progress = 0;
const progressInterval = setInterval(() => {
  progress = Math.min(progress + Math.random() * 15, 90);
  loaderFill.style.width = progress + '%';
}, 200);

// Init scene
const container = document.getElementById('webgl');
const { updateCamera, modelPromise } = createScene(container);

// Audio
const audio = setupAudio();
soundToggleBtn.addEventListener('click', () => {
  const playing = audio.toggle();
  soundStateEl.textContent = playing ? 'On' : 'Off';
  soundIconEl.textContent = playing ? '♫' : '♪';
});

// Reveal
modelPromise.then(() => {
  clearInterval(loadInterval);
  clearInterval(progressInterval);
  loaderFill.style.width = '100%';
  setTimeout(() => {
    loaderEl.classList.add('hidden');
    overlayEl.classList.add('visible');
  }, 600);
});

// Scroll camera
let currentProgress = 0;
let targetProgress = 0;

function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
}

window.addEventListener('scroll', () => {
  targetProgress = getScrollProgress();
}, { passive: true });

function tick() {
  currentProgress += (targetProgress - currentProgress) * 0.08;
  updateCamera(currentProgress);
  requestAnimationFrame(tick);
}
tick();
