module.exports = (game, io, app) => {
    io.on('connection', socket => {
        console.log(socket.id, 'connected');
        game.players[socket.id] = {
            id: socket.id,
            name: undefined,
            socket: socket.id,
            score: 0,
            team: undefined,
        }

        require('./ping.js')(game, socket, app, io);
        require('./player.js')(game, socket, app, io);
        require('./game.js')(game, socket, app, io);
        require('./song.js')(game, socket, app, io);

        io.emit('updateScores', game.teams)
        io.emit('updatePlayers', game.players)

        socket.on('disconnect', () => {
            console.log(socket.id, 'disconnected');
            game.players[socket.id] = null;
        });
    })
}