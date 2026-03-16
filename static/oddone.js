/* ── Odd One Out — game logic ─────────────────────────────────────────────── */

const promptEl = document.getElementById('o-prompt');
const scoreEl = document.getElementById('o-score');
const roundEl = document.getElementById('o-round');
const timerEl = document.getElementById('o-timer');
const timerChip = document.getElementById('o-timer-chip');
const finalScore = document.getElementById('o-final-score');
const goTitle = document.getElementById('gameover-title');
const gridEl = document.getElementById('odd-grid');

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

// ── Colour helpers ─────────────────────────────────────────────────────────────
// HSL hue-shifted palette — easy to control subtle differences
const BASE_HUES = [210, 260, 310, 355, 30, 75, 155];

function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

// contrast for text label
function contrastText(h, s, l) { return l > 55 ? '#000' : '#fff'; }

// ── State ─────────────────────────────────────────────────────────────────────
let score = 0;
let round = 0;
let timeLimit = 8;
let timerSecs = 0;
let timerTick = null;
let isActive = false;
let outlierIdx = -1;

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    round = 0;
    timeLimit = 8;
    isActive = true;
    scoreEl.textContent = 0;
    goModal.classList.add('hidden');
    nextRound();
}

function nextRound() {
    clearInterval(timerTick);
    round++;
    roundEl.textContent = round;
    timerChip.classList.remove('warning');

    // Circle count increases immediately after each click
    const count = Math.min(6 + score * 2, 45);

    // How subtle the hue difference is — starts at 35°, shrinks to 8°
    const hueDiff = Math.max(8, 35 - score * 1.5);

    // Pick a base hue for this round
    const baseHue = BASE_HUES[Math.floor(Math.random() * BASE_HUES.length)];
    const sat = 65, lig = 52;

    // Outlier has baseHue + hueDiff
    outlierIdx = Math.floor(Math.random() * count);

    // Calculate maximum circle size geometrically so they never overflow the grid horizontally
    const gridW = gridEl.offsetWidth || Math.min(window.innerWidth - 40, 520);
    const cols = Math.ceil(Math.sqrt(count * (gridW / 400)));
    const sizeToFit = Math.floor((gridW - (cols * 14)) / cols);
    const circleSize = Math.max(25, Math.min(80, sizeToFit));

    gridEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const isOutlier = i === outlierIdx;
        const hue = isOutlier ? baseHue + hueDiff : baseHue;
        const el = document.createElement('div');
        el.className = 'odd-circle';
        el.style.cssText = `
            width:${circleSize}px;
            height:${circleSize}px;
            background:${hsl(hue, sat, lig)};
        `;
        el.dataset.outlier = isOutlier ? '1' : '0';
        el.addEventListener('click', onCircleClick);
        gridEl.appendChild(el);
    }

    promptEl.textContent = 'Find the odd one out.';
    startTimer();
}

function onCircleClick(e) {
    if (!isActive) return;
    const el = e.target;
    if (el.dataset.outlier === '1') {
        // Correct
        score++;
        scoreEl.textContent = score;
        if (timeLimit > 3) timeLimit = Math.max(3, timeLimit - 0.3);
        el.style.boxShadow = '0 0 24px #00e054';
        setTimeout(nextRound, 320);
    } else {
        el.classList.add('shake');
        endGame('Wrong circle!');
    }
}

function startTimer() {
    timerSecs = Math.ceil(timeLimit);
    timerEl.textContent = timerSecs;
    timerTick = setInterval(() => {
        timerSecs--;
        timerEl.textContent = timerSecs;
        if (timerSecs <= 3) timerChip.classList.add('warning');
        if (timerSecs <= 0) { clearInterval(timerTick); endGame("Time's up!"); }
    }, 1000);
}

function endGame(msg) {
    isActive = false;
    clearInterval(timerTick);
    finalScore.textContent = score;
    goTitle.textContent = msg;
    goModal.classList.remove('hidden');
    if (score > 0) {
        fetch('/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: 'Odd One Out', score: score })
        }).catch(err => console.error(err));
    }
}
