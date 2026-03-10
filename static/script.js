const grid = document.getElementById('grid');
const promptText = document.getElementById('prompt-text');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const timerBoard = document.querySelector('.timer-board');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreDisplay = document.getElementById('final-score');
const retryBtn = document.getElementById('retry-btn');
const instructionsModal = document.getElementById('instructions-modal');
const startGameBtn = document.getElementById('start-game-btn');
const matrixDisplay = document.getElementById('matrix-label');

let score = 0;
let targetColor = '';
let targetNumber = 0;
let isGameActive = false;
let timeLimit = 9;
let timeRemaining = 9;
let timerInterval = null;

// ── Color palette ─────────────────────────────────────────────────────────────
const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333',
    '#33FFF3', '#FFFF33', '#FF8C33', '#8C33FF', '#FF6B9D',
    '#00CED1', '#FF4500', '#7FFF00', '#DA70D6', '#40E0D0',
    '#FF69B4', '#1E90FF', '#32CD32', '#FF8C00', '#9370DB',
    '#20B2AA', '#DC143C', '#00FA9A', '#FF1493', '#4169E1',
];

const colorNames = {
    '#FF5733': 'Red-Orange', '#33FF57': 'Green', '#3357FF': 'Blue',
    '#F333FF': 'Magenta', '#FF3333': 'Red', '#33FFF3': 'Cyan',
    '#FFFF33': 'Yellow', '#FF8C33': 'Orange', '#8C33FF': 'Purple',
    '#FF6B9D': 'Pink', '#00CED1': 'Dark Cyan', '#FF4500': 'Vermillion',
    '#7FFF00': 'Chartreuse', '#DA70D6': 'Orchid', '#40E0D0': 'Turquoise',
    '#FF69B4': 'Hot Pink', '#1E90FF': 'Dodger Blue', '#32CD32': 'Lime',
    '#FF8C00': 'Dark Orange', '#9370DB': 'Medium Purple', '#20B2AA': 'Sea Green',
    '#DC143C': 'Crimson', '#00FA9A': 'Spring Green', '#FF1493': 'Deep Pink',
    '#4169E1': 'Royal Blue',
};

// ── Matrix sizing ─────────────────────────────────────────────────────────────
// Returns { cols, boxCount, gridPx, boxPx, gapPx } for current score
function getMatrixConfig() {
    let cols, gridPx, boxPx;
    if (score < 5) {
        cols = 3; gridPx = 360; boxPx = 100;
    } else if (score < 12) {
        cols = 4; gridPx = 480; boxPx = 95;
    } else {
        cols = 5; gridPx = 580; boxPx = 88;
    }
    const boxCount = cols * cols;
    const gapPx = Math.floor((gridPx - cols * boxPx) / (cols + 1));
    return { cols, boxCount, gridPx, boxPx, gapPx };
}

// ── Arrangement permutations ──────────────────────────────────────────────────
// Returns CSS grid-template-areas string or null (null = plain row-major order)
// We shuffle the positions of the boxes within the CSS grid, keeping the
// grid structure but randomising which cell each box lands in.
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Build a randomly permuted position list (indices 0..boxCount-1)
// for placing boxes so the visual layout varies each round.
function getPositionPermutation(boxCount) {
    const indices = Array.from({ length: boxCount }, (_, i) => i);
    return shuffleArray(indices);
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function getContrastColor(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#FFF';
}

function pickColors(n) {
    // Pick n distinct colors (or repeat if n > palette size)
    const shuffled = shuffleArray([...colors]);
    const result = [];
    for (let i = 0; i < n; i++) result.push(shuffled[i % shuffled.length]);
    return result;
}

// ── Speech ────────────────────────────────────────────────────────────────────
function speakNumber(number) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(number.toString());
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    speechSynthesis.speak(u);
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeRemaining = Math.ceil(timeLimit);
    timerDisplay.textContent = timeRemaining;
    timerBoard.classList.remove('warning');

    timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = timeRemaining;
        if (timeRemaining <= 3) timerBoard.classList.add('warning');
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame("Time's up!");
        }
    }, 1000);
}

// ── Game flow ─────────────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    scoreDisplay.textContent = 0;
    timeLimit = 9;
    isGameActive = true;
    gameOverModal.classList.add('hidden');
    nextRound();
}

