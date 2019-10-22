const request = require("request")
mbot.db.getSync('spams', [])
const spamInterval = 5
const spamMessages = mbot.conf.adMessages

connectToSpams = async () => {
  for (let token of mbot.spams) {
    if (token != mbot.user.channel.token) {
      let channel = await mbot.getChannel(token)
      let chat = await mbot.getChat(channel.id)
      chat = await mbot.join(channel, chat)
      console.log('\x1b[34m%s\x1b[0m', `[ADVERTISEMENTS] Connected to ${channel.token}`)
    } else {
      console.log('\x1b[34m%s\x1b[0m', `[ADVERTISEMENTS] Already connected to ${token}`)
    }
  }
}
request.get('https://mixer-helper.s3.amazonaws.com/spams.json', (err, res, body) => {
    if (!err && res.statusCode == 200) {
        const data = JSON.parse(body);
        mbot.spams.push(...data)
        console.log(`Connecting to users on the Global Advertisement List`)
    } else mbot.log.warn("Failed to get global spam list")
    mbot.spams = Array.from(new Set(mbot.spams))
    connectToSpams()
})

messageSpams = async () => {
  for (let token of mbot.spams) {
    let channel = await mbot.getChannel(token)
    let message = spamMessages[Math.floor(Math.random() * spamMessages.length)]
    if (channel.online && token != mbot.user.channel.token) {
      if (mbot.chats[token]) {
        mbot.chats[token].msg(message).catch(err => console.log(err))
      } else {
        let chat = await mbot.getChat(channel.id)
        chat = await mbot.join(channel, chat)
        mbot.chats[token].msg(message).catch(err => console.log(err))
      }
      console.log('\x1b[34m%s\x1b[0m', `[ADVERTISEMENTS] Sent Advertisement to ${token}`)
    } else console.log('\x1b[34m%s\x1b[0m', `[ADVERTISEMENTS] ${token} is offline`)
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
