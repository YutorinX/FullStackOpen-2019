const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const loginRouter = require("express").Router()
const User = require("../models/user")

loginRouter.get("/", async (req, res) => {
  const users = await User.find({})
  res.json(users.map(user => user.toJSON()))
})

loginRouter.post("/", async (req, res) => {
  const body = req.body

  // リクエストのユーザー名からDBを検索
  const user = await User.findOne({ username: body.username })
  // compareでハッシュ含め検索
  const passwordCorrect =
    user === null
      ? false
      : await bcrypt.compare(body.password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: "invalid username or password"
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id
  }
  //トークン生成、SECRET文字列でデジタル署名する。
  const token = jwt.sign(userForToken, process.env.SECRET)

  res.status(200).send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter
