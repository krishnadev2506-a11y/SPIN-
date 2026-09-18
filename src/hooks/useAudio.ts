import { useState, useEffect } from 'react';

// Keep global mute state in module scope so it is shared across all components using the hook
let globalMuted = localStorage.getItem('fhc_muted') === 'true';

// Single global audio context to avoid creating multiple contexts
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Help synthesize white noise for the confetti pop sound
const createNoiseBuffer = (ctx: AudioContext, duration: number): AudioBuffer => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const useAudio = () => {
  const [muted, setMuted] = useState<boolean>(globalMuted);

  useEffect(() => {
    localStorage.setItem('fhc_muted', String(muted));
    globalMuted = muted;
  }, [muted]);

  const toggleMute = () => {
    setMuted(prev => !prev);
    // Unsuspend audio context upon user toggle interaction
    try {
      getAudioContext();
    } catch (e) {
      console.warn("Failed to initialize AudioContext", e);
    }
  };

  const playTick = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      // Fast pitch sweep downward for a classic mechanical click sound
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (error) {
      console.error('Audio tick error:', error);
    }
  };

  const playSpinStart = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sawtooth';
      // Low rising sweep to indicate acceleration
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.8);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch (error) {
      console.error('Audio spin start error:', error);
    }
  };

  const playReveal = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      // Synthesize an ascending sparkly arpeggio (C major 7 / 9 feel)
      const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77];
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        
        // Sparkly ring modulation feel using a tiny bit of frequency modulation or just high frequencies
        gainNode.gain.setValueAtTime(0.001, now + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.08, now + index * 0.1 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
        
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.45);
      });
    } catch (error) {
      console.error('Audio reveal error:', error);
    }
  };

  const playCelebration = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Chord: C4, E4, G4, C5, E5, G5
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      
      freqs.forEach((freq) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator(); // detuned for fat brass sound
        const gainNode = ctx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Brassy sound using sawtooth
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq + 3, now); // slight detune
        
        // Fade in chord slightly and sustain then fade out
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.03, now + 0.2); // total max volume is controlled by low gains
        gainNode.gain.setValueAtTime(0.03, now + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.6);
        osc2.stop(now + 2.6);
      });
    } catch (error) {
      console.error('Audio celebration error:', error);
    }
  };

  const playConfettiPop = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Noise burst for the pop sound
      const buffer = createNoiseBuffer(ctx, 0.1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.0, now);
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(now);
      source.stop(now + 0.12);

      // Low frequency thump to simulate the pressure release of a popper
      const lowOsc = ctx.createOscillator();
      const lowGain = ctx.createGain();
      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);
      lowOsc.type = 'triangle';
      lowOsc.frequency.setValueAtTime(90, now);
      lowOsc.frequency.exponentialRampToValueAtTime(20, now + 0.08);
      
      lowGain.gain.setValueAtTime(0.2, now);
      lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      lowOsc.start(now);
      lowOsc.stop(now + 0.09);
    } catch (error) {
      console.error('Audio confetti pop error:', error);
    }
  };

  const playTimerTick = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (error) {
      console.error('Audio timer tick error:', error);
    }
  };

  const playAlarm = () => {
    if (globalMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Synthesize an alarm buzzer (2 pulses of alternating high/low pitch)
      for (let i = 0; i < 4; i++) {
        const time = now + i * 0.25;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, time);

        gainNode.gain.setValueAtTime(0.05, time);
        gainNode.gain.linearRampToValueAtTime(0.05, time + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc.start(time);
        osc.stop(time + 0.21);
      }
    } catch (error) {
      console.error('Audio alarm error:', error);
    }
  };

  return {
    muted,
    toggleMute,
    playTick,
    playSpinStart,
    playReveal,
    playCelebration,
    playConfettiPop,
    playTimerTick,
    playAlarm,
  };
};
