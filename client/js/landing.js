const socket = io({
    transports: ['websocket']
})

const ping = document.getElementById('ping')
const playerName = document.getElementById('playerName')
const playerTeam = document.getElementById('playerTeam')
const submitButton = document.getElementById('submitButton')

socket.on('connect', () => {
    console.log('connected', socket.id)
    setInterval(() => {
        socket.emit('ping', Date.now())
    }, 1000)

    socket.on('pong', timestamp => {
        ping.innerText = `${Math.round((Date.now() - timestamp) * .5)} ms`
    })

    playerName.addEventListener('keyup', readyCheck)
    playerTeam.addEventListener('change', readyCheck)

    function readyCheck() {
        if (playerName.value && playerTeam.value) {
            submitButton.disabled = false
        } else {
            submitButton.disabled = true
        }
    }

    submitButton.addEventListener('click', () => {
        if (submitButton.disabled) return
        localStorage.setItem('playerName', playerName.value)
        localStorage.setItem('playerTeam', playerTeam.value)
        window.location.href = '/game.html'
    })
})

socket.on('disconnect', () => {
    console.log('disconnected')
})