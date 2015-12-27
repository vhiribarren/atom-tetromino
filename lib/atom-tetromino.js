"use strict";

const AtomTetrominoView = require("./atom-tetromino-view");
const CompositeDisposable = require("atom").CompositeDisposable;

const AtomTetromino = {

    atomTetrominoView: null,
    subscriptions: null,
    gamePanel: null,

    activate(state) {
        this.atomTetrominoView = new AtomTetrominoView(state.atomTetrominoViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.atomTetrominoView.getElement(),
            visible: false
        });

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
        this.atomTetrominoView.destroy();
    },

    serialize() {
        return {
            atomTetrominoViewState: this.atomTetrominoView.serialize()
        };
    },

    toggle() {
        console.log('AtomTetromino was toggled!');
        if (this.gamePanel === null) {
            this.gamePanel = atom.workspace.addRightPanel({item: this.atomTetrominoView});
        }
        else {
            this.gamePanel.destroy();
            this.gamePanel = null;
        }
    }
};

module.exports = AtomTetromino;
