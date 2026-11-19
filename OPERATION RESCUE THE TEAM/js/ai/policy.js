// js/ai/policy.js

export class PolicyManager {
    /**
     * Chọn ngẫu nhiên đều trong các hành động đồng hạng Q-Value cao nhất
     * để tránh thiên lệch theo chỉ số mảng (như mục 4.6 trong đặc tả)
     */
    static selectGreedyAction(qValues) {
        let maxQ = -Infinity;
        let bestActions = [];

        for (let a = 0; a < qValues.length; a++) {
            if (qValues[a] > maxQ) {
                maxQ = qValues[a];
                bestActions = [a];
            } else if (qValues[a] === maxQ) {
                bestActions.push(a);
            }
        }

        const randomIndex = Math.floor(Math.random() * bestActions.length);
        return bestActions[randomIndex];
    }

    /**
     * Chính sách Epsilon-Greedy dùng trong Training Mode
     */
    static selectEpsilonGreedyAction(qValues, epsilon) {
        if (Math.random() < epsilon) {
            return {
                action: Math.floor(Math.random() * qValues.length),
                isExploration: true
            };
        }
        return {
            action: this.selectGreedyAction(qValues),
            isExploration: false
        };
    }
}