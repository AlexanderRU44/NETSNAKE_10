const DIRECTIONS = [
    { x: 0, y: -1, name: "UP" },
    { x: 0, y: 1, name: "DOWN" },
    { x: -1, y: 0, name: "LEFT" },
    { x: 1, y: 0, name: "RIGHT" }
];

export function makeAIMove(snake, food, tileCount, obstacles, ghostTrails, playerSnake) {
    const head = snake[0];
    const targetX = food.x;
    const targetY = food.y;
    
    // Quick check - if food is adjacent, return direction immediately
    if (Math.abs(head.x - targetX) + Math.abs(head.y - targetY) === 1) {
        if (head.x === targetX) {
            return head.y > targetY ? "UP" : "DOWN";
        } else {
            return head.x > targetX ? "LEFT" : "RIGHT";
        }
    }
    
    // BFS with optimizations
    const queue = [[head.x, head.y]];
    const visited = new Array(tileCount);
    for (let i = 0; i < tileCount; i++) {
        visited[i] = new Uint8Array(tileCount);
    }
    const parent = new Array(tileCount);
    for (let i = 0; i < tileCount; i++) {
        parent[i] = new Array(tileCount);
    }
    
    // Проверка границ перед маркировкой
    if (head.x >= 0 && head.x < tileCount && head.y >= 0 && head.y < tileCount) {
        visited[head.x][head.y] = 1;
    }
    
    // Mark obstacles with bounds checking
    for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x >= 0 && snake[i].x < tileCount && snake[i].y >= 0 && snake[i].y < tileCount) {
            visited[snake[i].x][snake[i].y] = 1;
        }
    }
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].x >= 0 && obstacles[i].x < tileCount && obstacles[i].y >= 0 && obstacles[i].y < tileCount) {
            visited[obstacles[i].x][obstacles[i].y] = 1;
        }
    }
    for (let i = 0; i < ghostTrails.length; i++) {
        if (ghostTrails[i].x >= 0 && ghostTrails[i].x < tileCount && ghostTrails[i].y >= 0 && ghostTrails[i].y < tileCount) {
            visited[ghostTrails[i].x][ghostTrails[i].y] = 1;
        }
    }
    if (playerSnake) {
        for (let i = 0; i < playerSnake.length; i++) {
            if (playerSnake[i].x >= 0 && playerSnake[i].x < tileCount && playerSnake[i].y >= 0 && playerSnake[i].y < tileCount) {
                visited[playerSnake[i].x][playerSnake[i].y] = 1;
            }
        }
    }
    
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        
        if (cx === targetX && cy === targetY) {
            // Reconstruct path
            let px = cx, py = cy;
            while (parent[px][py] && !(px === head.x && py === head.y)) {
                const move = parent[px][py];
                px = move.px;
                py = move.py;
                if (px === head.x && py === head.y) {
                    return move.dir;
                }
            }
            break;
        }
        
        for (const d of DIRECTIONS) {
            let nx = cx + d.x;
            let ny = cy + d.y;
            
            if (nx >= 0 && nx < tileCount && ny >= 0 && ny < tileCount && !visited[nx][ny]) {
                visited[nx][ny] = 1;
                parent[nx][ny] = { px: cx, py: cy, dir: d.name };
                queue.push([nx, ny]);
            }
        }
    }
    
    // Fallback - safe direction
    for (const d of DIRECTIONS) {
        let nx = head.x + d.x;
        let ny = head.y + d.y;
        if (nx >= 0 && nx < tileCount && ny >= 0 && ny < tileCount && !visited[nx][ny]) {
            return d.name;
        }
    }
    
    return null;
}