const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

const unicodePieces = {
    wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
    bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F'
};

let board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

let turn = 'w';
let selected = null;
let possibleMoves = [];

function createBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = r;
            square.dataset.col = c;
            const piece = board[r][c];
            if (piece) {
                square.textContent = unicodePieces[piece];
            }
            square.addEventListener('click', onSquareClick);
            boardElement.appendChild(square);
        }
    }
    updateStatus();
}

function onSquareClick(e) {
    if (turn === 'b') return; // ignore clicks during AI turn
    const row = parseInt(e.currentTarget.dataset.row, 10);
    const col = parseInt(e.currentTarget.dataset.col, 10);
    const piece = board[row][col];

    if (selected) {
        if (row === selected.row && col === selected.col) {
            clearSelection();
            return;
        }
        if (isMoveInList(row, col, possibleMoves)) {
            movePiece(selected.row, selected.col, row, col);
            switchTurn();
            clearSelection();
            createBoard();
            if (turn === 'b') {
                setTimeout(makeRandomAIMove, 300);
            }
            return;
        }
    }

    if (piece && piece[0] === turn) {
        selected = { row, col };
        possibleMoves = getValidMoves(row, col);
        highlightSelection();
    }
}

function highlightSelection() {
    clearHighlights();
    const squares = boardElement.children;
    for (const div of squares) {
        const r = parseInt(div.dataset.row, 10);
        const c = parseInt(div.dataset.col, 10);
        if (selected && r === selected.row && c === selected.col) {
            div.classList.add('selected');
        }
        if (isMoveInList(r, c, possibleMoves)) {
            div.classList.add('move-option');
        }
    }
}

function clearHighlights() {
    for (const div of boardElement.children) {
        div.classList.remove('selected');
        div.classList.remove('move-option');
    }
}

function clearSelection() {
    selected = null;
    possibleMoves = [];
    clearHighlights();
}

function isMoveInList(r, c, moves) {
    return moves.some(m => m.row === r && m.col === c);
}

function movePiece(sr, sc, dr, dc) {
    const piece = board[sr][sc];
    board[dr][dc] = piece;
    board[sr][sc] = null;

    // Pawn promotion
    if (piece[1] === 'P' && (dr === 0 || dr === 7)) {
        board[dr][dc] = piece[0] + 'Q';
    }
}

function switchTurn() {
    turn = turn === 'w' ? 'b' : 'w';
}

function updateStatus() {
    statusElement.textContent = turn === 'w' ? "White's turn" : "Black's turn";
}

function makeRandomAIMove() {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === 'b') {
                const moves = getValidMoves(r, c);
                for (const m of moves) {
                    allMoves.push({ sr: r, sc: c, dr: m.row, dc: m.col });
                }
            }
        }
    }
    if (allMoves.length === 0) return;
    const move = allMoves[Math.floor(Math.random() * allMoves.length)];
    movePiece(move.sr, move.sc, move.dr, move.dc);
    switchTurn();
    createBoard();
}

function getValidMoves(r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];
    const moves = [];

    const dir = color === 'w' ? -1 : 1;
    if (type === 'P') {
        // forward
        if (isEmpty(r + dir, c)) {
            moves.push({ row: r + dir, col: c });
            const startRow = color === 'w' ? 6 : 1;
            if (r === startRow && isEmpty(r + 2 * dir, c)) {
                moves.push({ row: r + 2 * dir, col: c });
            }
        }
        // captures
        for (const dc of [-1, 1]) {
            const nr = r + dir;
            const nc = c + dc;
            if (isOpponent(nr, nc, color)) {
                moves.push({ row: nr, col: nc });
            }
        }
    } else if (type === 'R' || type === 'Q') {
        linearMoves(r, c, color, moves, [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ]);
    }
    if (type === 'B' || type === 'Q') {
        linearMoves(r, c, color, moves, [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ]);
    }
    if (type === 'N') {
        const deltas = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        for (const d of deltas) {
            const nr = r + d.dr;
            const nc = c + d.dc;
            if (inBounds(nr, nc) && !isAlly(nr, nc, color)) {
                moves.push({ row: nr, col: nc });
            }
        }
    }
    if (type === 'K') {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (inBounds(nr, nc) && !isAlly(nr, nc, color)) {
                    moves.push({ row: nr, col: nc });
                }
            }
        }
    }
    return moves;
}

function linearMoves(r, c, color, moves, deltas) {
    for (const d of deltas) {
        let nr = r + d.dr;
        let nc = c + d.dc;
        while (inBounds(nr, nc)) {
            if (isEmpty(nr, nc)) {
                moves.push({ row: nr, col: nc });
            } else {
                if (isOpponent(nr, nc, color)) {
                    moves.push({ row: nr, col: nc });
                }
                break;
            }
            nr += d.dr;
            nc += d.dc;
        }
    }
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isEmpty(r, c) {
    return inBounds(r, c) && board[r][c] === null;
}

function isOpponent(r, c, color) {
    return inBounds(r, c) && board[r][c] && board[r][c][0] !== color;
}

function isAlly(r, c, color) {
    return inBounds(r, c) && board[r][c] && board[r][c][0] === color;
}

createBoard();
