/* ── Constellation Path — game logic ─────────────────────────────────────── */

const canvas = document.getElementById('constellation-canvas');
const ctx = canvas.getContext('2d');
const promptEl = document.getElementById('c-prompt');
const scoreEl = document.getElementById('c-score');
const seqEl = document.getElementById('c-seq');
const timerEl = document.getElementById('c-timer');
const timerChip = document.getElementById('timer-chip');
const finalScore = document.getElementById('c-final-score');
const gameoverTitle = document.getElementById('gameover-title');

// Modals
const expModal = document.getElementById('exp-modal');
const instrModal = document.getElementById('instr-modal');
const goModal = document.getElementById('gameover-modal');

document.getElementById('exp-cont-btn').addEventListener('click', () => {
    expModal.classList.add('hidden');
    instrModal.classList.remove('hidden');
});
document.getElementById('instr-start-btn').addEventListener('click', () => {
    instrModal.classList.add('hidden');
    startGame();
});
document.getElementById('retry-btn').addEventListener('click', () => {
    goModal.classList.add('hidden');
    startGame();
});

// ── Canvas sizing ─────────────────────────────────────────────────────────────
function sizeCanvas() {
    const s = Math.min(window.innerWidth - 48, 600);
    canvas.width = s;
    canvas.height = Math.round(s * 0.72);
}
sizeCanvas();
window.addEventListener('resize', () => { sizeCanvas(); if (orbs.length) generateOrbs(); });

// ── State ─────────────────────────────────────────────────────────────────────
const ORB_COUNT = 10;
const ORB_R = 22;
const MIN_DIST = 90;

let orbs = [];
let bgStars = [];
let sequence = [];
let playerInput = [];
let seqLen = 3;
let score = 0;
let phase = 'idle';   // 'showing' | 'recall' | 'idle'
let showIdx = 0;
let showTimer = null;
let timerSecs = 0;
let timerTick = null;
let animId = null;
let isActive = false;

// ── Generate orbs in scattered, non-grid positions ────────────────────────────
function generateOrbs() {
    orbs = [];
    const w = canvas.width, h = canvas.height;
    const margin = 55;
    let tries = 0;
    while (orbs.length < ORB_COUNT && tries < 2000) {
        const x = margin + Math.random() * (w - 2 * margin);
        const y = margin + Math.random() * (h - 2 * margin);
        const ok = orbs.every(o => Math.hypot(x - o.x, y - o.y) >= MIN_DIST);
        if (ok) orbs.push({ x, y, state: 'idle', litAt: 0 });
        tries++;
    }
}

// ── Background stars ──────────────────────────────────────────────────────────
function generateStars() {
    bgStars = Array.from({ length: 130 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3,
        a: 0.2 + Math.random() * 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
    }));
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawFrame() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Deep space background
    ctx.fillStyle = '#060c14';
    ctx.fillRect(0, 0, W, H);

    // Subtle radial nebula glow
    const nebula = ctx.createRadialGradient(W * 0.6, H * 0.3, 0, W * 0.6, H * 0.3, W * 0.55);
    nebula.addColorStop(0, 'rgba(30,60,120,0.18)');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    const now = performance.now() / 1000;

    // Twinkling stars
    for (const s of bgStars) {
        const alpha = s.a * (0.7 + 0.3 * Math.sin(now * 1.5 + s.twinkleOffset));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
    }

    // Sequence connector lines
    if (phase === 'showing' && showIdx > 1) drawLines(showIdx, false);
    if (phase === 'recall') {
        drawLines(sequence.length, true);          // full ghost path
        drawLines(playerInput.length, false);      // player progress
    }

    // Orbs
    orbs.forEach((o, i) => drawOrb(o, i, now));
}

