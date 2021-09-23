const socket = io()

const buzzerSound = new Audio('assets/buzzer.mp3');

const audioPlayer = document.getElementById('audioPlayer')
const table = document.getElementById('table')

const startGame = document.getElementById('startGame')
const resetGame = document.getElementById('resetGame')
const skipSong = document.getElementById('skipSong')

const artistGuess = document.getElementById('artistGuess')
const titleGuess = document.getElementById('titleGuess')
const artistTruth = document.getElementById('artistTruth')
const titleTruth = document.getElementById('titleTruth')

const artistCorrect = document.getElementById('artistCorrect')
const titleCorrect = document.getElementById('titleCorrect')
const artistWrong = document.getElementById('artistWrong')
const titleWrong = document.getElementById('titleWrong')

socket.on('connect', () => {
    console.log('connected', socket.id)
})

socket.on('song', data => {
    console.log('play', data)
    audioPlayer.src = data.url
    artistTruth.innerHTML = data.artist
    titleTruth.innerHTML = data.title
    setTimeout(() => {
        audioPlayer.play()
    }, 1000)
})

socket.on('guess', data => {
    table.style.display = 'block'

    artistGuess.innerHTML = data.artist
    titleGuess.innerHTML = data.title

    titleCorrect.disabled = false
    artistCorrect.disabled = false
    titleWrong.disabled = false
    artistWrong.disabled = false
})

let response = {
    artist: null,
    title: null
}

titleCorrect.addEventListener('click', () => {
    response.title = titleTruth.innerHTML
    titleCorrect.disabled = true
    titleWrong.disabled = true
    checkResponse()
})

titleWrong.addEventListener('click', () => {
    response.title = false
    titleCorrect.disabled = true
    titleWrong.disabled = true
    checkResponse()
})

artistCorrect.addEventListener('click', () => {
    response.artist = artistTruth.innerHTML
    artistCorrect.disabled = true
    artistWrong.disabled = true
    checkResponse()
})

artistWrong.addEventListener('click', () => {
    response.artist = false
    artistCorrect.disabled = true
    artistWrong.disabled = true
    checkResponse()
})

function checkResponse() {
    if (response.artist !== null && response.title !== null) {
        console.log('judge')
        socket.emit('judge', response)
        response = {
            artist: null,
            title: null
        }
        table.style.display = 'none'
    }
}

socket.on('buzzer', () => {
    buzzerSound.play();
    audioPlayer.pause();
})

socket.on('reveal', () => {
    setTimeout(() => {
        socket.emit('play')
    }, 1000)
})

socket.on('resume', () => {
    audioPlayer.play();
    gameStatus.innerText = 'Spielt...'
})

skipSong.addEventListener('click', () => {
    socket.emit('skip')
})

resetGame.addEventListener('click', () => {
    socket.emit('reset')
    setTimeout(() => {
        window.location.reload()
    }, 1000)
})

startGame.addEventListener('click', () => {
    socket.emit('play')
    audioPlayer.style.display = 'block'
    startGame.disabled = true
})

socket.on('disconnect', () => {
    console.log('disconnected')
})