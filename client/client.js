// General
const audio = document.getElementById('player')
const currentRoomID = document.getElementById('currentRoomID')
const playerName = document.getElementById('playerName')
const pingContainer = document.getElementById('pingContainer')
const createRoom = document.getElementById('createRoom')
const joinRoom = document.getElementById('joinRoom')
const roomID = document.getElementById('roomID')
const scoreboard = document.getElementById('scoreboard')
const currentCategory = document.getElementById('currentCategory')
const userTitle = document.getElementById('userTitle')
const userArtist = document.getElementById('userArtist')
const volumeSlider = document.getElementById('volumeSlider')

const socketID = document.getElementById('socketID')

// Owner only
const startGame = document.getElementById('startGame')
const categories = document.getElementById('categories')
const adminControls = document.getElementById('adminControls')
const titleGuessAdmin = document.getElementById('titleGuessAdmin')
const artistGuessAdmin = document.getElementById('artistGuessAdmin')
const titleCorrectAdmin = document.getElementById('titleCorrectAdmin')
const artistCorrectAdmin = document.getElementById('artistCorrectAdmin')

const artistCorrect = document.getElementById('artistCorrect')
const artistWrong = document.getElementById('artistWrong')
const titleCorrect = document.getElementById('titleCorrect')
const titleWrong = document.getElementById('titleWrong')

// Buzzer Realted
const buzzer = document.getElementById('buzzer')
const skip = document.getElementById('skip')
const buzzerWait = document.getElementById('buzzerWait')
const buzzerForm = document.getElementById('buzzerForm')
const buzzerPopup = document.getElementById('buzzerPopup')
const titleGuess = document.getElementById('titleGuess')
const artistGuess = document.getElementById('artistGuess')
const submitGuess = document.getElementById('submitGuess')
const progress = document.getElementById('progress')


let pingInterval, isOwner, category, hasGuessed, correctData, buzzerPlayerId, latency, buzzerTimeout
let judgeDataCollector = {}
let currentRoom = {}
let nameMapper = {}
let status = {}

if (localStorage.getItem('name')) playerName.value = localStorage.getItem('name')

const socket = io("http://logge.top:8000", {
    transports: ['websocket']
})

