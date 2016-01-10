"use strict";

const EventEmitter = require('events');
const shapes = require('./shapes.js');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const SPEED_LEVEL_0  = 0.8 * 1000;
const SPEED_LEVEL_9  = 0.2 * 1000;
const SPEED_DOWN_KEY = 0.05 * 1000;

const BORDER_SIDE = "<span class='tetromino-border'>║</span>";
const BORDER_BOTTOM = "<span class='tetromino-border'>═</span>";
const BORDER_LEFT = "<span class='tetromino-border'>╚</span>";
const BORDER_RIGHT = "<span class='tetromino-border'>╝</span>";

const EVENT_HIGHSCORE = "highscore";

const convertTypeToClass = (function() {
    const ShapeType = shapes.ShapeType;
    const conversions = {
        [ShapeType.I]: "tetromino-shape-i",
        [ShapeType.O]: "tetromino-shape-o",
        [ShapeType.T]: "tetromino-shape-t",
        [ShapeType.L]: "tetromino-shape-l",
        [ShapeType.J]: "tetromino-shape-j",
        [ShapeType.S]: "tetromino-shape-s",
        [ShapeType.Z]: "tetromino-shape-z",
    };
    return type => conversions[type];
})();

function convertLevelToTimer(level) {
    if (level < 10) {
        const m = (SPEED_LEVEL_9-SPEED_LEVEL_0)/(9-0);
        return  level*m + SPEED_LEVEL_0;
    }
    else {
        return (9*SPEED_LEVEL_9)/(level);
    }
}

const Scene = {
    play: Symbol(),
    gameOver: Symbol(),
    pause: Symbol(),
};

const menuContent = `
    <h1 class="tetromino-title">Tetromino Game</h1>
    <div class="tetromino-highscore-lines">Best Lines: <span id="tetromino-highscore-lines-value">0</span></div>
    <div class="tetromino-level">Level: <span id="tetromino-level-value">0</span></div>
    <div class="tetromino-lines">Lines: <span id="tetromino-lines-value">0</span></div>
    <ul class="tetromino-commands">
        <li><span class="key-command">Left</span> or <span class="key-command">right</span> to move
        <li><span class="key-command">Space</span> or <span class="key-command">up</span> for right rotation
        <li><span class="key-command">Alt</span> for left rotation
        <li><span class="key-command">Down</span> for acceleration
        <li>Game over: <span class="key-command">space</span> to restart game
    </ul>
`;

class Engine extends EventEmitter {

    constructor() {
        super();

        this._highScoreLines = 0;
        this._state = null;
        this._tickTimer = null;
        this._view = null;
        this._scene = Scene.play;
        this._charCanvas = null;

        this._charCanvas = document.createElement('div');
        this._charCanvas.classList.add('tetromino-canvas');

        const gameContainer = document.createElement('div');
        gameContainer.classList.add('tetromino-game');
        gameContainer.appendChild(this._charCanvas);

        const menuContainer = document.createElement('div');
        menuContainer.classList.add('tetromino-menu');
        menuContainer.innerHTML = menuContent;

        this._view = document.createElement('div');
        this._view.classList.add('tetromino-container');
        this._view.appendChild(gameContainer);
        this._view.appendChild(menuContainer);

        this._scenePlay(true);
    }

    _resetGameState() {
        const state = {
            level: 0,
            score: 0,
            lines: 0,
            shape: null,
            shapePos: {x: 0, y: 0},
            nextShape: new shapes.RandomShape(),
            quickFallMode: false,
            board: (function() {
                const board = [];
                for (let i=0; i<BOARD_HEIGHT; ++i) {
                    const line = [];
                    for (let j=0; j<BOARD_WIDTH; ++j) {
                        line.push(0);
                    }
                    board.push(line);
                }
                return board;
            })(),
        };
        this._state = state;
    }

    // TODO Change display method which is currently quick and dirty?
    _drawGameState() {

        const state = this._state;
        const board = this._state.board.map(function(arr) {
            return arr.slice(); // Clone the content
        });
        for(let y=0; y<state.shape.getShape().length; ++y) {
            for(let x=0; x<state.shape.getShape()[y].length; ++x) {
                const xBoard = x+state.shapePos.x;
                const yBoard = y+state.shapePos.y;
                if (state.shape.getShape()[y][x] !== 0) {
                    board[yBoard][xBoard] = state.shape.type;
                }
            }
        }
        let view = "";
        for(const line of board) {
            view += BORDER_SIDE;
            for(const elem of line) {
                if (elem !== 0) {
                    view += `<span class="${convertTypeToClass(elem)}">#</span>`;
                }
                else {
                    view += " ";
                }
            }
            view += `${BORDER_SIDE}\n`;
        }
        view += BORDER_LEFT;
        for(let i=0; i<BOARD_WIDTH; ++i) {
            view += BORDER_BOTTOM;
        }
        view += BORDER_RIGHT;
        this._charCanvas.innerHTML = view;
        this._drawScore();
    }

