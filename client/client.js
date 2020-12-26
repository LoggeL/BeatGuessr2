const audio = document.getElementById('player')
const currentID = document.getElementById('currentID')
const playerName = document.getElementById('playerName')
const pingContainer = document.getElementById('pingContainer')
const createRoom = document.getElementById('createRoom')
const joinRoom = document.getElementById('joinRoom')
const roomID = document.getElementById('roomID')
const preGameRoom = document.getElementById('preGameRoom')
const adminControls = document.getElementById('adminControls')
const categories = document.getElementById('categories')
const currentCategory = document.getElementById('currentCategory')
const startGame = document.getElementById('startGame')
const resolveSong = document.getElementById('resolveSong')

let pingInterval, isOwner, category
let currentRoom = {}

const socket = io()

socket.on('connect', () => {
    console.log('connected', socket.id)

    createRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        socket.emit('createRoom', playerName.value)
        createRoom.parentNode.remove()
    })

    joinRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        socket.emit('joinRoom', roomID.value, playerName.value)
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

    socket.on('createRoom', () => {
        currentID.innerText = socket.id
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
        if (data == '404') {
            console.error('NoRoom')
            return joinRoom.parentNode.style.display = 'block'
        }

        currentRoom.players = data.players
        preGameRoom.innerText = data.players.map(p => p.id + ' - ' + p.playerName).join('\n')
    })

    pingInterval = setInterval(() => {
        socket.emit('ping', Date.now())
    }, 2000)

    socket.on('ping', latency => {
        if ('Ping: ' + latency + ' ms' != pingContainer.innerText)
            pingContainer.innerText = 'Ping: ' + latency + ' ms'
    })

    // socket.emit('getSong', true)
    socket.on('playerJoined', data => {
        if (currentRoom.players) {
            currentRoom.players.push(data)
            // Update List
            preGameRoom.innerText = currentRoom.players.map(p => p.id + ' - ' + p.playerName).join('\n')
        }
    })

    socket.on('playerLeft', playerID => {
        console.log('playerLeft', playerID)
        if (currentRoom.players) {
            const index = currentRoom.players.findIndex(e => e.id == playerID)
            currentRoom.players.splice(index, 1);
            // Update List
            preGameRoom.innerText = currentRoom.players.map(p => p.id + ' - ' + p.playerName).join('\n')
        }
    })


    socket.on('playSong', data => {
        player.src = data.url
        setTimeout(() => {
           player.play()   
        }, data.start - Date.now())
        console.log('Starts in', data.start - Date.now(), 'ms', data)
    })

    socket.on('destroyRoom', () => {
        alert('Host left room')
        window.reload(true)
    })

    socket.on('setCategory', setCategory => {
        console.log('ownerSetCategory', setCategory)
        category = setCategory
        currentCategory.innerText = setCategory
    })

    socket.on('resolveSong', metaData => {
        resolveSong.innerText = metaData.title + ' - ' + metaData.artist
    })
})

socket.on('disconnect', reason => {
    console.log('disconnected', reason)
    clearInterval(pingInterval)
    socket.removeAllListeners();
    setTimeout(() => {
        window.reload(true)
    }, 5000)
})

function setCategory(value) {
    if (!isOwner) return
    console.log('setCategory', value)
    socket.emit('setCategory', value)
}