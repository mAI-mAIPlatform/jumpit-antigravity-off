/**
 * JumpIt - Main Entry Point
 */
import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // Initial resize
    resizeCanvas();

    // Handle Resize
    window.addEventListener('resize', resizeCanvas);

    function resizeCanvas() {
        // Set canvas resolution to match display size for sharp rendering
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        canvas.width = width;
        canvas.height = height;

        // Notify game instance of resize (if needed for recalculating positions)
        if (game) {
            game.resize(width, height);
        }
    }
});
