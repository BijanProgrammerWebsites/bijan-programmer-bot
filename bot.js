const Telegraf = require('telegraf');

const bot = new Telegraf('1469026585:AAFQ_auIItyC9WBX1UNQiEjwXjakPoOKxWo');

bot.start((context) => {
    context.reply(`Hello, ${context.from.first_name} :D`).then();
});

bot.help((context) => {
    context.reply('Sure! I will help you :)').then();
});

bot.settings((context) => {
    context.reply('There is nothing here!').then();
});

bot.command('id', (context) => {
    context.reply(context.chat.id).then();
});

bot.command('rand', (context) => {
    context.reply(Math.random()).then();
});

bot.command('md', (context) => {
    context.reply('Markdown', {parse_mode: 'Markdown'}).then();
});

bot.command('say', (context) => {
    const input = context.message.text.substring(4);

    if (!input) context.reply('say what?!').then();
    else context.reply(input).then();
});

bot.command('placeholder', (context) => {
    context.replyWithPhoto('https://via.placeholder.com/500').then();
});

bot.hears(['hi', 'hello'], (context) => {
    context.reply(`Hello, ${context.from.first_name} :D`).then();
});

bot.hears('@all', (context) => {
    bot.telegram.getChatMembersCount(context.chat.id).then((count) => {
        context.reply(count.toString()).then();
    });
});

bot.launch().then(() => {
    console.log('Launched ...');
});
