const Discord = require('discord.js')
const fs = require('fs')

const config = require('./config.json')
const client = new Discord.Client()

client.on('ready', async () => {
    console.log(client.user.tag, 'logged in')
    let songURLs = require('./songs.json')
    const musicGuilds = client.guilds.cache.get(config.bgGuild)
    const musicCategory = musicGuilds.channels.cache.get(config.category)
    await Promise.all(musicCategory.children.map(async channel => {
        songURLs[channel.name] = []
        let size, last
        for (let i = 0; i < 20; i++) {
            const messages = await channel.messages.fetch({ limit: 100, before: last })
            const lastMsg = messages.last()
            if (!lastMsg) return
            console.log(i, channel.name, messages.size)
            size = messages.size
            last = messages.last().id
            const filteredMessages = messages.filter(m => m.attachments.size > 0 && m.attachments.first().url.endsWith('.mp3'))
            const URLs = filteredMessages.map(m => m.attachments.first().url)
            for (const url of URLs) {
                if (!songURLs[channel.name].includes(url)) {
                    songURLs[channel.name].push(url)
                }
            }
            console.log('current size', songURLs[channel.name].length)
        }
    }))
    console.log('done fetching')
    if (Object.values(songURLs).filter(c => c.length > 0).length == musicCategory.children.size) {
        fs.writeFileSync('songs.json', JSON.stringify(songURLs))
        console.log('songs.json updated')
        process.exit(0)
    }
})

client.login(config.token)