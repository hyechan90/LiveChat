const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	birth: {
		type: Date,
		require: true,
	},
	password: {
		type: String,
		require: true,
	},
	email: {
		type: String,
		require: true,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
})
module.exports = mongoose.model('User', UserSchema)
