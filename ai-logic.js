// ai-logic.js

export function makeAIMove(snake, gift, food, tileCount, obstacles, ghostTrails, currentModeIdx) {
    const head = snake[0];
    const queue = [ [head.x, head.y, []] ];
    const visited = Array.from({ length: tileCount }, () => Array(tileCount).fill(false));
    visited[head.x][head.y] = true;

    for (let i = 0; i < snake.length - 1; i++) visited[snake[i].x][snake[i].y] = true;
    obstacles.forEach(o => visited[o.x][o.y] = true);
    ghostTrails.forEach(g => visited[g.x][g.y] = true);

    const directions = [
        { x: 0, y: -1, name: "UP" },
        { x: 0, y: 1, name: "DOWN" },
        { x: -1, y: 0, name: "LEFT" },
        { x: 1, y: 0, name: "RIGHT" }
    ];

    let pathToTarget = null;
    let targetX = gift ? gift.x : food.x;
    let targetY = gift ? gift.y : food.y;
    const bordersAreDeadly = (currentModeIdx === 1);

    while (queue.length > 0) {
        const [cx, cy, path] = queue.shift();
        if (cx === targetX && cy === targetY) { pathToTarget = path; break; }

        for (const d of directions) {
            let nx = cx + d.x;
            let ny = cy + d.y;
            
            if (!bordersAreDeadly) {
                if (nx < 0) nx = tileCount - 1; if (nx >= tileCount) nx = 0;
                if (ny < 0) ny = tileCount - 1; if (ny >= tileCount) ny = 0;
            } else {
                if (nx < 0 || nx >= tileCount || ny < 0 || ny >= tileCount) continue;
            }
            if (!visited[nx][ny]) {
                visited[nx][ny] = true;
                queue.push([nx, ny, [...path, d.name]]);
            }
        }
    }

    if (pathToTarget && pathToTarget.length > 0) {
        return pathToTarget[0]; // Возвращаем направление
    }
    return null;
}
