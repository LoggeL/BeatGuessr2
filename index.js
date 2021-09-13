const express = require('express')
const socketio = require('socket.io')

const port = 8000

const app = express()

let game = {
    players: [],
    teams: [],
    started: false,
    song: {
        category: null,
        url: null,
        artistGuessed: null,
        titleGuessed: null,
        playing: false,
        progress: 0,
        buzzer: null,
        guesses: []
    },
}

app.use(express.static('client'))

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})

const io = socketio(server)

require('./socket/routes.js')(game, io, app)
require('./express/routes.js')(game, app, io)
