module.exports = (game, app, io) => {

    app.get('/', (req, res) => {
        res.redirect('/landing.html');
    });
}