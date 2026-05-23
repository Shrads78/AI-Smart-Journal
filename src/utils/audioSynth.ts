class AmbientSynth {
  private ctx: AudioContext | null = null;
  private active: boolean = false;
  private intervalId: any = null;

  start() {
    if (this.active) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.active = true;
      this.playChords();
    } catch (e) {
      console.error("Audio Web Synth failed to start", e);
    }
  }

  private playTone(freq: number, startTime: number, duration: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      // soft sine wave for high-comfort humming pad
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Fading envelope: soft attack, sustained comfort, slow fade-out
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.04, startTime + 1.5);
      gainNode.gain.setValueAtTime(0.04, startTime + duration - 2);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (err) {
      console.error(err);
    }
  }

  private playChords() {
    if (!this.ctx || !this.active) return;

    const triggerChordCycle = () => {
      if (!this.ctx || !this.active) return;
      const now = this.ctx.currentTime;
      // therapeutic pentatonic chords
      const chordSets = [
        [110.0, 165.0, 220.0, 293.66, 329.63], // A min sus4 (A, E, A, D, E)
        [130.81, 196.0, 261.63, 329.63, 392.0], // C Maj7 (C, G, C, E, G)
        [146.83, 220.0, 293.66, 349.23, 440.0], // D min7 (D, A, D, F, A)
        [98.0, 146.83, 196.0, 246.94, 293.66], // G Maj sus2 (G, D, G, B, D)
      ];

      // Pick a random calming chord set
      const chord = chordSets[Math.floor(Math.random() * chordSets.length)];
      chord.forEach((freq, idx) => {
        // slightly strum/stagger tones
        this.playTone(freq, now + idx * 0.18, 8.5);
      });
    };

    triggerChordCycle();
    this.intervalId = setInterval(triggerChordCycle, 8000);
  }

  stop() {
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }

  isActive() {
    return this.active;
  }
}

export const ambientSynthInstance = new AmbientSynth();
