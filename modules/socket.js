const timing = require('./socket/timing.js')
const music = require('./socket/music.js')
const room = require('./socket/room.js')
const scores = require('./socket/scores.js')

module.exports = io => {
    io.on('connection', socket => {
        console.log('connected', socket.id)

        socket.on('ping', (timestamp) => timing.ping(socket, timestamp))

        socket.on('getCategories', () => music.getCategories(socket))

        socket.on('createRoom', (playerName) => room.createRoom(socket, playerName))
        socket.on('joinRoom', (roomID, playerName) => room.joinRoom(socket, roomID, playerName))
        socket.on('leaveRoom', () => room.leaveRoom(socket))
        socket.on('statsRoom', () => room.statsRoom(socket))
        socket.on('setCategory', (category) => room.setCategory(socket, category))

        socket.on('startRoom', () => room.startRoom(socket))
        socket.on('roomPauseSong', () => room.roomPauseSong(socket))
        socket.on('roomPlaySong', () => room.roomPlaySong(socket))
        socket.on('roomBuzzer', () => room.roomBuzzer(socket))
        socket.on('roomGuess', (data) => room.roomGuess(socket, data))
        socket.on('roomJudge', (data) => room.roomJudge(socket, data))
        socket.on('roomResumeSong', (progress) => room.roomResumeSong(socket, progress))
        socket.on('resolveSong', (all) => room.resolveSong(socket, all))

        socket.on('scoresGet', () => room.scoresGet(socket))


        socket.on('disconnect', () => {
            room.leaveRoom(socket)
            console.log('disconnect', socket.id)
        })
    })
}
