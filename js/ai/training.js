// js/ai/training.js

export class TrainingManager {
    constructor(env, agent) {
        this.env = env;
        this.agent = agent;
        this.episode = 0;
        this.history = [];
        this.isTraining = false;
        this.isPaused = false;
    }

    /**
     * Chạy trọn vẹn 1 Episode nhanh (dùng cho Fast Training nhiều nghìn vòng)
     */
    runFastEpisode() {
        let state = this.env.reset();
        let done = false;

        while (!done) {
            const decision = this.agent.act(state, true);
            const stepResult = this.env.step(decision.action);
            this.agent.learn(state, decision.action, stepResult.reward, stepResult.nextState, stepResult.done);
            state = stepResult.nextState;
            done = stepResult.done;
        }

        this.agent.endEpisode();
        this.episode++;

        const record = {
            episode: this.episode,
            totalReward: this.env.totalReward,
            steps: this.env.steps,
            rescuedCount: this.env.rescueManager.getRescuedCount(state),
            win: this.env.win,
            epsilon: Number(this.agent.brain.epsilon.toFixed(4))
        };

        this.history.push(record);
        // Giới hạn giữ 2000 bản ghi gần nhất để nhẹ bộ nhớ trình duyệt
        if (this.history.length > 2000) {
            this.history.shift();
        }

        return record;
    }

    reset() {
        this.episode = 0;
        this.history = [];
        this.isTraining = false;
        this.isPaused = false;
        this.agent.reset();
        this.env.reset();
    }
}