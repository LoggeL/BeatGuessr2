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
const guessedTitle = document.getElementById('guessedTitle')
const guessedArtist = document.getElementById('guessedArtist')
const socketID = document.getElementById('socketID')

// Owner only
const startGame = document.getElementById('startGame')
const categories = document.getElementById('categories')
const adminControls = document.getElementById('adminControls')
const titleGuessAdmin = document.getElementById('titleGuessAdmin')
const artistGuessAdmin = document.getElementById('artistGuessAdmin')

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


let pingInterval, isOwner, category, judgeGuessedData, hasGuessed, correctData
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
            socket.emit('roomPlaySong')
            startGame.remove()
        }
        else {
            alert('Category not set')
        }
    })

    buzzer.addEventListener('click', () => {
        socket.emit('roomBuzzer')
        console.log('Buzzer press')
    })

    skip.addEventListener('click', () => {
        console.log('Skip press')
        socket.emit('roomSkip')
    })


    submitGuess.addEventListener('click', () => {
        const artist = artistGuess.disabled ? null : artistGuess.value.trim()
        const title = titleGuess.disabled ? null : titleGuess.value.trim()

        socket.emit('roomGuess', { title, artist })
    })

    socket.on('closePopup', () => {
        console.log('closePoup')
        buzzerPopup.style.display = 'none'
    })

    socket.on('guessedData', (data) => {
        console.log('guessedData')
        correctData = data.correctData
        titleGuessAdmin.innerText = data.guessedData.title + ' | ' + data.correctData.title
        artistGuessAdmin.innerText = data.guessedData.artist + ' | ' + data.correctData.artist
        judgeGuessedData = {}

        if (data.guessedData.title) {
            titleCorrect.addEventListener('click', judgeGuess)
            titleWrong.addEventListener('click', judgeGuess)
        }
        else {
            judgeGuessedData['title'] = null
        }

        if (data.guessedData.artist) {
            artistCorrect.addEventListener('click', judgeGuess)
            artistWrong.addEventListener('click', judgeGuess)
        }
        else {
            judgeGuessedData['artist'] = null
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

            player.currentTime = (player.duration * data.progress) || 0
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

    socket.on('pong', latency => {
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
        if (data.progress === 0) {
            artistGuess.value = ''
            artistGuess.removeAttribute('disabled')
            titleGuess.value = ''
            titleGuess.removeAttribute('disabled')
            guessedTitle.innerText = ''
            guessedTitle.style.color = 'black'
            guessedArtist.innerText = ''
            guessedArtist.style.color = 'black'
            hasGuessed = false
            status = { [currentRoomID.innerText]: 'owner' }
        }
        player.src = data.url
        setTimeout(() => {
            if (data.progress == 0 || !hasGuessed) {
                skip.removeAttribute('disabled')
                buzzer.removeAttribute('disabled')
            }
            player.currentTime = (player.duration * data.progress) || 0
            player.play()
        }, data.start - Date.now())
        console.log('playSong', 'Starts in', data.start - Date.now(), 'ms', data, 'at', data.progress * 100, '%')
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

    socket.on('roomBuzzer', buzzerPlayerId => {
        console.log('roomBuzzer', buzzerPlayerId)
        status[buzzerPlayerId] = 'Buzzered'
        player.pause()
        buzzer.setAttribute('disabled', true)
        skip.setAttribute('disabled', true)
        buzzerPopup.style.display = 'block'
        if (socket.id == buzzerPlayerId) {
            buzzerForm.style.display = 'block'
            buzzerWait.style.display = 'none'
            hasGuessed = true
        }
        else {
            buzzerWait.style.display = 'block'
            buzzerWait.innerText = 'Buzzered by ' + nameMapper[buzzerPlayerId]
            buzzerForm.style.display = 'none'
        }
        renderPlayerlist()
    })

    socket.on('roomSkip', skipPlayerID => {
        status[skipPlayerID] = 'Skipped'
        renderPlayerlist()
    })

    socket.on('revealSong', metaData => {
        console.log('revealSong', metaData)
        guessedTitle.innerText = metaData.title
        guessedArtist.innerText = metaData.artist
        player.play()
        setTimeout(() => {
            player.pause()
            socket.emit('roomPlaySong')
        }, 5000)
    })

    socket.on('artistCorrect', (artist, players) => {
        console.log('artistCorrect', artist)
        guessedArtist.innerText = artist
        artistGuess.value = artist
        artistGuess.setAttribute('disabled', true)
        guessedArtist.style.color = 'green'
        currentRoom.players = players
        renderPlayerlist()
    })

    socket.on('titleCorrect', (title, players) => {
        console.log('titleCorrect', title)
        titleGuess.value = title
        titleGuess.setAttribute('disabled', true)
        guessedTitle.innerText = title
        guessedTitle.style.color = 'green'
        currentRoom.players = players
        renderPlayerlist()
    })

    socket.on('artistWrong', wrongArtist => {
        console.log('artistWrong', wrongArtist)
        guessedArtist.innerText = wrongArtist
        guessedArtist.style.color = 'red'
    })

    socket.on('titleWrong', wrongTitle => {
        console.log('titleWrong', wrongTitle)
        guessedTitle.innerText = wrongTitle
        guessedTitle.style.color = 'red'
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
    const type = name.startsWith('artist') ? 'artist' : 'title'
    const correct = name.endsWith('Correct')
    judgeGuessedData[type] = correct
    document.getElementById(`${type}Wrong`).removeEventListener('click', judgeGuess)
    document.getElementById(`${type}Correct`).removeEventListener('click', judgeGuess)
    if (Object.values(judgeGuessedData).length == 2) {
        judgeGuessedData.progress = player.currentTime / player.duration
        judgeGuessedData.correctData = correctData
        return socket.emit('roomJudge', judgeGuessedData)
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