let rooms = {}

module.exports = {

    createRoom: (socket, playerName) => {
        console.log('createRoom', socket.id)
        const roomID = socket.id
        if (rooms[roomID] !== undefined) return console.error('createRoom', 'roomExists')
        rooms[roomID] = [{ id: socket.id, score: 0, playerName }]
        socket.emit('createRoom', roomID)
    },

    joinRoom: (socket, roomID, playerName) => {
        console.log('joinRoom', socket.id)
        console.log(rooms, roomID)
        if (!rooms[roomID]) return console.error('joinRoom', 'noRoom')
        rooms[roomID].push({ id: socket.id, score: 0, playerName })
        console.log('joinRoom', roomID)
        socket.join(roomID)
        socket.to(roomID).emit('playerJoined', { id: socket.id, score: 0, playerName })
    },

    leaveRoom: (socket, roomID) => {
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
            const index = rooms[roomID].findIndex(p => p.id == socket.id);
            if (rooms > -1) {
                console.log('leaveRoom', roomID)
                socket.to(roomID).emit('playerLeft', socket.id)
                rooms.splice(index, 1);
            }
        }
    },

    statsRoom: (socket, roomID) => {
        console.log('statsRoom', roomID)
        if (!rooms[roomID]) {
            socket.emit('statsRoom', 'Room not found')
            return console.error('statsRoom', 'noRoom')
        }
        socket.emit('statsRoom', rooms[roomID])
    },

    findRoom: (socket) => {
        console.log('findRoom', socket.id)
        for (roomID in rooms) {
            console.log(rooms[roomID], socket.id, rooms[roomID].some(p => p.id == socket.id))
            if (rooms[roomID].some(p => p.id == socket.id)) {
                return roomID
            }
        }
    }


}