module.exports.config = {
        name: 'help',
        version: '1.0.1',
        role: 0,
        hasPrefix: false,
        aliases: ['help', 'commands', 'cmd'],
        description: "Beginner's guide and command list",
        usage: "Help [page] or [command]",
        credits: 'ARI',
};

module.exports.run = async function ({
        api,
        event,
        enableCommands,
        args,
        Utils,
        prefix
}) {
        const input = args[0];
        try {
                const eventCommands = enableCommands[1].handleEvent;
                const commands = enableCommands[0].commands;

                const perPage = 10;
                const totalPages = Math.ceil(commands.length / perPage);
                const page = !isNaN(input) ? Math.max(1, Math.min(parseInt(input), totalPages)) : 1;
                const start = (page - 1) * perPage;
                const end = start + perPage;

                if (!input || !isNaN(input)) {
                        // 🎨 REDESIGNED HELP MESSAGE
                        let helpMessage = `╔═══════════════════════╗\n`;
                        helpMessage += `║       🤖 BOT HELP      ║\n`;
                        helpMessage += `╚═══════════════════════╝\n\n`;
                        
                        helpMessage += `📖 Command List » Page ${page} of ${totalPages}\n\n`;
                        
                        // Command list with better formatting
                        for (let i = start; i < Math.min(end, commands.length); i++) {
                                helpMessage += `▫️ ${i + 1}. ${prefix}${commands[i]}\n`;
                        }
                        
                        helpMessage += `\n───────────────\n`;
                        helpMessage += `🔹 Navigation:\n`;
                        helpMessage += `• ${prefix}help [page] » View other pages\n`;
                        helpMessage += `• ${prefix}help [command] » Command details\n`;
                        helpMessage += `• Total Commands: ${commands.length}\n\n`;

                        // Event commands section
                        if (page === 1 && eventCommands.length) {
                                helpMessage += `🎯 Event Commands:\n`;
                                eventCommands.forEach((eventCommand, index) => {
                                        helpMessage += `▫️ E${index + 1}. ${prefix}${eventCommand}\n`;
                                });
                                helpMessage += `\n`;
                        }

                        helpMessage += `💡 Tip: Use "${prefix}help commandname" for detailed info!`;
                        
                        return api.sendMessage(helpMessage, event.threadID, event.messageID);
                } else {
                        const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) =>
                                key.includes(input?.toLowerCase())
                        )?.[1];

                        if (command) {
                                const {
                                        name,
                                        version,
                                        role,
                                        aliases = [],
                                        description,
                                        usage,
                                        credits,
                                        cooldown,
                                        hasPrefix
                                } = command;

                                // 🎨 REDESIGNED COMMAND INFO
                                const roleMessage =
                                        role !== undefined
                                                ? (role === 0
                                                        ? '👤 User'
                                                        : role === 1
                                                                ? '👑 Admin'
                                                                : role === 2
                                                                        ? '⚡ Thread Admin'
                                                                        : role === 3
                                                                                ? '💎 Super Admin'
                                                                                : '')
                                                : '';

                                const aliasesMessage = aliases.length ? `🔤 Aliases: ${aliases.join(', ')}` : '';
                                const descriptionMessage = description ? `📝 ${description}` : '';
                                const usageMessage = usage ? `💬 Usage: ${usage}` : '';
                                const creditsMessage = credits ? `👨‍💻 Credits: ${credits}` : '';
                                const versionMessage = version ? `🔢 Version: ${version}` : '';
                                const cooldownMessage = cooldown ? `⏰ Cooldown: ${cooldown}s` : '';

                                const message = 
                                `╔═══════════════════════╗\n` +
                                `║     🎯 COMMAND INFO   ║\n` +
                                `╚═══════════════════════╝\n\n` +
                                `🔹 Command: ${prefix}${name}\n` +
                                `${versionMessage ? `🔹 ${versionMessage}\n` : ''}` +
                                `${roleMessage ? `🔹 Permission: ${roleMessage}\n` : ''}` +
                                `${aliasesMessage ? `🔹 ${aliasesMessage}\n` : ''}` +
                                `${descriptionMessage ? `🔹 ${descriptionMessage}\n` : ''}` +
                                `${usageMessage ? `🔹 ${usageMessage}\n` : ''}` +
                                `${creditsMessage ? `🔹 ${creditsMessage}\n` : ''}` +
                                `${cooldownMessage ? `🔹 ${cooldownMessage}\n` : ''}` +
                                `\n💡 Use "${prefix}help" to see all commands.`;
                                
                                return api.sendMessage(message, event.threadID, event.messageID);
                        } else {
                                return api.sendMessage(
                                        `❌ Command "${input}" not found.\n` +
                                        `💡 Use "${prefix}help" to see available commands.`, 
                                        event.threadID, 
                                        event.messageID
                                );
                        }
                }
        } catch (error) {
                console.log(error);
                return api.sendMessage(
                        '⚠️ An error occurred while processing your request.', 
                        event.threadID, 
                        event.messageID
                );
        }
};

module.exports.handleEvent = async function ({ api, event, prefix }) {
        const { threadID, messageID, body } = event;
        const message = prefix ? 
                `🔹 My prefix is: ${prefix}\n` +
                `💡 Type "${prefix}help" to see all commands!` : 
                "🗨️ My prefix is...";
                
        if (body?.toLowerCase().startsWith('prefix')) {
                api.sendMessage(message, threadID, messageID);
        }
};
