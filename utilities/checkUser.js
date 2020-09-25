const User = require("../model/user");

const checkUser = async (username) => {
  let user = await User.findOne({ username });
  return user ? user : false;
};

module.exports = checkUser;
