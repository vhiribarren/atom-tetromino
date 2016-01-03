"use strict";

const engine = require('./engine.js');
const CompositeDisposable = require("atom").CompositeDisposable;
const Disposable = require("atom").Disposable;

const URI_OPEN = "atom://tetromino/open";
const KEY_DOWN = 40;


function createView() {
    const element = document.createElement('div');
    element.setAttribute("tabindex", -1); // To be focusable and allow keymaps
    element.classList.add('tetromino');
    element.appendChild(engine.gameView);
    engine.startGame();
    //element.onclick = () => { console.log("click"); engine.startGame();};
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
            'tetromino:right': () => engine.moveRight(),
            'tetromino:left': () => engine.moveLeft(),
            'tetromino:down': () => engine.moveDown(),
            'tetromino:down-start': () => engine.moveDownStart(),
            'tetromino:down-stop': () => engine.moveDownStop(),
            'tetromino:rotate-right': () => engine.rotateRight(),
            'tetromino:rotate-left': () => engine.rotateLeft(),
            'tetromino:pause': () => engine.pause(),
        }));

        // Instantiate model and get associated view
        this.tetrominoItem = new TetrominoModel();
        const tetrominoView = atom.views.getView(this.tetrominoItem);

        // Add simple keyboard commands
        atom.keymaps.add("game-control", {
            ".tetromino": {
                "right": "tetromino:right",
                "left": "tetromino:left",
                "down": "tetromino:down",
                "space": "tetromino:rotate-right",
                "alt": "tetromino:rotate-left",
                "p": "tetromino:pause",
            },
        });

        // Add complex keyboard commands
        function addEventListener (view, eventName, handler) {
            view.addEventListener(eventName, handler);
            return new Disposable(() => view.removeEventListener(eventName, handler));
        }
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
