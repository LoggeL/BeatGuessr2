module.exports = (game, app, io) => {
  app.get('/cover', (req, res) => {
    res.header('Content-Type', 'image/jpeg').end(Buffer.from(game.song.tag.picture.data))
  })
}