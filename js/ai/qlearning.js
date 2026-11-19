// js/ai/qlearning.js

export class QLearning {
    constructor({
        alpha = 0.1,
        gamma = 0.95,
        epsilon = 1.0,
        epsilonDecay = 0.996,
        minEpsilon = 0.05,
        numActions = 4
    } = {}) {
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.initialEpsilon = epsilon;
        this.epsilonDecay = epsilonDecay;
        this.minEpsilon = minEpsilon;
        this.numActions = numActions;
        this.qTable = {};
    }

    getQValues(stateKey) {
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = new Array(this.numActions).fill(0);
        }
        return this.qTable[stateKey];
    }

    /**
     * Công thức cập nhật Q-Learning:
     * Q(s,a) <- Q(s,a) + alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]
     */
    update(stateKey, action, reward, nextStateKey, done) {
        const currentQs = this.getQValues(stateKey);
        const oldQ = currentQs[action];

        let maxNextQ = 0;
        if (!done) {
            const nextQs = this.getQValues(nextStateKey);
            maxNextQ = Math.max(...nextQs);
        }

        const target = reward + this.gamma * maxNextQ;
        const newQ = oldQ + this.alpha * (target - oldQ);
        currentQs[action] = Number(newQ.toFixed(4));

        return currentQs[action];
    }

    decayEpsilon() {
        this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    }

    reset() {
        this.qTable = {};
        this.epsilon = this.initialEpsilon;
    }

    getStateCount() {
        return Object.keys(this.qTable).length;
    }
}