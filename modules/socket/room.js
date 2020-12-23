const music = require('./music.js')

let rooms = {}

const findRoom = (socket) => {
    console.log('findRoom', socket.id)
    for (roomID in rooms) {
        if (rooms[roomID].players.some(p => p.id == socket.id)) {
            return roomID
        }
    }
}

module.exports = {

    createRoom: (socket, playerName) => {
        console.log('createRoom', socket.id)
        const roomID = socket.id
        if (rooms[roomID] !== undefined) return console.error('createRoom', 'roomExists')
        rooms[roomID] = {
            owner: socket.id,
            players: [{ id: socket.id, score: 0, playerName }],
            started: false,
            song: {
                url: null,
                artistGuessed: null,
                titleGuessed: null,
                category: null,
                playing: null,
                buzzer: null,
                guesses: []
            },
        }
        socket.emit('createRoom', roomID)
    },

    joinRoom: (socket, playerName) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        console.log('joinRoom', socket.id)
        console.log(rooms, roomID)
        if (!rooms[roomID]) return console.error('joinRoom', 'noRoom')
        rooms[roomID].players.push({ id: socket.id, score: 0, playerName })
        console.log('joinRoom', roomID)
        socket.join(roomID)
        socket.to(roomID).emit('playerJoined', { id: socket.id, score: 0, playerName })
    },

    leaveRoom: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        console.log('leaveRoom', socket.id)
        if (!rooms[roomID]) return console.error('leaveRoom', 'noRoom')
        if (roomID == socket.id) {
            // Host leaves, destroy room
            delete rooms[roomID]
            console.log('destroyRoom', roomID)
            socket.to(roomID).emit('destroyRoom')
        }
        else {
            // User leaves
            const index = rooms[roomID].players.findIndex(p => p.id == socket.id);
            if (rooms > -1) {
                console.log('leaveRoom', roomID)
                socket.to(roomID).emit('playerLeft', socket.id)
                rooms[roomID].players.splice(index, 1);
            }
        }
    },

    statsRoom: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        console.log('statsRoom', roomID)
        if (!rooms[roomID]) {
            socket.emit('statsRoom', 'Room not found')
            return console.error('statsRoom', 'noRoom')
        }
        socket.emit('statsRoom', rooms[roomID])
    },

    startRoom: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (roomID != socket.id) return '403'
        if (rooms[roomID].started) return '401'
        //if (rooms[roomID].players.length < 2) return '401'
        rooms[roomID].started = Date.now()
    },

    roomPlaySong: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403' 
        if (rooms[roomID].song.playing) return '401'
        const url = songs.getSong()
        music.playSong(socket, roomID, url)
    },

    roomPauseSong: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403' 
        if (!rooms[roomID].song.playing) return '401'
        music.pauseSong(socket, roomID)
    },

    roomBuzzer: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID].song.playing) return '401'
        if (rooms[roomID].guesses.includes(socket.id)) return '403'
        if (rooms[roomID].song.artistGuessed && rooms[roomID].song.titleGuessed) return '401'
        music.pauseSong(socket, roomID)
    },

    roomJudge: (socket, type, correct) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403' 

        if (correct) {
            if (type == 'artist') {
                rooms[roomID].artistGuessed = socket.id
            } else if (type == 'title') {
                rooms[roomID].titleGuessed = socket.id
            } else {
                return '401'
            }
        }
        else {
            rooms[roomID].guesses.push(socket.id)
        }
    }
}