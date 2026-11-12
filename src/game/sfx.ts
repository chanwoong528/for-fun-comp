type Tone = {
  frequency: number;
  endFrequency: number;
  seconds: number;
  wave: OscillatorType;
  volume: number;
};

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
};

const playTone = ({ frequency, endFrequency, seconds, wave, volume }: Tone) => {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + seconds);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + seconds);
};

export const sfx = {
  shoot: () => playTone({ frequency: 880, endFrequency: 440, seconds: 0.06, wave: 'square', volume: 0.03 }),
  jump: () => playTone({ frequency: 300, endFrequency: 600, seconds: 0.12, wave: 'square', volume: 0.04 }),
  enemyDown: () => playTone({ frequency: 220, endFrequency: 60, seconds: 0.18, wave: 'sawtooth', volume: 0.06 }),
  deflect: () => playTone({ frequency: 1200, endFrequency: 900, seconds: 0.05, wave: 'triangle', volume: 0.04 }),
  hurt: () => playTone({ frequency: 180, endFrequency: 70, seconds: 0.3, wave: 'sawtooth', volume: 0.08 }),
  persuade: () => playTone({ frequency: 520, endFrequency: 780, seconds: 0.35, wave: 'sine', volume: 0.07 }),
  pickup: () => playTone({ frequency: 660, endFrequency: 1320, seconds: 0.15, wave: 'triangle', volume: 0.06 }),
  hotfix: () => playTone({ frequency: 120, endFrequency: 1400, seconds: 0.45, wave: 'sawtooth', volume: 0.08 }),
  stamp: () => playTone({ frequency: 110, endFrequency: 40, seconds: 0.25, wave: 'square', volume: 0.09 }),
  clear: () => playTone({ frequency: 440, endFrequency: 1760, seconds: 0.7, wave: 'triangle', volume: 0.08 }),
};
