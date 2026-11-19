// js/ui/renderer.js

import { CELL_TYPES, TEAM_MEMBERS } from '../game/maze.js';

const CHARACTER_STYLES = {
    H1: { hair: '#4a044e', outfit: '#ec4899', isGirl: true,  label: 'Trang' },
    H2: { hair: '#581c87', outfit: '#a855f7', isGirl: true,  label: 'U.Nhi' },
    H3: { hair: '#831843', outfit: '#f43f5e', isGirl: true,  label: 'Q.Anh' },
    H4: { hair: '#701a75', outfit: '#fb7185', isGirl: true,  label: 'H.Anh' },
    H5: { hair: '#0f172a', outfit: '#38bdf8', isGirl: false, label: 'Quân' }
};

export class MazeRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.prevRescued = {};
        this.rescueEffects = [];
        this.lastEnv = null;

        // Tạo sẵn 80 ngôi sao lấp lánh cố định tọa độ để hiệu ứng nhấp nháy tự nhiên
        this.bgStars = Array.from({ length: 80 }, (_, i) => ({
            rx: ((i * 73 + 19) % 100) / 100,
            ry: ((i * 41 + 37) % 100) / 100,
            size: (i % 3 === 0) ? 2.2 : 1.3,
            speed: 0.002 + (i % 5) * 0.0008,
            phase: i * 1.3,
            isPink: i % 4 === 0,
            isCross: i % 9 === 0
        }));
    }

    render(env) {
        if (!this.ctx || !this.canvas) return;
        this.lastEnv = env;

        const ctx = this.ctx;
        const rows = env.maze.rows;
        const cols = env.maze.cols;
        const cellSize = this.canvas.width / cols;

        // 1. Nền đen vũ trụ sâu thẳm
        ctx.fillStyle = '#09060e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Vẽ các ánh sao lấp lánh trên nền đen
        this.drawTwinklingStars(ctx, this.canvas.width, this.canvas.height);

        const canUnlockAPlus = env.rescueManager.canUnlockAPlus(env.state);

        // Kiểm tra sự kiện vừa giải cứu để kích hoạt hiệu ứng bung lồng
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = env.maze.getCell(x, y);
                const member = TEAM_MEMBERS.find(m => m.id === cell);
                if (member) {
                    const isNowRescued = Boolean(env.state[member.key]);
                    if (isNowRescued && !this.prevRescued[member.id]) {
                        this.rescueEffects.push({
                            x: x * cellSize + cellSize / 2,
                            y: y * cellSize + cellSize / 2,
                            startTime: performance.now()
                        });
                    }
                    this.prevRescued[member.id] = isNowRescued;
                }
            }
        }

        // Lớp 1: Tường hồng Neon & chấm vàng lối đi
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = env.maze.getCell(x, y);
                const px = x * cellSize;
                const py = y * cellSize;

                if (cell === CELL_TYPES.WALL) {
                    this.drawNeonPinkWall(ctx, env.maze, x, y, px, py, cellSize);
                } else if (cell === CELL_TYPES.EMPTY) {
                    if (!env.visitedCells.has(`${x},${y}`)) {
                        ctx.fillStyle = '#facc15';
                        ctx.beginPath();
                        ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
                        ctx.beginPath();
                        ctx.arc(px + cellSize / 2, py + cellSize / 2, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // Viền ngoài mê cung hồng Neon
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, this.canvas.width - 3, this.canvas.height - 3);
        ctx.restore();

        // Lớp 2: Vật phẩm, cổng A+ và những thành viên CHƯA được cứu (đang ở trong lồng)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = env.maze.getCell(x, y);
                if (cell !== CELL_TYPES.WALL && cell !== CELL_TYPES.EMPTY) {
                    this.drawCellObject(ctx, cell, x * cellSize, y * cellSize, cellSize, env, canUnlockAPlus);
                }
            }
        }

        // Lớp 3: Thành viên ĐÃ được cứu nối đuôi đi theo sau Agent
        if (env.rescuedOrder && env.rescuedOrder.length > 0) {
            for (let i = env.rescuedOrder.length - 1; i >= 0; i--) {
                const memberId = env.rescuedOrder[i];
                const pos = env.getFollowerPosition(memberId);
                if (pos) {
                    const style = CHARACTER_STYLES[memberId];
                    const cx = pos.x * cellSize + cellSize / 2;
                    const cy = pos.y * cellSize + cellSize / 2;
                    this.drawHumanCharacter(ctx, cx, cy, cellSize, style, true);
                }
            }
        }

        // Lớp 4: Nhân vật AI Agent dẫn đầu đoàn
        this.drawAgentCharacter(ctx, env.state.x, env.state.y, cellSize);

        // Lớp 5: Hiệu ứng bung lồng
        this.renderRescueEffects(ctx, cellSize);
    }

    /**
     * Vẽ bầu trời sao trắng & hồng lấp lánh trên nền đen
     */
    drawTwinklingStars(ctx, width, height) {
        const now = performance.now();
        ctx.save();

        for (const s of this.bgStars) {
            const x = s.rx * width;
            const y = s.ry * height;
            const alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));

            ctx.fillStyle = s.isPink
                ? `rgba(249, 168, 212, ${alpha})`
                : `rgba(255, 255, 255, ${alpha})`;

            if (s.isCross) {
                // Ngôi sao 4 tia lấp lánh nhỏ
                ctx.fillRect(x - 3, y - 0.6, 6, 1.2);
                ctx.fillRect(x - 0.6, y - 3, 1.2, 6);
            } else {
                ctx.beginPath();
                ctx.arc(x, y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawNeonPinkWall(ctx, maze, x, y, px, py, size) {
        const top = maze.isWall(x, y - 1);
        const bottom = maze.isWall(x, y + 1);
        const left = maze.isWall(x - 1, y);
        const right = maze.isWall(x + 1, y);

        const inset = 5;
        const x1 = left ? px : px + inset;
        const y1 = top ? py : py + inset;
        const x2 = right ? px + size : px + size - inset;
        const y2 = bottom ? py + size : py + size - inset;

        // Nền lõi tường bán trong suốt để vẫn thấy ánh sao lấp lánh mờ ảo bên dưới
        ctx.fillStyle = 'rgba(31, 11, 25, 0.86)';
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        if (!top)    this.drawLine(ctx, x1, y1, x2, y1);
        if (!bottom) this.drawLine(ctx, x1, y2, x2, y2);
        if (!left)   this.drawLine(ctx, x1, y1, x1, y2);
        if (!right)  this.drawLine(ctx, x2, y1, x2, y2);

        const inner = 3.5;
        ctx.strokeStyle = '#fbcfe8';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        if (!top)    this.drawLine(ctx, x1 + (left ? 0 : inner), y1 + inner, x2 - (right ? 0 : inner), y1 + inner);
        if (!bottom) this.drawLine(ctx, x1 + (left ? 0 : inner), y2 - inner, x2 - (right ? 0 : inner), y2 - inner);
        if (!left)   this.drawLine(ctx, x1 + inner, y1 + (top ? 0 : inner), x1 + inner, y2 - (bottom ? 0 : inner));
        if (!right)  this.drawLine(ctx, x2 - inner, y1 + (top ? 0 : inner), x2 - inner, y2 - (bottom ? 0 : inner));

        ctx.restore();
    }

    drawLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.closePath();
    }

    drawHumanCharacter(ctx, cx, cy, size, style, isRescued) {
        ctx.save();

        ctx.fillStyle = isRescued ? 'rgba(244, 114, 182, 0.28)' : 'rgba(244, 114, 182, 0.14)';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (style.isGirl) {
            ctx.fillStyle = style.hair;
            ctx.beginPath();
            ctx.arc(cx, cy - size * 0.11, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(cx - size * 0.19, cy - size * 0.11, size * 0.38, size * 0.19);
        }

        ctx.fillStyle = style.outfit;
        this.drawRoundRect(ctx, cx - size * 0.16, cy + size * 0.02, size * 0.32, size * 0.2, 5);
        ctx.fill();

        ctx.fillStyle = '#fde6d8';
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.11, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = style.hair;
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.14, size * 0.155, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx - size * 0.05, cy - size * 0.1, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.05, cy - size * 0.1, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#9f1239';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isRescued) {
            ctx.arc(cx, cy - size * 0.07, 3.5, 0.1 * Math.PI, 0.9 * Math.PI);
        } else {
            ctx.arc(cx, cy - size * 0.03, 3, 1.1 * Math.PI, 1.9 * Math.PI);
        }
        ctx.stroke();

        // Lồng giam song sắt (biến mất khi cứu)
        if (!isRescued) {
            const cageW = size * 0.72;
            const cageH = size * 0.68;
            const cageX = cx - cageW / 2;
            const cageY = cy - cageH / 2 - 2;

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            const bars = 5;
            for (let i = 1; i < bars; i++) {
                const bx = cageX + (cageW / bars) * i;
                this.drawLine(ctx, bx, cageY, bx, cageY + cageH);
            }

            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2.5;
            this.drawRoundRect(ctx, cageX, cageY, cageW, cageH, 6);
            ctx.stroke();

            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 5, cageY + cageH - 7, 10, 8);
        }

        ctx.fillStyle = isRescued ? '#fbcfe8' : '#f9a8d4';
        ctx.font = 'bold 10px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isRescued ? `${style.label} ♥` : style.label, cx, cy + size * 0.43);

        ctx.restore();
    }

    renderRescueEffects(ctx, size) {
        const now = performance.now();
        const duration = 750;

        this.rescueEffects = this.rescueEffects.filter(eff => now - eff.startTime < duration);

        for (const eff of this.rescueEffects) {
            const progress = (now - eff.startTime) / duration;
            const alpha = 1 - progress;
            const radius = size * (0.3 + progress * 0.75);

            ctx.save();
            ctx.strokeStyle = `rgba(244, 114, 182, ${alpha})`;
            ctx.lineWidth = 3.5 * (1 - progress);
            ctx.beginPath();
            ctx.arc(eff.x, eff.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + progress * 0.8;
                const sx = eff.x + Math.cos(angle) * radius * 1.1;
                const sy = eff.y + Math.sin(angle) * radius * 1.1;
                ctx.fillStyle = i % 2 === 0 ? `rgba(250, 204, 21, ${alpha})` : `rgba(251, 207, 232, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 3.5 * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = `rgba(251, 207, 232, ${alpha})`;
            ctx.font = 'bold 12px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('RESCUED! +30', eff.x, eff.y - size * 0.35 - progress * 16);
            ctx.restore();
        }

        if (this.rescueEffects.length > 0 && this.lastEnv) {
            requestAnimationFrame(() => this.render(this.lastEnv));
        }
    }

    drawAgentCharacter(ctx, x, y, size) {
        const cx = x * size + size / 2;
        const cy = y * size + size / 2;

        ctx.save();
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;

        ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f9a8d4';
        ctx.lineWidth = 2;
        this.drawLine(ctx, cx, cy - size * 0.25, cx, cy - size * 0.37);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.39, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ec4899';
        this.drawRoundRect(ctx, cx - size * 0.18, cy + size * 0.02, size * 0.36, size * 0.22, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(cx, cy + size * 0.13, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffe4d6';
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.12, size * 0.165, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#db2777';
        this.drawRoundRect(ctx, cx - size * 0.2, cy - size * 0.18, size * 0.055, size * 0.13, 3);
        ctx.fill();
        this.drawRoundRect(ctx, cx + size * 0.145, cy - size * 0.18, size * 0.055, size * 0.13, 3);
        ctx.fill();

        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.15, size * 0.17, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx - size * 0.055, cy - size * 0.11, 2, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.055, cy - size * 0.11, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.08, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    drawCellObject(ctx, cell, px, py, size, env, canUnlockAPlus) {
        const cx = px + size / 2;
        const cy = py + size / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (cell) {
            case CELL_TYPES.START:
                ctx.fillStyle = 'rgba(236, 72, 153, 0.22)';
                this.drawRoundRect(ctx, px + 6, py + 6, size - 12, size - 12, 8);
                ctx.fill();
                ctx.strokeStyle = '#f472b6';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = '#fbcfe8';
                ctx.font = 'bold 10px Orbitron, sans-serif';
                ctx.fillText('START', cx, cy);
                break;

            case CELL_TYPES.EXIT:
                ctx.fillStyle = canUnlockAPlus ? 'rgba(236, 72, 153, 0.35)' : 'rgba(244, 63, 94, 0.2)';
                this.drawRoundRect(ctx, px + 5, py + 5, size - 10, size - 10, 8);
                ctx.fill();
                ctx.strokeStyle = canUnlockAPlus ? '#f472b6' : '#fb7185';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = canUnlockAPlus ? '#ffffff' : '#fda4af';
                ctx.font = 'bold 11.5px Orbitron, sans-serif';
                ctx.fillText(canUnlockAPlus ? 'A+ 🔓' : 'A+ 🔒', cx, cy);
                break;

            case CELL_TYPES.TRAP:
                ctx.save();
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#f87171';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 11);
                ctx.lineTo(cx + 4, cy - 4);
                ctx.lineTo(cx + 11, cy);
                ctx.lineTo(cx + 4, cy + 4);
                ctx.lineTo(cx, cy + 11);
                ctx.lineTo(cx - 4, cy + 4);
                ctx.lineTo(cx - 11, cy);
                ctx.lineTo(cx - 4, cy - 4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;

            case CELL_TYPES.TREASURE:
                if (!env.state.hasTreasure) {
                    ctx.save();
                    ctx.fillStyle = '#f9a8d4';
                    ctx.shadowColor = '#f472b6';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - 9);
                    ctx.lineTo(cx + 3, cy - 3);
                    ctx.lineTo(cx + 9, cy);
                    ctx.lineTo(cx + 3, cy + 3);
                    ctx.lineTo(cx, cy + 9);
                    ctx.lineTo(cx - 3, cy + 3);
                    ctx.lineTo(cx - 9, cy);
                    ctx.lineTo(cx - 3, cy - 3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                break;

            default: {
                const member = TEAM_MEMBERS.find(m => m.id === cell);
                if (member) {
                    const isRescued = env.state[member.key];
                    if (!isRescued) {
                        const style = CHARACTER_STYLES[member.id];
                        this.drawHumanCharacter(ctx, cx, cy, size, style, false);
                    }
                }
                break;
            }
        }
    }
}