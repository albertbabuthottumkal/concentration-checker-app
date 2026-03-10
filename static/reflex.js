/* ── Reflex Tap — game logic ──────────────────────────────────────────────── */

const promptEl = document.getElementById('r-prompt');
const scoreEl = document.getElementById('r-score');
const windowEl = document.getElementById('r-window');
const windowChip = document.getElementById('r-window-chip');
const finalScore = document.getElementById('r-final-score');
const goTitle = document.getElementById('gameover-title');
const arena = document.getElementById('reflex-arena');

const expModal = document.getElementById('exp-modal');
const instrModal = document.getElementById('instr-modal');
const goModal = document.getElementById('gameover-modal');

document.getElementById('exp-cont-btn').addEventListener('click', () => {
    expModal.classList.add('hidden'); instrModal.classList.remove('hidden');
});
document.getElementById('instr-start-btn').addEventListener('click', () => {
    instrModal.classList.add('hidden'); startGame();
});
document.getElementById('retry-btn').addEventListener('click', () => {
    goModal.classList.add('hidden'); startGame();
});

// ── Config ────────────────────────────────────────────────────────────────────
const INIT_WINDOW = 1800;    // ms the orb stays lit
const MIN_WINDOW = 500;
const WIN_DECREASE = 80;      // ms reduction every 3 correct taps

function getDotConfig() {
    const count = Math.min(6 + score * 2, 45);
    const radius = Math.max(14, 30 - Math.floor(score / 3) * 2);
    return { count, radius };
}

// ── State ─────────────────────────────────────────────────────────────────────
let score = 0;
let windowMs = INIT_WINDOW;
let litIndex = -1;
let litTimeout = null;
let nextTimeout = null;
let isActive = false;
let dots = [];   // DOM elements

// ── Build arena ───────────────────────────────────────────────────────────────
function buildArena() {
    arena.innerHTML = '';
    dots = [];
    const W = arena.offsetWidth || 540;
    const H = arena.offsetHeight || 420;
    const { count, radius } = getDotConfig();
    const margin = radius + 10;

    // Place dots in a scattered pattern (no grid)
    const placed = [];
    let tries = 0;

    while (placed.length < count && tries < 4000) {
        const x = margin + Math.random() * (W - 2 * margin);
        const y = margin + Math.random() * (H - 2 * margin);
        const ok = placed.every(p => Math.hypot(x - p.x, y - p.y) >= radius * 2.4);
        if (ok) placed.push({ x, y });
        tries++;
    }

    placed.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'reflex-dot';
        el.style.cssText = `
            width:${radius * 2}px;
            height:${radius * 2}px;
            left:${p.x - radius}px;
            top:${p.y - radius}px;
            background:#2c3440;
            color:var(--green);
        `;
        el.dataset.idx = i;
        el.addEventListener('click', onDotClick);
        arena.appendChild(el);
        dots.push(el);
    });
}

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    windowMs = INIT_WINDOW;
    isActive = true;
    scoreEl.textContent = 0;
    windowEl.textContent = (windowMs / 1000).toFixed(1);
    goModal.classList.add('hidden');
    windowChip.classList.remove('warning');
    buildArena();
    promptEl.textContent = 'Get ready…';
    setTimeout(scheduleNext, 600);
}

function scheduleNext() {
    if (!isActive) return;
    clearAll();
    litIndex = -1;

    // Random pause before lighting (0.4–1.4 s)
    const pause = 400 + Math.random() * 1000;
    nextTimeout = setTimeout(lightRandom, pause);
}

function lightRandom() {
    if (!isActive) return;
    const idx = Math.floor(Math.random() * dots.length);
    litIndex = idx;
    const el = dots[idx];
    el.style.background = 'var(--green)';
    el.style.boxShadow = '0 0 28px var(--green), 0 0 55px rgba(0,224,84,0.3)';
    el.classList.add('lit');
    promptEl.textContent = '⚡ Tap it!';

    // Auto-extinguish — missed!
    litTimeout = setTimeout(() => {
        if (!isActive) return;
        extinguish(idx);
        endGame("Too slow!");
    }, windowMs);
}

function extinguish(idx) {
    if (dots[idx]) {
        dots[idx].style.background = '#2c3440';
        dots[idx].style.boxShadow = '';
        dots[idx].classList.remove('lit');
    }
}

function onDotClick(e) {
    if (!isActive) return;
    const idx = parseInt(e.target.dataset.idx);

    if (idx === litIndex) {
        // Correct tap
        clearAll();
        extinguish(idx);
        score++;
        scoreEl.textContent = score;
        if (score % 3 === 0) {
            windowMs = Math.max(MIN_WINDOW, windowMs - WIN_DECREASE);
        }
        windowEl.textContent = (windowMs / 1000).toFixed(1);
        if (windowMs <= 800) windowChip.classList.add('warning');
        promptEl.textContent = '✓  Nice!';
        setTimeout(() => {
            buildArena();
            scheduleNext();
        }, 350);
    } else if (litIndex === -1) {
        // Tapped a dark dot while nothing is lit
        endGame('Wrong orb!');
    } else {
        // Tapped the wrong dot while another is lit
        endGame('Wrong orb!');
    }
}

function clearAll() {
    clearTimeout(litTimeout);
    clearTimeout(nextTimeout);
}

function endGame(msg) {
    isActive = false;
    clearAll();
    if (litIndex >= 0) extinguish(litIndex);
    litIndex = -1;
    finalScore.textContent = score;
    goTitle.textContent = msg;
    goModal.classList.remove('hidden');
}
