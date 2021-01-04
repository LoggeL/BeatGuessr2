const songs = require('./songs.js')
const timing = require('./timing.js')

module.exports = {
    playSong: (socket, roomID, url, progress) => {
        console.log('playSong', socket.id, url)
        const data = {
            url: url,
            start: Date.now() + Math.min(Math.max(timing.getMaxPing(), 5000) + 500, 10000),
            progress: progress || 0
        }
        socket.to(roomID).emit('playSong', data)
        socket.emit('playSong', data)
    },

    pauseSong: (socket, roomID) => {
        socket.to(roomID).emit('pauseSong')
    },

    getCategories: (socket) => {
        console.log('getCategories', socket.id)
        socket.emit('getCategories', songs.getCategories(socket))
    }
}