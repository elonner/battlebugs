//========================== CONSTANTS ========================
const MOVE_DELAY = 200;

//========================= STATE VARIABLES =============================
let userBoard;
let cpuBoard;
let userBugs;
let cpuBugs;
let turn; // 1, -1
let winner; // null, 1: user, -1: cpu
let playing;

//========================= CLASSES ===================================
class Cell {
    constructor(value, pos) {
        this.value = value; // 0: empty, 1: hit, -1: miss
        this.row = pos[0];
        this.col = pos[1];
        this.color = 'white';
        this.isOccupied = false;
        var el = document.createElement('div');
        el.classList.add('cell');
        this.el = el;
        this.bug; // bug that is covering cell 
    }
}

class Bug {
    constructor(size) {
        this.size = size; // 5, 4, 3, or 2
        this.orient = 1; // 1: vertical, -1: horizontal
        this.el = document.createElement('img');
        this.el.setAttribute('src', `Icons/${size}er.png`);
        this.el.classList.add('bug');
        this.row; // top row
        this.col; // left column 
        this.hits = 0; // total hits
        this.isSquashed = false; //css idea --> footprints then squashed animation
        this.cellsOn = []; // links to cells bug is covering
    }
}

//======================== CACHE ===========================
const userBoardEl = document.getElementById('user-board');
const cpuBoardEl = document.getElementById('cpu-board');

//======================== EVENT LISTENERS ==================
$('#cpu-board').on('click', '.cell', handleUserMove);

//======================== MAIN =======================
init();
printBoard(cpuBoard);
//play();

//======================== INITIALIZATION =====================
function init() {
    // TODO: reset any DOM elements that may have changed


    // fill bugs array with the 5 new Bugs
    fillBugs();
    // fill the boards with new empty cells
    initBoards();
    // randomize CPU bugs
    placeCpuBugs();
    placeUserBugs(); // FOR TESTING 

    playing = true;
    winner = null;
    turn = 1;
    render();
}

// fill bugs array with the 5 bugs
function fillBugs() {
    userBugs = [];
    cpuBugs = [];
    bugSizes = [2, 3, 3, 4, 5];
    bugSizes.forEach(size => {
        userBugs.push(new Bug(size));
        cpuBugs.push(new Bug(size));
    });
}

// fill the boards with new empty cells
function initBoards() {
    cpuBoard = [];
    userBoard = [];

    for (let r = 0; r < 10; r++) {
        cpuBoard.push([]);
        userBoard.push([]);
        for (let c = 0; c < 10; c++) {
            cpuBoard[r].push(new Cell(0, [r, c]));
            userBoard[r].push(new Cell(0, [r, c]));
        }
    }
}

// randomize cpu bugs
function placeCpuBugs() {
    let b = 4
    while (b >= 0) {
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        cpuBugs[b].orient = Math.random() > 0.5 ? 1 : -1;
        var l = cpuBugs[b].size;
        switch (cpuBugs[b].orient) {
            case 1:
                if (isValidPos(cpuBoard, cpuBugs[b], r, c)) {
                    for (let i = r; i < r + l; i++) {
                        cpuBoard[i][c].isOccupied = true;
                        cpuBoard[i][c].bug = cpuBugs[b];
                        cpuBugs[b].cellsOn.push(cpuBoard[i][c]);
                    }
                    cpuBugs[b].row = r;
                    cpuBugs[b].col = c;
                    b--;
                }
                break;
            case -1:
                if (isValidPos(cpuBoard, cpuBugs[b], r, c)) {
                    for (let i = c; i < c + l; i++) {
                        cpuBoard[r][i].isOccupied = true;
                        cpuBoard[r][i].bug = cpuBugs[b];
                        cpuBugs[b].cellsOn.push(cpuBoard[r][i]);
                    }
                    cpuBugs[b].row = r;
                    cpuBugs[b].col = c;
                    b--;
                }
                break;
        }
    }
}

//TEMPORARY USE BEFORE USER INPUT IS ADDED
function placeUserBugs() {
    let b = 4
    while (b >= 0) {
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        userBugs[b].orient = Math.random() > 0.5 ? 1 : -1;
        var l = userBugs[b].size;
        switch (userBugs[b].orient) {
            case 1:
                if (isValidPos(userBoard, userBugs[b], r, c)) {
                    for (let i = r; i < r + l; i++) {
                        userBoard[i][c].isOccupied = true;
                        userBoard[i][c].bug = userBugs[b];
                        userBugs[b].cellsOn.push(userBoard[i][c]);
                    }
                    userBugs[b].row = r;
                    userBugs[b].col = c;
                    b--;
                }
                break;
            case -1:
                if (isValidPos(userBoard, userBugs[b], r, c)) {
                    for (let i = c; i < c + l; i++) {
                        userBoard[r][i].isOccupied = true;
                        userBoard[r][i].bug = userBugs[b];
                        userBugs[b].cellsOn.push(userBoard[r][i]);
                    }
                    userBugs[b].row = r;
                    userBugs[b].col = c;
                    b--;
                }
                break;
        }
    }
}