socket.on('connect', () => {
    console.log('connected', socket.id)

    socketID.innerText = socket.id

    createRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        socket.emit('createRoom', playerName.value.trim())
        createRoom.parentNode.remove()
        buzzer.parentElement.style.display = 'none'
    })

    joinRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        localStorage.setItem('name', name)
        socket.emit('joinRoom', roomID.value.trim(), playerName.value.trim())
        joinRoom.parentNode.style.display = 'none'
    })

    startGame.addEventListener('click', () => {
        if (category) {
            socket.emit('playSong')
            startGame.remove()
        }
        else {
            alert('Category not set')
        }
    })

    buzzer.addEventListener('click', () => {
        socket.emit('buzzer')
        console.log('Buzzer press')
    })

    skip.addEventListener('click', () => {
        console.log('Skip press')
        socket.emit('skip')
    })


    submitGuess.addEventListener('click', () => {
        const artist = artistGuess.disabled ? null : artistGuess.value.trim()
        const title = titleGuess.disabled ? null : titleGuess.value.trim()

        clearTimeout(buzzerTimeout)

        socket.emit('guess', { title, artist })
    })

    socket.on('closePopup', () => {
        console.log('closePoup')
        progress.parentElement.style.display = 'none'
        progress.style.width = '100%'
        buzzerPopup.style.display = 'none'
    })

    socket.on('guessedData', (data) => {
        console.log('guessedData', data)
        correctData = data.correctData
        titleGuessAdmin.innerText = data.guessedData.title
        titleCorrectAdmin.innerText = data.correctData.title
        artistGuessAdmin.innerText = data.guessedData.artist
        artistCorrectAdmin.innerText = data.correctData.artist

        if (data.guessedData.title) {
            titleCorrect.parentElement.style.display = 'block'
            titleCorrect.addEventListener('click', judgeGuess)
            titleWrong.addEventListener('click', judgeGuess)
        } else {
            judgeDataCollector.titleWrong = '?'
        }

        if (data.guessedData.title == data.correctData.title) {
            console.log('titleAutoCorrect')
            titleCorrect.click()
        }

        if (data.guessedData.artist) {
            artistCorrect.parentElement.style.display = 'block'
            artistCorrect.addEventListener('click', judgeGuess)
            artistWrong.addEventListener('click', judgeGuess)
        } else {
            judgeDataCollector.artistWrong = '?'
        }

        if (data.guessedData.artist == data.correctData.artist) {
            console.log('titleAutoCorrect')
            artistCorrect.click()
        }

        if (!data.guessedData.title && !data.guessedData.artist) {
            judgeDataCollector.artistWrong = '?'
            judgeDataCollector.titleWrong = '?'
            socket.emit('judge', judgeDataCollector)
            socket.emit('setProgress', player.currentTime)
            judgeDataCollector = {}
        }
    })

    socket.on('createRoom', () => {
        console.log('createRoom')
        currentRoomID.innerText = socket.id
        currentRoom.id = socket.id
        adminControls.style.display = 'block'
        isOwner = true
        currentRoom.players = []
        renderPlayerlist()
    })

    socket.on('getCategories', categoryData => {
        console.log('getCategories')
        for (let i = 0; i < categoryData.length; i++) {
            const button = document.createElement('button')
            button.innerText = `${categoryData[i].category} [${categoryData[i].count} Songs]`
            button.onclick = () => setCategory(categoryData[i].category)
            categories.append(button)
        }
    })

    socket.on('statsRoom', data => {
        console.log('statsRoom')
        if (data == '404') {
            console.error('NoRoom')
            return joinRoom.parentNode.style.display = 'block'
        }

        currentCategory.innerText = data.song.category
        currentRoomID.innerText = data.owner
        currentRoom.players = data.players
        renderPlayerlist()
        data.players.forEach(p => nameMapper[p.id] = p.playerName)

        if (data.song.playing) {
            player.src = data.song.url
            skip.removeAttribute('disabled')
            buzzer.removeAttribute('disabled')

            player.currentTime = data.progress || 0
            player.play()
            renderPlayerlist()
        } else if (data.song.buzzer) {
            buzzerPopup.style.display = 'block'
            buzzerWait.style.display = 'block'
            buzzerWait.innerText = 'Buzzered by ' + nameMapper[buzzerPlayerId]
            buzzerForm.style.display = 'none'
        }
    })

    socket.on('ping', (key) => {
        socket.emit('pong', key)
    })

    socket.on('pong', latencyTemp => {
        latency = latencyTemp
        if (latency + ' ms' != pingContainer.innerText)
            pingContainer.innerText = latency + ' ms'
    })

    // socket.emit('getSong', true)
    socket.on('playerJoined', player => {
        console.log('playerJoined', player)
        if (currentRoom.players) {
            currentRoom.players.push(player)
            // Update List
            nameMapper[player.id] = player.playerName
            renderPlayerlist()
        }
    })

    socket.on('playerLeft', playerID => {
        console.log('playerLeft', playerID)
        if (currentRoom.players) {
            const index = currentRoom.players.findIndex(e => e.id == playerID)
            currentRoom.players.splice(index, 1);
            delete nameMapper[playerID]

            // Update List
            renderPlayerlist()
        }
    })

    socket.on('playSong', data => {
        console.log('playSong', data)
        if (data.progress === 0) {
            artistGuess.value = ''
            artistGuess.removeAttribute('disabled')
            titleGuess.value = ''
            titleGuess.removeAttribute('disabled')
            userTitle.innerText = ''
            userTitle.style.color = 'black'
            userArtist.innerText = ''
            userArtist.style.color = 'black'
            hasGuessed = false
            status = { [currentRoomID.innerText]: 'owner' }
        }
        player.src = data.url
        setTimeout(() => {
            if (data.progress == 0 || !hasGuessed) {
                skip.removeAttribute('disabled')
                buzzer.removeAttribute('disabled')
            }
            player.currentTime = data.progress
            player.play()
        }, data.start - latency)
        console.log('playSong', 'Starts in', data.start - latency, 'ms', data, 'at', data.progress, 's')
        renderPlayerlist()
    })

    socket.on('destroyRoom', () => {
        alert('Host left room')
        window.location.reload(true)
    })

    socket.on('setCategory', setCategory => {
        console.log('ownerSetCategory', setCategory)
        category = setCategory
        currentCategory.innerText = setCategory
    })

    socket.on('buzzer', buzzerPlayerIDTemp => {
        buzzerPlayerId = buzzerPlayerIDTemp
        console.log('buzzer', buzzerPlayerId)
        status[buzzerPlayerId] = 'Buzzed'

        player.pause()

        buzzer.setAttribute('disabled', true)
        skip.setAttribute('disabled', true)

        buzzerPopup.style.display = 'block'

        if (socket.id == buzzerPlayerId) {
            buzzerForm.style.display = 'block'
            buzzerWait.style.display = 'none'

            hasGuessed = true

            buzzerTimeout = setTimeout(() => {
                submitGuess.click()
            }, 20000 + latency)
        }
        else {
            buzzerWait.style.display = 'block'
            buzzerWait.innerText = 'Buzzed by ' + nameMapper[buzzerPlayerId]
            buzzerForm.style.display = 'none'
        }
        progress.parentElement.style.display = 'block'
        progress.style.width = '100%'
        setTimeout(() => {
            progress.style.width = '0%'
        }, 1000)

        renderPlayerlist()
        if (isOwner) socket.emit('setProgress', player.currentTime)
    })

    socket.on('skip', skipPlayerID => {
        status[skipPlayerID] = 'Skipped'
        renderPlayerlist()
    })

    socket.on('revealSong', metaData => {
        console.log('revealSong', metaData)
        userTitle.innerText = metaData.title
        userArtist.innerText = metaData.artist
        player.play()
        setTimeout(() => {
            player.pause()
            socket.emit('playSong')
        }, 5000)
    })

    socket.on('artistCorrect', (artist, players) => {
        console.log('artistCorrect', artist)
        userArtist.innerText = artist
        artistGuess.value = artist
        artistGuess.setAttribute('disabled', true)
        userArtist.style.color = 'green'
        currentRoom.players = players
        renderPlayerlist()
    })

    socket.on('titleCorrect', (title, players) => {
        console.log('titleCorrect', title)
        titleGuess.value = title
        titleGuess.setAttribute('disabled', true)
        userTitle.innerText = title
        userTitle.style.color = 'green'
        currentRoom.players = players
        renderPlayerlist()
    })

    socket.on('artistWrong', wrongArtist => {
        console.log('artistWrong', wrongArtist)
        userArtist.innerText = wrongArtist || "?"
        userArtist.style.color = 'red'
    })

    socket.on('titleWrong', wrongTitle => {
        console.log('titleWrong', wrongTitle)
        userTitle.innerText = wrongTitle || "?"
        userTitle.style.color = 'red'
    })
})

