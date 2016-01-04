"use strict";

const Engine = require('./engine.js').Engine;
const CompositeDisposable = require("atom").CompositeDisposable;
const Disposable = require("atom").Disposable;

const URI_OPEN = "atom://tetromino/open";
const KEY_DOWN = 40;

class TetrominoModel {
    constructor() {
        this.engine = new Engine();
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


// Add complex keyboard commands
function addEventListener (view, eventName, handler) {
    view.addEventListener(eventName, handler);
    return new Disposable(() => view.removeEventListener(eventName, handler));
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
            this.disposables.add(addEventListener( tetrominoView, 'keydown', event => {
                if (event.keyCode !== KEY_DOWN) return;
                if (this.keyDownPushed) return;
                this.keyDownPushed = true;
                atom.commands.dispatch(tetrominoView, "tetromino:down-start");
            }));
            this.disposables.add(addEventListener(tetrominoView, 'keyup', event => {
                if (event.keyCode !== KEY_DOWN) return;
                if (!this.keyDownPushed) return;
                this.keyDownPushed = false;
                atom.commands.dispatch(tetrominoView, "tetromino:down-stop");
            }));
            return tetrominoModel;
        }));

    },

    deactivate() {
        this.disposables.dispose();
    },

    serialize() {
    },

    show() {
        const itemPane = atom.workspace.paneForURI(URI_OPEN);
        if (itemPane == null) {
            const prevPane = atom.workspace.getActivePane();
            if (prevPane.parent.orientation !== "horizontal") {
                prevPane.splitRight();
            }
        }
        atom.workspace.open(URI_OPEN, {split: "right", searchAllPanes: true});
    }
};

module.exports = Tetromino;
