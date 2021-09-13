module.exports = (game, socket, app) => {
    socket.on('ping', (timestamp) => {
        lastPing = Date.now()
        socket.emit('pong', timestamp)
    })
}