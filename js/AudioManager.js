export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playJump() {
        if (!this.enabled) return;
        this.playTone(400, 'square', 0.1, -10);
    }

    playDie() {
        if (!this.enabled) return;
        this.playTone(150, 'sawtooth', 0.5, -20);
    }

    playTone(freq, type, duration, slide = 0) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.linearRampToValueAtTime(freq + slide * 10, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}
