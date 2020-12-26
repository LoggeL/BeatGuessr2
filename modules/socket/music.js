const songs = require('./songs.js')
const timing = require('./timing.js')

module.exports = {
    playSong: (socket, roomID, url, progress) => {
        socket.to(roomID).emit('playSong', {
            url: url,
            start: Date.now() + timing.getMaxPing() + 500,
            progress: 0
        })
    },

    pauseSong: (socket, roomID) => {
        socket.to(roomID).emit('pauseSong')
    },

    getCategories: (socket) => {
        console.log('getCategories', socket.id)
        socket.emit('getCategories', songs.getCategories(socket))
    }
}