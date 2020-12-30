const music = require('./music.js')
const scores = require('./scores.js')
const songs = require('./songs.js')

let rooms = {}

const findRoom = (socket) => {
    //console.log('findRoom', socket.id)
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
                category: null,
                url: null,
                artistGuessed: null,
                titleGuessed: null,
                playing: false,
                progress: 0,
                buzzer: null,
                guesses: []
            },
        }
        scores.scoresInitialize(socket, roomID, socket.id)
        socket.join(roomID)
        socket.emit('createRoom', roomID)
    },

    joinRoom: (socket, roomID, playerName) => {
        console.log('joinRoom', playerName, socket.id, 'to', roomID)
        if (!rooms[roomID]) return socket.emit('statsRoom', 404)
        rooms[roomID].players.push({ id: socket.id, score: 0, playerName })
        scores.scoresInitialize(socket, roomID, socket.id)
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
            console.log('destroyRoom', roomID)
            delete rooms[roomID]
            scores.scoresDestroy(socket, roomID)
            socket.to(roomID).emit('destroyRoom')
        }
        else {
            // User leaves
            const index = rooms[roomID].players.findIndex(p => p.id == socket.id);
            if (index > -1) {
                console.log('leaveRoom', roomID)
                scores.scoresRemove(socket, roomID, socket.id)
                rooms[roomID].players.splice(index, 1);
                socket.to(roomID).emit('playerLeft', socket.id)
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
        console.log('roomPlaySong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403'
        if (rooms[roomID].song.playing) return '401'
        if (!rooms[roomID].song.category) return '401'
        const url = songs.getSong(rooms[roomID].song.category)
        music.playSong(socket, roomID, url)

        if (!rooms[roomID].started) rooms[roomID].started = Date.now()

        rooms[roomID].song = {
            url,
            artistGuessed: false,
            titleGuessed: false,
            category: rooms[roomID].song.category,
            playing: true,
            buzzer: null,
            progress: 0,
            guesses: []
        }
    },

    roomResumeSong: (socket, progress) => {
        console.log('roomResumeSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403'
        if (rooms[roomID].playing) return '401'
        music.playSong(socket, roomID, rooms[roomID].song.url, progress)
    },

    roomPauseSong: (socket) => {
        console.log('roomPauseSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403'
        if (!rooms[roomID].song.playing) return '401'
        rooms[roomID].song.playing = false
        music.pauseSong(socket, roomID)
    },

    roomBuzzer: (socket) => {
        console.log('roomBuzzer', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID].song.playing) return '401'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403'
        if (rooms[roomID].song.artistGuessed && rooms[roomID].song.titleGuessed) return '401'
        rooms[roomID].song.buzzer = {
            id: socket.id,
            time: Date.now()
        }
        rooms[roomID].song.playing = false
        music.pauseSong(socket, roomID)
        socket.to(roomID).emit('roomBuzzer', socket.id)
        socket.emit('roomBuzzer', socket.id)
    },

    roomJudge: (socket, data) => {
        const { artist, title } = data
        console.log('roomJudge', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403'

        if (artist && !rooms[roomID].song.artistGuessed) {
            rooms[roomID].song.artistGuessed = socket.id
            socket.to(roomID).emit('artistCorrect', artist)
            socket.emit('artistCorrect', artist)
            scores.scoresIncrement(socket, roomID, socket.id)
        }
        else if (!rooms[roomID].song.artistGuessed) {
            socket.to(roomID).emit('artistWrong', artist)
            socket.emit('artistWrong', artist)
        }

        if (title && !rooms[roomID].song.titleGuessed) {
            rooms[roomID].song.titleGuessed = socket.id
            socket.to(roomID).emit('titleCorrect', title)
            socket.emit('titleCorrect', title)
            scores.scoresIncrement(socket, roomID, socket.id)
        }
        else if (!rooms[roomID].song.titleGuessed) {
            socket.to(roomID).emit('titleWrong', title)
            socket.emit('titleWrong', title)
        }

        rooms[roomID].song.guesses.push(socket.id)
        if (rooms[roomID].song.guesses.length + 1 >= rooms[roomID].players.length) {
            module.exports.resolveSong(socket, true)
        }
    },

    roomGuess: (socket, data, io) => {
        const { title, artist } = data
        console.log('roomGuess', socket.id)
        const roomID = findRoom(socket)
        if (rooms[roomID].owner == socket.id) return '403 - Owner guessing'
        if (artist === undefined || title === undefined) return '401 - No Data'
        if (rooms[roomID].song.playing) return '401 - Song is playing'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (!rooms[roomID].song.buzzer) return '403 - Buzzer not set'
        if (rooms[roomID].song.buzzer.time + 20000 < Date.now()) return '403 - Took too long'
        const correctData = songs.getMeta(rooms[roomID].song.url)
        io.to(roomID).emit('roomGuess', { guessedData: { title, artist }, correctData })
    },

    setCategory: (socket, category) => {
        console.log('setCategory', socket.id)
        const roomID = findRoom(socket)
        if (rooms[roomID].owner != socket.id) return '403'
        const categories = songs.getCategories(socket)
        if (!categories.includes(category)) return '404'
        rooms[roomID].song.category = category
        socket.to(roomID).emit('setCategory', category)
        socket.emit('setCategory', category)
    },

    resolveSong: (socket, all) => {
        console.log('resolveSong', socket.id)
        const roomID = findRoom(socket)
        if (rooms[roomID].owner != socket.id) return '403'
        songs.getMeta(rooms[roomID].song.url).then(metaData => {
            socket.emit('resolveSong', metaData.tags)
            if (all) socket.to(roomID).emit('resolveSong', metaData.tags)
        })
    },

    scoresGet: (socket) => {
        console.log('scoresGet', socket.id)
        const roomID = findRoom(socket)
        if (rooms[roomID]) return '404'
        scores.scoresGet(socket, roomID)
    }
}