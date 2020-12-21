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
        socket.on('leaveRoom', (roomID) => room.leaveRoom(socket, roomID))
        socket.on('statsRoom', (roomID) => room.statsRoom(socket, roomID))

        socket.on('disconnect', () => {
            const roomID = room.findRoom(socket)
            if (roomID) room.leaveRoom(socket, roomID)
            console.log('disconnect', socket.id, roomID)
        })
    })
}
