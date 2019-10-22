mbot.db.getSync('follows', [])
let f4fOn = mbot.conf.f4fOn || false

let followBack = async (chat, data, args) => {
  if(f4fOn) {
    try {
      if (data.channel == mbot.user.channel.id) {
        let user = await mbot.getUser(data.user_id)
        if (data.user_id === mbot.user.id && args[0]) {
          user.channel = await mbot.getChannel(args[0])
        }
        if (user.channel.token != "undefined") {
          mbot.followChannel(user.channel.id, {user: mbot.user.id}).catch(err => console.log(JSON.stringify(err)))
          if (mbot.utils.add(mbot.follows, user.channel.token)) {
            console.log(`[F4F] Added channel ${user.channel.token}`)
            mbot.db.set('follows')
          } else console.log(`[F4F] Already following ${user.channel.token}!`)
        } else {
          {return}
        }
      }
    } catch (err) {
      console.log(err)
    }
  }
}

mbot.addCommandHandler('f4fon', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      f4fOn = true
      chat.msg(`F4F has been enabled.`)
    }
  }
})

mbot.addCommandHandler('f4foff', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      f4fOn = false
      chat.msg(`F4F has been disabled.`)
    }
  }
})

mbot.addMessageHandler(async (chat, data) => {
  if(f4fOn) {
    let user = await mbot.getUser(data.user_id)
    let msg = data.message.message[0].text.toLowerCase()
    if ((msg.includes('f4f') || msg.includes('follow')) && data.channel == mbot.user.channel.id && data.user_id != mbot.user.id) {
      setTimeout(() => chat.msg(`${user.channel.token}'s channel has been added to our follow list!`), 1000)
      followBack(chat, data, [user])
    }
  }
})

mbot.server.get('/follows', (req, res) => {
  if (req.query.html != undefined) return res.render('./follow.ejs', { data: mbot.conf })
  else return res.send(JSON.stringify(mbot.follows))
})

mbot.server.on('connection', (client) => {
  client.send(JSON.stringify({ event: 'follows', follows: mbot.follows }))
})