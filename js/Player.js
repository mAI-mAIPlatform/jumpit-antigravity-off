export class Player {
    constructor(game) {
        this.game = game;
        this.size = 30;
        this.x = 100;
        this.y = 200; // Start in air

        // Physics
        this.dy = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.isGrounded = false;
        this.jumpCount = 0;
        this.maxJumps = 1; // Default 1, powerup gives 2

        // Power-ups
        this.hasShield = false;
        this.doubleJumpTimer = 0;

        // Visuals
        this.color = '#0aff00'; // Neon Lime
        this.rotation = 0;
    }

    update(deltaTime) {
        // Powerup Timers
        if (this.doubleJumpTimer > 0) {
            this.doubleJumpTimer -= deltaTime;
            if (this.doubleJumpTimer <= 0) {
                this.maxJumps = 1;
                this.doubleJumpTimer = 0;
            }
        }

        // Apply Gravity
        this.dy += this.gravity;
        this.y += this.dy;

        let onGround = false;

        // We only check for landing if we are falling
        if (this.dy >= 0) {
            this.game.platforms.forEach(platform => {
                // Check if horizontally aligned
                if (
                    this.x + this.size > platform.x &&
                    this.x < platform.x + platform.width
                ) {
                    const platformTop = platform.y;
                    const playerBottom = this.y + this.size;
                    const prevPlayerBottom = playerBottom - this.dy;

                    // Check if we crossed the top edge from above
                    // Using a small epsilon for float precision
                    if (prevPlayerBottom <= platformTop + 5 && playerBottom >= platformTop) {
                        this.y = platformTop - this.size;
                        this.dy = 0;
                        onGround = true;
                        this.jumpCount = 0;
                        this.rotation = 0;
                    }
                }
            });
        }

        this.isGrounded = onGround;

        // Rotate while jumping
        if (!this.isGrounded) {
            this.rotation += 0.1;
        } else {
            this.rotation = 0;
        }
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.dy = this.jumpForce;
            this.isGrounded = false;
            this.jumpCount++;

            // Jump Particles and Sound
            if (this.game.spawnParticles) {
                // Different color for second jump
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
        // Shield takes priority, then Double Jump (Yellow/Cyan mix?), then default
        if (this.hasShield) ctx.shadowColor = '#fff';
        else if (this.doubleJumpTimer > 0) ctx.shadowColor = '#ffff00';
        else ctx.shadowColor = this.color;

        ctx.fillStyle = this.hasShield ? '#ffffff' : (this.doubleJumpTimer > 0 ? '#ffff00' : this.color);
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Draw Shield Ring
        if (this.hasShield) {
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    resize(height) {
        // No longer strictly bound to a floor, but ensure we don't get stuck if screen shrinks
        // actually, logic is relative to platforms, so resize is less critical for Y.
    }
}
