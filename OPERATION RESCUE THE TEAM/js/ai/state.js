// js/ai/state.js

export class StateManager {
    static encode(state) {
        return [
            state.x,
            state.y,
            state.rescuedHaTrang ? 1 : 0,
            state.rescuedUyenNhi ? 1 : 0,
            state.rescuedQuynhAnh ? 1 : 0,
            state.rescuedHaiAnh ? 1 : 0,
            state.rescuedToQuan ? 1 : 0,
            state.hasTreasure ? 1 : 0
        ].join(',');
    }

    static formatDisplay(state) {
        const rescued = [
            state.rescuedHaTrang ? 1 : 0,
            state.rescuedUyenNhi ? 1 : 0,
            state.rescuedQuynhAnh ? 1 : 0,
            state.rescuedHaiAnh ? 1 : 0,
            state.rescuedToQuan ? 1 : 0
        ].join('');
        return `(${state.x},${state.y}) | Team:[${rescued}] | Tr:${state.hasTreasure ? 1 : 0}`;
    }
}