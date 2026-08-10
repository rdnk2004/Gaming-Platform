/**
 * CYBERARCADE RETRO SOUND SYNTHESIZER
 * Native Web Audio API implementation - zero external asset dependencies
 */

class SoundFxService {
    private ctx: AudioContext | null = null
    private isMuted: boolean = false

    constructor() {
        const storedMute = localStorage.getItem('cyberarcade_muted')
        this.isMuted = storedMute === 'true'
    }

    private initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            if (AudioCtx) {
                this.ctx = new AudioCtx()
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {})
        }
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted
        localStorage.setItem('cyberarcade_muted', this.isMuted ? 'true' : 'false')
        return this.isMuted
    }

    public getIsMuted(): boolean {
        return this.isMuted
    }

    // Play button click / UI toggle sound
    public playClick() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05)

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.05)
    }

    // Play orb / food eat sound (chirp up)
    public playEat() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime) // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.08) // C6

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.08)
    }

    // Play block rotation sound (short wooden click)
    public playRotate() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(300, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04)

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.04)
    }

    // Play hard drop / hit impact sound
    public playImpact() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(160, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12)

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.12)
    }

    // Play line clear / score reward (high arcade chime)
    public playLineClear() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator()
            const gain = this.ctx!.createGain()
            const startTime = this.ctx!.currentTime + idx * 0.05

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, startTime)

            gain.gain.setValueAtTime(0.15, startTime)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)

            osc.connect(gain)
            gain.connect(this.ctx!.destination)

            osc.start(startTime)
            osc.stop(startTime + 0.1)
        })
    }

    // Play explosion / crash sound
    public playExplosion() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const bufferSize = this.ctx.sampleRate * 0.3
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const output = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }

        const whiteNoise = this.ctx.createBufferSource()
        whiteNoise.buffer = buffer

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(800, this.ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3)

        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)

        whiteNoise.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        whiteNoise.start()
    }

    // Play level up fanfare
    public playFanfare() {
        if (this.isMuted) return
        this.initContext()
        if (!this.ctx) return

        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator()
            const gain = this.ctx!.createGain()
            const startTime = this.ctx!.currentTime + idx * 0.08

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, startTime)

            gain.gain.setValueAtTime(0.2, startTime)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

            osc.connect(gain)
            gain.connect(this.ctx!.destination)

            osc.start(startTime)
            osc.stop(startTime + 0.2)
        })
    }
}

export const soundFx = new SoundFxService()
