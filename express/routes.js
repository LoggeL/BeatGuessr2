const fetch = require('node-fetch');

module.exports = (game, app, io) => {

    app.get('/', (req, res) => {
        res.redirect('/landing.html');
    });

    // app.get('/cors/', (req, res, next) => {
    //     const url = req.query.url;
    //     // stream the response to the client
    //     fetch(url).then(r => r.buffer()).then(b => res.send(b));
    // })
}