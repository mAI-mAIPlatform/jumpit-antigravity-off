export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.isPlayingMusic = false;
        this.nextNoteTime = 0;
        this.currentBeat = 0;
        this.tempo = 120.0;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // s
        this.timerID = null;
    }

    startMusic() {
        if (!this.enabled || this.isPlayingMusic) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.isPlayingMusic = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.currentBeat = 0;
        this.scheduler();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.timerID) clearTimeout(this.timerID);
    }

    scheduler() {
        if (!this.isPlayingMusic) return;

        // While there are notes that will need to play before the next interval,
        // schedule them and advance the pointer.
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.currentBeat++;
        if (this.currentBeat === 16) {
            this.currentBeat = 0;
        }
    }

    scheduleNote(beatNumber, time) {
        // Simple 4/4 Beat
        // Kick on 0, 4, 8, 12
        if (beatNumber % 4 === 0) {
            this.playDrum(100, 0.05, time);
        }

        // Hi-hat on every odd 16th note (off-beat)
        if (beatNumber % 2 === 1) {
            this.playNoise(0.03, time);
        }

        // Bass/Melody Arp
        const bassNotes = [110, 110, 110, 164, 130, 130, 98, 98]; // A2, E3, C3, G2 scale-ish
        if (beatNumber % 2 === 0) {
            const noteIndex = Math.floor(beatNumber / 2) % 8;
            this.playSynth(bassNotes[noteIndex], 0.1, time);
        }
    }

    playDrum(freq, duration, time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    }

    playNoise(duration, time) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(time);
    }

    playSynth(freq, duration, time) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        // Lowpass filter for "warm" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
    }

    playJump() {
        if (!this.enabled) return;
        this.playTone(400, 'square', 0.1, -10, this.ctx.currentTime);
    }

    playDie() {
        if (!this.enabled) return;
        this.playTone(150, 'sawtooth', 0.5, -20, this.ctx.currentTime);
    }

    playTone(freq, type, duration, slide = 0, time = 0) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (time === 0) time = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        if (slide !== 0) {
            osc.frequency.linearRampToValueAtTime(freq + slide * 10, time + duration);
        }

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
    }
}
