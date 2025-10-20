const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scale = 20;
const rows = 20;
const cols = 12;

ctx.scale(scale, scale);

// Tetromino shapes
const pieces = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,0,0],[1,1,1]], // L
    [[0,0,1],[1,1,1]], // J
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]]  // Z
];

const colors = [
    '#00f0f0', // I - cyan
    '#f0f000', // O - yellow
    '#a000f0', // T - purple
    '#f0a000', // L - orange
    '#0000f0', // J - blue
    '#00f000', // S - green
    '#f00000'  // Z - red
];

let board = Array(rows).fill().map(() => Array(cols).fill(0));
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let dropInterval = 1000;
let lastTime = 0;
let dropCounter = 0;

// Game state elements
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const playerNameInput = document.getElementById('playerName');
const submitScoreBtn = document.getElementById('submitScore');
const closeModalBtn = document.getElementById('closeModal');

// Initialize
function init() {
    loadRankings();
    draw();
}

// Create new piece
function newPiece() {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    currentPiece = {
        shape: pieces[pieceIndex],
        color: colors[pieceIndex]
    };
    currentX = Math.floor(cols / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentY = 0;
    
    if (collision(currentX, currentY, currentPiece.shape)) {
        gameOver();
    }
}

// Draw board
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cols, rows);
    
    drawBoard();
    if (currentPiece) {
        drawPiece(currentX, currentY, currentPiece);
    }
}

function drawBoard() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x, y, 1, 1);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x, y, 1, 1);
            }
        }
    }
}

function drawPiece(offsetX, offsetY, piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = piece.color;
                ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(offsetX + x, offsetY + y, 1, 1);
            }
        });
    });
}

// Collision detection
function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                if (newX < 0 || newX >= cols || newY >= rows) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece to board
function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentY + y][currentX + x] = currentPiece.color;
            }
        });
    });
}

// Rotate piece
function rotate(shape) {
    const newShape = [];
    for (let i = 0; i < shape[0].length; i++) {
        newShape[i] = [];
        for (let j = shape.length - 1; j >= 0; j--) {
            newShape[i][shape.length - 1 - j] = shape[j][i];
        }
    }
    return newShape;
}

// Clear lines
function clearLines() {
    let linesCleared = 0;
    
    for (let y = rows - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(cols).fill(0));
            linesCleared++;
            y++; // Check same row again
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        updateUI();
    }
}

// Update UI
function updateUI() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
}

// Game loop
function update(time = 0) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        moveDown();
        dropCounter = 0;
    }
    
    draw();
    requestAnimationFrame(update);
}

// Move piece down
function moveDown() {
    if (!collision(currentX, currentY + 1, currentPiece.shape)) {
        currentY++;
    } else {
        merge();
        clearLines();
        newPiece();
    }
}

// Hard drop
function hardDrop() {
    while (!collision(currentX, currentY + 1, currentPiece.shape)) {
        currentY++;
        score += 2;
    }
    updateUI();
    merge();
    clearLines();
    newPiece();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused || !currentPiece) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (!collision(currentX - 1, currentY, currentPiece.shape)) {
                currentX--;
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (!collision(currentX + 1, currentY, currentPiece.shape)) {
                currentX++;
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            const rotated = rotate(currentPiece.shape);
            if (!collision(currentX, currentY, rotated)) {
                currentPiece.shape = rotated;
            }
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
    draw();
});

// Button controls
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        newPiece();
        update();
    }
}

function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
        if (!gamePaused) {
            lastTime = performance.now();
            update();
        }
    }
}

function resetGame() {
    board = Array(rows).fill().map(() => Array(cols).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    gameRunning = false;
    gamePaused = false;
    currentPiece = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    updateUI();
    draw();
}

function gameOver() {
    gameRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    finalScoreEl.textContent = score;
    modal.classList.add('active');
}

// Rankings system
function loadRankings() {
    const rankings = JSON.parse(localStorage.getItem('tetrisRankings') || '[]');
    displayRankings(rankings);
}

function saveRanking(name, score) {
    let rankings = JSON.parse(localStorage.getItem('tetrisRankings') || '[]');
    rankings.push({ name, score, date: new Date().toISOString() });
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10); // Keep top 10
    localStorage.setItem('tetrisRankings', JSON.stringify(rankings));
    displayRankings(rankings);
}

function displayRankings(rankings) {
    const rankingsEl = document.getElementById('rankings');
    
    if (rankings.length === 0) {
        rankingsEl.innerHTML = '<p style="text-align:center; color:#666;">No rankings yet. Be the first!</p>';
        return;
    }
    
    rankingsEl.innerHTML = rankings.map((rank, index) => `
        <div class="rank-item ${index < 3 ? 'top-3' : ''}">
            <span class="rank-number">#${index + 1}</span>
            <span class="rank-name">${rank.name}</span>
            <span class="rank-score">${rank.score}</span>
        </div>
    `).join('');
}

// Modal controls
submitScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Anonymous';
    saveRanking(name, score);
    modal.classList.remove('active');
    playerNameInput.value = '';
    resetGame();
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    playerNameInput.value = '';
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitScoreBtn.click();
    }
});

// Initialize game
init();