function drawLines(upTo, ghost) {
    ctx.save();
    ctx.setLineDash(ghost ? [4, 7] : []);
    const src = ghost ? sequence : (phase === 'showing' ? sequence : playerInput);
    for (let i = 1; i < upTo; i++) {
        if (src[i] === undefined || src[i - 1] === undefined) break;
        const a = orbs[src[i - 1]], b = orbs[src[i]];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = ghost ? 'rgba(0,224,84,0.12)' : 'rgba(0,224,84,0.65)';
        ctx.lineWidth = ghost ? 1 : 2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawOrb(o, idx, now) {
    const { x, y, state } = o;
    const idlePulse = 0.5 + 0.5 * Math.sin(now * 1.4 + idx * 0.9);

    let fillColor, glowColor, glowR;
    if (state === 'active') {
        fillColor = '#00e054'; glowColor = 'rgba(0,224,84,0.55)'; glowR = ORB_R * 2.6;
    } else if (state === 'correct') {
        fillColor = '#00e054'; glowColor = 'rgba(0,224,84,0.35)'; glowR = ORB_R * 2;
    } else if (state === 'wrong') {
        fillColor = '#e54040'; glowColor = 'rgba(229,64,64,0.55)'; glowR = ORB_R * 2.4;
    } else {
        fillColor = '#2a3545';
        glowColor = `rgba(64,188,244,${0.05 + 0.04 * idlePulse})`;
        glowR = ORB_R * 1.4;
    }

    // Glow halo
    const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g.addColorStop(0, glowColor);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    ctx.beginPath();
    ctx.arc(x, y, ORB_R, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Rim
    ctx.strokeStyle = state === 'active' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Step number during recall (once clicked)
    const clickStep = playerInput.indexOf(idx);
    if (phase === 'recall' && clickStep >= 0) {
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(ORB_R * 0.78)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(clickStep + 1, x, y);
    }
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function animate() {
    drawFrame();
    animId = requestAnimationFrame(animate);
}

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    seqLen = 3;
    isActive = true;
    scoreEl.textContent = 0;
    seqEl.textContent = seqLen;
    timerEl.textContent = '—';
    timerChip.classList.remove('warning');
    goModal.classList.add('hidden');
    generateOrbs();
    generateStars();
    if (animId) cancelAnimationFrame(animId);
    animate();
    canvas.addEventListener('click', handleCanvasClick);
    setTimeout(nextRound, 400);
}

function nextRound() {
    clearTimer();
    playerInput = [];
    phase = 'idle';
    orbs.forEach(o => o.state = 'idle');

    // Build random sequence
    const indices = Array.from({ length: orbs.length }, (_, i) => i);
    sequence = [];
    while (sequence.length < seqLen) {
        const pick = indices[Math.floor(Math.random() * indices.length)];
        if (sequence[sequence.length - 1] !== pick) sequence.push(pick);
    }

    seqEl.textContent = seqLen;
    timerEl.textContent = '—';
    timerChip.classList.remove('warning');
    promptEl.textContent = 'Watch the sequence…';

    showIdx = 0;
    phase = 'showing';
    showNextOrb();
}

function showNextOrb() {
    if (!isActive) return;
    if (showIdx > 0) orbs[sequence[showIdx - 1]].state = 'idle';

    if (showIdx >= seqLen) {
        phase = 'recall';
        promptEl.textContent = '↺  Now tap in order';
        startRecallTimer();
        return;
    }

    orbs[sequence[showIdx]].state = 'active';
    showIdx++;
    showTimer = setTimeout(showNextOrb, 820);
}

function handleCanvasClick(e) {
    if (phase !== 'recall' || !isActive) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        if (playerInput.includes(i)) continue;
        if (Math.hypot(cx - o.x, cy - o.y) <= ORB_R + 8) {
            if (sequence[playerInput.length] === i) {
                o.state = 'correct';
                playerInput.push(i);
                if (playerInput.length === seqLen) {
                    // Round complete
                    clearTimer();
                    score++;
                    seqLen++;
                    scoreEl.textContent = score;
                    promptEl.textContent = '✓  Perfect!';
                    setTimeout(nextRound, 900);
                }
            } else {
                o.state = 'wrong';
                orbs[sequence[playerInput.length]].state = 'active'; // reveal correct
                endGame('Wrong orb!');
            }
            return;
        }
    }
}

function startRecallTimer() {
    timerSecs = 12;
    timerEl.textContent = timerSecs;
    timerTick = setInterval(() => {
        timerSecs--;
        timerEl.textContent = timerSecs;
        if (timerSecs <= 4) timerChip.classList.add('warning');
        if (timerSecs <= 0) { clearInterval(timerTick); endGame("Time's up!"); }
    }, 1000);
}

function clearTimer() {
    clearInterval(timerTick);
    clearTimeout(showTimer);
}

function endGame(msg) {
    isActive = false;
    phase = 'idle';
    clearTimer();
    canvas.removeEventListener('click', handleCanvasClick);
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    finalScore.textContent = score;
    gameoverTitle.textContent = msg;
    goModal.classList.remove('hidden');
}
