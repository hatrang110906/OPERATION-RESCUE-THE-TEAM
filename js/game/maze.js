// js/game/maze.js

export const CELL_TYPES = {
    EMPTY: '.',
    WALL: '#',
    START: 'S',
    EXIT: 'E',     // Cổng A+
    TRAP: 'B',
    TREASURE: 'T',
    H1: 'H1',      // Hà Trang
    H2: 'H2',      // Uyển Nhi
    H3: 'H3',      // Quỳnh Anh
    H4: 'H4',      // Hải Anh
    H5: 'H5'       // Tô Quân
};

export const TEAM_MEMBERS = [
    { id: 'H1', key: 'rescuedHaTrang', name: 'Hà Trang' },
    { id: 'H2', key: 'rescuedUyenNhi', name: 'Uyển Nhi' },
    { id: 'H3', key: 'rescuedQuynhAnh', name: 'Quỳnh Anh' },
    { id: 'H4', key: 'rescuedHaiAnh', name: 'Hải Anh' },
    { id: 'H5', key: 'rescuedToQuan', name: 'Tô Quân' }
];

// Bản đồ 12x12 nhiều tường, đường hầm hẹp & nhiều ngã rẽ (đã kiểm tra thông đường 100%)
// Start (0,0) | Hà Trang (4,0) | Uyển Nhi (0,6) | Quỳnh Anh (6,4) | Hải Anh (2,10) | Tô Quân (11,6) | A+ (11,11)
export const FIXED_MAP_LAYOUT = [
    ['S',  '.',  '#',  '.',  'H1', '#',  '.',  '.',  '.',  '#',  '.',  '.'], // y = 0
    ['#',  '.',  '#',  '.',  '#',  '#',  '.',  '#',  '.',  '#',  '.',  '#'], // y = 1
    ['.',  '.',  '.',  '.',  '.',  '.',  '.',  '#',  '.',  '.',  '.',  '.'], // y = 2
    ['.',  '#',  '#',  '#',  '#',  '#',  '.',  '#',  '#',  '#',  '#',  '.'], // y = 3
    ['.',  '#',  'B',  '.',  '.',  '#',  'H3', '.',  'T',  '#',  '.',  '.'], // y = 4
    ['.',  '#',  '.',  '#',  '.',  '#',  '#',  '#',  '.',  '#',  '#',  '.'], // y = 5
    ['H2', '.',  '.',  '#',  '.',  '.',  '.',  '#',  '.',  '.',  '.',  'H5'],// y = 6
    ['#',  '#',  '#',  '#',  '#',  '#',  '.',  '#',  '#',  '#',  '#',  '.'], // y = 7
    ['.',  '.',  '.',  '.',  'B',  '.',  '.',  '.',  '.',  '#',  '.',  '.'], // y = 8
    ['.',  '#',  '#',  '#',  '#',  '#',  '#',  '#',  '.',  '#',  '#',  '.'], // y = 9
    ['.',  '#',  'H4', '.',  '.',  '.',  'B',  '#',  '.',  '.',  '.',  '.'], // y = 10
    ['.',  '.',  '.',  '#',  '#',  '.',  '.',  '.',  '.',  '#',  '#',  'E']  // y = 11
];

export class Maze {
    constructor() {
        this.rows = FIXED_MAP_LAYOUT.length;
        this.cols = FIXED_MAP_LAYOUT[0].length;
        this.grid = FIXED_MAP_LAYOUT.map(row => [...row]);
        this.startPos = this.findCell(CELL_TYPES.START);
        this.exitPos = this.findCell(CELL_TYPES.EXIT);
    }

    findCell(targetType) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === targetType) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    getCell(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return CELL_TYPES.WALL;
        }
        return this.grid[y][x];
    }

    isWall(x, y) {
        return this.getCell(x, y) === CELL_TYPES.WALL;
    }
}