const socket = io()

const scoreTable = document.getElementById('scoreTable');
const playerLists = document.querySelectorAll('ul');
const lastSong = document.getElementById('lastSong');
const lastSongCover = document.getElementById('lastSongCover');
const lastSongContainer = document.getElementById('lastSongContainer');

const medals = ["🥇", "🥈", "🥉"]

socket.on('connect', () => {
  console.log('connected', socket.id)

  socket.on('updatePlayers', players => {
    console.log('updatePlayers', players)

    playerLists.forEach(e => e.innerHTML = '')

    Object.values(players).forEach(player => {
      if (!player) return
      const li = document.createElement('li');
      li.innerText = player.name + ': ' + player.score;
      if (!player.team) return
      playerLists[Number(player.team) - 1].appendChild(li);
    })

  })

  socket.on('updateScores', score => {
    console.log('updateScores', score)

    const teams = Object.values(score).sort((a, b) => {
      return b.score - a.score
    })
    scoreTable.innerHTML = ''
    // Sort score

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.innerText = medals[i] || (i + 1)
      tr.appendChild(td)

      const td2 = document.createElement('td')
      td2.innerText = team.name
      tr.appendChild(td2)

      const td3 = document.createElement('td')
      td3.innerText = team.score
      tr.appendChild(td3)

      scoreTable.appendChild(tr)
    }
  })


  socket.on('reveal', data => {
    lastSongContainer.style.display = 'block'
    console.log('reveal', data)
    fetch('/cover').then(r => r.blob().then(blob => {
      lastSongCover.src = URL.createObjectURL(blob);
    }))
    lastSong.innerText = data.title + ' - ' + data.artist
  })
})


socket.on('disconnect', () => {
  console.log('disconnected')
})