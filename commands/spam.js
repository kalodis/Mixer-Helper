const request = require("request")
mbot.db.getSync('spams', [])
const spamInterval = 3
const spamMessages = mbot.conf.adMessages
const messageLiveTime = 1000 * 60 * mbot.conf.liveNowInterval



connectToSpams = async () => {
  try {
  for (let token of mbot.spams) {
    if (token != mbot.user.channel.token) {
      let channel = await mbot.getChannel(token)
      let chat = await mbot.getChat(channel.id)
      chat = await mbot.join(channel, chat)
    } else {
      return;
    }
  }
  } catch (err) {
    console.log(err)
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

messageLive = async () => {
  try {
    for (let token of mbot.spams) {
    let channel = await mbot.getChannel(token)
    let message = liveMessages[Math.floor(Math.random()*liveMessages.length)]
    if (channel.online) {
      if (mbot.user.channel.online) {
        if(!mbot.user.channel.online) {return}
      if (mbot.chats[token]) {
        mbot.chats[token].msg(message).catch(err => console.log(err))
      } else {
        let chat = await mbot.getChat(channel.id)
        chat = await mbot.join(channel, chat)
        mbot.chats[token].msg(message).catch(err => console.log(err))
      }
      mbot.log.info(`[LIVE NOW SENT] Channel: ${token} - Message: ${message}`)
    }
    } else {return}
    if (mbot.spams.length >= 1000) await mbot.delay(3500)
  }
} catch (err) {
  console.log(err)
}
}
setInterval(messageLive, messageLiveTime)

messageSpams = async () => {
  for (let token of mbot.spams) {
    let channel = await mbot.getChannel(token)
    let message = spamMessages[Math.floor(Math.random()*spamMessages.length)]
      if (mbot.chats[token]) {
        mbot.chats[token].msg(message).catch(err => console.log(err))
      } else {
        let chat = await mbot.getChat(channel.id)
        chat = await mbot.join(channel, chat)
        mbot.chats[token].msg(message).catch(err => console.log(err))
      }
      mbot.log.info(`[AD SENT] Channel: ${token} - Message: ${message}`)
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
