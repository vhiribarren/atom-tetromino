"use strict";

const shapes = require('./shapes.js');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

const SPEED_LEVEL_0  = 0.8 * 1000;
const SPEED_LEVEL_9  = 0.2 * 1000;
const SPEED_DOWN_KEY = 0.05 * 1000;

const screenContainer = document.createElement('div');
const gameContainer = document.createElement('div');
const menuContainer = document.createElement('div');
screenContainer.appendChild(gameContainer);

let gameState;
let tickTimer;

function resetGameState() {
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
    gameState = state;
}

const drawGameState = (function() {
    const charCanvas = document.createElement('pre');
    gameContainer.appendChild(charCanvas);
    function draw() {
        const board = gameState.board.map(function(arr) {
            return arr.slice();
        });
        for(let y=0; y<gameState.shape.getShape().length; ++y) {
            for(let x=0; x<gameState.shape.getShape()[y].length; ++x) {
                const xBoard = x+gameState.shapePos.x;
                const yBoard = y+gameState.shapePos.y;
                if (gameState.shape.getShape()[y][x] === 1) {
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
        charCanvas.textContent = view;
    }
    return draw;
})();


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

function changeSpeedToQuickFall() {
    if (tickTimer != null) {
        clearTimeout(tickTimer);
    }
    gameState.quickFallMode = true;
    gameTick();
}

function changeSpeedToLevel() {
    gameState.quickFallMode = false;
}

function newIncomingShape() {
    gameState.shape = gameState.nextShape;
    gameState.shapePos.x = 0;
    gameState.shapePos.y = 0;
    gameState.nextShape = new shapes.RandomShape();
}

function checkCollision(x, y, shape) {
    x = x === undefined ? gameState.shapePos.x : x;
    y = y === undefined ? gameState.shapePos.y : y;
    shape = shape || gameState.shape.getShape();
    for(let yt=0; yt<shape.length; ++yt) {
        for(let xt=0; xt<shape[yt].length; ++xt) {
            const xBoard = xt+x;
            const yBoard = yt+y;
            if (shape[yt][xt] === 1) {
                if (xBoard < 0 || xBoard >= BOARD_WIDTH || yBoard >= BOARD_HEIGHT || gameState.board[yBoard][xBoard] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function freezeShape() {
    const shape = gameState.shape.getShape();
    for(let y=0; y<shape.length; ++y) {
        for(let x=0; x<shape[y].length; ++x) {
            const xBoard = x+gameState.shapePos.x;
            const yBoard = y+gameState.shapePos.y;
            if (shape[y][x] === 1) {
                gameState.board[yBoard][xBoard] = 1;
            }
        }
    }
}

function processLines() {

}

function fallBlock() {
    gameState.shapePos.y++;
}

function gameTick() {
    if (gameState.shape === null) {
        newIncomingShape();
        if (checkCollision()) {
            // end of game
            return;
        }
    }
    else {
        if (checkCollision(gameState.shapePos.x, gameState.shapePos.y+1)) {
            freezeShape();
            processLines();
            newIncomingShape();
        }
        else {
            fallBlock();
        }
    }
    drawGameState();
    let nextTick;
    if (gameState.quickFallMode) {
        nextTick = SPEED_DOWN_KEY;
    }
    else {
        nextTick = convertLevelToTimer(gameState.level);
    }
    tickTimer = setTimeout(gameTick, nextTick);
}

// Main scenes of game
//////////////////////////////////////////////////////////////////////////////

function scenePlay() {
    resetGameState();
    gameTick();
}

function sceneGameOver() {

}

// Main entry point
//////////////////////////////////////////////////////////////////////////////

function startGame() {
    scenePlay();
}

function destroy() {

}

function moveLeft() {
    console.log("Move Left");
    const collision = checkCollision(gameState.shapePos.x-1);
    if (!collision) {
        gameState.shapePos.x--;
        drawGameState();
    }
}

function moveRight() {
    console.log("Move Right");
    const collision = checkCollision(gameState.shapePos.x+1);
    if (!collision) {
        gameState.shapePos.x++;
        drawGameState();
    }
}

function moveDown() {
    console.log("Move Down");
}

function moveDownStart() {
    console.log("Move Down Start");
    changeSpeedToQuickFall();
}

function moveDownStop() {
    console.log("Move Down Stop");
    changeSpeedToLevel();
}

function rotateRight() {
    console.log("Rotate Right");
    const collision = checkCollision(
        gameState.shapePos.x, gameState.shapePos.y,
        gameState.shape.getNextRightRotation()
    );
    if (!collision) {
        gameState.shape.rotateRight();
        drawGameState();
    }
}

function rotateLeft() {
    console.log("Rotate Left");
    const collision = checkCollision(
        gameState.shapePos.x, gameState.shapePos.y,
        gameState.shape.getNextLeftRotation()
    );
    if (!collision) {
        gameState.shape.rotateLeft();
        drawGameState();
    }
}

function pause() {
    console.log("Pause");
}

module.exports = {
    gameView: screenContainer,
    startGame, pause, destroy,
    moveLeft, moveRight, moveDown, moveDownStart, moveDownStop,
    rotateRight, rotateLeft
};
