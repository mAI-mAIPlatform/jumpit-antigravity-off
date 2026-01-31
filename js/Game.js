import { Player } from './Player.js';
import { Spike, Platform, PowerUp } from './Obstacle.js';
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

        // Initial setup
        this.audio = new AudioManager();
        this.platforms = [];
        this.obstacles = [];
        this.particles = [];
        this.player = new Player(this);
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.resumeBtn.addEventListener('click', () => this.togglePause());

        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleInput(e), { passive: false });

        window.addEventListener('resize', () => this.resize(window.innerWidth, window.innerHeight));
    }

    init() {
        this.resize(window.innerWidth, window.innerHeight);
    }

    start() {
        if (this.audio) {
            this.audio.startMusic();
        }

        this.isRunning = true;
        this.isPaused = false;

        if (this.startBtn) this.startBtn.blur();
        if (this.restartBtn) this.restartBtn.blur();

        this.toggleMenus(false);

        // Reset entities
        this.platforms = [];
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.baseGameSpeed = 5;
        this.gameSpeed = 5;
        this.spawnTimer = 0;
        this.slowMoTimer = 0;

        this.player = new Player(this);
        // Default maxJumps is 1 (Player handles default)

        // Initial Platform (Ground)
        this.createPlatform(0, this.height - 50, this.width, 50);

        this.updateScore(0);
        this.updateHighScore();

        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    toggleMenus(showMenu) {
        const menu = document.getElementById('main-menu');
        const hud = document.getElementById('hud');
        const gameOverScreen = document.getElementById('game-over');
        const pauseScreen = document.getElementById('pause-screen');

        if (!showMenu) {
            if (menu) { menu.classList.add('hidden'); menu.classList.remove('active'); }
            if (gameOverScreen) { gameOverScreen.classList.add('hidden'); gameOverScreen.classList.remove('active'); }
            if (pauseScreen) pauseScreen.classList.add('hidden');
            if (hud) hud.classList.remove('hidden');
        } else {
             // Logic for showing menus typically handled by Game Over or Pause
        }
    }

    restart() {
        this.start();
    }

    handleInput(e) {
        if (e.type === 'keydown' && (e.code === 'Escape' || e.code === 'KeyP')) {
            this.togglePause();
            return;
        }

        if (!this.isRunning || this.isPaused) return;

        if ((e.type === 'keydown' && e.code === 'Space') ||
            e.type === 'mousedown' ||
            e.type === 'touchstart') {
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
            this.lastTime = performance.now();
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.player) this.player.resize(height);
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Handle SlowMo
        let speedModifier = 1;
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= deltaTime;
            speedModifier = 0.5;
        }

        // Apply Speed
        this.gameSpeed = this.baseGameSpeed * speedModifier;

        // Pass effective deltaTime to player?
        // No, player physics (gravity) is frame-based currently, so we pass raw deltaTime for timers
        this.player.update(deltaTime);

        // Manage World Generation
        this.managePlatforms();

        // Update Entities
        this.platforms.forEach(p => p.update(this.gameSpeed));
        this.obstacles.forEach(o => o.update(this.gameSpeed));
        this.particles.forEach(p => p.update());

        // Cleanup
        this.platforms = this.platforms.filter(p => !p.markedForDeletion);
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Check Collisions
        this.checkCollisions();

        // Score & Base Speed Increase
        this.score += 0.05;
        this.updateScore(Math.floor(this.score));

        if (this.baseGameSpeed < 20) this.baseGameSpeed += 0.001;
    }

    managePlatforms() {
        const lastPlatform = this.platforms[this.platforms.length - 1];

        let spawnX = this.width;
        if (lastPlatform) {
            spawnX = lastPlatform.x + lastPlatform.width;
        }

        if (spawnX < this.width + 100) {
            // Determine next segment type
            const gapChance = 0.3; // 30% chance of gap
            const floatChance = 0.2; // 20% chance of floating platform

            // Random Gap
            if (Math.random() < gapChance && this.score > 50) {
                const gapSize = 100 + Math.random() * 100;
                spawnX += gapSize;
            }

            // Platform properties
            const width = 200 + Math.random() * 300;
            const y = this.height - 50; // Ground level

            if (Math.random() < floatChance && this.score > 100) {
                 // Floating Platform
                 const floatY = this.height - 150 - (Math.random() * 100);
                 this.createPlatform(spawnX, floatY, width, 30);
            } else {
                 // Ground Platform
                 this.createPlatform(spawnX, y, width, 50);
            }
        }
    }

    createPlatform(x, y, width, height) {
        const platform = new Platform(this, x, y, width, height);
        this.platforms.push(platform);

        // Spawn Spikes or Powerups
        const contentRand = Math.random();

        // 10% chance for PowerUp
        if (contentRand < 0.1) {
            const typeRand = Math.random();
            let type = 'shield';
            if (typeRand < 0.33) type = 'jump';
            else if (typeRand < 0.66) type = 'slowmo';

            const px = x + 50 + Math.random() * (width - 100);
            const py = y - 40; // float above
            this.obstacles.push(new PowerUp(this, px, py, type));

        }
        // 40% chance for Spike (only if not powerup)
        else if (contentRand < 0.5 && this.score > 30) {
            const spikeX = x + 50 + Math.random() * (width - 100);
            const spike = new Spike(this, spikeX, y - 30);
            this.obstacles.push(spike);
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

        // Obstacles (Spikes, PowerUps)
        this.obstacles.forEach(obs => {
            if (
                p.x + hitboxPadding < obs.x + obs.width - hitboxPadding &&
                p.x + p.size - hitboxPadding > obs.x + hitboxPadding &&
                p.y + hitboxPadding < obs.y + obs.height - hitboxPadding &&
                p.y + p.size - hitboxPadding > obs.y + hitboxPadding
            ) {
                // Determine type
                if (obs instanceof PowerUp) {
                    this.activatePowerUp(obs);
                    obs.markedForDeletion = true;
                } else if (obs instanceof Spike) {
                    if (p.hasShield) {
                        p.hasShield = false; // Consume shield
                        obs.markedForDeletion = true;
                        this.spawnParticles(obs.x, obs.y, '#00f3ff', 20); // Shield break effect
                        if (this.audio) this.audio.playTone(600, 'sine', 0.1); // Shield sound
                    } else {
                        this.gameOver();
                    }
                } else {
                    // Other obstacles?
                    this.gameOver();
                }
            }
        });

        // Check if player fell off world
        if (p.y > this.height) {
            this.gameOver();
        }
    }

    activatePowerUp(powerup) {
        if (this.audio) this.audio.playTone(800, 'square', 0.1, 10);
        this.spawnParticles(powerup.x, powerup.y, powerup.color, 20);

        if (powerup.type === 'shield') {
            this.player.hasShield = true;
        } else if (powerup.type === 'jump') {
            this.player.maxJumps = 2; // Enable double jump
            this.player.doubleJumpTimer = 10000; // 10s
        } else if (powerup.type === 'slowmo') {
            this.slowMoTimer = 5000; // 5s
        }
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
        if (this.audio) {
            this.audio.playDie();
            this.audio.stopMusic();
        }
        this.spawnParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2, this.player.color, 50);

        const finalScore = Math.floor(this.score);
        document.getElementById('final-score-value').innerText = finalScore;

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
        // Clear
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.platforms.forEach(p => p.draw(this.ctx));
        this.obstacles.forEach(o => o.draw(this.ctx));
        this.player.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));
    }
}
