import { ref } from 'vue';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.volume = 1.0;
    this.ambientType = 'none';
    this.ambientVolume = 0.6;
    this.ambientNode = null;
    this.ambientGain = null;
    this.tickInterval = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // 全域動態壓縮器，提升整體響度並避免破音
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getDestination() {
    return this.compressor || (this.ctx ? this.ctx.destination : null);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 1.5, this.ctx.currentTime);
    }
  }

  playNotification(type = 'bell') {
    if (type === 'silent') return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'bell':
        this._playBellChime(ctx, now);
        break;
      case 'zen':
        this._playZenBowl(ctx, now);
        break;
      case 'digital':
        this._playDigitalBeep(ctx, now);
        break;
      case 'marimba':
        this._playMarimba(ctx, now);
        break;
      default:
        this._playBellChime(ctx, now);
    }
  }

  _playBellChime(ctx, now) {
    const freqs = [587.33, 880, 1174.66, 1760];
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.6, now);
    baseGain.connect(this.getDestination());

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const decay = 2.4 / (idx + 1);
      gain.gain.setValueAtTime(0.8 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(baseGain);
      osc.start(now);
      osc.stop(now + decay);
    });
  }

  _playZenBowl(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.8, now);
    baseGain.connect(this.getDestination());

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now);
    osc.frequency.exponentialRampToValueAtTime(258, now + 3.2);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
    osc.connect(gain);
    gain.connect(baseGain);
    osc.start(now);
    osc.stop(now + 3.5);

    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(523.25, now);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    subOsc.connect(subGain);
    subGain.connect(baseGain);
    subOsc.start(now);
    subOsc.stop(now + 1.8);
  }

  _playDigitalBeep(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.5, now);
    baseGain.connect(this.getDestination());

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.8, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
      osc.connect(gain);
      gain.connect(baseGain);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  _playMarimba(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.6, now);
    baseGain.connect(this.getDestination());

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(1.0, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
      osc.connect(gain);
      gain.connect(baseGain);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  playClick() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(this.volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  setAmbientSound(type) {
    this.stopAmbientSound();
    this.ambientType = type;
    if (type === 'none') return;

    const ctx = this.initContext();
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.ambientVolume * 1.5, ctx.currentTime);
    this.ambientGain.connect(this.getDestination());

    if (type === 'tick') {
      this._startTickSound(ctx);
    } else if (type === 'whitenoise') {
      this._startWhiteNoise(ctx);
    } else if (type === 'rain') {
      this._startRainSound(ctx);
    } else if (type === 'stream') {
      this._startStreamSound(ctx);
    }
  }

  stopAmbientSound() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.ambientNode) {
      try {
        if (typeof this.ambientNode.stop === 'function') {
          this.ambientNode.stop();
        }
        this.ambientNode.disconnect();
      } catch (e) {}
      this.ambientNode = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  _startTickSound(ctx) {
    const playTick = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(this.ambientVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(now);
      osc.stop(now + 0.02);
    };
    playTick();
    this.tickInterval = setInterval(playTick, 1000);
  }

  _startWhiteNoise(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    noise.connect(filter);
    filter.connect(this.ambientGain);
    noise.start();
    this.ambientNode = noise;
  }

  _startRainSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);
    noise.connect(filter);
    filter.connect(this.ambientGain);
    noise.start();
    this.ambientNode = noise;
  }

  _startStreamSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    noise.connect(filter);
    filter.connect(this.ambientGain);
    noise.start();
    this.ambientNode = noise;
  }
}

const engine = new SoundEngine();

export function useSound() {
  const currentAmbient = ref('none');
  const ambientVol = ref(60);

  const setAmbient = (type) => {
    currentAmbient.value = type;
    engine.setAmbientSound(type);
  };

  const updateAmbientVolume = (val) => {
    ambientVol.value = val;
    engine.setAmbientVolume(val / 100);
  };

  return {
    engine,
    currentAmbient,
    ambientVol,
    setAmbient,
    updateAmbientVolume,
    setAmbientVolume: (val) => updateAmbientVolume(val),
    playNotification: (type) => engine.playNotification(type),
    playClick: () => engine.playClick(),
    setVolume: (vol) => engine.setVolume(vol),
    initContext: () => engine.initContext()
  };
}
