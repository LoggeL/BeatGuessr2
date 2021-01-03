const music = require('./music.js')
const scores = require('./scores.js')
const songs = require('./songs.js')
const timing = require('./timing.js')

let rooms = {}

const findRoom = (socket) => {
    if (socket.rooms.size == 0) return
    for (let roomID of socket.rooms) {
        if (roomID.startsWith('room_')) return roomID
    }
    console.error('No room for', socket.id, socket.rooms)
}

module.exports = {
    createRoom: (socket, playerName) => {
        console.log('createRoom', socket.id)
        const roomID = 'room_' + socket.id
        if (rooms[roomID] !== undefined) return console.error('createRoom', 'roomExists')
        rooms[roomID] = {
            owner: socket.id,
            players: [{ id: socket.id, playerName, owner: true }],
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
        module.exports.statsRoom(socket)
        songs.newRoom(roomID)
        music.getCategories(socket)
    },

    joinRoom: (socket, roomID, playerName) => {
        roomID = 'room_' + roomID
        console.log('joinRoom', playerName, socket.id, 'to', roomID)
        if (!rooms[roomID]) return socket.emit('statsRoom', 404)
        rooms[roomID].players.push({ id: socket.id, score: 0, playerName })
        scores.scoresInitialize(socket, roomID, socket.id)
        socket.join(roomID)
        socket.to(roomID).emit('playerJoined', { id: socket.id, score: 0, playerName })
        module.exports.statsRoom(socket)
    },

    leaveRoom: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID]) return '404'
        console.log('leaveRoom', socket.id)
        if (!rooms[roomID]) return console.error('leaveRoom', 'noRoom')
        if (roomID == 'room_' + socket.id) {
            // Host leaves, destroy room
            console.log('destroyRoom', roomID)
            delete rooms[roomID]
            scores.scoresDestroy(socket, roomID)
            songs.destroyRoom(roomID)
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
        if (!rooms[roomID]) return '404'
        console.log('statsRoom', roomID)
        if (!rooms[roomID]) {
            socket.emit('statsRoom', 'Room not found')
            return console.error('statsRoom', 'noRoom')
        }
        socket.emit('statsRoom', rooms[roomID])
    },

    startRoom: (socket) => {
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
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
        if (!rooms[roomID]) return '404'
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
            playing: false,
            buzzer: null,
            progress: 0,
            guesses: []
        }

        setTimeout(() => {
            rooms[roomID].song.playing = true
        }, Math.max(timing.getMaxPing(), 1000) + 500)
    },

    roomResumeSong: (socket, progress) => {
        console.log('roomResumeSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        if (rooms[roomID].song.playing) return '401'
        rooms[roomID].song.playing = true
        music.playSong(socket, roomID, rooms[roomID].song.url, progress)
    },

    roomPauseSong: (socket) => {
        console.log('roomPauseSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        if (!rooms[roomID].song.playing) return '401'
        rooms[roomID].song.playing = false
        music.pauseSong(socket, roomID)
    },

    roomBuzzer: (socket) => {
        console.log('roomBuzzer', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403 - Not in a Room'
        if (!rooms[roomID]) return '404 - Invalid Room'
        if (!rooms[roomID].song.playing) return '401 - Song not playing'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (rooms[roomID].song.artistGuessed && rooms[roomID].song.titleGuessed) return '401 - Already done'
        rooms[roomID].song.buzzer = {
            id: socket.id,
            time: Date.now()
        }
        rooms[roomID].song.playing = false
        music.pauseSong(socket, roomID)
        socket.to(roomID).emit('roomBuzzer', socket.id)
        socket.emit('roomBuzzer', socket.id)
    },

    roomSkip: (socket) => {
        const roomID = findRoom(socket)
        if (!roomID) return '403 - No Room'
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (!rooms[roomID].song.playing) return '401 - Song not playing'

        rooms[roomID].song.guesses.push(socket.id)
        socket.to(roomID).emit('roomBuzzer', socket.id)
        socket.emit('roomBuzzer', socket.id)
        if (rooms[roomID].song.guesses.length + 1 >= rooms[roomID].players.length) {
            module.exports.revealSong(socket, true)
        }
    },

    roomJudge: (socket, data, io) => {
        const { artist, title, progress, correctData } = data
        console.log('roomJudge', socket.id, data)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (!roomID) return '403'
        if (rooms[roomID].owner != socket.id) return '403'

        if (artist && !rooms[roomID].song.artistGuessed) {
            rooms[roomID].song.artistGuessed = socket.id
            io.to(roomID).emit('artistCorrect', correctData.artist)
            scores.scoresIncrement(socket, roomID, socket.id)
        }
        else if (!rooms[roomID].song.artistGuessed) {
            io.to(roomID).emit('artistWrong', null)
        }

        if (title && !rooms[roomID].song.titleGuessed) {
            rooms[roomID].song.titleGuessed = socket.id
            io.to(roomID).emit('titleCorrect', correctData.title)
            scores.scoresIncrement(socket, roomID, socket.id)
        }
        else if (!rooms[roomID].song.titleGuessed) {
            io.to(roomID).emit('titleWrong', null)
        }

        rooms[roomID].song.guesses.push(socket.id)
        if (rooms[roomID].song.guesses.length + 1 >= rooms[roomID].players.length || (rooms[roomID].song.titleGuessed && rooms[roomID].song.artistGuessed)) {
            module.exports.revealSong(socket, true)
        }
        else {
            module.exports.roomResumeSong(socket, progress)
        }
    },

    roomGuess: (socket, data, io) => {
        const { title, artist } = data
        console.log('roomGuess', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner == socket.id) return '403 - Owner guessing'
        if (artist === undefined || title === undefined) return '401 - No Data'
        if (rooms[roomID].song.playing) return '401 - Song is playing'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (!rooms[roomID].song.buzzer) return '403 - Buzzer not set'
        if (rooms[roomID].song.buzzer.time + 20000 < Date.now()) return '403 - Took too long'
        songs.getMeta(rooms[roomID].song.url).then(correctData => {
            io.to(rooms[roomID].owner).emit('guessedData', { guessedData: { title, artist }, correctData: correctData.tags })
            io.to(roomID).emit('closePopup')
        })
    },

    setCategory: (socket, category) => {
        console.log('setCategory', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        const categories = songs.getCategories(socket)
        if (!categories.includes(category)) return '404'
        rooms[roomID].song.category = category
        socket.to(roomID).emit('setCategory', category)
        socket.emit('setCategory', category)
    },

    revealSong: (socket, all) => {
        console.log('revealSong', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        songs.getMeta(rooms[roomID].song.url).then(metaData => {
            socket.emit('revealSong', metaData.tags)
            if (all) socket.to(roomID).emit('revealSong', metaData.tags)
        })
    },

    scoresGet: (socket) => {
        console.log('scoresGet', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID]) return '404'
        scores.scoresGet(socket, roomID)
    }
}