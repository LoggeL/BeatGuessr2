const ping = document.getElementById('ping')
const playerName = document.getElementById('playerName')
const playerTeam = document.getElementById('playerTeam')
const submitButton = document.getElementById('submitButton')

playerName.addEventListener('keyup', readyCheck)
playerTeam.addEventListener('change', readyCheck)

function readyCheck() {
    if (playerName.value && playerTeam.value) {
        submitButton.disabled = false
    } else {
        submitButton.disabled = true
    }
}

submitButton.addEventListener('click', () => {
    if (submitButton.disabled) return
    localStorage.setItem('playerName', playerName.value)
    localStorage.setItem('playerTeam', playerTeam.value)
    window.location.href = '/game.html'
})
