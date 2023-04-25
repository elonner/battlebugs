//======================================================== CONSTANTS ======================================================
let MOVE_DELAY = 2000;  // make a fast mode
const BUG_NAMES = ['', '', 'maggot', 'ant', 'beetle', 'millipede']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const MODES = ['normal'];
const ADJ_MOVES = [{ dr: 1, dc: 0 }, { dr: 0, dc: 1 }, { dr: -1, dc: 0 }, { dr: 0, dc: -1 }];

//=================================================== STATE VARIABLES ===========================================================
let mode = 0;
let difficulty = 0;
let instructionsHidden = true;
let fastMode = false;

let cpuBoard;
let userBoard;
let cpuBugs;
let userBugs;
let selectedBug;
let placedBugs;
let playing;
let message;
let winner; // null, 1: user, -1: cpu

// CPU algorithm variables 
let targetBug;
let prevShots;
let prevShots2;
let bugTally;

//======================================================= CLASSES =================================================================
class Cell {
    constructor(value, pos) {
        this.value = value; // 0: not shot at, 1: hit, -1: miss
        this.row = pos[0];
        this.col = pos[1];
        this.color = 'white';
        this.isOccupied = false;
        this.$ = $('<div class="cell"></div>');
        this.bug; // bug that is covering cell 
    }
}

class Bug {
    constructor(size) {
        this.size = size; // 5, 4, 3, or 2
        this.orient = 1; // 1: vertical, -1: horizontal
        this.$ = $(`<img src="Icons/${size}er.png" class="bug ${size}">`);
        this.row; // top row
        this.col; // left column 
        this.hits = 0; // total hits
        this.isSquashed = false; //css idea --> footprints then squashed animation
        this.cellsOn = []; // links to cells bug is covering
        this.isPlaced = false; // is it placed on the board already
    }
}

//====================================================== CACHE =========================================================
const $startScreen = $('#start-screen');
const $radioButtons = $('.radio-btn');
const $gameScreen = $('#game-screen');
const $userBoard = $('#user-board');
const $cpuBoard = $('#cpu-board');
const $bugBox = $('#bug-box');

//====================================================== EVENT LISTENERS ================================================
$('#difficulty').on('click', 'h1', changeDifficulty); // set up
$('#play-btn').on('click', play);
$('#show-instructions').on('click', showInstructions);

$bugBox.on('click', '.bug', selectBug);                // place bugs
$userBoard.on('click', '.cell', placeBug);
$('#ready-btn').on('click', startGame);

$cpuBoard.on('click', '.cell', userShot);              // game play

$('#play-again').on('click', init);                  // play again

$(document).on('keyup', delegateEvent);                // general

//====================================================== SET UP =====================================================
function changeDifficulty() {
    switch ($(this)[0].id) {
        case 'right':
            if (difficulty === 0 || difficulty === 1) {
                difficulty++;
                $('#difficulty>#dif-msg').html(`${DIFFICULTIES[difficulty]}`);
            }
            break;
        case 'left':
            if (difficulty === 1 || difficulty === 2) {
                difficulty--;
                $('#difficulty>#dif-msg').html(`${DIFFICULTIES[difficulty]}`);
            }
            break;
    }
}

function play() {
    if ($('#fast-check')[0].checked) fastMode = true;
    let checkedEl;
    $radioButtons.each((i, btnEl) => {
        if (btnEl.checked) checkedEl = btnEl;
    });
    mode = MODES.findIndex(MODE => MODE === checkedEl.id);
    if (mode !== 0) {
        alert('Oops! Sorry, this game mode is not available yet...');
        return;
    }
    if (difficulty !== 0) {
        alert('Oops! Sorry, this difficulty is not available yet...');
        return;
    }
    $startScreen.css({ display: 'none' });
    init();
}

function startGame() {
    playing = true;
    $userBoard.off('click');
    render();
}

function showInstructions() {
    let checkedEl;
    const $modeInstr = $('#mode-instructions');
    $radioButtons.each((i, btnEl) => {
        if (btnEl.checked) checkedEl = btnEl;
    });
    mode = MODES.findIndex(MODE => MODE === checkedEl.id);
    if (mode !== 0) {
        alert('Oops! Sorry, this game mode is not available yet...');
    }
    if (!instructionsHidden) {
        $modeInstr.html('');
        instructionsHidden = true;
    } else {
        switch (mode) {
        case 0:
            $modeInstr.html(`Normal battleship rules. Place your bugs wherever you want.<br>During game, select the cell on your opponent's board where you would like to "stomp."<br>Your opponent will let you know which bug you have squashed if your shot happens to squash a bug.<br>First one to squash all of the other's bugs wins!`)
            instructionsHidden = false;
            break;
        case 1:
            break;
        case 2:
            break;
        }
    }
}

