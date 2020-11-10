const Discord = require('discord.js')
const config = require('./config.json')
const {
  google
} = require('googleapis')
const civicinfo = google.civicinfo('v2')

const defaultOKZIP = '73107'
const prefix = '!'
// const googleCivicInfoURL =
//   'http://oklegislature.gov/FindMyLegislature2.aspx?Address=&Address2=&City=Oklahoma%20City&Zip=73113'

const civic = google.civicinfo({
  version: 'v2',
  auth: config.GOOGLE_API
})

const client = new Discord.Client()

client.on('message', async function (message) {
  if (message.author.bot) return
  if (!message.content.startsWith(prefix)) return

  const commandBody = message.content.slice(prefix.length)
  const args = commandBody.split(' ')
  const command = args.shift().toLowerCase()
  let msg = ''

  if (command === 'officials') {
    let subcommand
    if (args[0]) {
      subcommand = args.shift().toLowerCase()
    } else {
      subcommand = 'none'
    }

    let levels = []
    let userZIP

    if (subcommand === 'federal') {
      levels.push('country')
    } else if (subcommand === 'state') {
      levels.push('administrativeArea1')
    } else if (subcommand === 'county') {
      levels.push('administrativeArea2')
      if (args[0]) {
        userZIP = args.shift().toLowerCase()
      }
      if (!userZIP) {
        msg += `\n NOTE: Since no ZIP was entered, defaulting to OKC.`
      }
    } else if (subcommand === 'local') {
      levels.push('locality')
      if (args[0]) {
        userZIP = args.shift().toLowerCase()
      }
      if (!userZIP) {
        msg += `\n NOTE: Since no ZIP was entered, defaulting to OKC.`
      }
    } else {
      if (!isNaN(subcommand)) {
        userZIP = parseInt(subcommand)
      }
    }

    if (!userZIP) userZIP = defaultOKZIP

    const res = await civic.representatives.representativeInfoByAddress({
      address: userZIP,
      levels: levels,
    })
    console.log(res.data)

    const offices = res.data.offices
    const officials = res.data.officials

    for (const office of offices) {
      let officeOfficials = []
      for (const official of office.officialIndices) {
        officeOfficials.push(officials[official])
      }

      msg +=
        `\n` +
        office.name +
        ': ' +
        officeOfficials
        .map(function (elem) {
          return elem.name
        })
        .join('; ')
    }

    console.log(msg)
    try {
      message.reply(msg)

    } catch (error) {
      console.log("ERROR!")
      console.log(error)
    }
  } else if (command === 'ping') {
    const timeTaken = Date.now() - message.createdTimestamp

    const officials = res.data.officials
    message.reply(`Pong! It took me ${timeTaken}ms`)
  } else if (command === 'whatsmydistrict') {
    let levels = []
    let userZIP

    if (args[0]) {
      console.log(args)
      userZIP = args.shift().toLowerCase()
    } else {
      msg += `\n You MUST enter your ZIP code! Defaulting to OKC.`
      userZIP = defaultOKZIP
    }

    const res = await civic.representatives.representativeInfoByAddress({
      address: userZIP,
      levels: "country",
    })
    const district = res.data.offices[3].divisionId
    message.reply(`You are in ${res.data.divisions[district].name}!`)
  } else if (command === 'help') {
    msg += `I am a bot created to help you find information quickly and easily.`
    msg += `\nNOTE: all information provided is sourced through Google Civic API and may not be perfectly accurate.`
    msg += `\n\nCommands Include: '!whatsmydistrict zip-code' to get your district`
    msg += `\nand '!officials' followed by any of "federal", "state", "county", or "local" and then your zip code.`
    message.reply(msg)
  } else if (command === 'rbg') {
    message.reply("\nThe Notorious RBG: 'I said on the equality side of it, that it is essential to a woman's equality with man that she be the decision-maker, that her choice be controlling.'", {
      files: ["https://images-na.ssl-images-amazon.com/images/I/61qEwCq794L._AC_SX522_.jpg"]
    })
  } else {
    message.reply("Whoops! I don't understand you. I am not a very smart bot.")
  }
  console.log("Responded....")
})

client.login(config.BOT_TOKEN)