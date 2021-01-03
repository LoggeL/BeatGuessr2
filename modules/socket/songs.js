const jsmediatags = require("jsmediatags")
const songs = require('../discord/songs.json')
const categories = Object.keys(songs)
const playedSongs = {}

module.exports = {
    newRoom: (roomID) => {
        playedSongs[roomID] = []
    },

    destroyRoom: (roomID) => {
        delete playedSongs[roomID]
    },

    getSong: (category, roomID) => {
        console.log('getSong', category, roomID)
        if (!songs[category]) return null
        if (!playedSongs[roomID]) return null
        const categorySongs = songs[category].filter(s => !playedSongs[roomID].includes(s))
        const random = Math.floor(Math.random() * categorySongs.length)
        playedSongs[roomID].push(categorySongs[random])
        return categorySongs[random]
    },

    getCategories: () => {
        return categories.map(c => ({ category: c, count: songs[c].length }))
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