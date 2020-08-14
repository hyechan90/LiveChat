const express = require('express')
const route = express.Router()
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const User = require('../model/User')

route.get('/login', (req, res) => {
	res.render('login.ejs', {
		message: req.query.message,
		success: req.query.success,
		user: req.session.user,
	})
})

route.post('/login', async (req, res) => {
	const user = req.body
	try {
		const foundUser = await User.findOne({ email: user.email })
		if (!foundUser) {
			res.redirect('/user/login?message=없는 계정입니다.')
			return
		}
		if (!foundUser.isVerified) {
			res.redirect('/user/login?message=인증이 안된 계정입니다.')
			return
		}
		const match = await bcrypt.compare(user.password, foundUser.password)
		if (match) {
			req.session.user = foundUser
			res.redirect('/?success=로그인 성공!')
			return
		} else {
			res.redirect('/user/login?message=비밀번호가 틀렸습니다.')
			return
		}
	} catch (e) {
		res.sendStatus(500)
		console.log(e)
	}
})

route.get('/logout', (req, res) => {
	req.session.destroy()
	res.redirect('/?success=로그아웃 했습니다.')
})

route.get('/register', (req, res) => {
	console.log(process.env.email)
	res.render('register.ejs', {
		message: req.query.message,
		user: req.session.user,
	})
})

route.post('/register', async (req, res) => {
	try {
		const user = req.body
		if (user.password !== user.password1) {
			res.redirect('/user/register?message=비밀번호가 같지 않습니다.')
			return
		}
		if (user.password.length < 8) {
			res.redirect('/user/register?message=비밀번호는 8글자 이상이여야 합니다.')
			return
		}

		if (await User.findOne({ email: user.email })) {
			res.redirect('/user/register?message=이미 회원가입한 계정입니다.')
			return
		}
		const hash = await bcrypt.hash(user.password, 10)
		user.password = hash
		const newUser = await User.create(user)

		await sendMail(newUser)

		res.redirect('/user/verify')
		return
	} catch (e) {
		res.sendStatus(500)
		console.log(e)
	}
})

route.get('/verify', async (req, res) => {
	try {
		let key = req.query.key
		if (key) {
			if (key.length !== 24) {
				res.redirect('/user/verify?message=잘못된 접근입니다.')
				return
			}
			const user = await User.findByIdAndUpdate(key, { isVerified: true })
			if (!user) {
				res.redirect('/user/verify?message=잘못된 접근입니다.')
				return
			}
			res.redirect('/user/login?success=회원가입 성공!')
		} else {
			res.render('verify.ejs', {
				message: req.query.message,
				user: req.session.user,
			})
		}
	} catch (e) {
		res.sendStatus(500)
		console.log(e)
	}
})

module.exports = route

async function sendMail(user) {
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.naver.com',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.email, // generated ethereal user
			pass: process.env.password, // generated ethereal password
		},
	})

	// send mail with defined transport object
	await transporter.sendMail({
		from: `"Live Chat" <hyechan90@naver.com>`, // sender address
		to: user.email, // list of receivers
		subject: 'Please Verify Your Email(Live Chat)', // Subject line
		html: `<h1>Thank You, ${user.name}!</h1> <p>Click on the link below to verify</p> <a href="http://localhost:3000/user/verify?key=${user._id}">Click Here!</a>`,
	})
}
