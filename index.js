const Discord = require('discord.js')
const config = require('./config.json')
const { google } = require('googleapis')
const civicinfo = google.civicinfo('v2')

const prefix = '!'
const googleCivicInfoURL =
  'http://oklegislature.gov/FindMyLegislature2.aspx?Address=&Address2=&City=Oklahoma%20City&Zip=73113'

const civic = google.civicinfo({ version: 'v2', auth: config.GOOGLE_API })

const client = new Discord.Client()

client.on('message', async function (message) {
  if (message.author.bot) return
  if (!message.content.startsWith(prefix)) return

  const commandBody = message.content.slice(prefix.length)
  const args = commandBody.split(' ')
  const command = args.shift().toLowerCase()

  if (command === 'officials') {
    const subcommand = args.shift().toLowerCase()
    let levels = []
    if (subcommand === 'federal') {
      levels.push('country')
    }

    if (subcommand === 'state') {
      levels.push('administrativeArea1')
    }

    if (subcommand === 'county') {
      levels.push('administrativeArea2')
    }

    if (subcommand === 'local') {
      levels.push('locality')
    }

    let msg = ''
    const res = await civic.representatives.representativeInfoByAddress({
      address: '73107',
      levels: levels,
    })
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
    message.reply(msg)
  }

  if (command === 'ping') {
    const timeTaken = Date.now() - message.createdTimestamp

    const res = await civic.representatives.representativeInfoByAddress({
      address: '73107',
    })
    console.log(res.data)
    const offices = res.data.offices
    const officials = res.data.officials
    message.reply(`Your officials are ${officials.join('; ')}.\n Two`)
    message.reply(`Your officials are ${officials.join('; ')}.`)
  }

  if (command === 'help') {
    message.reply(
      `Please enter either 'Country', 'State', 'StateFull', or 'Local' to receive results.`
    )
  }
})

client.login(config.BOT_TOKEN)