    _drawScore() {
        const levelElement = document.getElementById("tetromino-level-value");
        if (levelElement == null) return; // DOM not displayed
        levelElement.innerHTML = this._state.level;
        const linesElement = document.getElementById("tetromino-lines-value");
        linesElement.innerHTML = this._state.lines;
        const highScorelinesElement = document.getElementById("tetromino-highscore-lines-value");
        highScorelinesElement.innerHTML = this.highScoreLines;
    }

    _drawPause() {
        const pauseMessage = "Pause";
        const pauseMessageY = Math.floor(BOARD_HEIGHT/2);
        const pauseMessageX = Math.floor((BOARD_WIDTH - pauseMessage.length)/2);
        let view = "";
        for(let h=0; h<BOARD_HEIGHT; ++h) {
            view += BORDER_SIDE;
            if (h !== pauseMessageY) {
                for(let w=0; w<BOARD_WIDTH; ++w) {
                    view += " ";
                }
            }
            else {
                for(let w=0; w<BOARD_WIDTH; ++w) {
                    if (w !== pauseMessageX) {
                        view += " ";
                    }
                    else {
                        view += pauseMessage;
                        w += pauseMessage.length-1;
                    }
                }
            }
            view += `${BORDER_SIDE}\n`;
        }
        view += BORDER_LEFT;
        for(let i=0; i<BOARD_WIDTH; ++i) {
            view += BORDER_BOTTOM;
        }
        view += BORDER_RIGHT;
        this._charCanvas.innerHTML = view;
        this._drawScore();
    }

    _drawGameOver() {
        this._drawGameState();
    }

    _changeSpeedToQuickFall() {
        if (this._tickTimer != null) {
            clearTimeout(this._tickTimer);
        }
        this._state.quickFallMode = true;
        this._gameTick();
    }

    _changeSpeedToLevel() {
        this._state.quickFallMode = false;
    }

    _changeSpeedToStop() {
        if (this._tickTimer != null) {
            clearTimeout(this._tickTimer);
        }
    }

    _newIncomingShape() {
        this._changeSpeedToLevel();
        const state = this._state;
        state.shape = state.nextShape;
        const shapeWidth = state.shape.getShape()[0].length;
        state.shapePos.x = Math.floor((BOARD_WIDTH-shapeWidth)/2);
        state.shapePos.y = 0;
        state.nextShape = new shapes.RandomShape();
    }

