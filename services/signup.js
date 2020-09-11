const jwt = require("jsonwebtoken");
const User = require("../model/user");

const signup = async (username, password, isAdmin) => {
  const user = new User({ username, password, isAdmin });
  await user.save();
  const token = jwt.sign({ userid: user._id }, process.env.USERKEY);
  return { token, user };
};

module.exports = signup;
