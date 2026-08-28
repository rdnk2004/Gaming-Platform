/**
 * CYBERARCADE RETRO SOUND SYNTHESIZER
 * High-performance Web Audio API procedural synthesis engine.
 * Zero external audio asset dependencies, pre-allocated noise buffers, and master gain management.
 */

class SoundFxService {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private isMuted: boolean = false
  private volume: number = 0.8
  private initialized: boolean = false

  constructor() {
    const storedMute = localStorage.getItem('cyberarcade_muted')
    this.isMuted = storedMute === 'true'

    // Auto-unlock on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext()
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
        window.removeEventListener('touchstart', unlockAudio)
      }
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio, { passive: true })
      window.addEventListener('touchstart', unlockAudio, { passive: true })
    }
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime)
        this.masterGain.connect(this.ctx.destination)

        // Pre-allocate 0.5s of white noise buffer to prevent runtime GC churn during gameplay
        const sampleRate = this.ctx.sampleRate
        const bufferSize = Math.floor(sampleRate * 0.5)
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
        const channelData = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1
        }
        this.initialized = true
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    return this.ctx
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    localStorage.setItem('cyberarcade_muted', this.isMuted ? 'true' : 'false')

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime)
    }

    return this.isMuted
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  public getVolume(): number {
    return this.volume
  }

  // Play button click / UI toggle sound
  public playClick() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.04)
  }

  // Play orb / food eat sound (chirp up)
  public playEat() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.07) // C6

    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.07)
  }

  // Play block rotation sound (short crisp click)
  public playRotate() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(320, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.035)

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.035)
  }

  // Play hard drop / paddle hit impact sound
  public playImpact() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.28, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  // Play line clear / score reward (high arcade chime arpeggio)
  public playLineClear() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = ctx.currentTime + idx * 0.045

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.18, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.09)
    })
  }

  // Play explosion / crash sound with pre-allocated buffer
  public playExplosion() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain || !this.noiseBuffer) return

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = this.noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.28)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.32, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)

    whiteNoise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    whiteNoise.start(ctx.currentTime)
    whiteNoise.stop(ctx.currentTime + 0.28)
  }

  // Play level up / victory fanfare
  public playFanfare() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = ctx.currentTime + idx * 0.075

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.24, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.18)
    })
  }

  // Play powerup sweep
  public playPowerup() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15)

    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  // Play game over descending chord
  public playGameOver() {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const notes = [440, 392, 349.23, 293.66] // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = ctx.currentTime + idx * 0.1

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.22)
    })
  }
}

export const soundFx = new SoundFxService()
