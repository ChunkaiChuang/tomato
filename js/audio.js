/**
 * Web Audio API 音效合成器
 * 無需外部音檔，支援完全離線運行與零延遲提示聲與白噪音生成
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.ambientType = 'none';
    this.ambientVolume = 0.4;
    this.ambientNode = null;
    this.ambientGain = null;
    this.tickInterval = null;
  }

  // 初始化或恢復 AudioContext（需使用者手勢觸發以符合瀏覽器政策）
  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // 建立全局動態壓縮器 (DynamicsCompressor)，提升響度並避免音量放大時破音失真
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

  // 取得音訊輸出端點（透過壓縮器）
  getDestination() {
    return this.compressor || this.ctx.destination;
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

  /**
   * 播放階段完成提示音
   * @param {'bell'|'zen'|'digital'|'marimba'|'silent'} type 
   */
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

  // 清脆鐘聲 (Bell Chime) - 大幅增強響度與泛音
  _playBellChime(ctx, now) {
    const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
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

  // 禪風木魚 / 缽音 (Zen Bowl) - 宏亮共鳴
  _playZenBowl(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.8, now);
    baseGain.connect(this.getDestination());

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(258, now + 3.2);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    osc.connect(gain);
    gain.connect(baseGain);
    osc.start(now);
    osc.stop(now + 3.5);

    // 次泛音提升厚實感
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(523.25, now); // C5
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    subOsc.connect(subGain);
    subGain.connect(baseGain);
    subOsc.start(now);
    subOsc.stop(now + 1.8);
  }

  // 數位節奏 (Digital Melody) - 清亮活潑
  _playDigitalBeep(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.5, now);
    baseGain.connect(this.getDestination());

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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

  // 輕快木琴 (Marimba)
  _playMarimba(ctx, now) {
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(this.volume * 1.6, now);
    baseGain.connect(this.getDestination());

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
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

  // 短促按鈕點擊聲
  playClick() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // 忽略自動播放限制
    }
  }

  /**
   * 切換背景專注音效 / 白噪音
   * @param {'none'|'tick'|'rain'|'whitenoise'|'stream'} type 
   */
  setAmbientSound(type) {
    this.stopAmbientSound();
    this.ambientType = type;
    if (type === 'none') return;

    const ctx = this.initContext();
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.ambientVolume, ctx.currentTime);
    this.ambientGain.connect(ctx.destination);

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
      gain.gain.setValueAtTime(this.ambientVolume * 0.25, now);
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

    // 低通濾波器，讓白噪音更加柔和舒適 (Pink/Brown noise 質感)
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

// 暴露單例物件
window.soundEngine = new SoundEngine();
