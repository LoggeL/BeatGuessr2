const express = require('express')
const socketio = require('socket.io')

const port = 80

const app = express()

let game = {
    players: {},
    teams: {
        "1": {
            name: "Team 1",
            color: "#ff0000",
            players: [],
            score: 0
        },
        "2": {
            name: "Team 2",
            color: "#0000ff",
            players: [],
            score: 0
        },
        "3": {
            name: "Team 3",
            color: "#00ff00",
            players: [],
            score: 0
        },
    },
    started: false,
    song: {
        category: 'jpfy',
        url: null,
        artist: null,
        artistGuessed: null,
        title: null,
        titleGuessed: null,
        playing: false,
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
