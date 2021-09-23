module.exports = (game, socket, app, io) => {
    socket.on('buzzer', (data) => {
        // if (game.started && game.song.playing) {
        console.log('buzzer', data);
        if (game.song.buzzer) return
        io.emit('buzzer', data);
        game.playing = false
        game.song.buzzer = socket.id
        data.buzzed = socket.id
        io.emit('buzzer', data)
    })

    socket.on('guess', data => {
        io.emit('guess', data)
    })

    socket.on('judge', (data) => {
        console.log('judge', data);

        // ToDo Validate Socket with buzzer

        const buzzerID = game.song.buzzer
        const player = game.players[buzzerID]
        const team = game.teams[player.team]

        game.song.guesses.push(player.team)

        game.song.buzzer = null

        if (data.artist && !game.song.artistGuessed) {
            game.song.artistGuessed = true
            game.song.artist = data.artist
            game.teams[player.team].score = game.teams[player.team].score + 1
            game.players[buzzerID].score = game.players[buzzerID].score + 1
        }

        if (data.title && !game.song.titleGuessed) {
            game.song.titleGuessed = true
            game.song.title = data.title
            game.teams[player.team].score = game.teams[player.team].score + 1
            game.players[buzzerID].score = game.players[buzzerID].score + 1
        }
        
        io.emit('updateScores', game.teams)
        io.emit('judge', data)

        if (data.title && data.artist || game.song.guesses.length == Object.keys(game.teams).length) {
            game.song.playing = false
            io.emit('reveal', data)
        } else {
            io.emit('resume', game.song.guesses)
        }
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