// js/game/rescue.js

import { TEAM_MEMBERS } from './maze.js';

export class RescueManager {
    constructor() {
        this.members = TEAM_MEMBERS;
    }

    /**
     * Kiểm tra ô (x, y) có phải là thành viên cần giải cứu không.
     * Trả về thông tin giải cứu mới hoặc null.
     */
    checkRescue(cellType, state) {
        const member = this.members.find(m => m.id === cellType);
        if (!member) {
            return { isMember: false, newlyRescued: false, member: null };
        }

        // Mỗi thành viên chỉ được giải cứu 1 lần
        if (!state[member.key]) {
            state[member.key] = true;
            return { isMember: true, newlyRescued: true, member };
        }

        return { isMember: true, newlyRescued: false, member };
    }

    /**
     * Đếm số thành viên đã được giải cứu
     */
    getRescuedCount(state) {
        return this.members.reduce((count, m) => count + (state[m.key] ? 1 : 0), 0);
    }

    /**
     * Điều kiện bắt buộc mở khóa cổng A+ (Phần 3.4 trong đặc tả)
     */
    canUnlockAPlus(state) {
        return (
            state.rescuedHaTrang &&
            state.rescuedUyenNhi &&
            state.rescuedQuynhAnh &&
            state.rescuedHaiAnh &&
            state.rescuedToQuan
        );
    }

    /**
     * Lấy danh sách trạng thái hiển thị cho UI Team Rescue Status
     */
    getStatusList(state) {
        return this.members.map(m => ({
            id: m.id,
            name: m.name,
            rescued: Boolean(state[m.key])
        }));
    }
}