//=========================== MOVE HANDLERS ================================
function handleUserMove() {
    const r = $(this)[0].id[1];
    const c = $(this)[0].id[3];
    const cell = cpuBoard[r][c];
    if (cell.value !== 0) return;
    if (isHit(cpuBoard, r, c)) {                  // HIT
        console.log('hit');
        cell.value = 1;
        cell.bug.hits++;
        if (cell.bug.hits === cell.bug.size) {   // SQUASHED
            console.log('squashed');
            cell.bug.isSquashed = true;
        }
    } else {                                     // MISS
        console.log('miss');
        cell.value = -1;
    }
    turn = -1;
    winner = getWinner();
    render();
    // CPU turn
    if (!winner) {
        //make sure user can't move when CPU turn 
        $('#cpu-board').off('click');
        setTimeout(handleCpuMove, MOVE_DELAY);
    }
}

function handleCpuMove() {
    let validMove = false;
    while (!validMove) {
        // select random cell
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        const cell = userBoard[r][c];
        if (cell.value === 0) { // if it hasn't been shot at yet
            validMove = true;
            if (isHit(userBoard, r, c)) {                // HIT
                console.log('CPU HIT');
                cell.value = 1;
                cell.bug.hits++;
                if (cell.bug.hits === cell.bug.size) {   // SQUASHED
                    cell.bug.isSquashed = true;
                    console.log('CPU SQUASH')
                }
            } else {                                     // MISS
                console.log('CPU MISS');
                cell.value = -1;
            }
        }
    }
    turn = 1;
    winner = getWinner();
    render();
    if (!winner) $('#cpu-board').on('click', '.cell', handleUserMove);
}

//===================================== RENDERERS ====================================
function render() {
    renderBoards();
    renderBugs();
}

// TODO: need to find a way around display = none so that when a user bug is hit we can show it 
function renderBoards() {
    if (winner) {
        $('#cpu-board').off('click');
        console.log('Winner', winner)
    }
    cpuBoard.forEach((row, r) => {
        row.forEach((cell, c) => {
            cell.el.setAttribute('id', `r${r}c${c}`)
            if (cell.value === 1) {
                cell.el.style.backgroundColor = 'red';
            }
            if (cell.value === -1) {
                cell.el.style.backgroundColor = 'green';
            }
            cpuBoardEl.append(cell.el);
        });
    });
    userBoard.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell.isOccupied) {
                cell.el.style.display = 'none';
            }
            if (cell.value === 1) {
                cell.el.style.backgroundColor = 'red';
            }
            if (cell.value === -1) {
                cell.el.style.backgroundColor = 'green';
            }
            cell.el.setAttribute('id', `r${r}c${c}`)
            userBoardEl.append(cell.el);
        });
    });
}

// TODO: wtf is going on with these horizontals 
function renderBugs() {
    if (!playing) {

    } else if (playing) {
        userBugs.forEach(bug => {
            if (bug.type === 'user') {
                userBoardEl.append(this.el);
            } else if (bug.type === 'cpu') {
                cpuBoardEl.append(this.el);
            }
            if (bug.orient === 1) { // vertical
                bug.el.classList.add('vertical');
                bug.el.setAttribute('style', `grid-column: ${bug.col + 1}; grid-row: ${bug.row + 1} / span ${bug.size};`);
                userBoardEl.append(bug.el);
            } else { // horizontal (-1)
                bug.el.classList.add('horizontal');
                bug.el.setAttribute('style', `grid-column: ${bug.col + 1} / span ${bug.size}; grid-row: ${bug.row + 1};`);
                userBoardEl.append(bug.el);
            }
        });
    }
}

//========================== HELPERS ==================================
function getWinner() {
    if (cpuBugs.every(bug => bug.isSquashed)) {
        return 1;
    } else if (userBugs.every(bug => bug.isSquashed)) {
        return -1;
    }
    return null;
}

function isValidPos(board, bug, r, c) {
    var l = bug.size;
    switch (bug.orient) {
        case 1:
            if (r + l < 10) {
                for (let i = r; i < r + l; i++) {
                    if (board[i][c].isOccupied) {
                        return false;
                    }
                }
            } else {
                return false;
            }
            return true;
        case -1:
            if (c + l < 10) {
                for (let i = c; i < c + l; i++) {
                    if (board[r][i].isOccupied) {
                        return false;
                    }
                }
            } else {
                return false;
            }
            return true;
    }
    return false;
}

function isHit(board, r, c) {
    return board[r][c].isOccupied;
}

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function printBoard(board) {
    const modBoard = [];
    board.forEach((row, r) => {
        modBoard.push([]);
        row.forEach(cell => {
            if (cell.isOccupied) {
                modBoard[r].push('X');
            } else {
                modBoard[r].push(' ');
            }
        });
    });
    modBoard.forEach(row => {
        console.log(row);
    });
}