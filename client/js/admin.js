const socket = io({
    transports: ['websocket']
})

socket.on('connect', () => {
    console.log('connected', socket.id)
})