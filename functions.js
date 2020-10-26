module.exports = (client) => {
    const Discord = require('discord.js');
    const chalk = require('chalk')
    const times = x => f => {
        if (x > 0) {
            f()
            times (x - 1) (f)
        } 
    }

    client.loadcommand = (commandName,dir) => {
        try {
            const props = require(`./commands/${dir}/${commandName}`);
            client.commands.set(props.help.name, props);
            
            props.help.aliases.forEach(a => {
                client.aliases.set(a, props.help.name)
            });
        }catch (e) {
            //true for extended err logs
            if(true){console.error(chalk.bgRed("ERR") + " " +  `Unable to load ${commandName}: ${e.message}\n${e.stack}`)}else{console.error(chalk.bgRed("ERR") + " " +  `Unable to load ${commandName}: ${e}`)}
        }
    }
    
}