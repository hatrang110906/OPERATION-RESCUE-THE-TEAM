// js/storage/storage.js

const STORAGE_KEY = 'operation_rescue_team_qmodel_v2';
const EXPECTED_MAZE_VERSION = 'maze-10x10-v1';

export class StorageManager {
    static saveModel(agent, trainingManager, stats) {
        try {
            const payload = {
                modelName: 'Operation Rescue Team',
                algorithm: 'Q-Learning',
                version: '1.0',
                mazeVersion: EXPECTED_MAZE_VERSION,
                savedAt: new Date().toISOString(),
                alpha: agent.brain.alpha,
                gamma: agent.brain.gamma,
                epsilon: agent.brain.epsilon,
                episode: trainingManager.episode,
                history: trainingManager.history.slice(-500),
                qTable: agent.brain.qTable
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            return { ok: true, message: `Model saved (Episode ${payload.episode}, ${Object.keys(payload.qTable).length} states).` };
        } catch (err) {
            return { ok: false, message: `Error saving to LocalStorage: ${err.message}` };
        }
    }

    static loadModel() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return { ok: false, message: 'No saved model found in LocalStorage.' };
            }

            const data = JSON.parse(raw);
            if (!data || typeof data.qTable !== 'object' || data.mazeVersion !== EXPECTED_MAZE_VERSION) {
                return { ok: false, message: 'Invalid model data or outdated map version.' };
            }

            return { ok: true, data, message: `Loaded model (Episode ${data.episode || 0}).` };
        } catch (err) {
            return { ok: false, message: `Error reading JSON data: ${err.message}` };
        }
    }

    static hasSavedModel() {
        return Boolean(localStorage.getItem(STORAGE_KEY));
    }

    static clearModel() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return { ok: true };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}