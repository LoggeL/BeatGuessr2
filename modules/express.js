const fetch = require('node-fetch')
const music = require('./socket/music.js')

module.exports = (app) => {
    app.get('/music.mp3', function (req, res) {
        const url = music.getSong()
        fetch(url).then(response => {
            res.set({
                'content-type': response.headers['content-type'],
                'content-length': response.headers['content-length'],
            })
            response.body.pipe(res)
        })
    })
}
