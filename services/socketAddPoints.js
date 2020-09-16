const jwt = require("jsonwebtoken");
const User = require("../model/user");

module.exports = async (token) => {
  const decoded = jwt.verify(token, process.env.USERKEY);
  const user = await User.findOne({ _id: decoded.userId });
  if (!user) {
    return "User is not authorized";
  }
  user.points += 3;
  user.save();
};
