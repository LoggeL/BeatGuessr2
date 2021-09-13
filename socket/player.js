module.exports = (game, socket, app, io) => {
    socket.on('join', (data) => {
        game.players[socket.id].name = data.name;
        game.players[socket.id].team = data.team;
        io.emit('updatePlayers', game.players);
    })

    socket.on('leave', () => {
        delete game.players[socket.id];
        io.emit('updatePlayers', game.players);
    })
}