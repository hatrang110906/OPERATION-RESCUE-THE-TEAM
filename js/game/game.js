// js/game/game.js

import { MazeEnvironment, ACTION_NAMES } from './environment.js';
import { PlayerController } from './player.js';
import { QLearningAgent } from '../ai/agent.js';
import { TrainingManager } from '../ai/training.js';
import { StateManager } from '../ai/state.js';
import { StorageManager } from '../storage/storage.js';

export class GameController {
    constructor(callbacks = {}) {
        this.env = new MazeEnvironment(450);
        this.agent = new QLearningAgent({
            alpha: 0.15,
            gamma: 0.95,
            epsilon: 1.0,
            epsilonDecay: 0.996,
            minEpsilon: 0.05
        });
        this.trainingManager = new TrainingManager(this.env, this.agent);

        this.callbacks = callbacks; // { onRender, onStatsUpdate, onLog, onVictory, onStatus }
        this.mode = 'IDLE';         // 'IDLE' | 'TRAINING' | 'WATCH' | 'MANUAL'
        this.loopTimer = null;
        this.episodesPerTick = 50;  // Số Episode chạy mỗi khung hình khi Fast Train
        this.watchDelayMs = 140;    // Tốc độ hoạt ảnh từng bước khi Watch AI

        this.player = new PlayerController((action) => this.handleManualStep(action));
    }

    startTraining() {
        if (this.mode === 'TRAINING' && !this.trainingManager.isPaused) return;

        this.stopLoop();
        this.player.setEnabled(false);
        this.mode = 'TRAINING';
        this.trainingManager.isTraining = true;
        this.trainingManager.isPaused = false;
        this.notifyStatus('Training Q-Learning...');

        const trainStep = () => {
            if (this.mode !== 'TRAINING' || this.trainingManager.isPaused) return;

            let lastRecord = null;
            for (let i = 0; i < this.episodesPerTick; i++) {
                lastRecord = this.trainingManager.runFastEpisode();
            }

            // Chạy 1 bước minh họa trạng thái mới nhất để vẽ lên Canvas
            this.env.reset();
            this.emitRender();
            this.emitStats();

            if (lastRecord && this.callbacks.onLog) {
                this.callbacks.onLog(
                    `[Train Ep #${lastRecord.episode}] Reward: ${lastRecord.totalReward} | Rescued: ${lastRecord.rescuedCount}/5 | ${lastRecord.win ? 'A+' : 'Chưa xong'} (ε=${lastRecord.epsilon})`
                );
            }

            this.loopTimer = requestAnimationFrame(trainStep);
        };

        this.loopTimer = requestAnimationFrame(trainStep);
    }

    pauseTraining() {
        if (this.mode !== 'TRAINING') return;
        this.trainingManager.isPaused = true;
        this.stopLoop();
        this.notifyStatus('Training paused.');
    }

    resumeTraining() {
        if (this.mode === 'TRAINING' && this.trainingManager.isPaused) {
            this.startTraining();
        }
    }

