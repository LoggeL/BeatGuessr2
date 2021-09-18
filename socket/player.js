module.exports = (game, socket, app, io) => {
    socket.on('join', (data) => {
        console.log('join', data)
        game.players[socket.id].name = data.name;
        game.players[socket.id].team = data.team;
        game.players[socket.id].socket = socket.id;

        game.teams[data.team].players.push(socket.id);
        io.emit('updatePlayers', game.players);
    })

    socket.on('leave', () => {
        console.log('leave', socket.id)
        delete game.players[socket.id];
        io.emit('updatePlayers', game.players);
    })
}