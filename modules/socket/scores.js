const {findRoom} = require('./room.js')

let scores = {}

module.exports = {

    scoresAdd: (socket, playerID) => {
        const roomID = findRoom(socket)
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score++
        socket.in(roomID).emit('scoresAdd', playerID)
    },

    scoresRemove: (socket, playerID) => {
        const roomID = findRoom(socket)
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score--
        socket.in(roomID).emit('scoresRemove', playerID)
    },

    scoresGet: (socket) => {
        const roomID = findRoom(socket)
        if (!scores[roomID]) return '404'
        socket.emit('scoresGet', scores[roomID])
    }
}