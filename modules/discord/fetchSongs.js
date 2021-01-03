const Discord = require('discord.js')
const fs = require('fs')

const config = require('./config.json')
const client = new Discord.Client()

client.on('ready', async () => {
    console.log(client.user.tag, 'logged in')
    let songURLs = {}
    const musicGuilds = client.guilds.cache.get(config.bgGuild)
    const musicCategory = musicGuilds.channels.cache.get(config.category)
    await musicCategory.children.map(async channel => {
        songURLs[channel.name] = []
        let size, last
        for (let i = 0; i < 10; i++) {
            const messages = await channel.messages.fetch({ limit: 100, before: last })
            const lastMsg = messages.last()
            if (!lastMsg) break
            size = messages.size
            last = messages.last().id
            const filteredMessages = messages.filter(m => m.attachments.size > 0 && m.attachments.first().url.endsWith('.mp3'))
            const URLs = filteredMessages.map(m => m.attachments.first().url)
            songURLs[channel.name] = [...songURLs[channel.name], ...URLs]
        }
        if (channel == musicCategory.children.last()) {
            fs.writeFileSync('songs.json', JSON.stringify(songURLs))
            process.exit(0)
        }
    })
})

client.login(config.token)