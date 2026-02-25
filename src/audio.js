export function setupAudio() {
  // Create ambient wind sound using Web Audio API (no external file needed)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let isPlaying = false;
  let noiseNode = null;
  let gainNode = null;

  // Generate wind-like noise
  function createWindNoise() {
    const bufferSize = audioCtx.sampleRate * 4;
    const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter (more natural wind sound)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        // Add slow amplitude modulation for wind gusts
        data[i] *= 0.5 + 0.5 * Math.sin(i / audioCtx.sampleRate * 0.3 + channel * 0.5);
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  function start() {
    if (isPlaying) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const buffer = createWindNoise();
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    // Low-pass filter for deeper wind
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.7;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 2);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseNode.start();
    isPlaying = true;
  }

  function stop() {
    if (!isPlaying || !noiseNode) return;
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    setTimeout(() => {
      try { noiseNode.stop(); } catch (e) {}
      isPlaying = false;
    }, 600);
  }

  function toggle() {
    if (isPlaying) { stop(); return false; }
    else { start(); return true; }
  }

  return { start, stop, toggle, isPlaying: () => isPlaying };
}
