/**
 * Loading screen with animated terminal-style text
 */

const LOADING_PATTERNS = [
  '--==+==--==+==--',
  '==+==--==+==--==',
  '+==--==+==--==+=',
  '=--==+==--==+==+',
  '--==+==--==+==--',
  '///////////////=',
  '==+==--==+==--==',
  '=+==--==+==--==+',
];

export function createLoadingScreen() {
  const screen = document.getElementById('loading-screen');

  screen.innerHTML = `
    <div class="loading-logo">IGLOO</div>
    <div class="loading-bar-container">
      <div class="loading-text"></div>
      <div class="loading-progress">INITIALIZING</div>
    </div>
  `;

  const textEl = screen.querySelector('.loading-text');
  const progressEl = screen.querySelector('.loading-progress');
  let frame = 0;
  let intervalId;

  // Animate the loading text pattern
  intervalId = setInterval(() => {
    const pattern = LOADING_PATTERNS[frame % LOADING_PATTERNS.length];
    textEl.textContent = pattern;
    frame++;

    if (frame % 8 === 0) {
      const states = ['INITIALIZING', 'LOADING ASSETS', 'BUILDING SCENE', 'RENDERING'];
      progressEl.textContent = states[Math.floor(frame / 8) % states.length];
    }
  }, 120);

  return {
    hide() {
      clearInterval(intervalId);
      screen.classList.add('fade-out');
      setTimeout(() => {
        screen.style.display = 'none';
      }, 800);
    },
  };
}
