const path = require('path')
const fs = require('fs')

mbot.db = {}

mbot.db.path = path.join(process.cwd(), 'db')

fs.mkdir(mbot.db.path, () => {})

mbot.db.get = (key, def) => new Promise((resolve, reject) => {
  let tryDef = (err) => def ? mbot.db.set(key, def).then((data) => resolve(data)).catch(err => reject(err)) : reject(err)
  try {
    fs.readFile(path.join(mbot.db.path, `${key}.json`), (err,data) => {
      if (err) return tryDef(err)
      mbot[key] = JSON.parse(data)
      return resolve(mbot[key])
    })
  } catch (err) {
    return tryDef(err)
  }
})

mbot.db.set = (key, value) => new Promise((resolve, reject) => {
  try {
    if (value) mbot[key] = value
    fs.writeFile(path.join(mbot.db.path, `${key}.json`), JSON.stringify(mbot[key], null, 2), (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  } catch(err) {
    reject(err)
  }
})

mbot.db.getSync = (key, def) => {
  try {
    let data = fs.readFileSync(path.join(mbot.db.path, `${key}.json`))
    mbot[key] = JSON.parse(data)
    return mbot[key]
  } catch(err) {
    if (def) return mbot.db.setSync(key, def) 
    throw err
  }
}

mbot.db.setSync = (key, value) => {
  if (value) mbot[key] = value
  fs.writeFileSync(path.join(mbot.db.path, `${key}.json`), JSON.stringify(mbot[key], null, 2))
  return mbot[key]
}