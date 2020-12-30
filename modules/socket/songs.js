const jsmediatags = require("jsmediatags")

module.exports = {
    getSong: (category) => {
        return 'https://cdn.discordapp.com/attachments/737612051056164986/793653657421348874/The_Weeknd_-_Blinding_Lights.mp3'
    },

    getCategories: () => {
        return ['Duck', 'Foo', 'Bar']
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
            // const title = 'title'
            // const artist = 'artist'
            // return { title, artist }
        })
}