let scores = {}

module.exports = {

    scoresAdd: (socket, roomID, playerID) => {
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score++
        socket.in(roomID).emit('scoresAdd', playerID)
    },

    scoresRemove: (socket, roomID, playerID) => {
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score--
        socket.in(roomID).emit('scoresRemove', playerID)
    },

    scoresGet: (socket, roomID) => {
        if (!scores[roomID]) return '404'
        socket.emit('scoresGet', scores[roomID])
    }
}