# Tetromino

Another [tetromino][tetromino-wikipedia] falling block game implementation.

Remember the hidden tetromino game in Emacs using the `M-x tetris` command? I just wanted the same kind of useful tool with Atom.

![Screenshot1](https://raw.githubusercontent.com/vhiribarren/atom-tetromino/master/materials/screenshot1.jpg)

## Commands

Open the game using the command palette `Tetromino: Play` or the `Tetromino` sub-menu in the `Packages` menu.

The current commands to play the game are:

- `left`: move block to left
- `right`: move block to right
- `bottom`: accelerate drop of block
- `up`: rotate block to right
- `space`: rotate block to right
- `alt`: rotate block to left
- `p`: pause

## TODO

- Display a "game over" message
- Button to choose start level
- Button to immediately restart level
- Implement a score formula and display score
- Locally save best score
- Choose in preferences if game must be in a split pane or not

## Contributions

Contributions and bug reports are welcome. Please keep in mind that the whole idea of the project is to have a minimalist implementation of the tetromino falling block game, so the game must not evolve too much. It is only for fun, like the Emacs tetromino game.

[tetromino-wikipedia]: https://en.wikipedia.org/wiki/Tetromino
