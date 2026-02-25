/**
 * Creates the fixed UI overlay: logo, manifesto, scroll hint, sound toggle.
 */
export function createUI(onSoundToggle) {
  const overlay = document.getElementById('ui-overlay');

  overlay.innerHTML = `
    <div class="ui-top-left">
      <div class="ui-logo">IGLOO</div>
      <div class="ui-copyright">// Copyright &copy; 2026<br/>Igloo, Inc. All Rights Reserved.</div>
    </div>

    <div class="ui-top-right">
      <div class="ui-section-header">////// Manifesto</div>
      <div class="ui-manifesto">
        We build structures that endure the harshest conditions.
        Born from ice and precision, our architecture defies the elements.
        Every block placed with purpose. Every curve engineered for resilience.
        This is shelter, reimagined. This is IGLOO.
      </div>
    </div>

    <div class="ui-bottom-left">
      <div class="ui-scroll-hint">Scroll down to discover.</div>
      <button class="ui-sound-toggle clickable" id="sound-toggle">&#x1f50a; Sound: Off</button>
    </div>

    <div class="ui-bottom-right">
      <div class="ui-scroll-progress">0%</div>
    </div>
  `;

  // Sound toggle
  const soundBtn = document.getElementById('sound-toggle');
  let soundOn = false;

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '\u{1F50A} Sound: On' : '\u{1F50A} Sound: Off';
    onSoundToggle(soundOn);
  });

  return {
    show() {
      overlay.classList.add('visible');
    },
    setSoundState(on) {
      soundOn = on;
      soundBtn.textContent = on ? '\u{1F50A} Sound: On' : '\u{1F50A} Sound: Off';
    },
  };
}
