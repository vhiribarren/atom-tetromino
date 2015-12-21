AtomTetrominoView = require './atom-tetromino-view'
{CompositeDisposable} = require 'atom'

module.exports = AtomTetromino =
  atomTetrominoView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @atomTetrominoView = new AtomTetrominoView(state.atomTetrominoViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @atomTetrominoView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'atom-tetromino:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @atomTetrominoView.destroy()

  serialize: ->
    atomTetrominoViewState: @atomTetrominoView.serialize()

  toggle: ->
    console.log 'AtomTetromino was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