    _checkCollision(x, y, shape) {
        x = x === undefined ? this._state.shapePos.x : x;
        y = y === undefined ? this._state.shapePos.y : y;
        shape = shape || this._state.shape.getShape();
        for(let yt=0; yt<shape.length; ++yt) {
            for(let xt=0; xt<shape[yt].length; ++xt) {
                const xBoard = xt+x;
                const yBoard = yt+y;
                if (shape[yt][xt] === 1) {
                    if (xBoard < 0 || xBoard >= BOARD_WIDTH || yBoard >= BOARD_HEIGHT || this._state.board[yBoard][xBoard] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    _copyShapeToBoard() {
        const state = this._state;
        const shape = state.shape.getShape();
        for(let y=0; y<shape.length; ++y) {
            for(let x=0; x<shape[y].length; ++x) {
                const xBoard = x+state.shapePos.x;
                const yBoard = y+state.shapePos.y;
                if (shape[y][x] === 1) {
                    state.board[yBoard][xBoard] = state.shape.type;
                }
            }
        }
    }

    _processLines(yTop, yBottom) {
        const state = this._state;
        const board = state.board;
        yBottom = yBottom < BOARD_HEIGHT ? yBottom : BOARD_HEIGHT-1;
        const destroyLine = (yLine) => {
            for(let y = yLine; y > 0 ; --y) {
                for(let x=0; x<board[y].length; ++x) {
                    board[y][x] = board[y-1][x];
                }
            }
            for(let x=0; x<board[0].length; ++x) {
                board[0][x] = 0;
            }
        };
        const increaseScore = () => {
            state.lines++;
            console.log(`lines: ${state.lines}`);
            if (state.lines % 10 === 0) {
                state.level++;
                console.log(`next level: ${state.level}`);
            }
        };
        const checkNewHighScore = () => {
            if (state.lines > this.highScoreLines) {
                this.highScoreLines = state.lines;
                this.emit(EVENT_HIGHSCORE);
            }
        };
        for(let y = yTop; y <= yBottom; y++) {
            let count = 0;
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] !== 0) {
                    count++;
                }
            }
            if (count !== BOARD_WIDTH) {
                continue;
            }
            else {
                destroyLine(y);
                increaseScore();
                checkNewHighScore();
            }
        }
    }

    _fallBlock() {
        this._state.shapePos.y++;
    }

    _gameTick() {
        const state = this._state;
        if (state.shape === null) {
            this._newIncomingShape();
        }
        else {
            if (this._checkCollision(state.shapePos.x, state.shapePos.y+1)) {
                const yTop = state.shapePos.y;
                const yBottom = state.shape.getShape().length -1 + yTop;
                this._copyShapeToBoard();
                this._processLines(yTop, yBottom);
                this._newIncomingShape();
                if (this._checkCollision()) {
                    return this._sceneGameOver();
                }
            }
            else {
                this._fallBlock();
            }
        }
        this._drawGameState();
        let nextTick;
        if (state.quickFallMode) {
            nextTick = SPEED_DOWN_KEY;
        }
        else {
            nextTick = convertLevelToTimer(state.level);
        }
        this._tickTimer = setTimeout(this._gameTick.bind(this), nextTick);
    }

    // Main scenes of the game
    //////////////////////////

    _scenePlay(resetGame) {
        console.log("Play Scene");
        this._scene = Scene.play;
        if (resetGame) {
            this._resetGameState();
        }
        this._gameTick();
        this._changeSpeedToLevel();
    }

    _sceneGameOver() {
        console.log("Game Over Scene");
        this._scene = Scene.gameOver;
        this._drawGameOver();
    }

    _scenePause() {
        console.log("Pause Scene");
        this._scene = Scene.pause;
        this._changeSpeedToStop();
        this._drawPause();
    }

    // Public exposed commands to control the game
    //////////////////////////////////////////////

    restartGame() {
        this._scenePlay(true);
    }

    destroy() {
        if (this._tickTimer != null) {
            clearTimeout(this._tickTimer);
        }
        this.removeAllListeners(EVENT_HIGHSCORE);
        this._tickTimer = null;
        this._state = null;
        this._view = null;
        this._charCanvas = null;
    }

    moveLeft() {
        if (this._scene !== Scene.play) {
            return;
        }
        const collision = this._checkCollision(this._state.shapePos.x-1);
        if (!collision) {
            this._state.shapePos.x--;
            this._drawGameState();
        }
    }

    moveRight() {
        if (this._scene !== Scene.play) {
            return;
        }
        const collision = this._checkCollision(this._state.shapePos.x+1);
        if (!collision) {
            this._state.shapePos.x++;
            this._drawGameState();
        }
    }

    moveDown() {
    }

    moveDownStart() {
        if (this._scene !== Scene.play) {
            return;
        }
        this._changeSpeedToQuickFall();
    }

    moveDownStop() {
        if (this._scene !== Scene.play) {
            return;
        }
        this._changeSpeedToLevel();
    }

    rotateRight() {
        if (this._scene === Scene.gameOver) {
            return this._scenePlay(true);
        }
        if (this._scene !== Scene.play) {
            return;
        }
        const collision = this._checkCollision(
            this._state.shapePos.x, this._state.shapePos.y,
            this._state.shape.getNextRightRotation()
        );
        if (!collision) {
            this._state.shape.rotateRight();
            this._drawGameState();
        }
    }

    rotateLeft() {
        if (this._scene !== Scene.play) {
            return;
        }
        const collision = this._checkCollision(
            this._state.shapePos.x, this._state.shapePos.y,
            this._state.shape.getNextLeftRotation()
        );
        if (!collision) {
            this._state.shape.rotateLeft();
            this._drawGameState();
        }
    }

    pause() {
        if (this._scene === Scene.play) {
            console.log("Pause");
            this._scenePause();
            return;
        }
        else if (this._scene === Scene.pause) {
            console.log("Resume");
            this._scenePlay(false);
        }
        else {
            return;
        }

    }

    get view() {
        return this._view;
    }

    get highScoreLines() {
        return this._highScoreLines;
    }

    set highScoreLines(value) {
        this._highScoreLines = value || 0;
    }

}


module.exports = { Engine, EVENT_HIGHSCORE };
