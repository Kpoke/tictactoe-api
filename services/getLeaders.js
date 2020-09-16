const User = require("../model/user");

const signup = async () => {
  return await User.find().sort({ points: "descending" }).limit(100);
};

module.exports = signup;
