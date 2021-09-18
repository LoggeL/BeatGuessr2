const socket = io()

const ping = document.getElementById('ping')
const playerName = document.getElementById('playerName')
const playerTeam = document.getElementById('playerTeam')
const buzzer = document.getElementById('buzzer-button')
const gameStatus = document.getElementById('gameStatus')
const scoreTable = document.getElementById('scoreTable')
const guessTitle = document.getElementById('guessTitle')
const guessArtist = document.getElementById('guessArtist')
const progress = document.getElementById('progress')

const medals = ["🥇", "🥈", "🥉"]

let game = {
    timer: {
        start: 0,
        animationFrame: null,
        duration: 20,
    },
    pingInterval: null,
}

socket.on('connect', () => {
    console.log('connected', socket.id)
    game.pingInterval = setInterval(() => {
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

    socket.on('updateTeams', score => {
        const teams = Object.values(score).sort((a, b) => {
            return b.score - a.score
        })
        scoreTable.innerHTML = ''
        // Sort score

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]
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
        gameStatus.innerText = 'Spielt...'
        buzzer.disabled = false
        guessTitle.disabled = false
        guessArtist.disabled = false
        guessArtist.removeAttribute('correct')
        guessTitle.removeAttribute('correct')
    })

    socket.on('resume', () => {
        gameStatus.innerText = 'Spielt...'
        buzzer.disabled = false
        if (!guessArtist.hasAttribute('correct')) guessArtist.disabled = false
        if (!guessTitle.hasAttribute('correct')) guessTitle.disabled = false
    })

    socket.on('pause', () => {
        buzzer.disabled = true
    })

    function updateTimers() {
        progress.children[0].children[0].style.width = (Date.now() - game.timer.start) / (game.timer.duration * 10) + '%'
        buzzer.innerText = Math.round(game.timer.duration * 10 - (Date.now() - game.timer.start) / 100) / 10
        if ((Date.now() - game.timer.start) > game.timer.duration * 1000) {
            window.cancelAnimationFrame(game.timer.animationFrame)
            buzzer.innerText = 'Buzzer'
            progress.style.display = 'none'
            gameStatus.innerText = 'Auswertung...'
            guessTitle.disabled = true
            guessArtist.disabled = true
            buzzer.disabled = true
            socket.emit('guess', {
                title: guessTitle.value,
                artist: guessArtist.value
            })
            return
        }
        requestAnimationFrame(updateTimers)
    }

    socket.on('buzzer', (data) => {
        progress.style.display = 'block'
        game.timer.start = Date.now()
        game.timer.animationFrame = requestAnimationFrame(updateTimers)

        gameStatus.innerText = 'Buzzed: ' + data.name + ', Team ' + data.team
        if (data.buzzed == socket.id) {
            if (!guessArtist.hasAttribute('correct')) guessArtist.disabled = false
            if (!guessTitle.hasAttribute('correct')) guessTitle.disabled = false
        } else {
            buzzer.disabled = true
        }
    })

    socket.on('guess', (data) => {
        console.log(data)
        buzzer.innerText = 'Buzzer'
        progress.style.display = 'none'
        gameStatus.innerText = 'Auswertung...'
        buzzer.disabled = true
    })

    socket.on('judge', (data) => {
        if (data.artist) {
            guessArtist.innerText = data.artist
            guessArtist.setAttribute('correct', true)
        }
        if (data.title) {
            guessTitle.innerText = data.title
            guessTitle.setAttribute('correct', true)
        }
        gameStatus.innerText = 'Warten...'
    })

    buzzer.addEventListener('click', () => {
        if (buzzer.innerText == 'Buzzer') {
            socket.emit('buzzer', {
                name: playerName.innerText,
                team: playerTeam.innerText.replace('team ', ''),
                buzzed: socket.id
            })
        }
        else {
            game.timer.start = Date.now() - game.timer.duration * 1000
        }
    })
})

socket.on('disconnect', () => {
    console.log('disconnected')
    ping.innerText = `offline`
    clearInterval(game.pingInterval)
})