socket.on('disconnect', reason => {
    console.log('disconnected', reason)
    socket.removeAllListeners();
    setTimeout(() => {
        window.location.reload(true)
    }, 1000)
})

function setCategory(value) {
    if (!isOwner) return
    console.log('setCategory', value)
    socket.emit('setCategory', value)
}

function judgeGuess(element) {
    const name = element.target.id
    if (name == "artistCorrect" || name == "artistWrong") {
        artistCorrect.parentElement.style.display = 'none'
        artistCorrect.removeEventListener('click', judgeGuess)
        artistWrong.removeEventListener('click', judgeGuess)
        judgeDataCollector[name] = artistGuessAdmin.innerText
    } else if (name == "titleCorrect" || name == "titleWrong") {
        titleCorrect.parentElement.style.display = 'none'
        titleCorrect.removeEventListener('click', judgeGuess)
        titleWrong.removeEventListener('click', judgeGuess)
        judgeDataCollector[name] = titleGuessAdmin.innerText
    } else {
        throw new Erorr('Error judging', name)
    }
    if (Object.keys(judgeDataCollector).length == 2) {
        console.log(judgeDataCollector)
        socket.emit('judge', judgeDataCollector)
        socket.emit('setProgress', player.currentTime)
        judgeDataCollector = {}
    }
}

function renderPlayerlist() {
    console.log('rendering', currentRoom.players.length, 'players')
    scoreboard.innerHTML = ''
    for (let i = 0; i < currentRoom.players.length; i++) {
        const player = currentRoom.players[i]

        const playerRow = document.createElement('tr')
        const playerStatus = document.createElement('td')
        const playerName = document.createElement('td')
        const playerScore = document.createElement('td')
        const playerID = document.createElement('td')

        playerStatus.innerText = status[player.id] || ""
        playerName.innerText = player.playerName
        playerScore.innerText = player.score || 0
        playerID.innerText = player.id

        playerRow.append(playerStatus)
        playerRow.append(playerName)
        playerRow.append(playerScore)
        playerRow.append(playerID)

        scoreboard.append(playerRow)
    }
}

function changeVolume() {
    player.volume = volumeSlider.value / 100
    console.log(player.volume)
}