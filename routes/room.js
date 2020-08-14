const express = require('express')
const route = express.Router()
const { v4: uuidV4 } = require('uuid')

route.get('/make', (req, res) => {
	if (!req.session.user) {
		res.redirect('/user/login?message=잘못된 접근입니다.')
		return
	}
	res.render('make.ejs', {
		message: req.query.message,
		success: req.query.success,
		user: req.session.user,
	})
})

route.post('/make', (req, res) => {
	const room = req.body
	const id = uuidV4()

	room['id'] = id
	room['userCount'] = 0
	rooms.push(room)
	res.redirect(`/room/${id}`)
})

route.get('/:room', (req, res) => {
	if (!req.session.user) {
		res.redirect(
			'/user/login?message=방에 참가하기 위해서는 로그인 하셔야 합니다.'
		)
	}
	res.render('room', { roomId: req.params.room })
})

module.exports = route
