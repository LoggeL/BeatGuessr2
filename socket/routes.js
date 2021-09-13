module.exports = (game, io, app) => {
    io.on('connection', socket => {
        console.log(socket.id, 'connected');
        game.players[socket.id] = {
            id: socket.id,
            name: undefined,
            socket: socket,
            score: 0,
            team: undefined,
        }

        require('./ping.js')(game, socket, app, io);
        require('./player.js')(game, socket, app, io);

        socket.on('disconnect', () => {
            console.log(socket.id, 'disconnected');
            game.players[socket.id] = null;
        });
    })
}