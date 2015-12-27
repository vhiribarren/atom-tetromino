"use strict";

const TetrominoView = require("./tetromino-view");
const CompositeDisposable = require("atom").CompositeDisposable;

const Tetromino = {

    tetrominoView: null,
    subscriptions: null,
    gamePanel: null,

    activate(state) {
        this.tetrominoView = new TetrominoView(state.atomTetrominoViewState);

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'tetromino:play': () => this.toggle()
        }));
    },

    deactivate() {
        this.gamePanel.destroy();
        this.subscriptions.dispose();
        this.tetrominoView.destroy();
    },

    serialize() {
        return {
            tetrominoViewState: this.tetrominoView.serialize()
        };
    },

    toggle() {
        console.log('Tetromino was toggled!');
        if (this.gamePanel === null) {
            this.gamePanel = atom.workspace.addRightPanel({item: this.tetrominoView});
        }
        else {
            this.gamePanel.destroy();
            this.gamePanel = null;
        }
    }
};

module.exports = Tetromino;
