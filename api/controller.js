const checkUser = require("../utilities/checkUser"),
  signup = require("../services/signup"),
  getLeaders = require("../services/getLeaders"),
  login = require("../services/login");

const controllers = {
  signup: async (req, res) => {
    const { username, password } = req.body;
    let isAdmin = false;
    req.body.isAdmin ? (isAdmin = req.body.isAdmin) : (isAdmin = false);
    try {
      const newUser = await checkUser(username.toLowerCase());
      if (newUser) {
        throw new Error("Username already exists");
      }
      const { token, user } = await signup(
        username.toLowerCase(),
        password,
        isAdmin
      );
      res.status(201).send({ token, user });
    } catch (e) {
      res.status(400).send(e.message);
    }
  },

  login: async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "Must provide Username or Password" });
    }
    try {
      const user = await checkUser(username);
      if (!user) {
        throw new Error("Invalid username or password");
      }
      const token = await login(password, user);
      res.status(201).send({ token, user: user.toJSON() });
    } catch (e) {
      res.status(400).send(e.message);
    }
  },

  getLeaderboard: async (req, res) => {
    try {
      const leaders = await getLeaders();
      res.status(200).send({ leaders });
    } catch (e) {
      res.status(500).send(e.message);
    }
  },
};

module.exports = controllers;