function nextRound() {
    if (!isGameActive) return;
    if (timerInterval) clearInterval(timerInterval);

    const { cols, boxCount, gridPx, boxPx, gapPx } = getMatrixConfig();

    // Update matrix label
    if (matrixDisplay) matrixDisplay.textContent = `${cols}×${cols}`;

    // Style the grid container
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, ${boxPx}px)`;
    grid.style.gridTemplateRows = `repeat(${cols}, ${boxPx}px)`;
    grid.style.gap = gapPx + 'px';
    grid.style.width = gridPx + 'px';
    grid.style.padding = gapPx + 'px';
    grid.style.boxSizing = 'border-box';
    grid.style.transition = 'width 0.4s ease';

    // ── Number range for this grid size ────────────────────────────────────
    // Numbers can repeat across boxes; range grows with grid so it stays
    // manageable to hear (max 12 even on 5×5)
    const maxNum = cols === 3 ? 9 : cols === 4 ? 12 : 16;

    // ── Distractor counts scale with grid size ──────────────────────────────
    // cols 3 → 1 of each type, cols 4 → 2, cols 5 → 3
    const distractorCount = cols - 2;

    // ── Pick target ─────────────────────────────────────────────────────────
    const shuffledColors = shuffleArray([...colors]);
    targetColor = shuffledColors[0];
    targetNumber = Math.floor(Math.random() * maxNum) + 1;

    // ── Build box data ───────────────────────────────────────────────────────
    const boxData = [];

    // 1. The ONE correct box
    boxData.push({ color: targetColor, number: targetNumber });

    // 2. COLOR distractors: same color as target, WRONG number
    //    → tricks the eye (correct color but audio says different number)
    const usedColorDistractorNums = new Set([targetNumber]);
    for (let i = 0; i < distractorCount; i++) {
        let num;
        let tries = 0;
        do {
            num = Math.floor(Math.random() * maxNum) + 1;
            tries++;
        } while (usedColorDistractorNums.has(num) && tries < 30);
        usedColorDistractorNums.add(num);
        boxData.push({ color: targetColor, number: num });
    }

    // 3. NUMBER distractors: same number as target, WRONG color
    //    → tricks the ear (correct number but wrong color shown)
    const usedNumDistractorColors = new Set([targetColor]);
    for (let i = 0; i < distractorCount; i++) {
        let col;
        let tries = 0;
        do {
            col = colors[Math.floor(Math.random() * colors.length)];
            tries++;
        } while (usedNumDistractorColors.has(col) && tries < 30);
        usedNumDistractorColors.add(col);
        boxData.push({ color: col, number: targetNumber });
    }

    // 4. Fill the rest with random combos (not the exact target)
    while (boxData.length < boxCount) {
        const col = colors[Math.floor(Math.random() * colors.length)];
        const num = Math.floor(Math.random() * maxNum) + 1;
        if (!(col === targetColor && num === targetNumber)) {
            boxData.push({ color: col, number: num });
        }
    }

    // Shuffle so target and distractors are in random positions
    shuffleArray(boxData);

    // ── Render ───────────────────────────────────────────────────────────────
    boxData.forEach(({ color, number }) => {
        const box = document.createElement('div');
        box.className = 'grid-item';
        box.style.backgroundColor = color;
        box.style.width = boxPx + 'px';
        box.style.height = boxPx + 'px';
        box.style.fontSize = Math.max(14, Math.round(boxPx * 0.38)) + 'px';
        box.style.color = getContrastColor(color);
        box.dataset.color = color;
        box.dataset.number = number;
        box.textContent = number;
        box.addEventListener('click', handleBoxClick);
        grid.appendChild(box);
    });

    // Prompt — visual color name + audio number
    const colorName = colorNames[targetColor] || 'This Color';
    promptText.innerHTML = `Click the <span style="color:${targetColor};text-shadow:0 0 6px rgba(255,255,255,0.6);">${colorName}</span> box`;
    speakNumber(targetNumber);

    setTimeout(startTimer, 500);
}

function handleBoxClick(e) {
    if (!isGameActive) return;
    const clickedColor = e.target.dataset.color;
    const clickedNumber = parseInt(e.target.dataset.number);

    if (clickedColor === targetColor && clickedNumber === targetNumber) {
        score++;
        scoreDisplay.textContent = score;
        if (timeLimit > 2) timeLimit = Math.max(2, timeLimit - 0.4);
        nextRound();
    } else {
        endGame('Wrong box!');
    }
}

function endGame(message = 'Game Over!') {
    isGameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    speechSynthesis.cancel();
    finalScoreDisplay.textContent = score;
    gameOverModal.querySelector('h2').textContent = message;
    gameOverModal.classList.remove('hidden');
}

// ── Modal wiring ──────────────────────────────────────────────────────────────
const explanationModal = document.getElementById('explanation-modal');
const continueToInstructionsBtn = document.getElementById('continue-to-instructions-btn');

retryBtn.addEventListener('click', startGame);

continueToInstructionsBtn.addEventListener('click', () => {
    explanationModal.classList.add('hidden');
    instructionsModal.classList.remove('hidden');
});

startGameBtn.addEventListener('click', () => {
    instructionsModal.classList.add('hidden');
    startGame();
});
