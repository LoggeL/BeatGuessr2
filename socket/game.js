module.exports = (game, socket, app, io) => {
    socket.on('buzzer', (data) => {
        // if (game.started && game.song.playing) {
        console.log('buzzer', data);
        io.emit('buzzer', data);
        game.playing = false
        game.song.buzzer = data.buzzer
        io.emit('buzzer', data)
    })

    socket.on('guess', data => {
        io.emit('guess', data)
    })

    socket.on('judge', (data) => {
        console.log('judge', data);
        // game.players[socket.id] = {
        //     id: socket.id,
        //     name: undefined,
        //     socket: socket.id,
        //     score: 0,
        //     team: undefined,
        // }
        const player = game.players[socket.id]

        const team = game.teams[player.team]
        if (data.artist && !game.song.artistGuessed) {
            game.song.artistGuessed = true
            game.song.artist = data.artist
            team.score++
            player.score++
        }

        if (data.title && !game.song.titleGuessed) {
            game.song.titleGuessed = true
            game.song.title = data.title
            team.score++
            player.score++
        }
        
        io.emit('updateScores', game.teams)
        io.emit('judge', data)
    })

    socket.on('reset', () => {
        console.log('reset')
        for (team in game.teams) {
            game.teams[team].score = 0
            game.teams[team].players = []
        }
        game.players = {}
        game.started = false
        io.emit('reset')
    })
}