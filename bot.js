const {Telegraf} = require('telegraf');

require('dotenv').config();

const bot = new Telegraf(process.env.TOKEN);

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
    context.reply(context.chat.id.toString()).then();
});

bot.command('rand', (context) => {
    context.reply(Math.random().toString()).then();
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

bot.hears(/@all/g, async (context) => {
    const count = await bot.telegram.getChatMembersCount(context.chat.id);
    await context.reply(count.toString(), {reply_to_message_id: context.update.message.message_id});
    await context.reply(context.update.message.message_id.toString(), {
        reply_to_message_id: context.update.message.message_id,
    });
});

bot.launch().then(() => {
    console.log('Launched ...');
});
