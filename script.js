//======================================================== CONSTANTS ======================================================
let MOVE_DELAY = 2000;  // make a fast mode
const BUG_NAMES = ['', '', 'a fly', 'an ant', 'a cockroach', 'a millipede']
const NUM_DIF_BUGS = 4;
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const MODES = ['normal', 'salvo', 'third'];
const ADJ_MOVES = [{ dr: 1, dc: 0 }, { dr: 0, dc: 1 }, { dr: -1, dc: 0 }, { dr: 0, dc: -1 }];

//=================================================== STATE VARIABLES ===========================================================
let mode = 0;
let difficulty = 0;
let instructionsHidden = true;
let fastMode = false;

// TODO: turn cpu and user into Player classes
let cpuBoard; // --> Player
let userBoard; // --> Player
let cpuBugs; // --> Player
let userBugs; // --> Player
let selectedBug; // --> Player
let placedBugs; // --> Player
let playing;
let message;
let winner; // null, 1: user, -1: cpu

// CPU algorithm variables 
let prevShots;
let userSquashed; // --> Player
let cpuSquashed; // --> Player
let leExAdjs; // --> Computer
let hitCells; // --> Computer

// Salvo mode
let shots; // --> Player

//======================================================= CLASSES =================================================================
class Player {
    constructor() {
        this.board = [];                // fine for now, but try changing the init functions to work with this approach
        for (let r = 0; r < 10; r++) {
            this.board.push([]);
            for (let c = 0; c < 10; c++) {
                this.board[r].push(new Cell(0, [r, c]));
            }
        }
        this.bugs = [];                 // fine for now, but try changing the init functions to work with this approach
        bugSizes = [2, 3, 3, 4, 5];
        bugSizes.forEach(size => {
            userBugs.push(new Bug(size));
            cpuBugs.push(new Bug(size));
        });
        this.selectedBug = false;
        this.placedBugs = [];
        this.squashed = [];

        // SALVO
        this.shots = [];
    }

    placeBugs() {
        let b = NUM_DIF_BUGS;
        while (b >= 0) {
            var r = Math.floor(Math.random() * 10);
            var c = Math.floor(Math.random() * 10);
            this.bugs[b].orient = Math.random() > 0.5 ? 1 : -1;
            var l = this.bugs[b].size;
            switch (this.bugs[b].orient) {
                case 1:

                    if (isValidPos(this.board, this.bugs[b], r, c)) {
                        for (let i = r; i < r + l; i++) {
                            this.board[i][c].isOccupied = true;
                            this.board[i][c].bug = this.bugs[b];
                            this.bugs[b].cellsOn.push(this.board[i][c]);
                        }
                        this.bugs[b].row = r;
                        this.bugs[b].col = c;
                        b--;
                    }
                    break;
                case -1:
                    if (isValidPos(this.board, this.bugs[b], r, c)) {
                        for (let i = c; i < c + l; i++) {
                            this.board[r][i].isOccupied = true;
                            this.board[r][i].bug = this.bugs[b];
                            this.bugs[b].cellsOn.push(this.board[r][i]);
                        }
                        this.bugs[b].$.removeClass('vertical').addClass('horizontal');
                        this.bugs[b].row = r;
                        this.bugs[b].col = c;
                        b--;
                    }
                    break;
            }
        }
    }
}

class Computer extends Player {
    constructor() {
        super();
        this.prevShots = [];
        this.leExAdjs = [];
        this.hitCells = [];
    }
}

class Cell {
    constructor(value, pos) {
        this.value = value; // 0: not shot at, 1: hit, -1: miss
        this.row = pos[0];
        this.col = pos[1];
        this.color = 'white';
        this.isOccupied = false;
        this.$ = $('<div class="cell"></div>');
        this.bug; // bug that is covering cell 
        this.salvoShot = false; // selected to be shot in a salvo turn 
    }

    emptyAdjs() {
        const adjVals = [];
        ADJ_MOVES.forEach(dir => {
            var r = this.row + dir.dr;
            var c = this.col + dir.dc
            if (r > 9 || r < 0 || c > 9 || c < 0) return;
            adjVals.push(userBoard[r][c].value);
        });
        const emptyAdjs = adjVals.reduce((acc, val) => {
            if (val === 0) return acc + 1;
            else return acc;
        }, 0);
        return emptyAdjs;
    }

