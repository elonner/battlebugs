//======================================================== CONSTANTS ======================================================
let MOVE_DELAY = 2500;  // delay for the computer to take its turn and respective animations
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
let playing; // as opposed to placing the bugs
let turn; // 1: user, -1: cpu
let message; // after each turn 
let winner; // null, 1: user, -1: cpu

// CPU algorithm variables 
let prevShots; // --> Computer
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
        this.$board = $('#user-board');
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
        this.$board = $('#cpu-board');
        this.prevShots = [];
        this.leExAdjs = [];
        this.hitCells = [];
    }
}

class Cell {
    constructor(value, pos) {
        this.value = value; // 0: empty (not shot at), 1: hit, -1: miss
        this.row = pos[0];
        this.col = pos[1];
        this.isOccupied = false;
        this.$ = $('<div class="cell"></div>'); // create its DOM element
        this.bug; // bug that is occupying cell 
        this.salvoShot = false; // selected to be shot in a salvo turn 
    }

    // returns the number of empty adjacent cells this Cell has
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

    // appends an image element (of a boot print) to the cell element
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
        this.$ = $(`<img src="Icons/${size}er.png" class="bug ${size}">`); // creates its DOM image element
        this.row; // top row
        this.col; // left column 
        this.hits = 0; // total hits
        this.isSquashed = false;
        this.cellsOn = []; // contains Cells bug is covering
        this.isPlaced = false; // is it placed on the board already
        this.borderColor = '#5f98bf';
    }

    // change the image to a squashed bug, change styling of the cells it's covering 
    squash(cpu = false) {
        this.$.attr('src', `Icons/${this.size}dead.png`);
        this.$.addClass('squashed');
        this.cellsOn.forEach(cell => {
            removeAllChildNodes(cell.$[0]);
            if (cpu) this.borderColor = '#ca7b7b';
            cell.$.css({ backgroundColor: 'initial', border: `0.3vmin solid ${this.borderColor}`, opacity: '50%' });
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

$('#difficulty').on('click', 'h1', changeDifficulty);  // game setup
$('#play-btn').on('click', play);
$('#show-instructions').on('click', showInstructions);

$bugBox.on('click', '.bug', selectBug);                // bug placement
$('#ready-btn').on('click', startGame);
$userBoard.on('click', '.cell', placeBug);

$cpuBoard.on('click', '.cell', userShot);              // game play

$('#play-again').on('click', init);                    // play again

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

// sets game mode from user input, hides the start screen, initializes game
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

// sets playing = true, renders game with that new information
function startGame() {
    playing = true;
    render();
}

// toggles instructions for the game mode that is currently selected
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
    if (!instructionsHidden) {      // if already showing set inner html to nothing 
        $modeInstr.html('');
        instructionsHidden = true;
    } else {
        switch (mode) {             // otherwise show the relevant instructions (better way of doing this? what if much longer paragraph?)
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

// defines state variables, renders game, skips user bug placement if in fast mode
function init() {
    // reset any DOM elements that may have changed in the previous game
    setupDOM();
    // fill bugs array with the 5 new Bugs
    fillBugs(); // --> Player
    // fill the boards with new empty cells
    initBoards(); // --> Player
    // randomize CPU bugs
    placeCpuBugs(); // --> Player

    playing = false; // until user places all bugs and clicks ready
    turn = 1;
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

// removes all bugs and cells from the DOM, resets classes, resets CSS
function setupDOM() {
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

// defines and fills bugs array with the 5 Bugs
function fillBugs() {
    userBugs = [];
    cpuBugs = [];
    bugSizes = [2, 3, 3, 4, 5];
    bugSizes.forEach(size => {
        userBugs.push(new Bug(size));
        cpuBugs.push(new Bug(size));
    });
}

// defines and fills the boards with new empty Cells
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
// finds a random location/orientation for each bug, places it on the user's board, changes relevant data 
function placeCpuBugs() {
    let b = NUM_DIF_BUGS;
    while (b >= 0) {
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        cpuBugs[b].orient = Math.random() > 0.5 ? 1 : -1;
        var l = cpuBugs[b].size;
        switch (cpuBugs[b].orient) { // if the random location is valid, change relevant data
            case 1:
                if (isValidPos(cpuBoard, cpuBugs[b], r, c)) {
                    for (let i = r; i < r + l; i++) {
                        cpuBoard[i][c].isOccupied = true;        // each cell the bug covers is occupied
                        cpuBoard[i][c].bug = cpuBugs[b];         // each cell's bug points to this bug
                        cpuBugs[b].cellsOn.push(cpuBoard[i][c]); // the bug's cellsOn array points to these cells
                    }
                    cpuBugs[b].row = r;                          // sets the cell's coordinates
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

// TODO: change so user can randomize bugs with a button as many times as they want, no messages are displayed
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
// MODEL+VIEW -> on click of a bug in the bug box: if there is a selected bug, deselect it, otherwise select it
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

// MODEL+VIEW -> on spacebar press: change bug orientation
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

// MODEL+VIEW -> on click on the user board: places the topmost/leftmost end of the bug on the cell the user clicked
function placeBug() {
    if (selectedBug && !playing) {  // ensure the user has selected a bug to place, ensure the user board is only able to be clicked in this circumstance
        const r = parseInt($(this)[0].id[1]);
        const c = parseInt($(this)[0].id[3]);
        if (isValidPos(userBoard, selectedBug, r, c)) {     // ensure the selected position is valid
            selectedBug.col = c;                            // update the bugs position
            selectedBug.row = r;
            const l = selectedBug.size;
            // update cell elements, add cells to bug.cellsOn, 
            if (selectedBug.orient === 1) {
                for (let i = r; i < r + l; i++) {
                    userBoard[i][c].isOccupied = true;          // each cell the bug covers is occupied
                    userBoard[i][c].bug = selectedBug;          // each cell's bug points to this bug
                    selectedBug.cellsOn.push(userBoard[i][c]);  // the bug's cellsOn array points to these cells
                }
                selectedBug.$.css({ gridArea: `${r + 1} / ${c + 1} / ${r + 1 + l} / ${c + 1}` }); // updates DOM immediately 
            } else {
                for (let i = c; i < c + l; i++) {
                    userBoard[r][i].isOccupied = true;
                    userBoard[r][i].bug = selectedBug;
                    selectedBug.cellsOn.push(userBoard[r][i]);
                }
                selectedBug.$.css({ gridArea: `${r + 1} / ${c + 1} / ${r + 1} / ${c + 1 + l}` });
            }
            $userBoard.append(selectedBug.$);       // add bug to the board and update relevant data
            selectedBug.$.removeClass('selected');  
            selectedBug.isPlaced = true;
            placedBugs.push(selectedBug);
            selectedBug = null;
        }
    }
    if (allBugsPlaced(userBugs)) {                  // if all the bugs are placed, show the button to start game
        $('#ready-btn').css({ display: 'initial' });
        $bugBox.css({ display: 'none' });
    }
}

// MODEL+VIEW -> on backspace press: take bug back off the board and into the bug box to be placed again, follows same logic as placBug() but backwards
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

// MODEL+VIEW -> on click of cpu board: handles the user's move
function userShot() {
    // ensure the board can only be clicked while the game is being played, it is the user's turn, and the cell's child isn't picking up the click 
    if (playing && turn === 1 && !winner && !$(this).hasClass('no-click')) { 
        const r = parseInt($(this)[0].id[1]);      
        const c = parseInt($(this)[0].id[3]); // get the cell that was clicked
        const cell = cpuBoard[r][c];    
        if (mode === 1) {                         // SALVO
            salvoAddShot(r, c);
            return;
        }
        if (cell.value !== 0) return; // make sure it hasn't been shot at yet, if not, update relevant data
        if (isHit(cpuBoard, cell)) {                             // HIT
            cell.value = 1;
            cell.bug.hits++;
            message = `You hit ${BUG_NAMES[cell.bug.size]}!`;
            if (cell.bug.hits === cell.bug.size) {               // SQUASHED
                cell.bug.isSquashed = true;
                message = `You squashed ${BUG_NAMES[cell.bug.size]}!`;
            }
        } else {                                                 // MISS
            cell.value = -1;
            message = 'You missed!';
        }
        animateCSSista(cell.$[0], 'puff-in-center');    // animate the cell
        winner = getWinner();      
        render()                     
        if (!winner) {                                  // animate boards and switch turns
            if (!fastMode) {
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.remove('shrink'));
                $userBoard.removeClass('shrink');
                setTimeout(() => {
                    $cpuBoard.addClass('shrink');
                }, 150);
            }
            //make sure user can't move when CPU turn 
            turn *= -1;
            setTimeout(cpuShot, MOVE_DELAY);
        }
    }
}

// MODEL+VIEW -> on click of user board: take clicked cell from userShot() but if in SALVO mode, add it to the list of shots (unless it is already there, then remove it) 
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

// MODEL+VIEW -> on enter press: fire all of the shots at once, follows same logic as userShot()
function salvoUserShoot() {
    if (shots.length === (5 - userSquashed.length)) {
        let msg = '';
        shots.forEach(cell => {
            cell.salvoShot = false;
            if (isHit(cpuBoard, cell)) {                    // HIT
                cell.value = 1;
                cell.bug.hits++;
                if (cell.bug.hits === cell.bug.size) {      // SQUASHED
                    cell.bug.isSquashed = true;
                    cpuSquashed.push(cell.bug);
                    msg += `You squashed ${BUG_NAMES[cell.bug.size]}! `; // adds messages together to show at the same time
                } else {
                    msg += `You hit ${BUG_NAMES[cell.bug.size]}! `;
                }
            } else {                                        // MISS
                cell.value = -1;
            }
            animateCSSista(cell.$[0], 'puff-in-center');
        });
        shots = []; // reset shots array for the next turn 
        if (msg === '') message = 'All Misses!';
        else message = msg;
        winner = getWinner();
        render();

        if (!winner) {              // animate board and switch turns
            if (!fastMode) {     
                $('#user-board>.bug').each((i, bugEl) => bugEl.classList.remove('shrink'));
                $userBoard.removeClass('shrink');
                setTimeout(() => {
                    $cpuBoard.addClass('shrink');
                }, 150);
            }
            //make sure user can't move when CPU turn 
            turn *= -1;
            setTimeout(salvoCpuShot, MOVE_DELAY);
        }
    }
}

// takes user keyboard input and calls the correct event handler function if situation permits
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

// renders the view
function render() {
    if (!playing) initialRender();
    renderBoards();
    renderBugs();
    if (winner) renderGameOver();
    renderMsgs();
}

// renders the view only once for the state of bug placement
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

// renders the boards cell by cell
function renderBoards() {  // --> Player
    $gameScreen.css({ display: 'flex' });
    if (playing) {                                  
        $cpuBoard.css({ display: 'grid' });
        $userBoard.removeClass('hover'); // can't hover on a cell you can't click
        $bugBox.css({ display: 'none' });
        cpuBoard.forEach(row => {
            row.forEach(cell => {
                if (cell.salvoShot) cell.$.addClass('salvo-selected'); // SALVO toggle highlight
                else cell.$.removeClass('salvo-selected');
                if (cell.value === 1) {                                // HIT image
                    cell.setImg();
                }
                if (cell.value === -1) {                               // MISS image
                    cell.$.css({ backgroundColor: '#4DCCBD' }); 
                }
            });
        });
        userBoard.forEach(row => {
            row.forEach(cell => {
                if (!!cell.bug && cell.bug.isSquashed) {
                    cell.bug.squash();                                  // SQUASH image
                } else {
                    if (cell.value === 1) {
                        cell.setImg();                                  // HIT image
                        cell.$.css({ backgroundColor: 'rgba(255,255,255,0.5)', border: 'rgba(1,1,1,0)', zIndex: '1' });
                    }
                    if (cell.value === -1) {                            // MISS image
                        cell.$.css({ backgroundColor: '#4DCCBD', zIndex: '1' });
                    }
                }
            });
        });
    }
}

// adds the bugs to user board in the right place
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

// adds the bugs to cpu board in the right place, only called when game is over
function revealBugs() { // --> Player
    cpuBugs.forEach(bug => {
        if (bug.orient === 1) { // vertical
            bug.$.css({ gridColumn: `${bug.col + 1}`, gridRow: `${bug.row + 1} / span ${bug.size}` });
        } else { // horizontal (-1)
            bug.$.addClass('horizontal');
            bug.$.css({ gridColumn: `${bug.col + 1} / span ${bug.size}`, gridRow: `${bug.row + 1}` });
        }
        $cpuBoard.append(bug.$);
        if (bug.isSquashed) {
            bug.squash(cpu = true);
        }
    });
}

// changes the various messages/text content to be displayed
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

// TODO: hide the instructions
// stops the board shrinking and reveals cpu bugs, shows play again button
function renderGameOver() {
    $cpuBoard.removeClass('shrink');
    $userBoard.removeClass('shrink');
    revealBugs();
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

//================================================= CPU TURN ============================================================================
// TODO: figure out how to animate the bug on a squash 
// handles the computers shot based on difficulty, follows same logic as userShot()
function cpuShot() {
    let targetCell; // cell to shoot at
    let okToAnimate = true; // don't wanna animate the cell when the bug image changes
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
    if (!fastMode && !winner) {         // animate boards and change turn
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
        turn *= -1;
    }
}

// handles the computers shot based on difficulty, follows same logic as salvoUserShoot()
function salvoCpuShot() {
    let salvoSelected; // array of valid targets to shoot at returned by the respective seach algorithm
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
    salvoSelected.forEach(cell => {             // update data for each shot 
        if (isHit(userBoard, cell)) {                       // HIT
            cell.value = 1;
            cell.bug.hits++;
            message = 'Ouch!';
            hitCells.unshift(cell);
            if (cell.bug.hits === cell.bug.size) {          // SQUASHED
                cell.bug.isSquashed = true;
                userSquashed.push(cell.bug);
                message = "That one's gonna hurt..."
            }
        } else {                                            // MISS
            cell.value = -1;
        }
        animateCSSista(cell.$[0], 'puff-in-center');
    });
    if (message !== 'Ouch!' && message !== "That one's gonna hurt...") message = 'Phew! That was close!';
    winner = getWinner();
    render();
    if (!winner) {                  // animate boards and change turn
        if (!fastMode) {                    
            setTimeout(() => {
                $cpuBoard.removeClass('shrink');
                setTimeout(() => {
                    $userBoard.addClass('shrink');
                    $('#user-board>.bug').each((i, bugEl) => bugEl.classList.add('shrink'));
                }, 150);
            }, 0.5 * MOVE_DELAY);
        }
        turn *= -1;
    }
}

// returns a valid cell to shoot at, decides hunt or target
function easySelect() {
    let targetCell;
    if (targetCells() === 0) {          // hunt: returns random cell
        targetCell = randomSelect();
    } else {                            // target: returns adjacent cell to the targetted hit cell
        targetCell = adjacentSelect();  
    }

    prevShots.unshift(targetCell);      // remember shot
    return targetCell;
}

// returns an array of the correct length of valid cells to shoot at, decides hunt or target
function salvoEasySelect() {
    let targetCell;
    let salvoSelected = [];
    if (targetCells() === 0) {       // hunt: adds random cell if not already added
        while (salvoSelected.length < (5 - cpuSquashed.length)) {
            targetCell = randomSelect();
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
                prevShots.unshift(targetCell);
            }
        }
    } else {                         // target: adds all possible adjacents to any hit cells, if none available adds randoms
        salvoSelected = salvoSimpleSelect();
        salvoSelected.forEach(cell => prevShots.unshift(cell)); // remember shot
    }
    return salvoSelected;
}

// returns a valid cell to shoot at, decides hunt or target
function mediumSelect() {
    let targetCell;
    if (targetCells() === 0) {        // hunt: returns random cell in 50% pattern 
        targetCell = huntSelect();
    } else {                          // target: accounts for knowledge that cells colinear with multiple hit cells must be given priority
        targetCell = targetSelect();
    }

    prevShots.unshift(targetCell);    // remember shot
    return targetCell;
}

// TODO... 
function hardSelect() {

}

//================================================ CPU ALGORITHMS ================================================================
// returns a valid cell to shoot at, decides if there are multiple targeted cells and if they are colinear or not
function targetSelect() {
    // return an empty cell adjacent to the hit cell with the least adjacents explored if only one target cell 
    if (targetCells() === 1) return selectAdjTarget(hitCells[0]);  // SORTS hitCells

    var r = hitCells[0].row;
    var c = hitCells[0].col;
    var dr = r - hitCells[1].row;
    var dc = c - hitCells[1].col;
    if (dr === 0) {                           // colinear
        return lineSelect(r, c, true);
    } else if (dc === 0) {                    // colinear
        return lineSelect(r, c, false);
    } else {                                  // not colinear
        return selectAdjTarget(hitCells[0]);                       // SORTS hitCells
    }
}

// TODO: use isInbounds() more
// returns a valid cell to shoot at, takes the position of a hit cell and a boolean indicating the axis of the line to follow
function lineSelect(r, c, horiz) {
    let line = [userBoard[r][c]];   // to be used in the case of bugs intersecting
    let rIdx = 0;
    let cIdx = 0;
    let endOfDir = false;           // if reach the edge of the bug via miss or boundary of the board
    let endOfLine = false;          // if we reach the end of the bug on both ends
    if (horiz) cIdx++;              // start off the search 
    else rIdx++;
    while (!endOfLine) {            // returns an empty cell on the line of the two previous hits, if it exists
        if (isInbounds(r + rIdx, c + cIdx) && userBoard[r + rIdx][c + cIdx].value === 0) {        // if an empty cell, return it
            return userBoard[r + rIdx][c + cIdx];
        } else if (isInbounds(r + rIdx, c + cIdx) && userBoard[r + rIdx][c + cIdx].value === 1) { // if a hit cell, skip over it but add it to array
            line.push(userBoard[r + rIdx][c + cIdx]);
            if (endOfDir) {
                if (horiz) cIdx--;
                else rIdx--;
            } else {
                if (horiz) cIdx++;
                else rIdx++;
            }
            continue;
        } else if (!endOfDir) {          // if reach boundary or miss, set the position back to where we started and...
            endOfDir = true;
            if (horiz) cIdx = 0;
            else rIdx = 0;
        } else {                        // othersie we must have reached the end of the bug in both directions 
            endOfLine = true;
        }
        if (endOfDir) {                 // ...head in the other direction
            if (horiz) cIdx--;
            else rIdx--;
        } else {                        // keep going in initial direction 
            if (horiz) cIdx++;
            else rIdx++;
        }
    }
    // go back through line and check perpendicular axis 
    return crossAxSelect(line);
}

// TODO: i don't think this works... that return will not return out of the function...
// goes back through the line we thought was the bug and checks the perpendicular axis
function crossAxSelect(line) {
    line.forEach(cell => {      
        if (adjsHasVal(cell, 0)) { 
            foundIdx = hitCells.findIndex(hitCell => hitCell.row === cell.row && hitCell.col === cell.col);
            hitCells.splice(foundIdx, 1);
            hitCells.unshift(cell);
            return selectAdjTarget(cell);
        }
    });
    return findLoneHit();
}

// returns a valid cell to shoot at, chooses an adjacent from the hit cell with the least adjacents that have been shot at (explored)
function findLoneHit() {
    hitCells.sort((a, b) => b.emptyAdjs() - a.emptyAdjs());     // SORT hitCells
    return selectAdjTarget(hitCells[0]);
}

// returns a valid cell to shoot at, uses 2-unit (50%) shot pattern
function huntSelect(best = true) {
    let cell;
    let i = 0;
    while (i < 500) {   // give it plenty of time to get a valid random guess before determining there isn't one
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        if ((r + c) % 2 === 0) {                // shot pattern
            cell = userBoard[r][c];
            // try to make sure we dont shoot adjacent to a miss if possible
            if (best && cell.value === 0 && !adjsHasVal(cell, -1)) return cell;
            else if (!best && cell.value === 0) return cell;
        }
        i++;
    }
    if (best) {                         // if we have to shoot adjacent to a miss
        return huntSelect(false);
    }                  
    return randomSelect();              // failsafe, i don't think this code is ever called
}

// returns a valid cell to shoot at
function adjacentSelect() {
    if (!adjsHasVal(hitCells[0], 0)) {       // for the case we reach end of the bug, there must be another targeted cell somewhere
        let otherHit = hitCells.find(hitCell => {
            if (adjsHasVal(hitCell, 0)) {
                return true;
            }
        });
        return selectAdjTarget(otherHit);   // find this other targeted cell and return on of its adjacents 
    }
    return selectAdjTarget(hitCells[0]);    // return an adjacent of the most recent hit cell
}

// returns a valid cell to shoot at adjacent to the cell it takes as argument
function selectAdjTarget(cell) {
    let targetCell = null;
    const randMoves = [...ADJ_MOVES].sort((a, b) => Math.random() - 0.5); // does this even work? 
    randMoves.forEach(dir => {
        const r = cell.row + dir.dr;
        const c = cell.col + dir.dc;
        // if it is in the board and it hasn't been shot at yet, return that cell 
        if (r < 10 && r >= 0 && c < 10 && c >= 0 && userBoard[r][c].value === 0) {
            targetCell = userBoard[r][c];
        }
    });
    if (targetCell) return targetCell;
    return findLoneHit();   // basically just a recursive call that sorts the hit cells array according to most available adjacents to shoot at
}

// TODO: change someUnselected() to use emptyAdjs() method
// returns an array of valid cells to shoot at
function salvoSimpleSelect() {
    const salvoSelected = [];
    let i = 0;
    let targetCell;
    while (salvoSelected.length < (5 - cpuSquashed.length)) {
        if (i >= hitCells.length) {                     // if we have selected all the unexplored adjectents to all of the hit cells, add a random 
            targetCell = randomSelect();
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
            }
        } else if (someUnselected(hitCells[i])) {       // if the hit cell has at least one adjacent that hasn't been shot at (explored)
            targetCell = selectAdjTarget(hitCells[i]);  // add it to the array if it isn't there already and update relevant data
            if (!salvoSelected.includes(targetCell)) {
                salvoSelected.push(targetCell);
                targetCell.salvoShot = true;
            }
        } else {                                        // otherwise go to the next hit cell
            i++;
        }
    }
    return salvoSelected;
}

// returns a random cell that hasn't been shot at yet
function randomSelect() {
    let cell;
    while (true) {
        // select random cell
        var r = Math.floor(Math.random() * 10);
        var c = Math.floor(Math.random() * 10);
        cell = userBoard[r][c];
        if (cell.value === 0) return cell 
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

// returns the number of targeted cells, or hit cells that are not a part of a squashed bug
function targetCells() {
    const sqBugCells = userSquashed.reduce((acc, bug) => acc + bug.size, 0);
    return hitCells.length - sqBugCells;
}

// updates DOM
function addCelltoBoard($board, cell) {
    cell.$.attr('id', `r${cell.row}c${cell.col}`);
    cell.$.css({ gridColumn: `${cell.col + 1} / ${cell.col + 2}`, gridRow: `${cell.row + 1} / ${cell.row + 2}` });
    $board.append(cell.$);
}

// returns 1 for user win, -1 for cpu win, checks if every bug is squashed
function getWinner() {
    if (cpuBugs.every(bug => bug.isSquashed)) {
        return 1;
    } else if (userBugs.every(bug => bug.isSquashed)) {
        return -1;
    }
    return null;
}

// returns true if this is a legal bug placement 
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

// returns true if the cell is coverd by a bug
function isHit(board, cell) {
    return board[cell.row][cell.col].isOccupied;
}

// sets multiple attributes at once
function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

// prints the state of the board to the console for testing purposes
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

// returns true if all of the bugs are placed 
function allBugsPlaced(bugs) {
    return bugs.every(bug => bug.isPlaced);
}

// removed all children of the parent from the DOM
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

// TODO: returns true if the coordinates are on the baord
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

//adds the animation class to an element then removes it when done
function animateCSSista(element, animation) {
    element.classList.add(animation);
    element.addEventListener('animationend', function (e) {
        e.stopPropagation();
        element.classList.remove(animation);
    });
}


/* Questions:

I try to keep DOM manip and data manip separate, but what about functions that are small and simple but do both? 

Add and remove event listeners, or check for conditions in the event handler? 

What can take this to the next level as far as me looking employable and professional? 





*/