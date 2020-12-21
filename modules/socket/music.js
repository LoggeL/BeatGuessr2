const songs = require('./songs.js')
const timing = require('./timing.js')

module.exports = {
    playSong: (socket) => {
        url = songs.getSong()
        const data = {
            url: url,
            start: Date.now() + timing.getMaxPing() + 500,
        }
        socket.broadcast.emit('playSong', data)
        socket.emit('playSong', data)
    }
}