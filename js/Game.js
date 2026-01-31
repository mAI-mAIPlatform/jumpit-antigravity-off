import { Player } from './Player.js';
import { Spike, DebugBlock } from './Obstacle.js';
import { Particle } from './Particle.js';
import { AudioManager } from './AudioManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.isRunning = false;
        this.isPaused = false;

        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.resumeBtn = document.getElementById('resume-btn');

        this.bindEvents();
        this.init();
    }

    init() {
        console.log('Game Initialized');

        this.player = new Player(this);
        this.obstacles = [];
        this.particles = [];
        this.audio = new AudioManager();
        this.gameSpeed = 5;
        this.score = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1500;

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.resumeBtn.addEventListener('click', () => this.togglePause());

        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleInput(e), { passive: false });
    }

    start() {
        // Resume Audio Context if suspended (Browser Policy)
        if (this.audio && this.audio.ctx && this.audio.ctx.state === 'suspended') {
            try {
                this.audio.ctx.resume();
            } catch (e) {
                console.warn("Could not resume audio context:", e);
            }
        }

        console.log('Game Started');
        this.isRunning = true;
        this.isPaused = false;

        // Hide Menus
        const menu = document.getElementById('main-menu');
        if (menu) {
            menu.classList.add('hidden');
            menu.classList.remove('active');
        }

        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.classList.add('hidden');

        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            gameOverScreen.classList.remove('active');
        }

        const hud = document.getElementById('hud');
        if (hud) hud.classList.remove('hidden');

        // Reset entities
        this.player = new Player(this);
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.gameSpeed = 5;
        this.spawnTimer = 0;
        this.lastSpawnTime = 0; // for spacing check
        this.updateScore(0);
        this.updateHighScore();
    }

    restart() {
        this.start();
    }

    handleInput(e) {
        // Pause Toggle
        if (e.type === 'keydown' && (e.code === 'Escape' || e.code === 'KeyP')) {
            this.togglePause();
            return;
        }

        if (!this.isRunning || this.isPaused) return;

        if (e.type === 'keydown' && e.code === 'Space') {
            this.player.jump();
        } else if (e.type === 'mousedown' || e.type === 'touchstart') {
            e.preventDefault();
            this.player.jump();
        }
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;

        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            this.lastTime = performance.now(); // Avoid huge delta time jump
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        if (this.player) this.player.resize(height);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.isRunning && !this.isPaused) {
            this.update(deltaTime);
        }

        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        this.player.update(deltaTime);

        // Obstacles Spawning
        this.spawnTimer += deltaTime;
        // Basic interval check AND minimum separation check (approx 500ms at current speed)
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            if (this.spawnInterval > 500) this.spawnInterval -= 5;
        }

        // Update Obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.update(this.gameSpeed);
        });
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        // Update Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Collisions
        this.checkCollisions();

        // Score
        this.score += 0.05;
        this.updateScore(Math.floor(this.score));

        // Speed scaling
        if (this.gameSpeed < 15) this.gameSpeed += 0.0005;
    }

    spawnObstacle() {
        const type = Math.random() < 0.6 ? 'spike' : 'box';
        if (type === 'box') {
            this.obstacles.push(new DebugBlock(this, this.width));
        } else {
            this.obstacles.push(new Spike(this, this.width));
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    checkCollisions() {
        const p = this.player;
        const hitboxPadding = 5;

        this.obstacles.forEach(obs => {
            if (
                p.x + hitboxPadding < obs.x + obs.width - hitboxPadding &&
                p.x + p.size - hitboxPadding > obs.x + hitboxPadding &&
                p.y + hitboxPadding < obs.y + obs.height - hitboxPadding &&
                p.y + p.size - hitboxPadding > obs.y + hitboxPadding
            ) {
                this.gameOver();
            }
        });
    }

    updateScore(val) {
        const el = document.getElementById('score-value');
        if (el) el.innerText = val;
    }

    updateHighScore() {
        const highScore = localStorage.getItem('jumpit_highscore') || 0;
        const hudEl = document.getElementById('hud-high-score-value');
        if (hudEl) hudEl.innerText = highScore;
        return highScore;
    }

    gameOver() {
        this.isRunning = false;

        if (this.audio) this.audio.playDie();
        this.spawnParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2, this.player.color, 50);

        const finalScore = Math.floor(this.score);
        document.getElementById('final-score-value').innerText = finalScore;

        // High Score
        let highScore = this.updateHighScore();
        if (finalScore > highScore) {
            highScore = finalScore;
            localStorage.setItem('jumpit_highscore', highScore);
            this.updateHighScore();
        }
        document.getElementById('high-score-value').innerText = highScore;

        setTimeout(() => {
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('game-over').classList.add('active');
            document.getElementById('hud').classList.add('hidden');
        }, 500);
    }

    draw() {
        // Clear & Background
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Floor
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height - 50);
        this.ctx.lineTo(this.width, this.height - 50);
        this.ctx.stroke();

        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
    }
}
