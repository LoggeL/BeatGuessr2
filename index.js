const express = require('express')
const socketio = require('socket.io')

const socketHanlder = require('./modules/socket.js')
const expressHandler = require('./modules/express.js')

const app = express()
const server = app.listen(8000)

const io = socketio(server)
socketHanlder(io)

app.use(express.static('client'))
expressHandler(app)



