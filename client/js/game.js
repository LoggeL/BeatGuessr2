const socket = io({
    transports: ['websocket']
})

const ping = document.getElementById('ping')
const playerName = document.getElementById('playerName')
const playerTeam = document.getElementById('playerTeam')
const buzzer = document.getElementById('buzzer')
const gameStatus = document.getElementById('gameStatus')
const scoreTable = document.getElementById('scoreTable')
const guessTitle = document.getElementById('guessTitle')
const guessArtist = document.getElementById('guessArtist')

const medals = ["🥇", "🥈", "🥉"]

socket.on('connect', () => {
    console.log('connected', socket.id)
    setInterval(() => {
        socket.emit('ping', Date.now())
    }, 1000)

    socket.on('pong', timestamp => {
        ping.innerText = `${Math.round((Date.now() - timestamp) * .5)} ms`
    })

    const name = localStorage.getItem('playerName')
    const team = localStorage.getItem('playerTeam')

    if (!name || !team) window.location.href = '/'

    socket.emit('join', {
        name, team
    })

    playerName.innerText = name
    playerTeam.innerText = 'Team ' + team

    socket.on('updateScore', score => {
        scoreTable.innerHTML = ''
        // Sort score
        score.sort((a, b) => {
            return b.score - a.score
        })
        for (let i = 0; i < score.length; i++) {
            const team = score[i]
            const tr = document.createElement('tr')
            const td = document.createElement('td')
            td.innerText = medals[i]
            tr.appendChild(td)

            const td2 = document.createElement('td')
            td2.innerText = team.name
            tr.appendChild(td2)

            const td3 = document.createElement('td')
            td3.innerText = team.score
            tr.appendChild(td3)

            scoreTable.appendChild(tr)
        }
    })

    socket.on('play', () => {
        gameStatus.innerText = 'Playing...'
        buzzer.disabled = false
        guessTitle.true = false
        guessArtist.true = false
    })

    socket.on('pause', () => {
        buzzer.disabled = true
    })

    socket.on('buzzer', (data) => {
        gameStatus.innerText = 'Buzzed: ' + data.name + ', Team ' + data.team
        if (data.buzzed == socket.id) {
            guessTitle.disabled = false
            guessArtist.disabled = false
        } else {
            buzzer.disabled = true
        }
    })


})

socket.on('disconnect', () => {
    console.log('disconnected')
})