//====================================================== INITIALIZATION ===================================================
function init() {
    // reset any DOM elements that may have changed in a previous game
    resetDOM();
    // fill bugs array with the 5 new Bugs
    fillBugs();
    // fill the boards with new empty cells
    initBoards();
    // randomize CPU bugs
    placeCpuBugs();

    playing = false;
    selectedBug = null;
    placedBugs = [];
    message = 'Good luck!'
    winner = null;

    prevShots = [];
    prevShots2 = { hits: [], misses: [] };
    targetBug = false;
    bugTally = [
        { size: 2, tally: 0 },
        { size: 3, tally: 0 },
        { size: 3, tally: 0 },
        { size: 4, tally: 0 },
        { size: 5, tally: 0 }
    ]

    render();

    if (fastMode) {
        placeUserBugs();
        playing = true;
        MOVE_DELAY = 0;
        render();
    }
}

function resetDOM() {
    removeAllChildNodes($cpuBoard[0]);
    removeAllChildNodes($userBoard[0]);
    removeAllChildNodes($bugBox[0]);

    $cpuBoard.on('click', '.cell', userShot);
    $cpuBoard.addClass('hover');
    $cpuBoard.css({ display: 'none' });
    $userBoard.addClass('hover');
    $userBoard.removerClass('shrink');
    $cpuBoard.removerClass('shrink');
    $bugBox.css({ display: 'flex' });
    $('#play-again').css({ display: 'none' });
    $('#msg').html('');
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

// TODO: getFancy(howFancy), weird placements to throw off user
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

// FOR TESTING! RANDOMLY PLACES USER BUGS
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
                    userBugs[b].$.removeClass('vertical').addClass('horizontal');
                    userBugs[b].row = r;
                    userBugs[b].col = c;
                    b--;
                }
                break;
        }
    }
    if (allBugsPlaced(userBugs)) {
        $('#ready-btn').css({ display: 'initial' });
        $('#instructoins').css({ display: 'none' });
        $bugBox.css({ display: 'none' });
    }
}

//==================================================== MOVE HANDLERS ==============================================
function selectBug() {
    const $bug = $(this);
    if (selectedBug && $bug[0] === selectedBug.$[0]) {
        selectedBug.$.removeClass('selected');                    // DESELECT click
        selectedBug = null;
    } else {                                                      // SELECT click
        if (selectedBug) selectedBug.$.removeClass('selected');
        $bug.addClass('selected');
        selectedBug = userBugs.find(bug => bug.$[0] === $bug[0]);
    }
}

function rotateBug(bug) {
    if (!bug.isPlaced) {
        if (bug.orient === 1) {
            bug.$.removeClass('vertical').addClass('horizontal');
        } else {
            bug.$.removeClass('horizontal').addClass('vertical');
        }
        bug.orient *= (-1);
    }
}

function placeBug() {
    if (selectedBug && !playing) {
        const r = parseInt($(this)[0].id[1]);
        const c = parseInt($(this)[0].id[3]);
        if (isValidPos(userBoard, selectedBug, r, c)) {
            selectedBug.col = c;
            selectedBug.row = r;
            const l = selectedBug.size;
            // update cell elements, add cells to bug.cellsOn, 
            if (selectedBug.orient === 1) {
                for (let i = r; i < r + l; i++) {
                    userBoard[i][c].isOccupied = true;
                    userBoard[i][c].bug = selectedBug;
                    selectedBug.cellsOn.push(userBoard[i][c]);
                }
                selectedBug.$.css({ gridArea: `${r + 1} / ${c + 1} / ${r + 1 + l} / ${c + 1}` });
            } else {
                for (let i = c; i < c + l; i++) {
                    userBoard[r][i].isOccupied = true;
                    userBoard[r][i].bug = selectedBug;
                    selectedBug.cellsOn.push(userBoard[r][i]);
                }
                selectedBug.$.css({ gridArea: `${r + 1} / ${c + 1} / ${r + 1} / ${c + 1 + l}` });
            }
            $userBoard.append(selectedBug.$);
            selectedBug.$.removeClass('selected');
            selectedBug.isPlaced = true;
            placedBugs.push(selectedBug);
            selectedBug = null;
        }
    }
    if (allBugsPlaced(userBugs)) {
        $('#ready-btn').css({ display: 'initial' });
        $('#instructoins').css({ display: 'none' });
        $bugBox.css({ display: 'none' });
    }
}

