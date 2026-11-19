// js/ui/decision-log.js

export class DecisionLogUI {
    constructor(containerId, maxEntries = 60) {
        this.container = document.getElementById(containerId);
        this.maxEntries = maxEntries;
    }

    addEntry(message) {
        if (!this.container) return;

        // Xóa thông báo rỗng ban đầu nếu có
        const placeholder = this.container.querySelector('.log-empty');
        if (placeholder) placeholder.remove();

        const item = document.createElement('div');
        item.className = 'log-item';

        if (message.includes('WIN') || message.includes('FINISH') || message.includes('Successfully rescued')) {
            item.classList.add('log-success');
        } else if (message.includes('TRAP') || message.includes('HIT WALL') || message.includes('STUCK')) {
            item.classList.add('log-warn');
        }

        const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        item.textContent = `[${time}] ${message}`;

        this.container.appendChild(item);

        // Giới hạn số bản ghi hiển thị gần nhất để tránh lag DOM
        while (this.container.children.length > this.maxEntries) {
            this.container.removeChild(this.container.firstChild);
        }

        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        if (!this.container) return;
        this.container.innerHTML = '<div class="log-empty">No actions recorded yet.</div>';
    }
}