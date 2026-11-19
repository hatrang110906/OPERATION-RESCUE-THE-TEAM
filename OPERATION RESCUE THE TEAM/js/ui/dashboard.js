// js/ui/dashboard.js

import { ACTION_NAMES } from '../game/environment.js';
import { StateManager } from '../ai/state.js';
import { StatisticsManager } from './statistics.js';

export class DashboardUI {
    constructor() {
        this.statsManager = new StatisticsManager('learningChart');
    }

    updateAll({ episode, epsilon, lastReward, history, env, stateCount }, lastDecision = null) {
        // 1. Training Statistics
        this.setText('stat-episode', episode);
        this.setText('stat-epsilon', epsilon.toFixed(4));
        this.setText('stat-last-reward', lastReward > 0 ? `+${lastReward}` : lastReward);
        this.setText('stat-steps', `${env.steps} / ${env.maxSteps}`);
        this.setText('stat-states', stateCount);

        const metrics = this.statsManager.computeMetrics(history);
        this.setText('stat-avg-reward', metrics.avgReward);
        this.setText('stat-success-rate', metrics.successRate);

        // 2. Team Rescue Status (5 thành viên)
        const statusList = env.rescueManager.getStatusList(env.state);
        const rescuedCount = env.rescueManager.getRescuedCount(env.state);
        this.setText('rescue-progress-text', `${rescuedCount}/5`);

        const progressBar = document.getElementById('rescue-progress-fill');
        if (progressBar) {
            progressBar.style.width = `${(rescuedCount / 5) * 100}%`;
        }

        statusList.forEach(member => {
            const badge = document.getElementById(`status-${member.id}`);
            if (badge) {
                badge.textContent = member.rescued ? 'Rescued ✓' : 'Waiting...';
                badge.className = `member-badge ${member.rescued ? 'rescued' : 'waiting'}`;
            }
        });

        // Trạng thái Chìa khóa & Cổng A+
        const keyBadge = document.getElementById('item-key-status');
        if (keyBadge) {
            keyBadge.textContent = env.state.hasKey ? 'haved 🔑' : 'Not have';
            keyBadge.className = `item-pill ${env.state.hasKey ? 'active' : ''}`;
        }

        const gateBadge = document.getElementById('gate-aplus-status');
        const unlocked = env.rescueManager.canUnlockAPlus(env.state);
        if (gateBadge) {
            gateBadge.textContent = unlocked ? 'A+ UNLOCKED 🔓' : 'A+ LOCKED 🔒';
            gateBadge.className = `item-pill ${unlocked ? 'unlocked' : 'locked'}`;
        }

        // 3. AI Brain (Q-Values & Current State)
        this.setText('brain-current-state', StateManager.formatDisplay(env.state));

        if (lastDecision && lastDecision.qValues) {
            const q = lastDecision.qValues;
            this.setText('q-val-up', q[0].toFixed(3));
            this.setText('q-val-down', q[1].toFixed(3));
            this.setText('q-val-left', q[2].toFixed(3));
            this.setText('q-val-right', q[3].toFixed(3));
            this.setText('brain-selected-action', `${ACTION_NAMES[lastDecision.action]} (${lastDecision.isExploration ? 'Explore' : 'Exploit'})`);
            this.setText('brain-max-q', lastDecision.maxQ.toFixed(3));

            // Tô sáng dòng hành động được chọn
            ['up', 'down', 'left', 'right'].forEach((dir, idx) => {
                const row = document.getElementById(`q-row-${dir}`);
                if (row) {
                    row.classList.toggle('selected-q', idx === lastDecision.action);
                }
            });
        } else {
            ['up', 'down', 'left', 'right'].forEach(dir => {
                this.setText(`q-val-${dir}`, '0.000');
                const row = document.getElementById(`q-row-${dir}`);
                if (row) row.classList.remove('selected-q');
            });
            this.setText('brain-selected-action', '—');
            this.setText('brain-max-q', '0.000');
        }

        // 4. Vẽ lại biểu đồ Learning Progress
        this.statsManager.renderChart(history);
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}