function undoPlacement() {
    let lastPlacedBug = placedBugs.pop();
    lastPlacedBug.isPlaced = false;
    let r = lastPlacedBug.row;
    let c = lastPlacedBug.col;
    let l = lastPlacedBug.size;
    if (lastPlacedBug.orient === 1) {
        for (let i = r; i < r + l; i++) {
            userBoard[i][c].isOccupied = false;
            userBoard[i][c].bug = null;
        }
        lastPlacedBug.cellsOn = [];
        lastPlacedBug.$.css({ gridArea: `` });
    } else {
        for (let i = c; i < c + l; i++) {
            userBoard[r][i].isOccupied = false;
            userBoard[r][i].bug = null;
        }
        lastPlacedBug.cellsOn = [];
        lastPlacedBug.$.css({ gridArea: `` });
        rotateBug(lastPlacedBug);
    }
    $bugBox.append(lastPlacedBug.$);
    $('#ready-btn').css({ display: 'none' });
    $('#instructoins').css({ display: 'initial' });
    $bugBox.css({ display: 'flex' });
}

function userShot() {
    if (playing) {
        const r = parseInt($(this)[0].id[1]);
        const c = parseInt($(this)[0].id[3]);
        const cell = cpuBoard[r][c];
        if (cell.value !== 0) return;
        if (isHit(cpuBoard, cell)) {                  // HIT
            cell.value = 1;
            cell.bug.hits++;
            message = 'You hit a bug!';
            if (cell.bug.hits === cell.bug.size) {   // SQUASHED
                cell.bug.isSquashed = true;
                message = `You squashed a ${BUG_NAMES[cell.bug.size]}!`;
            }
        } else {                                     // MISS
            cell.value = -1;
            message = 'You missed!';
        }
        animateCSS(cell.$[0], 'flip');
        turn = -1;
        winner = getWinner();
        render();
        // animate turn and switch turns
        if (!winner) {
            if (!fastMode) {
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.remove('shrink'));
                $userBoard.removeClass('shrink');
                setTimeout(() => {
                    $cpuBoard.addClass('shrink');
                }, 150);
            }
            //make sure user can't move when CPU turn 
            $('#cpu-board').off('click');
            setTimeout(cpuShot, MOVE_DELAY);
        }
    }
}

function cpuShot() {
    if (!fastMode) {
        setTimeout(() => {
            $cpuBoard.removeClass('shrink');
            setTimeout(() => {
                $userBoard.addClass('shrink');
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.add('shrink'));
            }, 150);
        }, 0.5*MOVE_DELAY);
    }
    let targetCell;
    switch (difficulty) {
        case 0:
            targetCell = easySelect();
            break;
        case 1:
            targetCell = mediumSelect();
            break;
        case 2:
            targetCell = hardSelect();
            break;
    }
    if (isHit(userBoard, targetCell)) {                      // HIT
        targetBug = true;  // for cpu algorithm 
        targetCell.value = 1;
        targetCell.bug.hits++;
        message = 'Ouch!';
        if (targetCell.bug.hits === targetCell.bug.size) {   // SQUASHED
            targetCell.bug.isSquashed = true;
            targetBug = false;
            message = "That one's gonna hurt..."
        }
    } else {                                                 // MISS
        targetCell.value = -1;
        message = 'That was a close one!'
    }
    animateCSS(targetCell.$[0], 'flip');

    turn = 1;
    winner = getWinner();
    render();
    if (!winner) {
        $('#cpu-board').on('click', '.cell', userShot);
    }
    // console.log('===========================================');         //TESTING
    // printBoard(userBoard);
    // console.log(targetBug);
}

function delegateEvent(e) {
    switch (e.keyCode) {
        case 32: // space 
            if (selectedBug && !playing) rotateBug(selectedBug);
            break;
        case 8: // tab
            if (!playing && placedBugs.length > 0) undoPlacement();
            break;
        case 13: // enter
            if (playing === undefined) {
                play();
                break;
            }
            if (playing === false) {
                if (allBugsPlaced(userBugs)) startGame();
                break;
            }
            if (winner) {
                init();
                break;
            }
    }

}