    startWatchAI() {
        if (this.agent.brain.getStateCount() === 0) {
            this.notifyStatus('Q-Table is empty! Please press Start Training or Load Model first.');
            return;
        }

        this.stopLoop();
        this.player.setEnabled(false);
        this.mode = 'WATCH';
        this.trainingManager.isTraining = false;
        this.trainingManager.isPaused = false;

        let state = this.env.reset();
        this.emitRender();
        this.emitStats();
        if (this.callbacks.onLog) {
            this.callbacks.onLog('=== WATCH AI (GREEDY POLICY) ===');
        }
        this.notifyStatus('Watch AI: Watching Agent solve the maze...');

        const watchStep = () => {
            if (this.mode !== 'WATCH') return;

            const decision = this.agent.act(state, false); // false = Greedy, không cập nhật Q-Table
            const stepResult = this.env.step(decision.action);

            if (this.callbacks.onLog) {
                this.callbacks.onLog(
                    `Bước ${this.env.steps}: ${StateManager.formatDisplay(state)} → Chọn ${ACTION_NAMES[decision.action]} (Q=${decision.maxQ.toFixed(2)}) | ${stepResult.event}`
                );
            }

            state = stepResult.nextState;
            this.emitRender(decision);
            this.emitStats(stepResult.reward);

            if (stepResult.done) {
                this.mode = 'IDLE';
                if (stepResult.win) {
                    this.notifyStatus('MISSION ACCOMPLISHED! All 5 members have reached A+!');
                    if (this.callbacks.onVictory) {
                        this.callbacks.onVictory({
                            steps: this.env.steps,
                            totalReward: this.env.totalReward,
                            episodes: this.trainingManager.episode
                        });
                    }
                } else {
                    this.notifyStatus('Watch AI ended due to exceeding step limit (Timeout). Please train more!');
                }
                return;
            }

            this.loopTimer = setTimeout(watchStep, this.watchDelayMs);
        };

        this.loopTimer = setTimeout(watchStep, this.watchDelayMs);
    }

    enableManualMode() {
        this.stopLoop();
        this.mode = 'MANUAL';
        this.env.reset();
        this.player.setEnabled(true);
        this.emitRender();
        this.emitStats();
        this.notifyStatus('Manual mode enabled: Use arrow keys or WASD to move.');
    }

    handleManualStep(action) {
        if (this.mode !== 'MANUAL' || this.env.done) return;

        const prevState = this.env.getState();
        const stepResult = this.env.step(action);

        if (this.callbacks.onLog) {
            this.callbacks.onLog(
                `[Manual] ${StateManager.formatDisplay(prevState)} → ${ACTION_NAMES[action]} | ${stepResult.event}`
            );
        }

        this.emitRender();
        this.emitStats(stepResult.reward);

        if (stepResult.done && stepResult.win && this.callbacks.onVictory) {
            this.player.setEnabled(false);
            this.callbacks.onVictory({
                steps: this.env.steps,
                totalReward: this.env.totalReward,
                episodes: this.trainingManager.episode
            });
        }
    }

    saveModel() {
        const res = StorageManager.saveModel(this.agent, this.trainingManager);
        this.notifyStatus(res.message);
        return res;
    }

    loadModel() {
        const res = StorageManager.loadModel();
        if (res.ok) {
            this.stopLoop();
            this.mode = 'IDLE';
            this.agent.brain.qTable = res.data.qTable;
            this.agent.brain.epsilon = res.data.epsilon ?? 0.05;
            this.trainingManager.episode = res.data.episode ?? 0;
            this.trainingManager.history = res.data.history ?? [];
            this.env.reset();
            this.emitRender();
            this.emitStats();
        }
        this.notifyStatus(res.message);
        return res;
    }

    resetAll(clearSaved = false) {
        this.stopLoop();
        this.player.setEnabled(false);
        this.mode = 'IDLE';
        this.trainingManager.reset();
        if (clearSaved) {
            StorageManager.clearModel();
        }
        this.emitRender();
        this.emitStats();
        this.notifyStatus('All environments and models have been reset to their initial states.');
    }

    stopLoop() {
        if (this.loopTimer) {
            cancelAnimationFrame(this.loopTimer);
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
    }

    emitRender(decision = null) {
        if (this.callbacks.onRender) {
            this.callbacks.onRender(this.env, decision || this.agent.lastDecision);
        }
    }

    emitStats(lastReward = 0) {
        if (this.callbacks.onStatsUpdate) {
            this.callbacks.onStatsUpdate({
                episode: this.trainingManager.episode,
                epsilon: this.agent.brain.epsilon,
                lastReward,
                history: this.trainingManager.history,
                env: this.env,
                stateCount: this.agent.brain.getStateCount()
            });
        }
    }

    notifyStatus(msg) {
        if (this.callbacks.onStatus) {
            this.callbacks.onStatus(msg);
        }
    }
}