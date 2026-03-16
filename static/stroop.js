/* ── Color Switch (Stroop) — game logic ───────────────────────────────────── */

const wordEl = document.getElementById('s-word');
const optionsEl = document.getElementById('stroop-options');
const scoreEl = document.getElementById('s-score');
const timerEl = document.getElementById('s-timer');
const timerChip = document.getElementById('s-timer-chip');
const finalScore = document.getElementById('s-final-score');
const goTitle = document.getElementById('gameover-title');

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

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
    { name: 'Red', hex: '#e54040', text: '#fff' },
    { name: 'Green', hex: '#00b241', text: '#fff' },
    { name: 'Blue', hex: '#40bcf4', text: '#000' },
    { name: 'Yellow', hex: '#f5d600', text: '#000' },
    { name: 'Purple', hex: '#9b59b6', text: '#fff' },
    { name: 'Orange', hex: '#ff8000', text: '#000' },
    { name: 'Pink', hex: '#ff6b9d', text: '#000' },
    { name: 'Cyan', hex: '#00e5cc', text: '#000' },
];

// ── State ─────────────────────────────────────────────────────────────────────
let score = 0;
let timeLimit = 7;
let timerSecs = 0;
let timerTick = null;
let isActive = false;
let inkColorIdx = -1;   // The colour we want the player to click (ink colour)

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    timeLimit = 7;
    isActive = true;
    scoreEl.textContent = 0;
    goModal.classList.add('hidden');
    timerChip.classList.remove('warning');
    nextRound();
}

function nextRound() {
    clearInterval(timerTick);
    timerChip.classList.remove('warning');

    // Number of colour options shown — increases every round
    const optionCount = Math.min(3 + score, COLORS.length);

    // Shuffle colours and pick subset
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5).slice(0, optionCount);

    // Pick the ink colour (what the word is physically drawn in)
    const inkIdx = Math.floor(Math.random() * shuffled.length);
    const inkColor = shuffled[inkIdx];
    inkColorIdx = inkIdx;

    // Pick a word that is a DIFFERENT colour name
    let wordColor;
    do {
        wordColor = shuffled[Math.floor(Math.random() * shuffled.length)];
    } while (wordColor.name === inkColor.name);

    // Render word — text content = wordColor.name, ink = inkColor.hex
    wordEl.textContent = wordColor.name.toUpperCase();
    wordEl.style.color = inkColor.hex;

    // Render circle options
    optionsEl.innerHTML = '';
    shuffled.forEach((col, i) => {
        const chip = document.createElement('div');
        chip.className = 'stroop-chip';
        chip.style.cssText = `background:${col.hex}; color:${col.text};`;
        chip.textContent = col.name;
        chip.dataset.idx = i;
        chip.addEventListener('click', onChipClick);
        optionsEl.appendChild(chip);
    });

    startTimer();
}

function onChipClick(e) {
    if (!isActive) return;
    const el = e.currentTarget;
    const idx = parseInt(el.dataset.idx);

    if (idx === inkColorIdx) {
        el.classList.add('flash-correct');
        score++;
        scoreEl.textContent = score;
        if (timeLimit > 2.5) timeLimit = Math.max(2.5, timeLimit - 0.3);
        setTimeout(() => { el.classList.remove('flash-correct'); nextRound(); }, 300);
    } else {
        el.classList.add('flash-wrong');
        setTimeout(() => endGame('Wrong colour!'), 350);
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
            body: JSON.stringify({ game: 'Color Switch', score: score })
        }).catch(err => console.error(err));
    }
}
