const timing = require('./socket/timing.js')
const music = require('./socket/music.js')
const room = require('./socket/room.js')

module.exports = io => {
    io.on('connection', socket => {
        console.log('connected', socket.id)

        music.playSong(socket)

        socket.on('ping', (timestamp) => timing.ping(socket, timestamp))

        socket.on('createRoom', (playerName) => room.createRoom(socket, playerName))
        socket.on('joinRoom', (roomID, playerName) => room.joinRoom(socket, roomID, playerName))
        socket.on('leaveRoom', () => room.leaveRoom(socket))
        socket.on('statsRoom', () => room.statsRoom(socket))

        socket.on('startRoom', () => room.startRoom(socket))
        socket.on('roomPauseSong', () => room.roomPauseSong(socket))
        socket.on('roomPlaySong', () => room.roomPlaySong(socket))
        socket.on('roomBuzzer', () => room.roomBuzzer(socket))


        socket.on('disconnect', () => {
            room.leaveRoom(socket)
            console.log('disconnect', socket.id)
        })
    })
}
