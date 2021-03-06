const music = require('./music.js')
const songs = require('./songs.js')
const timing = require('./timing.js')

let rooms = {}
let correctMeta = {}

const findRoom = (socket) => {
    if (!socket.rooms) return
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
        correctMeta[roomID] = {}
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
            delete correctMeta[roomID]
            songs.destroyRoom(roomID)
            socket.to(roomID).emit('destroyRoom')
        }
        else {
            // User leaves
            const index = rooms[roomID].players.findIndex(p => p.id == socket.id);
            if (index > -1) {
                console.log('leaveRoom', roomID)
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

    playSong: (socket) => {
        console.log('playSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403 - Not in a Room'
        if (!rooms[roomID]) return '404 - Invalid Room'
        if (rooms[roomID].owner != socket.id) return '403 - Not owner'
        //if (rooms[roomID].song.playing) return '401 - Already playing'
        if (!rooms[roomID].song.category) return '401 - No category set'
        const url = songs.getSong(rooms[roomID].song.category, roomID)
        if (!url) return socket.emit('categoryOutOfSongs')
        songs.getMeta(url).then(correctData => {
            const { artist, title } = correctData.tags
            correctMeta[roomID] = { artist, title }
        })
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

    resumeSong: (socket) => {
        console.log('resumeSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        if (rooms[roomID].song.playing) return '401'
        rooms[roomID].song.playing = true
        rooms[roomID].song.buzzer = null
        if (rooms[roomID].song.progress == 0) rooms[roomID].song.progress = 0.1
        music.playSong(socket, roomID, rooms[roomID].song.url, rooms[roomID].song.progress)
    },

    pauseSong: (socket) => {
        console.log('pauseSong', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403'
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        if (!rooms[roomID].song.playing) return '401'
        rooms[roomID].song.playing = false
        music.pauseSong(socket, roomID)
    },

    buzzer: (socket) => {
        console.log('buzzer', socket.id)
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
        socket.to(roomID).emit('buzzer', socket.id)
        socket.emit('buzzer', socket.id)
    },

    skip: (socket) => {
        console.log('skip', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403 - No Room'
        if (!rooms[roomID]) return '404 - Invalid Room'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (!rooms[roomID].song.playing) return '401 - Song not playing'

        rooms[roomID].song.guesses.push(socket.id)
        socket.to(roomID).emit('skip', socket.id)
        socket.emit('skip', socket.id)
        if (rooms[roomID].song.guesses.length + 1 >= rooms[roomID].players.length) {
            module.exports.revealSong(socket, true)
        }
    },

    setProgress: (socket, progress) => {
        console.log('setProgress', socket.id)
        const roomID = findRoom(socket)
        if (!roomID) return '403 - Not in a Room'
        if (!rooms[roomID]) return '404 - Invalid Room'
        if (rooms[roomID].owner != socket.id) return '403 - Not owner'
        if (!rooms[roomID].song.buzzer) return '403 - Not buzzered'
        if (!progress) return '404 - Progress not passed'
        rooms[roomID].song.progress = progress
    },

    judge: (socket, data, io) => {
        console.log('judge', socket.id, data)
        const { artistCorrect, titleCorrect, artistWrong, titleWrong } = data
        const roomID = findRoom(socket)
        if (!roomID) return '403 - Not in a Room'
        if (!rooms[roomID]) return '404 - Invalid Room'
        if (rooms[roomID].owner != socket.id) return '403 - Not owner'
        if (!rooms[roomID].song.buzzer) return '403 - Not buzzered'

        const buzzerPlayer = rooms[roomID].players.find(p => p.id === rooms[roomID].song.buzzer.id)

        // Artist
        if (artistCorrect && !rooms[roomID].song.artistGuessed) {
            console.log('artistCorrect', correctMeta[roomID].artist)
            rooms[roomID].song.artistGuessed = socket.id
            buzzerPlayer.score++
            io.to(roomID).emit('artistCorrect', correctMeta[roomID].artist, rooms[roomID].players)
        }
        else if (!rooms[roomID].song.artistGuessed) {
            console.log('artistWrong', artistWrong)
            io.to(roomID).emit('artistWrong', artistWrong)
        }

        // Title
        if (titleCorrect && !rooms[roomID].song.titleGuessed) {
            console.log('titleCorrect', correctMeta[roomID].title)
            rooms[roomID].song.titleGuessed = socket.id
            buzzerPlayer.score++
            io.to(roomID).emit('titleCorrect', correctMeta[roomID].title, rooms[roomID].players)
        }
        else if (!rooms[roomID].song.titleGuessed) {
            console.log('titleWrong', titleWrong)
            io.to(roomID).emit('titleWrong', titleWrong)
        }

        rooms[roomID].song.guesses.push(socket.id)
        if (
            rooms[roomID].song.guesses.length + 1 >= rooms[roomID].players.length
            || (rooms[roomID].song.titleGuessed && rooms[roomID].song.artistGuessed)
        ) {
            module.exports.revealSong(socket, true)
        }
        else {
            module.exports.resumeSong(socket)
        }
    },

    guess: (socket, data, io) => {
        const { title, artist } = data
        console.log('guess', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner == socket.id) return '403 - Owner guessing'
        if (artist === undefined || title === undefined) return '401 - No Data'
        if (rooms[roomID].song.playing) return '401 - Song is playing'
        if (rooms[roomID].song.guesses.includes(socket.id)) return '403 - Already guessed'
        if (!rooms[roomID].song.buzzer) return '403 - Buzzer not set'
        //if (rooms[roomID].song.buzzer.time + 20000 < Date.now()) return '403 - Took too long'

        io.to(rooms[roomID].owner).emit('guessedData', {
            guessedData: { title, artist },
            correctData: { title: correctMeta[roomID].title, artist: correctMeta[roomID].artist }
        })
        io.to(roomID).emit('closePopup')
    },

    setCategory: (socket, category) => {
        console.log('setCategory', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        if (rooms[roomID].owner != socket.id) return '403'
        const categories = songs.getCategories(socket).map(c => c.category)
        if (!categories.includes(category)) return '404'
        rooms[roomID].song.category = category
        socket.to(roomID).emit('setCategory', category)
        socket.emit('setCategory', category)
    },

    revealSong: (socket, all) => {
        console.log('revealSong', socket.id)
        const roomID = findRoom(socket)
        if (!rooms[roomID]) return '404'
        socket.emit('revealSong', { title: correctMeta[roomID].title, artist: correctMeta[roomID].artist })
        if (all) socket.to(roomID).emit('revealSong', { title: correctMeta[roomID].title, artist: correctMeta[roomID].artist })
    }
}