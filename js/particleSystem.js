export class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    addExplosion(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.push({
                x: x * 20 + 10,
                y: y * 20 + 10,
                vx: vx,
                vy: vy,
                life: 20,
                color: color,
                size: Math.random() * 2 + 1
            });
        }
    }

    addTeleportParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x * 20 + 10,
                y: y * 20 + 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 15,
                color: "#8a2be2",
                size: Math.random() * 2 + 1
            });
        }
    }

    addTurboParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                x: x * 20 + 10,
                y: y * 20 + 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 10,
                color: "#ba68c8",
                size: Math.random() * 2 + 1
            });
        }
    }

    addShieldParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.particles.push({
                x: x * 20 + 10,
                y: y * 20 + 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20,
                color: "#1e88e5",
                size: Math.random() * 2 + 1
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
    }
}