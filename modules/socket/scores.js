let scores = {}

module.exports = {

    scoresIncrement: (socket, roomID, playerID) => {
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score++
        socket.in(roomID).emit('scoresIncrement', playerID)
    },

    scoresDecrement: (socket, roomID, playerID) => {
        if (!scores[roomID]) return '404'
        const player = scores[roomID].find(player => player.id == playerID)
        player.score--
        socket.in(roomID).emit('scoresDecrement', playerID)
    },

    scoresInitialize: (socket, roomID, playerID) => {
        if (!scores[roomID]) scores[roomID] = []
        if (scores[roomID].some(player => player.id == playerID)) return '401'
        scores[roomID].push({ id: playerID, score: 0 })
    },

    scoresRemove: (socket, roomID, playerID) => {
        const index = scores[roomID].findIndex(p => p.id == playerID);
        if (index > -1) {
            scores[roomID].splice(index, 1)
        }
    },

    scoresDestroy: (socket, roomID) => {
        if (!scores[roomID]) return '404'
        delete scores[roomID]
    },

    scoresGet: (socket, roomID) => {
        if (!scores[roomID]) return '404'
        socket.emit('scoresGet', scores[roomID])
    }
}