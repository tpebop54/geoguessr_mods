function weightedRandomChoice(grid) {
    const flat = grid.flat();
    const sum = flat.reduce((a, b) => a + b, 0);
    const weights = flat.map(x => x / sum);
    let r = Math.random();
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r < acc) {
            const rows = grid.length;
            const cols = grid[0].length;
            return { row: Math.floor(i / cols), col: i % cols };
        }
    }
    // fallback
    const rows = grid.length;
    const cols = grid[0].length;
    return { row: Math.floor((weights.length-1) / cols), col: (weights.length-1) % cols };
}
