  const Discord = require('discord.js')
  // @ts-ignore
  const fs = require('fs')
  const { promisify } = require("util");
  // @ts-ignore
  const { inspect } = require("util");
  const readdir = promisify(require("fs").readdir);
  const Enmap = require("enmap")
  const chalk = require('chalk');

  console.log("Modules Loaded!")

  const client = new Discord.Client({ shardCount: 1, presence: { status: 'idle', activity: { name: 'Booting...' } } })

  // @ts-ignore
  const package = require('./package.json');
  // @ts-ignore
  const mode_list = require('./storage/data/modes.json');

  const dp = "!" //default prefix
  const token = 'token' //token to login

  const logging = true //log all ran commands
  const spam = true //antispam enable

  client.settings = {
    "defaultprefix": dp,
    "econ": econ,
    "dmchannel": dmchannel,
    "serverlog": serverlog,
    "lp_chn_id": lp_chn_id,
    "lp_msg_id": lp_msg_id,
    "verifychannel": verifychannel,
    "leveling": leveling,
    "live_panel": live_panel,
    "music": music,
    "blacklist": bclk,
    "antispam": spam,
    "persistant": ['546008502754082830', '701081621717319720']
  }

  console.log("Bot settings loaded!")

  // @ts-ignore
  if (!leveling) console.warn(chalk.yellow("WARN") + " " + "Leveling System Disabled!")

  // @ts-ignore
  if (!spam) console.warn(chalk.yellow("WARN") + " " + "Antispam System Disabled!")

  // Enmap init
  let config = new Enmap({ name: "config" })
  let rank = new Enmap({ name: "rank" })
  let warn = new Enmap({ name: "warn" })
  let mode = new Enmap({ name: "ctrlset" })
  let blacklist = new Enmap({ name: "bclk" })
  let commands = new Enmap();
  let aliases = new Enmap();
  let temp = new Enmap();
  console.log("Enmap init done!")

  try {
    require('./functions.js')(client);
    client.temp = temp
    client.config = config
    client.rank = rank
    client.warn = warn
    client.commands = commands
    client.aliases = aliases
    client.blacklist = blacklist

    // Search for "PERMLVL_INJECT" for Perm Import
    // Search for "PREFIX_INJECT" for Prefix Import
    console.log("Import Done!")
  } catch (e) {
    console.error(chalk.bgRed("ERR") + " " + e)
  }

  if (Boolean(require('inspector').url())) client.on('debug', async (info) => { console.debug(chalk.yellowBright(info)) })

  client.on('shardReady', (id, unavialable) => console.log(`Shard ${id} launched!`));

  client.on('ready', async () => {
    console.info(chalk.green(`${client.user.username} has started running ${client.ws.shards.size} Shard(s), with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`))

    client.user.setStatus('online')

    //advanced status
    let a = 5
    client.user.setActivity('Bravo Six going Dark')
    setInterval(() => {
      if (a == 1) {
        client.user.setActivity(`over ${client.users.cache.size} Members`, { url: 'https://www.twitch.tv/hammer1279', type: 'WATCHING' },)
        a = 2
        return
      }
      if (a == 2) {
        client.user.setActivity(`in ${client.guilds.cache.size} Servers`, { url: 'https://www.twitch.tv/hammer1279', type: 'PLAYING' },)
        a = 3
        return
      }
      if (a == 3) {
        client.user.setActivity(`Update ${package.version} - ${package.update}`, { url: 'https://www.twitch.tv/hammer1279', type: 'WATCHING' },)
        a = 1
        return
      }
    }, 10000)

    //dynamic command init
    let f = 0;
    let i = 0;
    async function loaddir(dir) {
      if (!music && dir == "music") return f++
      const cmdFiles = await readdir(`./commands/${dir}`); f++
      cmdFiles.forEach(f => { client.loadcommand(f, dir); i++; });
      if (f == cmdDirs.length) console.log(`Loaded ${i} commands`)
    }
    const cmdDirs = await readdir(`./commands/`)
    cmdDirs.forEach(async d => await loaddir(d))
  });

  //      event handler
  const events = await readdir("./events/")
  events.forEach(e => {
    const eventFunction = require(`./events/${e}`)
    const event = eventFunction.event || e.split('.')[0];
    const emitter = (typeof eventFunction.emitter === 'string' ? client[eventFunction.emitter] : eventFunction.emitter) || client;
    const once = eventFunction.once;
    try {
      emitter[once ? 'once' : 'on'](event, (...args) => eventFunction.run(...args, client));
    } catch (error) {
      console.error(error.stack);
    }
  })


  console.log(chalk.yellow("Init done!"))

  /*dm listener*/
  client.on('message', async message => {
    if (message.author.bot || message.guild) return;
    let msgContent = message.content
    let attachment
    let content
    if (!msgContent) {
      attachment = message.attachments.first().url
      content = "Picture:"
    } else {
      if (message.attachments.first()) {
        attachment = message.attachments.first().url
      } else {
        attachment = null
      }
      content = msgContent
    }
    const embed = new Discord.MessageEmbed()
      .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, format: 'png', size: 1024 }))
      .setDescription(message.author.id)
      .addField(`DM-Message:`, content)
      .setImage(attachment)
      .setTimestamp()
      .setColor("#ff0000")
    client.channels.cache.get(dmchannel).send(embed)
  })

  //          spam protection
  if (spam) {
    let recent = new Map()
    client.on('message', async message => {
      if (message.author.bot || !message.guild) return
      if (bclk) {
        if (blacklist.get("users").includes(message.author.id)) return
        if (blacklist.get("servers").includes(message.guild.id)) return
      }
      if (!config.has(message.guild.id)) return
      let mp = message.content.toUpperCase().slice(0, config.get(message.guild.id, "prefix").length)
      let up = config.get(message.guild.id, "prefix").toUpperCase()
      if (mp !== up) return;
      let st = 30 // seconds to clear status
      let si = 5 // messages to chat warn
      let sw = 10 // messages to dm warn
      let sb = 15 // messages to ban [not included with NOS-V4]
      if (recent.has(message.author.id)) {
        recent.set(message.author.id, { timestamp: recent.get(message.author.id).timestamp, count: recent.get(message.author.id).count + 1 })
      } else {
        // @ts-ignore
        let timestamp = message.createdTimestamp + (new Date() - message.createdTimestamp)
        recent.set(message.author.id, { timestamp: timestamp, count: 0 })
      }
      if (recent.get(message.author.id).count > si) message.reply(`Slow down! ✋`)
      if (recent.get(message.author.id).count > sw) message.member.send(`Stop spamming or you will get banned from ${client.user.username}!`)
      // if (recent.get(message.author.id).count > sb) { blacklist.push("users", message.author.id); message.member.send(`So you were unable to resist getting banned?\nNow it's too late to stop, but there is still hope!\n\nReply to this message to contact Support and request a unban if you stopped spamming 😄`) }
      // @ts-ignore
      if ((new Date() - recent.get(message.author.id).timestamp) > st * 1000) recent.delete(message.author.id)
    })
  }

  //          command handler + Permlevel Calc
  client.on('message', async message => {
    if (!message.guild || message.author.bot) return;
    message.guild.members.fetch(message.author);
    if (!config.has(message.guild.id)) config.set(message.guild.id, {})
    let prefix;
    if (!config.has(message.guild.id, "prefix")) { config.set(message.guild.id, dp, "prefix"); return client.emit('message', message) } else { prefix = config.get(message.guild.id, "prefix") }
    /*PREFIX_INJECT*/ client.prefix = prefix
    /*CONFIG SETUP*/
    if (!config.has(message.guild.id, "channels")) config.set(message.guild.id, { join: "disabled", chat: "disabled", log: "disabled" }, "channels")
    if (!warn.has(message.guild.id)) warn.set(message.guild.id, {/* case:0 */ })
    if (!warn.has(message.guild.id, message.author.id)) warn.set(message.guild.id, { warnings: [], count: 0 }, message.author.id)
    if (bclk) {
      if (blacklist.get("users").includes(message.author.id)) return
      if (blacklist.get("servers").includes(message.guild.id)) return
    }
    let permlvl

    if (!message.member.hasPermission("MANAGE_MESSAGES") || !message.member.hasPermission("ADMINISTRATOR")) {
      permlvl = 1
    }

    if (message.member.hasPermission("MANAGE_MESSAGES")) {
      permlvl = 2
    }

    if (message.member.hasPermission("ADMINISTRATOR")) {
      permlvl = 3
    }

    /*PERMLVL_INJECT*/ client.permlvl = permlvl

    let msg = message.content.toUpperCase();
    let args = message.content.slice(prefix.length).trim().split(" ");
    let command = args.shift().toLowerCase();
    let cmd
    if (mode.get(message.guild.id) == 1) {
      if (commands.has(command)) { cmd = commands.get(command).help.name } else { cmd = aliases.get(command) }
    } else { cmd = command }

    if (message.content.toLowerCase().includes(`<@${client.user.id}> prefix`)) message.channel.send(`My prefix on this server is **${prefix}**`)
    if (message.content.toLowerCase().includes(`<@!${client.user.id}> prefix`)) message.channel.send(`My prefix on this server is **${prefix}**`)

    let mprefix = msg.slice(0, prefix.length)
    let uprefix = prefix.toUpperCase()
    if (mprefix !== uprefix) return;
    if (!mode.has(message.guild.id)) mode.set(message.guild.id, 1)
    let path = mode_list[mode.get(message.guild.id)].path.commands
    try {
      if (logging) { if (!cmd) return; console.log(`| ${chalk.green(new Date().toLocaleString())} | ${chalk.red(message.guild.name)} | ${chalk.cyan(message.author.tag)} | ${chalk.white(cmd)}`) }
      fs.access(`${path}/${commands.get(cmd).help.category}/${cmd}.js`, fs.F_OK, (err) => {
        if (err) {
          try {
            commands.get(command).run(client, message, args)
          } catch { return }
          return
        }
        let commandFile = require(`${path}/${commands.get(cmd).help.category}/${cmd}.js`);
        commandFile.run(client, message, args)
      })
    } catch (e) {
      // console.error(e)
    }
  });

  client.login(token)