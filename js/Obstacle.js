export class Obstacle {
    constructor(game, x, y, width, height, color) {
        this.game = game;
        this.x = x;
        this.y = y || 0;
        this.width = width || 30;
        this.height = height || 30;
        this.color = color || '#ff00ff';
        this.markedForDeletion = false;
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

export class Platform extends Obstacle {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height, '#0aff00'); // Neon Lime default
        this.type = 'platform';
    }
}

export class Spike extends Obstacle {
    constructor(game, x, y) {
        super(game, x, y, 30, 30, '#ff0000'); // Red for danger
        this.type = 'spike';
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

export class PowerUp extends Obstacle {
    constructor(game, x, y, type) {
        super(game, x, y, 20, 20, '#ffffff');
        this.type = type; // 'shield', 'slowmo', 'jump'

        if (this.type === 'shield') this.color = '#00f3ff'; // Cyan
        else if (this.type === 'slowmo') this.color = '#ff00ff'; // Magenta
        else if (this.type === 'jump') this.color = '#ffff00'; // Yellow
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        if (this.type === 'shield') {
            // Circle
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        } else if (this.type === 'slowmo') {
            // Hourglass or Diamond
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height/2);
            ctx.lineTo(this.x + this.width/2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height/2);
        } else {
            // Star or Box
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.fill();
        ctx.restore();
    }
}

export class DebugBlock extends Obstacle {
    constructor(game, x) {
        super(game, x, game.height - 80, 30, 30, '#ff00ff');
    }
}
