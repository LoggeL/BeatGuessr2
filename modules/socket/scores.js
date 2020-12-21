module.exports = {
    scores = {},

    scoresAdd: (socket, playerID, roomID) => {
        if (!scores[roomID]) return
        const player = scores[roomID].find(player => player.id == playerID)
        player.score++
        socket.in(roomID).emit('scoresAdd', playerID)
    },

    scoresRemove: (socket, playerID, roomID) => {
        if (!scores[roomID]) return
        const player = scores[roomID].find(player => player.id == playerID)
        player.score--
        socket.in(roomID).emit('scoresRemove', playerID)
    },

    scoresGet: (socket, roomID) => {
        if (!scores[roomID]) return
        socket.emit('scoresGet', scores[roomID])
    }
}