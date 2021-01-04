let timeHandler = {}
let lastPing = Date.now()
let lastKey = null

module.exports = {
    ping: (key) => {
        lastKey = key
        lastPing = Date.now()
    },

    pong: (socket, key) => {
        if (lastKey != key) return socket.emit('pong', 1999)
        const latency = Math.floor((Date.now() - lastPing) * 0.5)
        timeHandler[socket.id] = latency
        socket.emit('pong', latency)
    },

    getMaxPing: () => Math.max(Object.values(timeHandler)) || 0
}
