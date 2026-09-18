// Living Canvas Particle Field - Interactive Constellation & Shooting Star Nebula
export class ParticleField {
    constructor(containerId) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(this.canvas);
        }
        this.particles = [];
        this.blobs = [];
        this.shootingStars = [];
        this.mouse = { x: null, y: null, radius: 180 };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Track interactive mouse position
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    init() {
        this.particles = [];
        this.blobs = [];
        this.shootingStars = [];

        // Fetch brand theme colors dynamically
        const styles = getComputedStyle(document.body);
        const pink = styles.getPropertyValue('--accent-pink').trim() || '#FF2A6D';
        const cyan = styles.getPropertyValue('--accent-cyan').trim() || '#05D9E8';
        const purple = styles.getPropertyValue('--accent-purple').trim() || '#A300FF';
        const amber = styles.getPropertyValue('--accent-amber').trim() || '#FFBE0B';

        const isLight = document.body.getAttribute('data-theme') === 'light';
        const blobOpacity = isLight ? 0.04 : 0.06;
        const particleCount = 180;
        const brandColors = [pink, cyan, purple, amber];

        // Initialize starry constellation particles with varied colors
        for (let i = 0; i < particleCount; i++) {
            const assignedColor = brandColors[Math.floor(Math.random() * brandColors.length)];
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                size: Math.random() * 2.5 + 0.5,
                color: assignedColor,
                alpha: Math.random() * 0.6 + 0.2,
                fadeDir: Math.random() > 0.5 ? 0.008 : -0.008,
                baseVx: (Math.random() - 0.5) * 0.35,
                baseVy: (Math.random() - 0.5) * 0.35
            });
        }

        // Initialize 4 giant colorful drifting glowing blobs (Prevention pink, Cyber cyan, Amethyst purple, Solar amber)
        brandColors.forEach((color) => {
            const baseSize = 260 + Math.random() * 160;
            this.blobs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.12,
                size: baseSize,
                color: color,
                opacity: blobOpacity,
                pulseSpeed: 0.001 + Math.random() * 0.0015,
                pulsePhase: Math.random() * Math.PI * 2,
                baseSize: baseSize
            });
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const isLight = document.body.getAttribute('data-theme') === 'light';

        // 1. Draw and update Giant Glowing Nebula Blobs
        this.blobs.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            // Bounce off boundaries with a large buffer
            if (b.x < -b.size || b.x > this.canvas.width + b.size) b.vx *= -1;
            if (b.y < -b.size || b.y > this.canvas.height + b.size) b.vy *= -1;

            // Pulse blob size slowly
            b.pulsePhase += b.pulseSpeed;
            const currentSize = b.baseSize + Math.sin(b.pulsePhase) * 45;

            const rgbaColor = this.hexToRgba(b.color, b.opacity);
            const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, currentSize);
            grad.addColorStop(0, rgbaColor);
            grad.addColorStop(1, 'rgba(7, 6, 20, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, currentSize, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 2. Spawn and update Shooting Stars
        if (Math.random() < 0.004 && this.shootingStars.length < 3) {
            const isHorizontal = Math.random() > 0.5;
            this.shootingStars.push({
                x: isHorizontal ? -100 : Math.random() * this.canvas.width,
                y: isHorizontal ? Math.random() * this.canvas.height : -100,
                vx: Math.random() * 5 + 4,
                vy: Math.random() * 3 + 2,
                color: Math.random() > 0.5 ? '#05D9E8' : '#FF2A6D',
                alpha: 0.95
            });
        }

        this.shootingStars.forEach((s, idx) => {
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.018; // Fade out slowly

            if (s.alpha <= 0 || s.x > this.canvas.width + 200 || s.y > this.canvas.height + 200) {
                this.shootingStars.splice(idx, 1);
                return;
            }

            // Draw glowing tail gradient
            const grad = this.ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
            grad.addColorStop(0, this.hexToRgba(s.color, s.alpha));
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(s.x, s.y);
            this.ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
            this.ctx.stroke();
        });

        // 3. Draw starry constellation lines
        const maxDist = 95;
        const baseLineColor = isLight ? 'rgba(0, 172, 193,' : 'rgba(5, 217, 232,';

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const lineAlpha = (1 - dist / maxDist) * 0.07 * Math.min(p1.alpha, p2.alpha);
                    this.ctx.strokeStyle = `${baseLineColor} ${lineAlpha})`;
                    this.ctx.lineWidth = 0.55;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        // 4. Draw and update individual particles (with dynamic interactive mouse gravity)
        this.particles.forEach(p => {
            // Apply mouse interactivity (attraction & connecting lines)
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.mouse.radius) {
                    // Soft gravity pull
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.vx -= (dx / dist) * force * 0.14;
                    p.vy -= (dy / dist) * force * 0.14;

                    // Draw connecting line to mouse pointer
                    const mouseLineAlpha = (1 - dist / this.mouse.radius) * 0.08;
                    const lineCol = isLight ? 'rgba(0, 172, 193,' : 'rgba(255, 42, 109,';
                    this.ctx.strokeStyle = `${lineCol} ${mouseLineAlpha})`;
                    this.ctx.lineWidth = 0.75;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            }

            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Apply friction & slow return to base speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = 1.5;
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }
            p.vx = p.vx * 0.96 + p.baseVx * 0.04;
            p.vy = p.vy * 0.96 + p.baseVy * 0.04;

            // Twinkle particle alpha
            p.alpha += p.fadeDir;
            if (p.alpha <= 0.15 || p.alpha >= 0.8) {
                p.fadeDir *= -1;
            }

            // Wrap around edges gracefully
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Draw multi-colored sparkling stars
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(p.color, p.alpha);
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}
