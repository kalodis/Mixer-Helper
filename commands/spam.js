const request = require("request")
mbot.db.getSync('spams', [])
const spamInterval = 5
const spamMessages = mbot.conf.adMessages || [
  `F4F L4L - mixer.com/${mbot.user.channel.token}`,
  `Support 4 Support - mixer.com/${mbot.user.channel.token}`,
  `Check out my channel - mixer.com/${mbot.user.channel.token}`,
  `Lurk for Lurk - mixer.com/${mbot.user.channel.token}`
]

connectToSpams = async () => {
  for (let token of mbot.spams) {
    if (token != mbot.user.channel.token) {
      let channel = await mbot.getChannel(token)
      let chat = await mbot.getChat(channel.id)
      chat = await mbot.join(channel, chat)
      console.log(`[ADVERTISEMENTS] Connected to ${channel.token}`)
    } else {
      console.log(`[ADVERTISEMENTS] Already connected to ${token}`)
    }
  }
}
request.get('https://mixer-helper.s3.amazonaws.com/spams.json', (err, res, body) => {
    if (!err && res.statusCode == 200) {
        const data = JSON.parse(body);
        mbot.spams.push(...data)
    }
    connectToSpams()
})

messageSpams = async () => {
  for (let token of mbot.spams) {
    let channel = await mbot.getChannel(token)
    let message = spamMessages[Math.floor(Math.random()*spamMessages.length)]
    if (channel.online) {
      mbot.chats[token].msg(message)
      console.log(`[ADVERTISEMENTS] Sent Advertisement to ${token}`)
    } else console.log(`[ADVERTISEMENTS] ${token} is offline`)
    if (mbot.spams.length >= 1000) await mbot.delay(3500)
  }
}
setInterval(messageSpams, 1000 * 60 * spamInterval)

mbot.server.get('/spams', (req, res) => {
  if (req.query.html != undefined) return res.render('./spam.ejs', { data: mbot.conf })
  else return res.send(JSON.stringify(mbot.spams))
})

mbot.server.on('connection', (client) => {
  client.send(JSON.stringify({ event: 'spams', spams: mbot.spams }))
})
