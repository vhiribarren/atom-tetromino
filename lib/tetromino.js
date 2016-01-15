"use strict";

const engine = require('./engine.js');
const Engine = require('./engine.js').Engine;
const Hashids = require('./hashids.js');
const CompositeDisposable = require("atom").CompositeDisposable;
const Disposable = require("atom").Disposable;

const HASHIDS_SEED = "tetromino";
const HASHIDS_MINLEN = 10;
const hashids = new Hashids(HASHIDS_SEED, HASHIDS_MINLEN);

const URI_OPEN = "atom://tetromino/open";
const CONF_HIGHSCORE_LINES = "tetromino.highscore.lines";
const CONF_RIGHTPANE = "tetromino.rightPane";
const KEY_DOWN = 40;



class TetrominoModel {
    constructor() {
        let highScore = hashids.decode(localStorage.getItem(CONF_HIGHSCORE_LINES) ||0);
        highScore = highScore[0] || 0;
        this.engine = new Engine();
        this.engine.highScoreLines = highScore;
        this.engine.on(engine.EVENT_HIGHSCORE, () => {
            const newHighScoreLines = this.engine.highScoreLines;
            if (newHighScoreLines > highScore) {
                localStorage.setItem(CONF_HIGHSCORE_LINES, hashids.encode(newHighScoreLines));
            }
        });
    }
    getTitle() { // For the tab title
        return "Tetromino";
    }
    getURI() { // To retrieve the item with itemForURI
        return URI_OPEN;
    }
    destroy() {
        this.engine.destroy();
    }
    serialize() { // To avoid an exception while spliting the panel
        return null;
    }
}

function createView(model) {
    const element = document.createElement('div');
    element.setAttribute("tabindex", -1); // To be focusable and allow keymaps
    element.classList.add('tetromino');
    element.appendChild(model.engine.view);
    return element;
}

const Tetromino = {

    disposables: null,
    keyDownPushed: false,

    activate(state) {

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.disposables = new CompositeDisposable();

        // Link tetromino view and model
        this.disposables.add(
            atom.views.addViewProvider(TetrominoModel, createView)
        );

        // Register command that toggles this view
        this.disposables.add(atom.commands.add('atom-workspace', {
            'tetromino:play': () => this.show()
        }));
        this.disposables.add(atom.commands.add(".tetromino", {
            'tetromino:right': () => atom.workspace.getActivePaneItem().engine.moveRight(),
            'tetromino:left': () => atom.workspace.getActivePaneItem().engine.moveLeft(),
            'tetromino:down': () => atom.workspace.getActivePaneItem().engine.moveDown(),
            'tetromino:down-start': () => atom.workspace.getActivePaneItem().engine.moveDownStart(),
            'tetromino:down-stop': () => atom.workspace.getActivePaneItem().engine.moveDownStop(),
            'tetromino:rotate-right': () => atom.workspace.getActivePaneItem().engine.rotateRight(),
            'tetromino:rotate-left': () => atom.workspace.getActivePaneItem().engine.rotateLeft(),
            'tetromino:pause': () => atom.workspace.getActivePaneItem().engine.pause(),
        }));

        // Add simple keyboard commands
        atom.keymaps.add("game-control", {
            ".tetromino": {
                "right": "tetromino:right",
                "left": "tetromino:left",
                "down": "tetromino:down",
                "up": "tetromino:rotate-right",
                "space": "tetromino:rotate-right",
                "alt": "tetromino:rotate-left",
                "p": "tetromino:pause",
            },
        });

        // Opener for custom view in editor
        this.disposables.add(atom.workspace.addOpener( uri => {
            if (uri !== URI_OPEN) {
                return;
            }
            const tetrominoModel = new TetrominoModel();
            const tetrominoView = atom.views.getView(tetrominoModel);
            tetrominoView.addEventListener('keydown', event => {
                if (event.keyCode !== KEY_DOWN) return;
                if (this.keyDownPushed) return;
                this.keyDownPushed = true;
                atom.commands.dispatch(tetrominoView, "tetromino:down-start");
            });
            tetrominoView.addEventListener('keyup', event => {
                if (event.keyCode !== KEY_DOWN) return;
                if (!this.keyDownPushed) return;
                this.keyDownPushed = false;
                atom.commands.dispatch(tetrominoView, "tetromino:down-stop");
            });
            return tetrominoModel;
        }));

    },

    deactivate() {
        this.disposables.dispose();
    },

    serialize() {
    },

    config: {
        rightPane: {
            description: 'Open game in right pane',
            type: "boolean",
            default: true
        }
    },

    show() {
        const itemPane = atom.workspace.paneForURI(URI_OPEN);
        if (itemPane == null) {
            const prevPane = atom.workspace.getActivePane();
            if (prevPane.parent.orientation !== "horizontal" && atom.config.get(CONF_RIGHTPANE)) {
                prevPane.splitRight();
            }
        }
        const options = { searchAllPanes: true };
        if( atom.config.get(CONF_RIGHTPANE)) {
            options.split = "right";
        }
        atom.workspace.open(URI_OPEN, options);
    }
};

module.exports = Tetromino;
