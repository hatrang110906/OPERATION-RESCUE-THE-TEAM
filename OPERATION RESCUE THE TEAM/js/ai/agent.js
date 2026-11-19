// js/ai/agent.js

import { StateManager } from './state.js';
import { PolicyManager } from './policy.js';
import { QLearning } from './qlearning.js';

export class QLearningAgent {
    constructor(config = {}) {
        this.brain = new QLearning(config);
        this.lastDecision = null;
    }

    /**
     * Chọn hành động:
     * - isTraining = true: dùng Epsilon-Greedy
     * - isTraining = false (Watch AI): dùng Greedy Policy thuần túy
     */
    act(state, isTraining = true) {
        const stateKey = StateManager.encode(state);
        const qValues = [...this.brain.getQValues(stateKey)];

        let action;
        let isExploration = false;

        if (isTraining) {
            const choice = PolicyManager.selectEpsilonGreedyAction(qValues, this.brain.epsilon);
            action = choice.action;
            isExploration = choice.isExploration;
        } else {
            action = PolicyManager.selectGreedyAction(qValues);
        }

        this.lastDecision = {
            state,
            stateKey,
            qValues,
            action,
            maxQ: Math.max(...qValues),
            isExploration
        };

        return this.lastDecision;
    }

    learn(state, action, reward, nextState, done) {
        const stateKey = StateManager.encode(state);
        const nextStateKey = StateManager.encode(nextState);
        return this.brain.update(stateKey, action, reward, nextStateKey, done);
    }

    endEpisode() {
        this.brain.decayEpsilon();
    }

    reset() {
        this.brain.reset();
        this.lastDecision = null;
    }
}