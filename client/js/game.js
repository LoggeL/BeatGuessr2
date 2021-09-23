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

const name = localStorage.getItem('playerName')
const team = localStorage.getItem('playerTeam')

if (!name || !team) window.location.href = '/'

let connected = false
let buzzerID

socket.on('connect', () => {
    
    game.pingInterval = setInterval(() => {
        socket.emit('ping', Date.now())
    }, 1000)

    console.log('join', name, team)
    socket.emit('join', {
        name, team
    })

    console.log('connected', socket.id)
    if (connected) return
    connected = true

    socket.on('pong', timestamp => {
        ping.innerText = `${Math.round((Date.now() - timestamp) * .5)} ms`
    })

    playerName.innerText = name
    playerTeam.innerText = 'Team ' + team

    socket.on('updateScores', score => {
        const teams = Object.values(score).sort((a, b) => {
            return b.score - a.score
        })
        scoreTable.innerHTML = ''
        // Sort score

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]
            const tr = document.createElement('tr')
            const td = document.createElement('td')
            td.innerText = medals[i] || (i + 1)
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
        guessTitle.disabled = true
        guessArtist.disabled = true
        guessArtist.removeAttribute('correct')
        guessTitle.removeAttribute('correct')
        game.timer.start = Date.now() - game.timer.duration * 1000
        window.cancelAnimationFrame(game.timer.animationFrame)
    })

    socket.on('resume', teams => {
        console.log('resume', teams)
        gameStatus.innerText = 'Spielt...'
        game.timer.start = Date.now() - game.timer.duration * 1000
        window.cancelAnimationFrame(game.timer.animationFrame)
        if (!teams.includes(team)) buzzer.disabled = false
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
            if (gameStatus.innerText !== "Spielt...") gameStatus.innerText = 'Auswertung...'
            guessTitle.disabled = true
            guessArtist.disabled = true
            if (buzzerID == socket.id) {
            buzzer.disabled = true
                socket.emit('guess', {
                    title: guessTitle.value,
                    artist: guessArtist.value
                })
            }
            return
        }
        requestAnimationFrame(updateTimers)
    }

    socket.on('buzzer', (data) => {
        progress.style.display = 'block'
        game.timer.start = Date.now()
        game.timer.animationFrame = requestAnimationFrame(updateTimers)

        guessArtist.value = ''
        guessTitle.value = ''   

        gameStatus.innerText = 'Buzzed: ' + data.name + ', Team ' + data.team
        
        buzzerID = data.buzzed
        
        if (data.buzzed == socket.id) {
            if (!guessArtist.hasAttribute('correct')) guessArtist.disabled = false
            if (!guessTitle.hasAttribute('correct')) guessTitle.disabled = false
            buzzer.disabled = false
        } else {
            buzzer.disabled = true
        }
    })

    socket.on('guess', (data) => {
        console.log('guess', data)
        buzzer.innerText = 'Buzzer'
        progress.style.display = 'none'
        gameStatus.innerText = 'Auswertung...'
        buzzer.disabled = true
        game.timer.start = Date.now() - game.timer.duration * 1000
        window.cancelAnimationFrame(game.timer.animationFrame)
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

    socket.on('reset', () => {
        alert('Runde wird neu gestartet')
        localStorage.removeItem('name')
        localStorage.removeItem('team')
        window.location = '/'
    })

    buzzer.addEventListener('click', () => {
        if (buzzer.innerText == 'Buzzer') {
            socket.emit('buzzer', {
                name: playerName.innerText,
                team: playerTeam.innerText.replace('Team ', ''),
                // buzzed: socket.id
            })
        }
        else {
            game.timer.start = Date.now() - game.timer.duration * 1000
        }
    })
})

socket.on('disconnect', () => {
    console.log('disconnected')
    ping.innerText = 'offline'
    clearInterval(game.pingInterval)
})