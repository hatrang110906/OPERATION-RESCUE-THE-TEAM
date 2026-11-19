// js/ui/statistics.js

export class StatisticsManager {
    constructor(chartCanvasId) {
        this.canvas = document.getElementById(chartCanvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    computeMetrics(history) {
        if (!history || history.length === 0) {
            return {
                avgReward: '—',
                successRate: 'N/A',
                avgSteps: '—'
            };
        }

        // Tính trên cửa sổ 100 Episode gần nhất để phản ánh sát tiến độ hiện tại
        const recent = history.slice(-100);
        const totalReward = recent.reduce((sum, item) => sum + item.totalReward, 0);
        const wins = recent.reduce((sum, item) => sum + (item.win ? 1 : 0), 0);
        const totalSteps = recent.reduce((sum, item) => sum + item.steps, 0);

        return {
            avgReward: (totalReward / recent.length).toFixed(1),
            successRate: `${((wins / recent.length) * 100).toFixed(1)}%`,
            avgSteps: Math.round(totalSteps / recent.length)
        };
    }

    renderChart(history) {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Nền biểu đồ
        ctx.fillStyle = '#fff5f8'
        ctx.fillRect(0, 0, w, h);

        // Đường lưới ngang
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        if (!history || history.length < 2) {
            ctx.fillStyle = '#fff5f8';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Insufficient training data to generate a chart...', w / 2, h / 2);
            return;
        }

        // Lấy tối đa 150 điểm gần nhất để biểu đồ mượt
        const points = history.slice(-150);
        const rewards = points.map(p => p.totalReward);
        const minR = Math.min(...rewards, -250);
        const maxR = Math.max(...rewards, 350);
        const range = maxR - minR || 1;

        const padX = 12;
        const padY = 16;
        const plotW = w - padX * 2;
        const plotH = h - padY * 2;

        // Vẽ đường 0 điểm
        const zeroY = padY + plotH - ((0 - minR) / range) * plotH;
        ctx.strokeStyle = '#f9a8d4';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padX, zeroY);
        ctx.lineTo(w - padX, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vẽ đường Reward
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();

        points.forEach((p, idx) => {
            const x = padX + (idx / (points.length - 1)) * plotW;
            const y = padY + plotH - ((p.totalReward - minR) / range) * plotH;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Đánh dấu các điểm thắng A+ bằng chấm xanh lá
        points.forEach((p, idx) => {
            if (p.win) {
                const x = padX + (idx / (points.length - 1)) * plotW;
                const y = padY + plotH - ((p.totalReward - minR) / range) * plotH;
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}