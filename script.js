//========================= STATE VARIABLES =============================
let userBoard;
let cpuBoard;
let userBugs;
let cpuBugs;
let turn;
let winner;
let playing;

//========================= CLASSES ===================================
class Cell {
    constructor(value, el, pos) {
        this.value = value; // 0: empty, 1: hit, -1: miss
        this.el = el;
        this.row = pos[0];
        this.col = pos[1];
        this.color = 'white';
        this.isOccupied = false;
    }
}

class Bug {
    constructor(size, type) {
        this.size = size;
        this.orient = 1; // 1: vertical, -1: horizontal
        this.el = document.createElement('img');
        this.el.setAttribute('src', `Icons/${size}er.png`);
        this.el.classList.add('bug');
        this.type = type;
        // TODO: think i want to move this out of the constructor
        switch (type) {
            case 'user':
                userBoardEl.append(this.el);
                break;
            case 'cpu':
                cpuBoardEl.append(this.el)
                break;
        }
        this.row; // top row
        this.col; // left column 
    }
}

//======================== CACHE ===========================
const userBoardEl = document.getElementById('user-board');
const cpuBoardEl = document.getElementById('cpu-board');

//======================== EVENT LISTENERS ==================
cpuBoardEl.addEventListener('click', handleUserMove);

//======================== FUNCTIONS =======================
init();


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
    render();
}

// fill bugs array with the 5 bugs
function fillBugs() {
    userBugs = [];
    cpuBugs = [];
    bugSizes = [2, 3, 3, 4, 5];
    bugSizes.forEach((size, i) => {
        userBugs.push(new Bug(size));
        cpuBugs.push(new Bug(size));
    });
}

// fill the boards with new empty cells
function initBoards() {
    cpuBoard = [];
    userBoard = [];

    for (let i = 0; i < 10; i++) {
        cpuBoard.push([]);
        userBoard.push([]);
        for (let j = 0; j < 10; j++) {
            var newCpuCellEl = document.createElement('div')
            newCpuCellEl.classList.add('cell')
            cpuBoard[i].push(new Cell(0, newCpuCellEl, [j, i]));

            var newUserCellEl = document.createElement('div');
            newUserCellEl.classList.add('cell')
            userBoard[i].push(new Cell(0, newUserCellEl, [j, i]));
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
                if (r + l < 10) {
                    var tryAgain = false;
                    for (let i = r; i < r + l; i++) {
                        if (cpuBoard[i][c].isOccupied) {
                            tryAgain = true;
                            break;
                        }
                    }
                    if (tryAgain) break;
                    for (let i = r; i < r + l; i++) {
                        cpuBoard[i][c].isOccupied = true;
                    }
                    cpuBugs[b].row = r;
                    cpuBugs[b].col = c;
                    b--;
                }
                break;
            case -1:
                if (c + l < 10) {
                    var tryAgain = false;
                    for (let i = c; i < c + l; i++) {
                        if (cpuBoard[r][i].isOccupied) {
                            tryAgain = true;
                            break;
                        }
                    }
                    if (tryAgain) break
                    for (let i = c; i < c + l; i++) {
                        cpuBoard[r][i].isOccupied = true;
                    }
                    cpuBugs[b].row = r;
                    cpuBugs[b].col = c;
                    b--;
                }
                break;
        }
    }
}

// FOR TESTING placeCpuBugs PLACE USER BUGS
function placeUserBugs() {
    let b = 4
    while (b >= 0) {
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        userBugs[b].orient = Math.random() > 0.5 ? 1 : -1;
        var l = userBugs[b].size;
        switch (userBugs[b].orient) {
            case 1:
                if (r + l < 10) {
                    var tryAgain = false;
                    for (let i = r; i < r + l; i++) {
                        if (userBoard[i][c].isOccupied) {
                            tryAgain = true;
                            break;
                        }
                    }
                    if (tryAgain) break;
                    for (let i = r; i < r + l; i++) {
                        userBoard[i][c].isOccupied = true;
                    }
                    userBugs[b].row = r;
                    userBugs[b].col = c;
                    b--;
                }
                break;
            case -1:
                if (c + l < 10) {
                    var tryAgain = false;
                    for (let i = c; i < c + l; i++) {
                        if (userBoard[r][i].isOccupied) {
                            tryAgain = true;
                            break;
                        }
                    }
                    if (tryAgain) break;
                    for (let i = c; i < c + l; i++) {
                        userBoard[r][i].isOccupied = true;
                    }
                    userBugs[b].row = r;
                    userBugs[b].col = c;
                    b--;
                }
                break;
        }
    }
}

function render() {
    renderBoard();
    renderBugs();
}

// TODO: need to find a way around display = none so that when a user bug is hit we can show it 
function renderBoard() {
    cpuBoard.forEach(rows => {
        rows.forEach(cell => {
            cpuBoardEl.append(cell.el);
        });
    });
    userBoard.forEach(rows => {
        rows.forEach(cell => {
            if (cell.isOccupied) {
                cell.el.style.display = 'none';
            }
            userBoardEl.append(cell.el);
        });
    });
}

// TODO: wtf is going on with these horizontals 
function renderBugs() {
    if (!playing) {

    } else if (playing) {
        userBugs.forEach(bug => {
            console.log(bug);
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

function handleUserMove() {

}

// allows setting multiple attributes at once
function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}