const fs = require('fs')
const jsmediatags = require("jsmediatags");

const songs = require('../discord/songs.json')

const category = 'jpfy'

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

module.exports = (game, socket, app, io) => {
  socket.on('play', () => {
    console.log('play')
    // get random song
    shuffleArray(songs[category])
    const url = songs[category].shift()
    game.song.url = url

    jsmediatags.read(url, {
      onSuccess: function (tag) {
        game.song.tag = tag.tags
        game.song.title = tag.tags.title
        game.song.artist = tag.tags.artist
        console.log({
          url: url,
          title: tag.tags.title,
          artist: tag.tags.artist
        })
        io.emit('song', {
          url: url,
          title: tag.tags.title,
          artist: tag.tags.artist
        })
        io.emit('play')
      },
      onError: function(error) {
        console.log(':(', error.type, error.info);
      }
    });
  })
  
    socket.on('reveal', data => {
      socket.emit('reveal', data)
  })
}