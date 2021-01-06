const timing = require('./socket/timing.js')
const music = require('./socket/music.js')
const room = require('./socket/room.js')

module.exports = io => {
    io.on('connection', socket => {
        console.log('connected', socket.id)

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
        socket.on('roomSkip', () => room.roomSkip(socket))
        socket.on('roomGuess', (data) => room.roomGuess(socket, data, io))
        socket.on('roomJudge', (data) => room.roomJudge(socket, data, io))
        socket.on('roomSetProgress', (progress) => room.roomSetProgress(socket, progress))

        socket.on('disconnecting', reason => {
            room.leaveRoom(socket)
            console.log('disconnecting', socket.id, reason)
        })

        socket.on('pong', (key) => { timing.pong(socket, key) })
    })

    setInterval(() => {
        const key = Math.random().toString(36).substring(7);
        timing.ping(key)
        io.emit('ping', key)
    }, 2000)
}
