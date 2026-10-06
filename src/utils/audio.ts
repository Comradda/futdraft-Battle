import type { PersonalityType } from '../types/casino';

// Web Audio API Synthesizer for 100% zero-dependency, lag-free casino sound effects on iOS & Web
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = false;
  private musicVolume: number = 0.22;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private musicGainNode: GainNode | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with iOS autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopCasinoMusic();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // ==========================================
  // 1. CARD SOUNDS
  // ==========================================

  // Card slide / deal sound
  public playCardDeal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Card flip sound
  public playCardFlip() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // ==========================================
  // 2. DYNAMIC MONEY SOUNDS BY BET AMOUNT
  // ==========================================

  /**
   * Plays realistic casino chip sound scaled to the bet amount
   * - <= $25: crisp ceramic chip clink
   * - $26 - $100: heavy double clay-chip bounce
   * - > $100 (or All-In): rich heavy stack drop & golden coin cascade
   */
  public playChip(amount: number = 25) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (amount <= 25) {
      // 1. Light ceramic chip clink
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } else if (amount <= 100) {
      // 2. Medium double clay-chip clack
      [0, 0.025].forEach((delay, idx) => {
        const t = now + delay;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 1750 : 2100, t);
        osc.frequency.exponentialRampToValueAtTime(750, t + 0.06);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.07);
      });
    } else {
      // 3. Heavy chip stack drop + gold coin splash ($200, $500, All-In)
      [0, 0.02, 0.045, 0.07].forEach((delay, idx) => {
        const t = now + delay;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        const freq = [1400, 1900, 2300, 1600][idx];
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      });

      // Low resonant felt thud
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(140, now);
      bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.13);
    }
  }

  // Soft tactile chip drop when dragged onto the felt
  public playChipDrop() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.07);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Cash register / payout sound
  public playCashRegister() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5, E6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // ==========================================
  // 3. GENUINE CRUPIER LAUGHTER ON LOSS
  // ==========================================

  /**
   * Generates real acoustic chuckles / taunting laughter when player loses
   */
  public playDealerLaugh(isFemale: boolean = true) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chuckles = [0, 0.12, 0.23, 0.33, 0.42]; // Rhythmic "Ha-ha-ha-ha-ha"
    const basePitch = isFemale ? 580 : 380;

    chuckles.forEach((delay, idx) => {
      const t = now + delay;
      const osc = this.ctx!.createOscillator();
      const formant = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      const pitchOffset = idx === 0 ? 1.05 : idx === 1 ? 1.15 : idx === 2 ? 1.0 : idx === 3 ? 0.9 : 0.8;
      osc.frequency.setValueAtTime(basePitch * pitchOffset, t);
      osc.frequency.exponentialRampToValueAtTime(basePitch * pitchOffset * 0.85, t + 0.09);

      // Vocal formant filter (mimics human mouth "A-ha" resonance)
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(isFemale ? 1150 : 850, t);
      formant.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.25 - idx * 0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // ==========================================
  // 4. ATTRACTIVE VOICE SYNTHESIS (WEB SPEECH API)
  // ==========================================

  /**
   * Speaks dealer dialogue using attractive seductive/charismatic voice
   */
  public speakDealer(text: string, personality: PersonalityType = 'burlona') {
    if (!this.enabled) return;

    if (!('speechSynthesis' in window)) {
      this.playDealerVoice();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';

      const voices = window.speechSynthesis.getVoices();
      const isFemale = personality === 'burlona' || personality === 'amigable' || personality === 'neutral';

      const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
      const preferred =
        spanishVoices.find((v) => {
          const name = v.name.toLowerCase();
          if (isFemale) {
            return (
              name.includes('paulina') ||
              name.includes('monica') ||
              name.includes('mónica') ||
              name.includes('sabina') ||
              name.includes('luciana') ||
              name.includes('helena') ||
              name.includes('female')
            );
          } else {
            return name.includes('jorge') || name.includes('diego') || name.includes('carlos') || name.includes('male');
          }
        }) || spanishVoices[0];

      if (preferred) {
        utterance.voice = preferred;
      }

      if (isFemale) {
        utterance.pitch = personality === 'burlona' ? 1.18 : personality === 'amigable' ? 1.1 : 1.05;
        utterance.rate = 0.96; // Sultry, seductive cadence
      } else {
        utterance.pitch = 0.85; // Deep masculine baritone
        utterance.rate = 0.95;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback blip
      this.playDealerVoice();
    }
  }

  // ==========================================
  // 5. CASINO VIP BACKGROUND MUSIC (RAINBET / CALIENTE / VEGAS)
  // ==========================================

  /**
   * Procedural VIP Casino Lounge Jazz music generator
   * 100% zero downloads, lag-free, loops indefinitely
   */
  public startCasinoMusic() {
    if (this.musicInterval || !this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    this.musicEnabled = true;

    // Master music gain node
    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGainNode.connect(this.ctx.destination);

    // Smooth jazz progression: Dm9 -> G13 -> Cmaj9 -> A7alt
    const chords = [
      [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9
      [196.0, 329.63, 392.0, 493.88, 659.25],  // G13
      [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
      [220.0, 329.63, 392.0, 440.0, 554.37],   // A7
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.ctx || !this.musicEnabled || !this.musicGainNode) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];

      // Soft Rhodes piano / Electric vibraphone chord
      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);

        gain.gain.setValueAtTime(0.08, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGainNode!);

        osc.start(now + idx * 0.03);
        osc.stop(now + 1.9);
      });

      // Upright walking bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const rootBass = currentChord[0] * 0.5;

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(rootBass, now);
      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGainNode!);
      bassOsc.start(now);
      bassOsc.stop(now + 0.95);

      // Brushed jazz hi-hat rhythm
      [0, 0.45, 0.9, 1.35].forEach((offset) => {
        const t = now + offset;
        const bufferSize = this.ctx!.sampleRate * 0.03;
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const hatNoise = this.ctx!.createBufferSource();
        hatNoise.buffer = buffer;
        const hatFilter = this.ctx!.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(8000, t);

        const hatGain = this.ctx!.createGain();
        hatGain.gain.setValueAtTime(0.04, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGainNode!);

        hatNoise.start(t);
      });

      chordIdx++;
    };

    playChordStep();
    this.musicInterval = setInterval(playChordStep, 1900);
  }

  public stopCasinoMusic() {
    this.musicEnabled = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGainNode.disconnect();
      this.musicGainNode = null;
    }
  }

  public toggleCasinoMusic(): boolean {
    if (this.musicEnabled) {
      this.stopCasinoMusic();
      return false;
    } else {
      this.startCasinoMusic();
      return true;
    }
  }

  public isMusicPlaying(): boolean {
    return this.musicEnabled;
  }

  // ==========================================
  // 6. ROULETTE & GAME EVENTS
  // ==========================================

  public playRouletteTick(speedFactor: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 * speedFactor, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = (this.ctx?.currentTime || 0) + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  public playLose() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4
    notes.forEach((freq, idx) => {
      const startTime = (this.ctx?.currentTime || 0) + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  public playDealerVoice(pitch: number = 440) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sound = new SoundEngine();
