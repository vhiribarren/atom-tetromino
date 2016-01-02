"use strict";

const shapes = require('./shapes.js');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

const screenContainer = document.createElement('div');
const gameContainer = document.createElement('div');
const menuContainer = document.createElement('div');
screenContainer.appendChild(gameContainer);

let gameState;

function resetGameState() {
    const state = {
        level: 1,
        score: 0,
        lines: 0,
        shape: null,
        shapePos: {x: 0, y: 0},
        nextShape: new shapes.RandomShape(),
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
    setTimeout(gameTick, gameState.level*1000);
}

// Main screens of game
//////////////////////////////////////////////////////////////////////////////

function screenPlay() {
    resetGameState();
    gameTick();
}

function screenGameOver() {

}

// Main entry point
//////////////////////////////////////////////////////////////////////////////

function startGame() {
    screenPlay();
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
    moveLeft, moveRight, moveDown,
    rotateRight, rotateLeft
};
