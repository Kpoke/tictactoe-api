const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (loginPassword, user) => {
	let flag = await bcrypt.compare(loginPassword, user.password);
	if (!flag) {
		throw new Error("Invalid username or password");
	}

	const token = jwt.sign({ userId: user._id }, process.env.USERKEY);
	return token;
};

module.exports = login;
