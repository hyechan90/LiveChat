const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const mongoose = require('mongoose')
const session = require('express-session')

require('dotenv').config()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use(
	session({
		secret: process.env.password,
		resave: false,
		saveUninitialized: true,
	})
)

global.rooms = []

const userRoute = require('./routes/user')
const roomRoute = require('./routes/room')

app.use('/user', userRoute)
app.use('/room', roomRoute)

app.get('/', (req, res) => {
	console.log(rooms)
	res.render('index.ejs', {
		message: req.query.message,
		success: req.query.success,
		user: req.session.user,
		rooms: rooms,
	})
})

app.post('/', (req, res) => {
	res.send(req.body)
})

io.on('connection', (socket) => {
	socket.on('join-room', (roomId, userId) => {
		console.log('join')
		for (let i = 0; i < rooms.length; i++) {
			if (rooms[i].id === roomId) {
				rooms[i].userCount++
				break
			}
		}
		socket.join(roomId)
		socket.to(roomId).broadcast.emit('user-connected', userId)

		socket.on('disconnect', () => {
			socket.to(roomId).broadcast.emit('user-disconnected', userId)
			console.log('left')
			for (let i = 0; i < rooms.length; i++) {
				if (rooms[i].id === roomId) {
					rooms[i].userCount--
					if (rooms[i].userCount === 0) {
						rooms.splice(i, 1)
					}
					break
				}
			}
		})
	})
})

mongoose.connect(
	'mongodb://localhost:27017/liveChat',
	{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
	() => {
		console.log('connected to DB')
	}
)

server.listen(3000)
