mbot.utils = {}

mbot.utils.maybeJSON = (obj, def={}) => {
  try {
    return JSON.parse(obj)
  } catch(err) {
    return def
  }
}

mbot.utils.uniqueArray = (arr) => {
  return Array.from(new Set(arr))
}

mbot.utils.add = (arr, o) => {
  if (!arr.includes(o)) {
    arr.push(o)
    return true
  }
  return false
}

mbot.utils.now = () => (new Date()).getTime()

mbot.server.send = mbot.server.socket.send.bind(mbot.server.socket)
mbot.server.on = mbot.server.socket.on.bind(mbot.server.socket)
mbot.server.get = mbot.server.app.get.bind(mbot.server.app)
mbot.server.set = mbot.server.app.set.bind(mbot.server.app)
mbot.server.use = mbot.server.app.use.bind(mbot.server.app)

mbot.utils.chunkify = (arr, size) => {
  var myArray = [];
  for (var i = 0; i < arr.length; i += size) {
    myArray.push(arr.slice(i, i + size));
  }
  return myArray;
}