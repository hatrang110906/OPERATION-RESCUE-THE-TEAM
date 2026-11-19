// js/game/environment.js

import { Maze, CELL_TYPES } from './maze.js';
import { RescueManager } from './rescue.js';

export const REWARDS = {
    STEP: -1,
    WALL: -5,
    LOCKED_EXIT: -5,
    TRAP: -20,
    RESCUE: 30,
    TREASURE: 15,
    WIN: 250
};

export const ACTIONS = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

export const ACTION_NAMES = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const ACTION_DELTAS = {
    [ACTIONS.UP]:    { dx: 0,  dy: -1 },
    [ACTIONS.DOWN]:  { dx: 0,  dy: 1 },
    [ACTIONS.LEFT]:  { dx: -1, dy: 0 },
    [ACTIONS.RIGHT]: { dx: 1,  dy: 0 }
};

export class MazeEnvironment {
    constructor(maxSteps = 450) {
        this.maze = new Maze();
        this.rescueManager = new RescueManager();
        this.maxSteps = maxSteps;
        this.reset();
    }

    reset() {
        const start = this.maze.startPos;
        this.state = {
            x: start.x,
            y: start.y,
            rescuedHaTrang: false,
            rescuedUyenNhi: false,
            rescuedQuynhAnh: false,
            rescuedHaiAnh: false,
            rescuedToQuan: false,
            hasTreasure: false
        };

        this.steps = 0;
        this.totalReward = 0;
        this.done = false;
        this.win = false;
        this.visitedCells = new Set([`${start.x},${start.y}`]);

        // Lưu chuỗi tọa độ Agent đã bước qua & thứ tự thành viên được cứu để đi nối đuôi
        this.pathHistory = [{ x: start.x, y: start.y }];
        this.rescuedOrder = []; // mảng id: ['H1', 'H3', ...]

        return this.getState();
    }

    getState() {
        return { ...this.state };
    }

    step(action) {
        if (this.done) {
            return {
                nextState: this.getState(),
                reward: 0,
                done: true,
                win: this.win,
                event: 'Episode đã kết thúc.'
            };
        }

        this.steps++;
        const delta = ACTION_DELTAS[action];
        const targetX = this.state.x + delta.dx;
        const targetY = this.state.y + delta.dy;
        const targetCell = this.maze.getCell(targetX, targetY);

        let reward = 0;
        let event = '';

        // 1. Đụng tường
        if (targetCell === CELL_TYPES.WALL) {
            reward = REWARDS.WALL;
            event = `Đụng tường tại (${targetX},${targetY}) [${reward}]`;
        }
        // 2. Cổng đích A+ (E)
        else if (targetCell === CELL_TYPES.EXIT) {
            if (this.rescueManager.canUnlockAPlus(this.state)) {
                this.recordMove(targetX, targetY);
                reward = REWARDS.STEP + REWARDS.WIN;
                this.done = true;
                this.win = true;
                event = `HOÀN THÀNH NHIỆM VỤ! Cả 5 thành viên đã vào cổng A+! [+${REWARDS.WIN}]`;
            } else {
                const rescued = this.rescueManager.getRescuedCount(this.state);
                reward = REWARDS.LOCKED_EXIT;
                event = `Cổng A+ đang khóa (mới cứu ${rescued}/5 thành viên)! [${reward}]`;
            }
        }
        // 3. Di chuyển hợp lệ sang ô mới
        else {
            this.recordMove(targetX, targetY);
            reward = REWARDS.STEP;
            event = `Di chuyển tới (${targetX},${targetY})`;

            if (targetCell === CELL_TYPES.TRAP) {
                reward += REWARDS.TRAP;
                event = `Dính bẫy tại (${targetX},${targetY})! [${REWARDS.TRAP}]`;
            } else if (targetCell === CELL_TYPES.TREASURE && !this.state.hasTreasure) {
                this.state.hasTreasure = true;
                reward += REWARDS.TREASURE;
                event = `Thu thập được Kho báu! [+${REWARDS.TREASURE}]`;
            } else {
                const rescueRes = this.rescueManager.checkRescue(targetCell, this.state);
                if (rescueRes.isMember) {
                    if (rescueRes.newlyRescued) {
                        this.rescuedOrder.push(rescueRes.member.id);
                        reward += REWARDS.RESCUE;
                        const count = this.rescueManager.getRescuedCount(this.state);
                        event = `Giải cứu thành công ${rescueRes.member.name} (${count}/5)! [+${REWARDS.RESCUE}]`;
                        if (count === 5) {
                            event += ' -> CỔNG A+ ĐÃ MỞ KHÓA!';
                        }
                    } else {
                        event = `Đi ngang qua vị trí cũ của ${rescueRes.member.name}.`;
                    }
                }
            }
        }

        this.totalReward += reward;

        if (!this.done && this.steps >= this.maxSteps) {
            this.done = true;
            this.win = false;
            event += ' | Hết giới hạn bước (Timeout).';
        }

        return {
            nextState: this.getState(),
            reward,
            done: this.done,
            win: this.win,
            event
        };
    }

    recordMove(x, y) {
        this.state.x = x;
        this.state.y = y;
        this.visitedCells.add(`${x},${y}`);
        this.pathHistory.push({ x, y });
        if (this.pathHistory.length > 20) {
            this.pathHistory.shift();
        }
    }

    /**
     * Lấy tọa độ hiện tại của thành viên đã được cứu để vẽ nối đuôi sau Agent
     */
    getFollowerPosition(memberId) {
        const idx = this.rescuedOrder.indexOf(memberId);
        if (idx === -1) return null;

        // Người thứ 0 đi sau Agent 1 bước, người thứ 1 đi sau 2 bước...
        const histIdx = Math.max(0, this.pathHistory.length - 2 - idx);
        return this.pathHistory[histIdx];
    }
}