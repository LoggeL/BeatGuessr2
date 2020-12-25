const socket = io();
const audio = document.getElementById('player')
const currentID = document.getElementById('currentID')
const playerName = document.getElementById('playerName')
const pingContainer = document.getElementById('ping-container')
const createRoom = document.getElementById('createRoom')
const joinRoom = document.getElementById('joinRoom')
const roomID = document.getElementById('roomID')
const preGameRoom = document.getElementById('preGameRoom')
let pingInterval, isOwner
let currentRoom = {}
socket.on('connect', () => {
    console.log('connected', socket.id)

    createRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        socket.emit('createRoom', playerName.value)
        createRoom.remove()
    })

  joinRoom.addEventListener('click', () => {
        const name = playerName.value
        if (!name) return alert('Kein Name')
        socket.emit('joinRoom', roomID.value, playerName.value)
        joinRoom.remove()
        socket.emit('statsRoom')
    })

    socket.on('createRoom', () => {

        currentID.innerText = socket.id
        currentRoom.id = socket.id

        socket.emit('statsRoom')
    })

    socket.on('statsRoom', data => {
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
           //player.play()   
        }, data.start - Date.now())
        console.log('Starts in', data.start - Date.now(), 'ms', data)
    })
  
    socket.on('destroyRoom', () => {
        alert('Host left room')
        window.location.reload(true)
    })
})

socket.on('disconnect', reason => {
    console.log('disconnected', reason)
    clearInterval(pingInterval)
    socket.removeAllListeners();
})