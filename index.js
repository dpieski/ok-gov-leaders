const Discord = require('discord.js')
const config = require('./config.json')
const { google } = require('googleapis')
const civicinfo = google.civicinfo('v2')

const defaultOKZIP = '73107'
const prefix = '!'

const civic = google.civicinfo({
  version: 'v2',
  auth: config.GOOGLE_API,
})

const client = new Discord.Client()

client.on('message', async function (message) {
  if (message.author.bot) return
  if (!message.content.startsWith(prefix)) return

  const commandBody = message.content.slice(prefix.length)
  const args = commandBody.split(' ')
  const command = args.shift().toLowerCase()
  let subcommand
  let msg = ''
  let alreadySent = false

  if (command === 'officials') {
    if (args[0]) {
      subcommand = args.shift().toLowerCase()
    } else {
      subcommand = 'none'
    }

    let levels = []
    let userZIP
    let tryContactInfo = false

    if (subcommand === 'federal') {
      levels.push('country')
      if (!isNaN(args[0])) {
        userZIP = parseInt(args.shift().toLowerCase())
      } else {
        userZIP = defaultOKZIP
      }
    } else if (subcommand === 'state') {
      levels.push('administrativeArea1')
      console.log('In state subcommnad....')
      if (!isNaN(args[0])) {
        userZIP = parseInt(args.shift().toLowerCase())
      } else {
        userZIP = defaultOKZIP
      }
    } else if (subcommand === 'county') {
      levels.push('administrativeArea2')
      if (!isNaN(args[0])) {
        userZIP = parseInt(args.shift().toLowerCase())
      } else {
        msg += `\n NOTE: Since no ZIP was entered, defaulting to OKC.`
        userZIP = defaultOKZIP
      }
    } else if (subcommand === 'local') {
      levels.push('locality')
      if (!isNaN(args[0])) {
        userZIP = parseInt(args.shift().toLowerCase())
      } else {
        msg += `\n NOTE: Since no ZIP was entered, defaulting to OKC.`
        userZIP = defaultOKZIP
      }
    } else {
      if (!isNaN(subcommand)) {
        userZIP = parseInt(subcommand)
      } else if (subcommand != 'none') {
        tryContactInfo = true
      }
    }

    if (!tryContactInfo && userZIP && args[0]) {
      subcommand = args.shift().toLowerCase()
      tryContactInfo = true
    }

    if (!userZIP) {
      msg += `\nNOTE: No ZIP was entered so defaulting to OKC.`
      userZIP = defaultOKZIP
    }

    const res = await civic.representatives.representativeInfoByAddress({
      address: userZIP,
      levels: levels,
    })
    console.log(res.data)

    const offices = res.data.offices
    const officials = res.data.officials

    if (tryContactInfo) {
      console.log('In trying contact info....')
      alreadySent = getOfficialContactInfo(msg, subcommand, officials, message)

      for (const office of offices) {
        if (office.name.toLowerCase().includes(subcommand)) {
          for (const officialIndex of office.officialIndices) {
            alreadySent = getOfficialContactInfo(
              msg,
              officials[officialIndex],
              officials,
              message
            )
          }
        }
      }
    } else {
      if (offices) {
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
      } else {
        msg += `\nI'm sorry. I couldn't find any ${subcommand} officials or offices!`
      }
    }

    console.log(msg)
    if (!alreadySent) {
      try {
        message.reply(msg)
      } catch (error) {
        console.log('ERROR!')
        console.log(error)
      }
    }
  } else if (command === 'ping') {
    const timeTaken = Date.now() - message.createdTimestamp
    message.reply(`Pong! It took me ${timeTaken}ms`)
  } else if (command === 'whatsmydistrict') {
    let userZIP

    if (args[0]) {
      console.log(args)
      const subcommand = args.shift().toLowerCase()
      if (!isNaN(subcommand)) {
        userZIP = parseInt(subcommand)
      }
    } else {
      msg += `\n You MUST enter your ZIP code!`
      message.reply(msg)
      return
    }

    const res = await civic.representatives.representativeInfoByAddress({
      address: userZIP,
      levels: 'country',
    })
    // Set this up to select the U.S. Representative based on either name: "U.S. Representative" or "roles" includes "legislatorLowerBody" to get Rep's district
    const district = res.data.offices[3].divisionId
    msg += `\nYou are in ${res.data.divisions[district].name}!`
    message.reply(msg)
  } else if (command === 'help') {
    msg += `I am a bot created to help you find information quickly and easily.`
    msg += `\nNOTE: all information provided is sourced through Google Civic API and may not be perfectly accurate.`
    msg += `\n\nCommands Include:`
    msg += `\n'!whatsmydistrict zip' to get your district.`
    msg += `\n'!officials [federal|state|county|local] [zip]' to get your Officials for a particular jurisdictional level.`
    msg += `\n'!officials [official's name]' to get contact information for a particular official.`
    msg += `\n'!help' to get this help screen.`
    msg += `\n\nIf you have any suggestions for additional information, please contact PatLawAtty (andrewp#5308).`

    message.reply(msg)
  } else if (command === 'rbg') {
    message.reply(
      "\nThe Notorious RBG: 'I said on the equality side of it, that it is essential to a woman's equality with man that she be the decision-maker, that her choice be controlling.'",
      {
        files: [
          'https://images-na.ssl-images-amazon.com/images/I/61qEwCq794L._AC_SX522_.jpg',
        ],
      }
    )
  } else {
    msg += "Whoops! I don't understand you. I am not a very smart bot."
    msg += `\nTo learn more about my commands, type '!help'`
    msg += `\n\nIf you think I should have understood that, send a message to PatLawAtty (andrewp#5308)`
    message.reply(msg)
  }
  console.log(`Responded to ${command} and ${subcommand}....`)
})

function getOfficialContactInfo(msg, wantedofficial, officials, message) {
  for (const official of officials) {
    if (official.name.toLowerCase().includes(wantedofficial)) {
      msg += `\nInformation for ${official.name}:`
      msg += `\nParty: ${official.party}`

      msg += `\nAddress:`
      msg += `\n    ${official.address[0].line1}`
      msg += `\n    ${official.address[0].city}, ${official.address[0].state} ${official.address[0].zip}`

      if (official.phones) {
        msg += `\nPhone(s):`
        for (const phone of official.phones) {
          msg += `\n    ${phone}`
        }
      }

      if (official.urls) {
        msg += `\nHome Page(s):`
        for (const url of official.urls) {
          msg += `\n    ${url}`
        }
      }

      if (official.channels) {
        msg += `\nSocial Media:`
        for (const media of official.channels) {
          msg += `\n    ${media.type}: ${media.id}`
        }
      }

      if (official.photoUrl) {
        message.reply(msg, {
          files: [official.photoUrl],
        })
      } else {
        message.reply(msg)
      }

      return true
    }
  }
}

client.login(config.BOT_TOKEN)
