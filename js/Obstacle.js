export class Obstacle {
    constructor(game, x) {
        this.game = game;
        this.x = x;
        this.y = 0; // Set by subclass
        this.width = 30;
        this.height = 30;
        this.markedForDeletion = false;
        this.color = '#ff00ff'; // Neon Magenta
    }

    update(speed) {
        this.x -= speed;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

export class DebugBlock extends Obstacle {
    constructor(game, x) {
        super(game, x);
        this.y = this.game.height - this.height - 50;
        this.color = '#ff00ff';
    }
}

export class Spike extends Obstacle {
    constructor(game, x) {
        super(game, x);
        this.width = 30;
        this.height = 30;
        this.y = this.game.height - this.height - 50;
        this.color = '#ff0000'; // Red for danger
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Draw Triangle
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