//================================================== RENDERERS ============================================================

function render() {
    if (!playing) initialRender();
    renderBoards();
    renderBugs();
    if (winner) renderGameOver();
    renderMsgs();
}

function initialRender() {
    if (!playing) {
        userBugs.forEach(bug => {                   // ADD bugs to box
            bug.$.addClass('vertical');
            $bugBox.append(bug.$);
        });
        cpuBoard.forEach(row => {                   // ADD cells to boards
            row.forEach(cell => {
                addCelltoBoard($cpuBoard, cell);
            });
        });
        userBoard.forEach(row => {
            row.forEach(cell => {
                addCelltoBoard($userBoard, cell);
            });
        });
    }
}

function renderBoards() {
    $gameScreen.css({ display: 'flex' });
    if (playing) {                                  // HOVER
        $cpuBoard.css({ display: 'grid' });
        $userBoard.removeClass('hover');
        $bugBox.css({ display: 'none' });
        cpuBoard.forEach(row => {
            row.forEach(cell => {
                if (cell.value === 1) {
                    // cell.$.removeClass('hover').addClass('hit');
                    cell.$.css({ backgroundColor: 'red' });
                    // cell.el.style.backgroundColor = 'red';
                }
                if (cell.value === -1) {
                    // cell.$.removeClass('hover').addClass('miss');
                    cell.$.css({ backgroundColor: '#4DCCBD' });
                    // cell.el.style.backgroundColor = 'green';
                }
            });
        });
        userBoard.forEach(row => {
            row.forEach(cell => {
                if (cell.value === 1) {
                    // cell.$.removeClass('hover').addClass('hit');
                    cell.$.css({ backgroundColor: 'red', zIndex: '1' });
                }
                if (cell.value === -1) {
                    // cell.$.removeClass('hover').addClass('miss');
                    cell.$.css({ backgroundColor: '#4DCCBD', zIndex: '1' });
                }
            });
        });
    }
}

// hor/vert classes are added/removed in rotateBug
function renderBugs() {
    if (playing) {
        userBugs.forEach(bug => {
            if (bug.orient === 1) { // vertical
                bug.$.css({ gridColumn: `${bug.col + 1}`, gridRow: `${bug.row + 1} / span ${bug.size}` });
            } else { // horizontal (-1)
                bug.$.css({ gridColumn: `${bug.col + 1} / span ${bug.size}`, gridRow: `${bug.row + 1}` });
            }
            $userBoard.append(bug.$);
        });
    }
}

function renderMsgs() {
    $('#game-info').html(`Mode: ${MODES[mode]} &nbsp &nbsp Difficulty: ${DIFFICULTIES[difficulty].toLowerCase()}`);
    $('#instructions').html("First <span class='action'>click</span> on a bug to select it, then on a tile to place the bug (clicked tile corresponds to left/top of bug). Press <span class='action'>'space'</span> to flip the bug horizontal. Press <span class='action'>'backspace'</span> to undo placement.<br><br>Once you have placed all your bugs, press <span class='action'>'enter'</span> or <span class='action'>click ready</span> to start the game.");
    if (playing) {
        $('#ready-btn').css({ display: 'none' });
        $('#msg').html(`${message}`);
        $('#instructions').html("<span class='action'>Click</span> on a cell in your opponent's board to stomp!")
    }
}

function renderGameOver() {
    $cpuBoard.off('click');
    $('.hover').removeClass('hover');
    switch (winner) {
        case 1:
            message = 'You win!'
            break;
        case -1:
            message = 'Better luck next time! '
            break;
    }
    $('#play-again').toggle();
}

//============================================== CPU ALGORITHMS =========================================
function easySelect() {
    let targetCell;
    if (!targetBug) {
        targetCell = randomSelect();
    } else {
        targetCell = adjacentSelect();
    }

    prevShots.unshift(targetCell);
    return targetCell;
}

function mediumSelect() {
    let targetCell;
    if (!targetBug) {
        targetCell = huntSelect();
    } else {
        targetCell = targetSelect();
    }
    if (isHit(userBoard, targetCell)) {
        prevShots2.hits.unshift(targetCell);    // could also do {cell: targetCell, targetBug: targetBug} 
        return targetCell;
    } else {
        prevShots2.misses.unshift(targetCell);
        return targetCell;
    }
}

function hardSelect() {

}

