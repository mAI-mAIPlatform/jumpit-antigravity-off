export class Player {
    constructor(game) {
        this.game = game;
        this.size = 30;
        this.x = 100;
        this.y = this.game.height - this.size - 50; // Initial floor position
        this.baseY = this.game.height - this.size - 50;

        // Physics
        this.dy = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.isGrounded = true;
        this.jumpCount = 0;
        this.maxJumps = 2;

        // Visuals
        this.color = '#0aff00'; // Neon Lime
        this.rotation = 0;
    }

    update(deltaTime) {
        // Apply Gravity
        this.dy += this.gravity;
        this.y += this.dy;

        // Ground Collision
        if (this.y >= this.baseY) {
            this.y = this.baseY;
            this.dy = 0;
            this.isGrounded = true;
            this.jumpCount = 0; // Reset jumps
            this.rotation = 0; // Reset rotation on land
        } else {
            this.isGrounded = false;
            // Rotate while jumping
            this.rotation += 0.1;
        }
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.dy = this.jumpForce;
            this.isGrounded = false;
            this.jumpCount++;

            // Jump Particles and Sound
            if (this.game.spawnParticles) {
                // Different color for second jump?
                const color = this.jumpCount === 2 ? '#00f3ff' : '#fff';
                this.game.spawnParticles(this.x + this.size / 2, this.y + this.size, color, 5);
            }
            if (this.game.audio) {
                this.game.audio.playJump();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        // Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }

    resize(height) {
        this.baseY = height - this.size - 50;
        if (this.isGrounded) {
            this.y = this.baseY;
        }
    }
}
