// General
const audio = document.getElementById('player')
const currentRoomID = document.getElementById('currentRoomID')
const playerName = document.getElementById('playerName')
const pingContainer = document.getElementById('pingContainer')
const createRoom = document.getElementById('createRoom')
const joinRoom = document.getElementById('joinRoom')
const roomID = document.getElementById('roomID')
const gameRoom = document.getElementById('gameRoom')
const adminControls = document.getElementById('adminControls')
const categories = document.getElementById('categories')
const currentCategory = document.getElementById('currentCategory')
const startGame = document.getElementById('startGame')
const resolveTitle = document.getElementById('resolveTitle')
const resolveArtist = document.getElementById('resolveArtist')
const socketID = document.getElementById('socketID')

// Buzzer Realted
const buzzer = document.getElementById('buzzer')
const buzzerWait = document.getElementById('buzzerWait')
const buzzerForm = document.getElementById('buzzerForm')
const buzzerPopup = document.getElementById('buzzerPopup')
const titleGuess = document.getElementById('titleGuess')
const artistGuess = document.getElementById('artistGuess')
const submitGuess = document.getElementById('submitGuess')


let pingInterval, isOwner, category
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

        socket.emit('roomGuess', title, artist)
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

    if (isOwner) {
        socket.on('roomGuess', data => {
            socket.emit('roomJudge', data)
        })
    }

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
            resolveTitle.innerText = ''
            resolveTitle.style.color = 'black'
            resolveArtist.innerText = ''
            resolveArtist.style.color = 'black'
        }
        player.src = data.url
        setTimeout(() => {
            console.log(player.duration * data.progress, player.duration, data.progress)
            player.currentTime = player.duration * data.progress
            player.play()
        }, data.start - Date.now())
        console.log('Starts in', data.start - Date.now(), 'ms', data)
        buzzer.removeAttribute('disabled')
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
        resolveTitle.innerText = metaData.title
        resolveArtist.innerText = metaData.artist
    })

    socket.on('artistCorrect', artist => {
        resolveArtist.innerText = artist
        resolveArtist.style.color = 'green'
    })

    socket.on('titleCorrect', title => {
        resolveTitle.innerText = title
        resolveTitle.style.color = 'green'
    })

    socket.on('artistWrong', wrongArtist => {
        resolveArtist.innerText = wrongArtist
        resolveArtist.style.color = 'red'
    })

    socket.on('titleWrong', wrongTitle => {
        resolveTitle.innerText = wrongTitle
        resolveTitle.style.color = 'red'
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