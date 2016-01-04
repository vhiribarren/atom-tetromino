"use strict";

const shapes = require('./shapes.js');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const SPEED_LEVEL_0  = 0.8 * 1000;
const SPEED_LEVEL_9  = 0.2 * 1000;
const SPEED_DOWN_KEY = 0.05 * 1000;

const convertTypeToColor = (function() {
    const ShapeType = shapes.ShapeType;
    const conversions = {
        [ShapeType.I]: "#FF0000",
        [ShapeType.D]: "#00FF00",
        [ShapeType.T]: "#0000FF",
        [ShapeType.L]: "#FF00FF",
        [ShapeType.J]: "#00FFFF",
        [ShapeType.S]: "#FFFF00",
        [ShapeType.Z]: "#FFFFFF",
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
};

class Engine {

    constructor() {
        this._state = null;
        this._tickTimer = null;
        this._view = null;
        this._charCanvas = null;
        this._scene = Scene.play;

        const gameContainer = document.createElement('div');
        const menuContainer = document.createElement('div');
        this._view = document.createElement('div');
        this._view.appendChild(gameContainer);

        this._charCanvas = document.createElement('pre');
        gameContainer.appendChild(this._charCanvas);

        this._scenePlay();
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

    _drawGameState() {
        const state = this._state;
        const board = this._state.board.map(function(arr) {
            return arr.slice();
        });
        for(let y=0; y<state.shape.getShape().length; ++y) {
            for(let x=0; x<state.shape.getShape()[y].length; ++x) {
                const xBoard = x+state.shapePos.x;
                const yBoard = y+state.shapePos.y;
                if (state.shape.getShape()[y][x] === 1) {
                    board[yBoard][xBoard] = 1;
                }
            }
        }
        let view = "";
        for(const line of board) {
            view += "=";
            for(const elem of line) {
                if (elem !== 0) {
                    view += " #";
                }
                else {
                    view += "  ";
                }
            }
            view += " =\n";
        }
        view += "=";
        for(let i=0; i<BOARD_WIDTH+1; ++i) {
            view += " =";
        }
        this._charCanvas.textContent = view;
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
                    state.board[yBoard][xBoard] = 1;
                }
            }
        }
    }

    _processLines(yTop, yBottom) {
        const state = this._state;
        const board = state.board;
        yBottom = yBottom < BOARD_HEIGHT ? yBottom : BOARD_HEIGHT-1;
        function destroyLine(yLine) {
            for(let y = yLine; y > 0 ; --y) {
                for(let x=0; x<board[y].length; ++x) {
                    board[y][x] = board[y-1][x];
                }
            }
            for(let x=0; x<board[0].length; ++x) {
                board[0][x] = 0;
            }
        }
        function increaseScore() {
            state.lines++;
            console.log(`lines: ${state.lines}`);
            if (state.lines % 10 === 0) {
                state.level++;
                console.log(`next level: ${state.level}`);
            }
        }
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

    _scenePlay() {
        console.log("Play Scene");
        this._scene = Scene.play;
        this._resetGameState();
        this._gameTick();
    }

    _sceneGameOver() {
        console.log("Game Over Scene");
        this._scene = Scene.gameOver;
        this._drawGameOver();
    }

    restartGame() {
        this._scenePlay();
    }

    destroy() {
        if (this._tickTimer != null) {
            clearTimeout(this._tickTimer);
        }
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
            return this._scenePlay();
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
        if (this._scene !== Scene.play) {
            return;
        }
        console.log("Pause");
    }

    get view() {
        return this._view;
    }

}


module.exports = { Engine };