    setImg() {
        if (this.$.children().length === 0) {
            const newImg = $('<img src="Icons/boot.png" class="cell no-click">')
            this.$.append(newImg);
        }
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

    squash() {
        this.$.attr('src', `Icons/${this.size}dead.png`);
        this.$.addClass('squashed');
        this.cellsOn.forEach(cell => {
            removeAllChildNodes(cell.$[0]);
            cell.$.css({ backgroundColor: 'initial', border: '0.3vmin solid #5f98bf', opacity: '50%'});
        });
    }
}

//====================================================== CACHE/SETUP =========================================================
const $startScreen = $('#start-screen');
const $radioButtons = $('.radio-btn');
const $gameScreen = $('#game-screen');
const $userBoard = $('#user-board');
const $cpuBoard = $('#cpu-board');
const $bugBox = $('#bug-box');

// event listeners needed for game setup
$('#difficulty').on('click', 'h1', changeDifficulty);
$('#play-btn').on('click', play);
$('#show-instructions').on('click', showInstructions);

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
    switch (Number(mode)) {
        case 0:
            if (difficulty === 2) {
                alert('Oops! Sorry, this difficulty is not available yet...');
                return;
            }
            break;
        case 1:
            if (difficulty !== 0) {
                alert('Oops! Sorry, Salvo is not available at this difficulty yet...');
                return;
            }
            break;
        case 2:
            alert('Oops! Sorry, this game mode is not available yet...');
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
    if (mode === 2) {
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
                $modeInstr.html(`Same rules as normal mode with the following differences:<br>Players stomp 5 times per turn.<br>Whenever one of your bugs has been squashed, you lose one shot on your following turns.`)
                instructionsHidden = false;
                break;
            case 2:
                break;
        }
    }
}

//====================================================== INITIALIZATION ===================================================
function init() {
    // reset any DOM elements that may have changed in a previous game
    setupDOM();
    // fill bugs array with the 5 new Bugs
    fillBugs(); // --> Player
    // fill the boards with new empty cells
    initBoards(); // --> Player
    // randomize CPU bugs
    placeCpuBugs(); // --> Player

    playing = false;
    selectedBug = null; // --> Player
    placedBugs = []; // --> Player
    message = 'Good luck!'
    winner = null;

    // cpu algorithm
    prevShots = []; // --> Computer
    leExAdjs = []; // --> Computer
    hitCells = []; // --> Computer
    userSquashed = []; // --> Player
    cpuSquashed = []; // --> Player

    // salvo mode
    shots = []; // --> Player

    render();

    if (fastMode) {
        placeUserBugs();
        playing = true;
        MOVE_DELAY = 0;
        render();
    }
}

