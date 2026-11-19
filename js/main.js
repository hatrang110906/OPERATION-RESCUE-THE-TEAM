// js/main.js

import { GameController } from './game/game.js';
import { MazeRenderer } from './ui/renderer.js';
import { DashboardUI } from './ui/dashboard.js';
import { DecisionLogUI } from './ui/decision-log.js';
import { StorageManager } from './storage/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        intro: document.getElementById('screen-intro'),
        control: document.getElementById('screen-control'),
        victory: document.getElementById('screen-victory')
    };

    function showScreen(name) {
        Object.entries(screens).forEach(([key, el]) => {
            if (el) el.classList.toggle('active', key === name);
        });
    }

    const renderer = new MazeRenderer('mazeCanvas');
    const dashboard = new DashboardUI();
    const decisionLog = new DecisionLogUI('decisionLogContainer');
    const statusBanner = document.getElementById('systemStatusBanner');

    let latestDecision = null;

    const game = new GameController({
        onRender: (env, decision) => {
            latestDecision = decision;
            renderer.render(env);
        },
        onStatsUpdate: (statsPayload) => {
            dashboard.updateAll(statsPayload, latestDecision);
        },
        onLog: (msg) => {
            decisionLog.addEntry(msg);
        },
        onStatus: (msg) => {
            if (statusBanner) statusBanner.textContent = msg;
        },
        onVictory: ({ steps, totalReward, episodes }) => {
            document.getElementById('vic-steps').textContent = steps;
            document.getElementById('vic-reward').textContent = totalReward;
            document.getElementById('vic-episodes').textContent = episodes;
            setTimeout(() => showScreen('victory'), 450);
        }
    });

    // Kiểm tra xem đã có mô hình lưu trong LocalStorage chưa ngay ở Screen 1
    const introModelHint = document.getElementById('intro-model-hint');
    if (introModelHint) {
        introModelHint.textContent = StorageManager.hasSavedModel()
            ? 'Saved Q-Table model detected! You can watch the AI ​​in action now or continue training.'
            : 'No saved model found. Click "Start Mission" to begin training your AI agent!';
    }

    // Nút Screen 1 -> Screen 2
    document.getElementById('btn-start-mission')?.addEventListener('click', () => {
        showScreen('control');
        if (StorageManager.hasSavedModel()) {
            game.loadModel();
        } else {
            game.emitRender();
            game.emitStats();
        }
    });

    // Các nút điều khiển tại Rescue Control Center
    document.getElementById('btn-train')?.addEventListener('click', () => game.startTraining());
    document.getElementById('btn-pause')?.addEventListener('click', () => game.pauseTraining());
    document.getElementById('btn-resume')?.addEventListener('click', () => game.resumeTraining());
    document.getElementById('btn-watch')?.addEventListener('click', () => game.startWatchAI());
    document.getElementById('btn-manual')?.addEventListener('click', () => game.enableManualMode());
    document.getElementById('btn-save')?.addEventListener('click', () => game.saveModel());
    document.getElementById('btn-load')?.addEventListener('click', () => game.loadModel());

    document.getElementById('btn-reset')?.addEventListener('click', () => {
        const confirmed = window.confirm('Are you sure you want to reset the current progress to its initial state?');
        if (confirmed) {
            decisionLog.clear();
            game.resetAll(false);
        }
    });

    // Nút từ Screen 3 (Victory) quay lại
    document.getElementById('btn-replay-watch')?.addEventListener('click', () => {
        showScreen('control');
        game.startWatchAI();
    });

    document.getElementById('btn-back-control')?.addEventListener('click', () => {
        showScreen('control');
    });
});