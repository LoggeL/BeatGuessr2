const jsmediatags = require("jsmediatags")
const songs = require('../discord/songs.json')
const categories = Object.keys(songs)
const playedSongs = {}

module.exports = {
    newRoom: (roomID) => {
        playedSongs[roomID] = {}
    },

    destroyRoom: (roomID) => {
        delete playedSongs[roomID]
    },

    getSong: (category, roomID) => {
        if (!songs[category]) return null
        if (!playedSongs[roomID]) return null
        const categorySongs = songs[category].filter(s => !playedSongs[roomID].includes(s))
        const random = Math.floor(Math.random() * categorySongs.length)
        playedSongs[roomID].push(categorySongs[random])
        return categorySongs[random]
        //return 'https://cdn.discordapp.com/attachments/737612051056164986/793653657421348874/The_Weeknd_-_Blinding_Lights.mp3'
    },

    getCategories: () => {
        return categories.map(c => c + ' - ' + songs[c].length)
    },

    getMeta: (url) =>
        new Promise((resolve, reject) => {
            jsmediatags.read(url, {
                onSuccess: function (tag) {
                    resolve(tag)
                },
                onError: function (error) {
                    reject(error)
                }
            });
        })
}