//================================================ HELPERS ================================================================
function targetSelect() { //just for one bug now, then account for others
    const hitCells = prevShots.filter(shotCell => shotCell.value === 1);
    // if hitCells.length - tot size squashed bugs = 1 -> adjacent select
    // TODO... 
    // attack linearly until (squash or reach end of line)
    // if reach end of line change axis and go back through line -> 1
    // when squash, if the total size of squashed bugs != total hits
    // find lone hit(s)
    // else target select turns off 

}

function findLoneHit() {
    // TODO...
    // prioritize hitCells with the least explored adjacents 
    // explore their adjacents until find a hit
    // if that hit is not a squash
    // put those two cells at the front of the line (or however you implement target cell)
    // continue with target select
    // else if the total size of squashed bugs != total hits
    // find lone hit(s)
    // else target select turns off
}

function huntSelect() {
    let cell;
    let i = 0;
    while (i < 500) {
        // select random cell
        var r = 2 * Math.floor(Math.random() * 5);
        var c = 2 * Math.floor(Math.random() * 5);
        cell = userBoard[r][c];
        if (cell.value === 0 && !adjsHasVal(cell, -1)) { // need to make sure we dont shoot adjacent to a miss, if it hasn't been shot at yet
            return cell;
        }
    }
    return randomSelect();          // in case theoretically there is some layout where we must shoot adjacent to a miss 
}

// very dumb algorithm, easily tricked
function adjacentSelect() {
    const lastHitCell = prevShots.find(shotCell => shotCell.value === 1);
    if (!adjsHasVal(lastHitCell, 0)) {       // for the case we reach end of the bug
        const hitCells = prevShots.filter(shotCell => shotCell.value === 1);
        let otherHit = hitCells.find(hitCell => {
            if (adjsHasVal(hitCell, 0)) {
                return true;
            }
        });
        return selectAdjTarget(otherHit);
    }
    return selectAdjTarget(lastHitCell);
}

function selectAdjTarget(cell) {
    let INF = 0;
    while (true) {
        const dir = ADJ_MOVES[Math.floor(Math.random() * 4)];
        const r = cell.row + dir.dr;
        const c = cell.col + dir.dc;
        // if it is in the board and it hasn't been shot at yet
        if (r < 10 && r >= 0 && c < 10 && c >= 0 && userBoard[r][c].value === 0) return userBoard[r][c];

        //TESTING
        INF++;
        if (INF > 100) {
            console.log('infinite loop');
            break;
        }
    }
}

function randomSelect() {
    let cell;
    while (true) {
        // select random cell
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        cell = userBoard[r][c];
        if (cell.value === 0) return cell // if it hasn't been shot at yet
    }
}

// returns true if any of cell's adjacent cells have value
function adjsHasVal(cell, val) {
    return ADJ_MOVES.some(dir => {
        const r = cell.row + dir.dr;
        const c = cell.col + dir.dc;
        if (r < 10 && r >= 0 && c < 10 && c >= 0) {
            if (userBoard[r][c].value === val) return true;
        }
    });
}

function addCelltoBoard($board, cell) {
    cell.$.attr('id', `r${cell.row}c${cell.col}`);
    cell.$.css({ gridColumn: `${cell.col + 1} / ${cell.col + 2}`, gridRow: `${cell.row + 1} / ${cell.row + 2}` });
    $board.append(cell.$);
}

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
            if (r + l <= 10) {
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
            if (c + l <= 10) {
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

function isHit(board, cell) {
    return board[cell.row][cell.col].isOccupied;
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
            switch (cell.value) {
                case 1:
                    modBoard[r].push('1');
                    break;
                case -1:
                    modBoard[r].push('0');
                    break;
                case 0:
                    if (cell.isOccupied) {
                        modBoard[r].push('X');
                    } else {
                        modBoard[r].push(' ');
                    }
                    break;
            }
        });
    });
    modBoard.forEach(row => {
        console.log(row);
    });
}

function allBugsPlaced(bugs) {
    return bugs.every(bug => bug.isPlaced);
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

//adds the animation class to an element then removes it when done
function animateCSS(element, animation, prefix = 'animate__') {
    const animationName = `${prefix}${animation}`;
    element.classList.add(`${prefix}animated`, animationName);
    element.addEventListener('animationend', function (e) {
        e.stopPropagation();
        element.classList.remove(`${prefix}animated`, animationName);
    });
}


/* Questions:

I try to keep DOM manip and data manip separate, but what about functions that are small and simple but do both? 







*/