(function () {
    'use strict';

    const PALETTE = ['#ffd98e', '#f5c372', '#f4a261', '#fff3d6', '#f2b591', '#9ec5ff'];

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function pickColor() {
        return PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    // 1. Mesin Kanvas Perayaan: Lentera Terbang, Kembang Api Emas, Konfeti & Kunang-kunang
    class CelebrationCanvas {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.lanterns = [];
            this.fireflies = [];
            this.rockets = [];
            this.sparks = [];
            this.confetti = [];
            this.lastTime = 0;
            this.rafId = null;

            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.floor(this.width * this.dpr);
            this.canvas.height = Math.floor(this.height * this.dpr);
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        }

        seedAmbient() {
            this.lanterns = [];
            this.fireflies = [];
            this.confetti = [];

            const lanternCount = this.width < 640 ? 9 : 15;
            for (let i = 0; i < lanternCount; i += 1) {
                this.lanterns.push(this.createLantern(randomBetween(0.08 * this.height, this.height)));
            }

            const fireflyCount = this.width < 640 ? 24 : 42;
            for (let i = 0; i < fireflyCount; i += 1) {
                this.fireflies.push({
                    x: randomBetween(0, this.width),
                    y: randomBetween(0, this.height),
                    r: randomBetween(1, 2.6),
                    vx: randomBetween(-0.22, 0.22),
                    vy: randomBetween(-0.28, -0.05),
                    phase: randomBetween(0, Math.PI * 2),
                    speed: randomBetween(0.02, 0.05),
                    color: Math.random() > 0.3 ? '#ffe09e' : '#ffffff',
                });
            }

            const confettiCount = this.width < 640 ? 20 : 34;
            for (let i = 0; i < confettiCount; i += 1) {
                this.confetti.push(this.createConfetti(randomBetween(-this.height, this.height)));
            }
        }

        createLantern(startY) {
            const scale = randomBetween(0.55, 1.15);
            return {
                x: randomBetween(30, Math.max(60, this.width - 30)),
                y: startY ?? this.height + randomBetween(20, 90),
                scale,
                vy: randomBetween(0.35, 0.8) * scale,
                swayAmp: randomBetween(0.25, 0.65),
                swayPhase: randomBetween(0, Math.PI * 2),
                swaySpeed: randomBetween(0.012, 0.024),
                alpha: randomBetween(0.55, 0.92),
            };
        }

        createConfetti(startY) {
            return {
                x: randomBetween(0, this.width),
                y: startY ?? randomBetween(-40, -10),
                w: randomBetween(5, 9),
                h: randomBetween(3, 6),
                vy: randomBetween(0.55, 1.25),
                vx: randomBetween(-0.35, 0.35),
                rot: randomBetween(0, Math.PI * 2),
                rotSpeed: randomBetween(-0.04, 0.04),
                wobble: randomBetween(0, Math.PI * 2),
                color: pickColor(),
                alpha: randomBetween(0.45, 0.85),
            };
        }

        launchFirework(targetX, targetY) {
            const startX = targetX !== undefined
                ? targetX + randomBetween(-60, 60)
                : randomBetween(0.14 * this.width, 0.86 * this.width);
            const destX = targetX ?? startX + randomBetween(-35, 35);
            const destY = targetY ?? randomBetween(0.14 * this.height, 0.48 * this.height);

            this.rockets.push({
                x: startX,
                y: this.height + 10,
                destX,
                destY,
                vx: (destX - startX) / 38,
                vy: (destY - (this.height + 10)) / 38,
                color: pickColor(),
                trail: [],
                age: 0,
                maxAge: 38,
            });
        }

        burstAt(x, y, count = 42, baseColor = null) {
            const color = baseColor || pickColor();
            for (let i = 0; i < count; i += 1) {
                const angle = (Math.PI * 2 * i) / count + randomBetween(-0.08, 0.08);
                const speed = randomBetween(1.4, 5.2);
                this.sparks.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.048,
                    drag: 0.972,
                    alpha: 1,
                    decay: randomBetween(0.012, 0.022),
                    radius: randomBetween(1.4, 2.9),
                    color: Math.random() > 0.25 ? color : '#fff7e2',
                });
            }

            // Tambahkan beberapa konfeti emas dari titik ledakan
            for (let j = 0; j < 8; j += 1) {
                this.confetti.push({
                    x: x + randomBetween(-14, 14),
                    y: y + randomBetween(-14, 14),
                    w: randomBetween(5, 9),
                    h: randomBetween(3, 5),
                    vy: randomBetween(0.5, 1.4),
                    vx: randomBetween(-1.2, 1.2),
                    rot: randomBetween(0, Math.PI * 2),
                    rotSpeed: randomBetween(-0.06, 0.06),
                    wobble: randomBetween(0, Math.PI * 2),
                    color: pickColor(),
                    alpha: 0.85,
                });
            }
            if (this.confetti.length > 90) {
                this.confetti.splice(0, this.confetti.length - 90);
            }
        }

        celebrateWave() {
            const burstCount = this.width < 640 ? 4 : 6;
            for (let i = 0; i < burstCount; i += 1) {
                setTimeout(() => {
                    this.launchFirework(
                        randomBetween(0.15 * this.width, 0.85 * this.width),
                        randomBetween(0.15 * this.height, 0.45 * this.height)
                    );
                }, i * 190);
            }

            for (let k = 0; k < 4; k += 1) {
                this.lanterns.push(this.createLantern(this.height + randomBetween(10, 60)));
            }
            if (this.lanterns.length > 26) {
                this.lanterns.splice(0, this.lanterns.length - 26);
            }
        }

        drawLantern(l) {
            const ctx = this.ctx;
            const w = 18 * l.scale;
            const h = 25 * l.scale;

            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.globalAlpha = l.alpha;

            // Aura cahaya lentera
            const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28 * l.scale);
            glow.addColorStop(0, 'rgba(255, 214, 130, 0.45)');
            glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, 28 * l.scale, 0, Math.PI * 2);
            ctx.fill();

            // Badan lentera
            const bodyGrad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
            bodyGrad.addColorStop(0, 'rgba(244, 162, 97, 0.78)');
            bodyGrad.addColorStop(0.65, 'rgba(255, 217, 142, 0.92)');
            bodyGrad.addColorStop(1, 'rgba(255, 245, 214, 0.98)');

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.moveTo(-w * 0.45, -h * 0.45);
            ctx.quadraticCurveTo(0, -h * 0.62, w * 0.45, -h * 0.45);
            ctx.lineTo(w * 0.34, h * 0.45);
            ctx.lineTo(-w * 0.34, h * 0.45);
            ctx.closePath();
            ctx.fill();

            // Inti api kecil
            ctx.fillStyle = '#fff9e6';
            ctx.beginPath();
            ctx.arc(0, h * 0.28, 2.2 * l.scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        step(timestamp) {
            const dt = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 2.2) : 1;
            this.lastTime = timestamp;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            // Kunang-kunang & bintang lembut
            this.fireflies.forEach((f) => {
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.phase += f.speed * dt;
                if (f.y < -10) f.y = this.height + 10;
                if (f.x < -10) f.x = this.width + 10;
                if (f.x > this.width + 10) f.x = -10;

                const alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(f.phase));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Lentera terbang
            this.lanterns.forEach((l, idx) => {
                l.swayPhase += l.swaySpeed * dt;
                l.x += Math.sin(l.swayPhase) * l.swayAmp * dt;
                l.y -= l.vy * dt;
                if (l.y < -50) {
                    this.lanterns[idx] = this.createLantern(this.height + 40);
                }
                this.drawLantern(l);
            });

            // Konfeti / kelopak cahaya emas
            this.confetti.forEach((c, idx) => {
                c.wobble += 0.05 * dt;
                c.x += (c.vx + Math.sin(c.wobble) * 0.35) * dt;
                c.y += c.vy * dt;
                c.rot += c.rotSpeed * dt;

                if (c.y > this.height + 20) {
                    this.confetti[idx] = this.createConfetti(-20);
                }

                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rot);
                ctx.globalAlpha = c.alpha;
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
                ctx.restore();
            });

            // Roket kembang api
            for (let i = this.rockets.length - 1; i >= 0; i -= 1) {
                const r = this.rockets[i];
                r.trail.push({ x: r.x, y: r.y });
                if (r.trail.length > 7) r.trail.shift();

                r.x += r.vx * dt;
                r.y += r.vy * dt;
                r.age += dt;

                ctx.save();
                ctx.strokeStyle = r.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                r.trail.forEach((pt, idx) => {
                    if (idx === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                });
                ctx.lineTo(r.x, r.y);
                ctx.stroke();
                ctx.restore();

                if (r.age >= r.maxAge) {
                    this.burstAt(r.x, r.y, 44, r.color);
                    this.rockets.splice(i, 1);
                }
            }

            // Percikan kembang api
            for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
                const s = this.sparks[i];
                s.vx *= Math.pow(s.drag, dt);
                s.vy = s.vy * Math.pow(s.drag, dt) + s.gravity * dt;
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.alpha -= s.decay * dt;

                if (s.alpha <= 0) {
                    this.sparks.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, s.alpha);
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            this.rafId = requestAnimationFrame((ts) => this.step(ts));
        }

        start() {
            if (reducedMotion) return;
            this.seedAmbient();
            this.rafId = requestAnimationFrame((ts) => this.step(ts));
        }
    }

    // 2. Alunan Nada Lembut Opsional (Web Audio API tanpa file audio eksternal)
    class GentleChimePlayer {
        constructor(button) {
            this.button = button;
            this.ctx = null;
            this.timer = null;
            this.isPlaying = false;
            this.stepIndex = 0;
            // Nada pentatonik hangat (C mayor / A minor lembut)
            this.notes = [523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 587.33, 440.0];
        }

        playNote(freq) {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.0);
        }

        toggle() {
            if (this.isPlaying) {
                this.stop();
                return;
            }
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.ctx) {
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.isPlaying = true;
            this.button.setAttribute('aria-pressed', 'true');
            this.button.textContent = 'Nada: Nyala';

            const tick = () => {
                if (!this.isPlaying) return;
                this.playNote(this.notes[this.stepIndex % this.notes.length]);
                this.stepIndex += 1;
            };
            tick();
            this.timer = setInterval(tick, 950);
        }

        stop() {
            this.isPlaying = false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            this.button.setAttribute('aria-pressed', 'false');
            this.button.textContent = 'Nada: Mati';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const stage = document.getElementById('stage');
        const canvas = document.getElementById('celebration-canvas');
        const replayBtn = document.getElementById('replay-btn');
        const celebrateBtn = document.getElementById('celebrate-btn');
        const soundBtn = document.getElementById('sound-btn');

        if (!stage || !canvas) return;

        const engine = new CelebrationCanvas(canvas);
        engine.start();

        const chime = soundBtn ? new GentleChimePlayer(soundBtn) : null;

        function runEntranceSequence() {
            stage.classList.remove('is-animating');
            // Paksa reflow agar keyframe CSS berulang dari awal
            void stage.offsetWidth;
            stage.classList.add('is-animating');

            if (!reducedMotion) {
                setTimeout(() => {
                    engine.launchFirework(0.24 * window.innerWidth, 0.24 * window.innerHeight);
                }, 450);
                setTimeout(() => {
                    engine.launchFirework(0.76 * window.innerWidth, 0.26 * window.innerHeight);
                }, 1050);
                setTimeout(() => {
                    engine.launchFirework(0.5 * window.innerWidth, 0.2 * window.innerHeight);
                }, 1750);
            }
        }

        runEntranceSequence();

        // Kembang api ringan berkala agar suasana tetap semarak
        if (!reducedMotion) {
            setInterval(() => {
                if (document.visibilityState === 'visible') {
                    engine.launchFirework();
                }
            }, 3400);
        }

        // Klik di mana saja pada panggung untuk memeriahkan dengan ledakan cahaya & lentera
        stage.addEventListener('click', (event) => {
            if (event.target.closest('#controls-dock')) return;
            if (reducedMotion) return;
            engine.burstAt(event.clientX, event.clientY, 38);
            engine.lanterns.push(engine.createLantern(window.innerHeight + 25));
            if (engine.lanterns.length > 26) {
                engine.lanterns.shift();
            }
        });

        if (replayBtn) {
            replayBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                runEntranceSequence();
            });
        }

        if (celebrateBtn) {
            celebrateBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (!reducedMotion) {
                    engine.celebrateWave();
                }
            });
        }

        if (soundBtn && chime) {
            soundBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                chime.toggle();
            });
        }
    });
})();