// sets up all initial event listeners and resets any DOM elements that may have changed in a previous game
function setupDOM() {
    $bugBox.on('click', '.bug', selectBug);                // place bugs
    $userBoard.on('click', '.cell', placeBug);
    $('#ready-btn').on('click', startGame);

    $cpuBoard.on('click', '.cell', userShot);              // game play

    $('#play-again').on('click', init);                  // play again

    $(document).on('keyup', delegateEvent);                // general

    // reset DOM
    removeAllChildNodes($cpuBoard[0]);
    removeAllChildNodes($userBoard[0]);
    removeAllChildNodes($bugBox[0]);

    $cpuBoard.addClass('hover').removeClass('shrink');
    $userBoard.addClass('hover').removeClass('shrink');
    $cpuBoard.css({ display: 'none' });
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
    let b = NUM_DIF_BUGS;
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
    let b = NUM_DIF_BUGS;
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
    if (playing && !$(this).hasClass('no-click')) {
        const r = parseInt($(this)[0].id[1]);
        const c = parseInt($(this)[0].id[3]);
        const cell = cpuBoard[r][c];
        if (mode === 1) {                           // SALVO
            salvoAddShot(r, c);
            return;
        }
        if (cell.value !== 0) return;
        if (isHit(cpuBoard, cell)) {                  // HIT
            cell.value = 1;
            cell.bug.hits++;
            message = `You hit ${BUG_NAMES[cell.bug.size]}!`;
            if (cell.bug.hits === cell.bug.size) {   // SQUASHED
                cell.bug.isSquashed = true;
                message = `You squashed ${BUG_NAMES[cell.bug.size]}!`;
            }
        } else {                                     // MISS
            cell.value = -1;
            message = 'You missed!';
        }
        animateCSSista(cell.$[0], 'puff-in-center');
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

function salvoAddShot(r, c) {
    const cell = cpuBoard[r][c];
    if (playing && !cell.$.hasClass('no-click')) {
        if (cell.value !== 0) return;
        if (cell.salvoShot) {
            cell.salvoShot = false;
            let removeIdx = shots.indexOf(cell);
            shots.splice(removeIdx, 1);
        } else if (shots.length < (5 - userSquashed.length)) {
            cell.salvoShot = true;
            shots.push(cell);
        }
    }
    render();
}

function salvoUserShoot() {
    if (shots.length === (5 - userSquashed.length)) {
        let msg = '';
        shots.forEach(cell => {
            cell.salvoShot = false;
            if (isHit(cpuBoard, cell)) {                  // HIT
                cell.value = 1;
                cell.bug.hits++;
                if (cell.bug.hits === cell.bug.size) {   // SQUASHED
                    cell.bug.isSquashed = true;
                    cpuSquashed.push(cell.bug);
                    msg += `You squashed ${BUG_NAMES[cell.bug.size]}! `;
                } else {
                    msg += `You hit ${BUG_NAMES[cell.bug.size]}! `;
                }
            } else {                                     // MISS
                cell.value = -1;
            }
            animateCSSista(cell.$[0], 'puff-in-center');
        });
        shots = [];
        if (msg === '') message = 'All Misses!';
        else message = msg;
        winner = getWinner();
        render();

        if (!winner) {
            if (!fastMode) {        // SHRINK and unshrink
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.remove('shrink'));
                $userBoard.removeClass('shrink');
                setTimeout(() => {
                    $cpuBoard.addClass('shrink');
                }, 150);
            }
            //make sure user can't move when CPU turn 
            $('#cpu-board').off('click');
            setTimeout(salvoCpuShot, MOVE_DELAY);
        }
    }
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
            if (playing && mode === 1) {
                salvoUserShoot();
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

function renderBoards() {  // --> Player
    $gameScreen.css({ display: 'flex' });
    if (playing) {                                  // HOVER
        $cpuBoard.css({ display: 'grid' });
        $userBoard.removeClass('hover');
        $bugBox.css({ display: 'none' });
        cpuBoard.forEach(row => {
            row.forEach(cell => {
                if (cell.salvoShot) cell.$.addClass('salvo-selected'); // SALVO
                else cell.$.removeClass('salvo-selected');
                if (cell.value === 1) {
                    cell.setImg();
                }
                if (cell.value === -1) {
                    cell.$.css({ backgroundColor: '#4DCCBD' });
                }
            });
        });
        userBoard.forEach(row => {
            row.forEach(cell => {
                // console.log(cell.bug, cell.bug === true, !!cell.bug);
                if (!!cell.bug && cell.bug.isSquashed) {
                    cell.bug.squash();
                } else {
                    if (cell.value === 1) {
                        cell.setImg();
                        cell.$.css({ backgroundColor: 'rgba(255,255,255,0.5)', border: 'rgba(1,1,1,0)', zIndex: '1' });
                    }
                    if (cell.value === -1) {
                        cell.$.css({ backgroundColor: '#4DCCBD', zIndex: '1' });
                    }
                }
            });
        });
    }
}

// hor/vert classes are added/removed in rotateBug
function renderBugs() { // --> Player
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
        if (mode === 1) $('#instructions').html("<span class='action'>Click</span> on <span class='action'>5</span> cells in your opponent's board where you would like to stop. Press <span class='action'>enter</span> to stomp!!")
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


// TODO: remove class shrink on game end and call showbugs to show the cpus bugs
function showBugs() {

}

//============================================== CPU TURN =========================================
function cpuShot() {
    let targetCell;
    let okToAnimate = true;
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
        targetCell.value = 1;
        targetCell.bug.hits++;
        message = 'Ouch!';
        hitCells.unshift(targetCell);
        if (targetCell.bug.hits === targetCell.bug.size) {   // SQUASHED
            okToAnimate = false;
            targetCell.bug.isSquashed = true;
            userSquashed.push(targetCell.bug);
            message = "That one's gonna hurt..."
        }
    } else {                                                 // MISS
        targetCell.value = -1;
        message = 'That was a close one!'
    }
    winner = getWinner();
    if (!fastMode && !winner) {         // SHRINK and unshrink boards
        setTimeout(() => {
            $cpuBoard.removeClass('shrink');
            setTimeout(() => {
                $userBoard.addClass('shrink');
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.add('shrink'));
            }, 150);
        }, 0.5 * MOVE_DELAY);
    }
    if (okToAnimate) animateCSSista(targetCell.$[0], 'puff-in-center');
    render();
    if (!winner) {
        $('#cpu-board').on('click', '.cell', userShot);
    }
}

function salvoCpuShot() {
    let salvoSelected;
    switch (difficulty) {
        case 0:
            salvoSelected = salvoEasySelect();
            break;
        case 1:
            salvoSelected = salvoMediumSelect();
            break;
        case 2:
            salvoSelected = salvoHardSelect();
            break;
    }

    salvoSelected.forEach(cell => {
        if (isHit(userBoard, cell)) {                      // HIT
            cell.value = 1;
            cell.bug.hits++;
            message = 'Ouch!';
            hitCells.unshift(cell);
            if (cell.bug.hits === cell.bug.size) {   // SQUASHED
                cell.bug.isSquashed = true;
                userSquashed.push(cell.bug);
                message = "That one's gonna hurt..."
            }
        } else {                                                 // MISS
            cell.value = -1;
        }
        animateCSSista(cell.$[0], 'puff-in-center');
    });
    if (message !== 'Ouch!' && message !== "That one's gonna hurt...") message = 'Phew! That was close!';
    winner = getWinner();
    render();

    if (!winner) {
        if (!fastMode) {                    // SHRINK and unshrink boards
            setTimeout(() => {
                $cpuBoard.removeClass('shrink');
                setTimeout(() => {
                    $userBoard.addClass('shrink');
                    $('#user-board>.bug').each((i, bugEl) => bugEl.classList.add('shrink'));
                }, 150);
            }, 0.5 * MOVE_DELAY);
        }
        $('#cpu-board').on('click', '.cell', userShot);
    }
}

function easySelect() {
    let targetCell;
    if (targetCells() === 0) {
        targetCell = randomSelect();
    } else {
        targetCell = adjacentSelect();
    }

    prevShots.unshift(targetCell);
    return targetCell;
}

function salvoEasySelect() {
    let targetCell;
    let salvoSelected = [];
    if (targetCells() === 0) {
        while (salvoSelected.length < (5 - cpuSquashed.length)) {
            targetCell = randomSelect();
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
                prevShots.unshift(targetCell);
            }
        }
    } else {
        salvoSelected = salvoSimpleSelect();
        salvoSelected.forEach(cell => prevShots.unshift(cell));
    }
    return salvoSelected;
}

function mediumSelect() {
    let targetCell;
    if (targetCells() === 0) {
        targetCell = huntSelect();
    } else {
        targetCell = targetSelect();
    }

    prevShots.unshift(targetCell);
    return targetCell;
}

function hardSelect() {

}

//================================================ CPU ALGORITHMS ================================================================
function targetSelect() {
    // return an empty cell adjacent to the hit cell with the least adjacents explored
    if (targetCells() === 1) return selectAdjTarget(hitCells[0]);  // SORT hitCells

    var r = hitCells[0].row;
    var c = hitCells[0].col;
    var dr = r - hitCells[1].row;
    var dc = c - hitCells[1].col;
    if (dr === 0) {
        return lineSelect(r, c, true);
    } else if (dc === 0) {
        return lineSelect(r, c, false);
    } else {
        return selectAdjTarget(hitCells[0]);                       // SORT hitCells
    }
}

function lineSelect(r, c, horiz) {
    let line = [userBoard[r][c]];
    let rIdx = 0;
    let cIdx = 0;
    let endOfDir = false;
    let endOfLine = false;
    if (horiz) cIdx++;
    else rIdx++;
    // returns an empty cell on the line of the two previous hits, if it exists
    while (!endOfLine) {
        if (isInbounds(r + rIdx, c + cIdx) && userBoard[r + rIdx][c + cIdx].value === 0) {        // if an empty cell
            return userBoard[r + rIdx][c + cIdx];
        } else if (isInbounds(r + rIdx, c + cIdx) && userBoard[r + rIdx][c + cIdx].value === 1) { // if a hit cell
            line.push(userBoard[r + rIdx][c + cIdx]);
            if (endOfDir) {
                if (horiz) cIdx--;
                else rIdx--;
            } else {
                if (horiz) cIdx++;
                else rIdx++;
            }
            continue;
        } else if (!endOfDir) {                                     // if reach boundary or miss
            endOfDir = true;
            if (horiz) cIdx = 0;
            else rIdx = 0;
        } else {
            endOfLine = true;
        }
        if (endOfDir) {
            if (horiz) cIdx--;
            else rIdx--;
        } else {
            if (horiz) cIdx++;
            else rIdx++;
        }
    }
    // go back through line and check cross axis 
    return crossAxSelect(line);
}

function crossAxSelect(line) {
    line.forEach(cell => {
        if (adjsHasVal(cell, 0)) { // find this cell in hit cells and move it to the front
            foundIdx = hitCells.findIndex(hitCell => hitCell.row === cell.row && hitCell.col === cell.col);
            hitCells.splice(foundIdx, 1);
            hitCells.unshift(cell);
            return selectAdjTarget(cell);
        }
    });
    return findLoneHit();
}

function findLoneHit() {
    hitCells.sort((a, b) => b.emptyAdjs() - a.emptyAdjs());     // SORT hitCells
    return selectAdjTarget(hitCells[0]);
}

function huntSelect(best = true) {
    let cell;
    let i = 0;
    while (i < 500) {
        // select random cell
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        if ((r + c) % 2 === 0) {
            cell = userBoard[r][c];
            // try to make sure we dont shoot adjacent to a miss, if it hasn't been shot at yet
            if (best && cell.value === 0 && !adjsHasVal(cell, -1)) return cell;
            else if (!best && cell.value === 0) return cell;
        }
        i++;
    }
    if (best) {
        return huntSelect(false);
    }
    return randomSelect();
}

// very dumb algorithm, easily tricked
function adjacentSelect() {
    if (!adjsHasVal(hitCells[0], 0)) {       // for the case we reach end of the bug
        let otherHit = hitCells.find(hitCell => {
            if (adjsHasVal(hitCell, 0)) {
                return true;
            }
        });
        return selectAdjTarget(otherHit);
    }
    return selectAdjTarget(hitCells[0]);
}

function selectAdjTarget(cell) {
    let targetCell = null;
    const randMoves = [...ADJ_MOVES].sort((a, b) => Math.random() - 0.5);
    randMoves.forEach(dir => {
        const r = cell.row + dir.dr;
        const c = cell.col + dir.dc;
        // if it is in the board and it hasn't been shot at yet
        if (r < 10 && r >= 0 && c < 10 && c >= 0 && userBoard[r][c].value === 0) {
            targetCell = userBoard[r][c];
        }
    });
    if (targetCell) return targetCell;
    return findLoneHit();
}

function salvoSimpleSelect() {
    const salvoSelected = [];
    let i = 0;
    let targetCell;
    while (salvoSelected.length < (5 - cpuSquashed.length)) {
        if (i >= hitCells.length) {
            targetCell = randomSelect();
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
                prevShots.unshift(targetCell);
            }
        } else if (someUnselected(hitCells[i])) {
            targetCell = selectAdjTarget(hitCells[i]);
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
                prevShots.unshift(targetCell);
            }
        } else {
            i++;
        }
    }
    return salvoSelected;
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

//============================================= HELPERS ==========================================

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

// returns true if at least one adjacent sell is available to be selected
function someUnselected(cell) {
    return ADJ_MOVES.some(dir => {
        const r = cell.row + dir.dr;
        const c = cell.col + dir.dc;
        if (r < 10 && c < 10 && c >= 0 && r >= 0) {
            if (!userBoard[r][c].salvoShot && userBoard[r][c].value === 0) {
                return true;
            }
        }
    });
}

function targetCells() {
    const sqBugCells = userSquashed.reduce((acc, bug) => acc + bug.size, 0);
    return hitCells.length - sqBugCells;
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

function isInbounds(r, c) {
    return (r < 10 && c < 10 && r >= 0 && c >= 0);
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

function animateCSSista(element, animation) {
    element.classList.add(animation);
    element.addEventListener('animationend', function (e) {
        e.stopPropagation();
        element.classList.remove(animation);
    });
}


/* Questions:

I try to keep DOM manip and data manip separate, but what about functions that are small and simple but do both? 

What can take this to the next level as far as me looking employable and professional? 





*/