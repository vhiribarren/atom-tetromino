"use strict";

const engine = require('./engine.js');
const CompositeDisposable = require("atom").CompositeDisposable;

const URI_OPEN = "atom://tetromino/open";


function createView() {
    const element = document.createElement('div');
    element.setAttribute("tabindex", -1); // To be focusable and allow keymaps
    element.classList.add('tetromino');
    engine.displayGame(element);
    element.onclick = () => { console.log("click");};
    return element;
}


class TetrominoModel {
    getTitle() {
        return "Tetromino";
    }
}

const Tetromino = {

    tetrominoItem: null,
    disposables: null,

    activate(state) {

        this.tetrominoItem = new TetrominoModel();

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.disposables = new CompositeDisposable();

        this.disposables.add(
            atom.views.addViewProvider(TetrominoModel, createView)
        );

        atom.keymaps.add("game-control", {
            ".tetromino": {
                "right": "tetromino:right",
                "left": "tetromino:left",
                "down": "tetromino:down",
                "space": "tetromino:rotate",
                "p": "tetromino:pause",
            },
        });

        // Register command that toggles this view
        this.disposables.add(atom.commands.add('atom-workspace', {
            'tetromino:play': () => this.show()
        }));

        this.disposables.add(atom.commands.add(".tetromino", {
            'tetromino:right': () => console.log("right"),
            'tetromino:left': () => console.log("left"),
            'tetromino:down': () => console.log("down"),
            'tetromino:rotate': () => console.log("rotate"),
            'tetromino:pause': () => console.log("pause"),
        }));

        // Opener for custom view in editor
        this.disposables.add(atom.workspace.addOpener( uri => {
            if (uri === URI_OPEN) {
                return this.tetrominoItem;
            }
        }));

    },

    deactivate() {
        this.disposables.dispose();
        this.tetrominoItem.destroy();
    },

    serialize() {
    },

    show() {
        const itemPane = atom.workspace.paneForItem(this.tetrominoItem);
        if (itemPane != null) {
            itemPane.activateItem(this.tetrominoItem);
            return;
        }
        const prevPane = atom.workspace.getActivePane();
        if (prevPane.parent.orientation !== "horizontal") {
            prevPane.splitRight();
        }
        atom.workspace.open(URI_OPEN, {split: "right", searchAllPanes: true});
    }
};

module.exports = Tetromino;
