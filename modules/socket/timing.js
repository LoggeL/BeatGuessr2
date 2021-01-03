
module.exports = {
    timeHandler: {},

    ping: (socket, timestamp) => {
        const latency = Math.max(Date.now() - timestamp, 0)
        module.exports.timeHandler[socket.id] = latency
        socket.emit('pong', latency)
    },

    getMaxPing: () => Math.max(Object.values(module.exports.timeHandler)) || 0
}
