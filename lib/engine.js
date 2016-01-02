"use strict";

const shapes = require('./shapes.js');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

const screenContainer = document.createElement('div');
const gameContainer = document.createElement('div');
const menuContainer = document.createElement('div');

const gameState = initGameState();

function initGameState() {
    const state = {
        currentShape: null,
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
    return state;
}

function startGameLoop() {

}

const drawGameState = (function() {
    const charCanvas = document.createElement('pre');
    gameContainer.appendChild(charCanvas);
    function draw() {
        let view = "";
        for(const line of gameState.board) {
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

// Main screens of game
//////////////////////////////////////////////////////////////////////////////

function screenPlay() {
    drawGameState();
}

function screenGameOver() {

}

// Main entry point
//////////////////////////////////////////////////////////////////////////////

function displayGame(domElement) {
    screenContainer.appendChild(gameContainer);
    domElement.focus();
    domElement.appendChild(screenContainer);
    screenPlay();
}

module.exports = {displayGame};
