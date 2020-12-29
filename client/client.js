// General
const audio = document.getElementById('player')
const currentRoomID = document.getElementById('currentRoomID')
const playerName = document.getElementById('playerName')
const pingContainer = document.getElementById('pingContainer')
const createRoom = document.getElementById('createRoom')
const joinRoom = document.getElementById('joinRoom')
const roomID = document.getElementById('roomID')
const gameRoom = document.getElementById('gameRoom')
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
const buzzerWait = document.getElementById('buzzerWait')
const buzzerForm = document.getElementById('buzzerForm')
const buzzerPopup = document.getElementById('buzzerPopup')
const titleGuess = document.getElementById('titleGuess')
const artistGuess = document.getElementById('artistGuess')
const submitGuess = document.getElementById('submitGuess')


let pingInterval, isOwner, category, judgeGuessData
let currentRoom = {}

const socket = io()

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
        socket.emit('joinRoom', roomID.value.trim(), playerName.value.trim())
        joinRoom.parentNode.style.display = 'none'
        socket.emit('statsRoom')
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
    })

    submitGuess.addEventListener('click', () => {
        const artist = artistGuess.disabled ? null : artistGuess.value.trim()
        const title = titleGuess.disabled ? null : titleGuess.value.trim()

        socket.emit('roomGuess', { title, artist })
    })

    socket.on('artistCorrect', artist => {
        artistGuess.value = artist
        artistGuess.setAttribute('disabled', true)
    })

    socket.on('roomBuzzer', buzzerPlayerId => {
        player.pause()
        buzzer.setAttribute('disabled', true)
        buzzerPopup.style.display = 'block'
        if (socket.id == buzzerPlayerId) {
            buzzerForm.style.display = 'block'
            buzzerWait.style.display = 'none'
        }
        else {
            buzzerWait.style.display = 'block'
            buzzerWait.innerText = 'Buzzered by ' + buzzerPlayerId
            buzzerForm.style.display = 'none'
        }
    })

    socket.on('roomGuess', (data) => {
        buzzerPopup.style.display = 'none'

        titleGuessAdmin.innerText = data.guessedData.title + ' | ' + data.correctData.title
        artistGuessAdmin.innerText = data.guessedData.artist + ' | ' + data.correctData.artist
        judgeGuessedData = {}

        titleCorrect.addEventListener('click', judgeGuess)
        titleWrong.addEventListener('click', judgeGuess)

        artistCorrect.addEventListener('click', judgeGuess)
        artistWrong.addEventListener('click', judgeGuess)
    })

    socket.on('createRoom', () => {
        currentRoomID.innerText = socket.id
        currentRoom.id = socket.id
        adminControls.style.display = 'block'
        isOwner = true
        socket.emit('getCategories')
        socket.emit('statsRoom')
    })

    socket.on('getCategories', categoryData => {
        for (let i = 0; i < categoryData.length; i++) {
            const button = document.createElement('button')
            button.innerText = categoryData[i]
            button.onclick = () => setCategory(button.innerText)
            categories.append(button)
        }
    })

    socket.on('statsRoom', data => {
        console.log(data)
        if (data == '404') {
            console.error('NoRoom')
            return joinRoom.parentNode.style.display = 'block'
        }

        currentRoomID.innerText = data.owner
        currentRoom.players = data.players
        gameRoom.innerText = data.players.map(p => p.id + ' - ' + p.playerName).join('\n')
    })

    pingInterval = setInterval(() => {
        socket.emit('ping', Date.now())
    }, 2000)

    socket.on('ping', latency => {
        if (latency + ' ms' != pingContainer.innerText)
            pingContainer.innerText = latency + ' ms'
    })

    // socket.emit('getSong', true)
    socket.on('playerJoined', data => {
        if (currentRoom.players) {
            currentRoom.players.push(data)
            // Update List
            gameRoom.innerText = currentRoom.players.map(p => p.id + ' - ' + p.playerName).join('\n')
        }
    })

    socket.on('playerLeft', playerID => {
        console.log('playerLeft', playerID)
        if (currentRoom.players) {
            const index = currentRoom.players.findIndex(e => e.id == playerID)
            currentRoom.players.splice(index, 1);
            // Update List
            gameRoom.innerText = currentRoom.players.map(p => p.id + ' - ' + p.playerName).join('\n')
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
        }
        player.src = data.url
        setTimeout(() => {
            buzzer.removeAttribute('disabled')
            player.currentTime = player.duration * data.progress
            player.play()
        }, data.start - Date.now())
        console.log('Starts in', data.start - Date.now(), 'ms', data)
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

    socket.on('resolveSong', metaData => {
        guessedTitle.innerText = metaData.title
        guessedArtist.innerText = metaData.artist
        setTimeout(() => {
            socket.emit('roomPlaySong')
        }, 5000)
    })

    socket.on('artistCorrect', artist => {
        guessedArtist.innerText = artist
        guessedArtist.style.color = 'green'
    })

    socket.on('titleCorrect', title => {
        guessedTitle.innerText = title
        guessedTitle.style.color = 'green'
    })

    socket.on('artistWrong', wrongArtist => {
        guessedArtist.innerText = wrongArtist
        guessedArtist.style.color = 'red'
    })

    socket.on('titleWrong', wrongTitle => {
        guessedTitle.innerText = wrongTitle
        guessedTitle.style.color = 'red'
    })
})

socket.on('disconnect', reason => {
    console.log('disconnected', reason)
    clearInterval(pingInterval)
    socket.removeAllListeners();
    setTimeout(() => {
        window.location.reload(true)
    }, 5000)
})

function setCategory(value) {
    if (!isOwner) return
    console.log('setCategory', value)
    socket.emit('setCategory', value)
}

function judgeGuess(element) {
    const name = element.target.id
    console.log(name)
    const type = name.startsWith('artist') ? 'artist' : 'title'
    const correct = name.endsWith('Correct')
    judgeGuessedData[type] = correct
    document.getElementById(`${type}Wrong`).removeEventListener('click', judgeGuess)
    document.getElementById(`${type}Correct`).removeEventListener('click', judgeGuess)
    if (Object.values(judgeGuessedData).length == 2)
        return socket.emit('judgeGuess', judgeGuessedData)
}