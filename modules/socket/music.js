const songs = require('./songs.js')
const timing = require('./timing.js')

module.exports = {
    playSong: (socket, roomID, url) => {
        socket.to(roomID).emit('playSong', {
            url: url,
            start: Date.now() + timing.getMaxPing() + 500,
        })
    },

    pauseSong: (socket, roomID) => {
        socket.to(roomID).emit('pauseSong')
    }
}