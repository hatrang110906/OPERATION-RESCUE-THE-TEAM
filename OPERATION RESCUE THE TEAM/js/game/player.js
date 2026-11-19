// js/game/player.js

import { ACTIONS } from './environment.js';

export class PlayerController {
    constructor(onMoveCallback) {
        this.onMoveCallback = onMoveCallback;
        this.enabled = false;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    setEnabled(flag) {
        this.enabled = flag;
    }

    handleKeyDown(e) {
        if (!this.enabled) return;

        let action = null;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                action = ACTIONS.UP;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                action = ACTIONS.DOWN;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                action = ACTIONS.LEFT;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                action = ACTIONS.RIGHT;
                break;
            default:
                return;
        }

        e.preventDefault();
        if (this.onMoveCallback) {
            this.onMoveCallback(action);
        }
    }

    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}