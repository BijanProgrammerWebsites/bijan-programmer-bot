const {Api, TelegramClient} = require('telegram');
const {StringSession} = require('telegram/sessions');
const input = require('input');
const fs = require('fs');

require('dotenv').config();

const {API_ID, API_HASH, SESSION_ID} = process.env;
const stringSession = new StringSession(SESSION_ID || '');

let client;
let latestState;
let latestDate;

const archive = async (path, data) => {
    fs.writeFile(path, JSON.stringify(data, null, '\t'), () => {});
};

const login = async () => {
    client = new TelegramClient(stringSession, +API_ID, API_HASH, {connectionRetries: 5});

    await client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });

    if (!SESSION_ID) console.log('Session ID:', client.session.save());
};

const getAllGroupChats = async () => {
    const {chats} = await client.invoke(new Api.messages.GetAllChats({exceptIds: []}));
    const groups = chats.filter((x) => (x.className = 'Chat'));
};

const updateState = async () => {
    latestState = await client.invoke(new Api.updates.GetState({}));
};

const mentionAllMembers = async (participants, peer, messageId) => {
    const userIds = participants.map((x) => x.userId);
    const users = await client.invoke(new Api.users.GetUsers({id: userIds}));
    const usernames = users
        .filter((user) => !user.bot)
        .map((user) => user.username)
        .filter((username) => !!username);

    const chunks = [];
    const size = 5;
    for (let i = 0; i < participants.length; i += size) chunks.push(usernames.slice(i, i + size));

    for (const [index, chunk] of chunks.entries()) {
        const message = chunk.map((username) => `@${username}`).join(' ');
        await client.invoke(
            new Api.messages.SendMessage({
                peer,
                replyToMsgId: messageId,
                message,
                randomId: BigInt(messageId - index * 100),
            })
        );
    }

    console.log('mentioned all.');
};

const mentionAllGroupMembersIfNeeded = async (messages) => {
    for (const x of messages) {
        const className = x?.peerId?.className;
        if (!x?.message?.includes('@all') || className !== 'PeerChat') continue;

        const {chatId} = x.peerId;
        const {fullChat} = await client.invoke(new Api.messages.GetFullChat({chatId}));

        await mentionAllMembers(fullChat.participants.participants, chatId, x.id);
    }
};

const mentionAllChannelMembersIfNeeded = async (messages) => {
    for (const x of messages) {
        const className = x?.peerId?.className;
        if (!x?.message?.includes('@all') || className !== 'PeerChannel') continue;

        const {channelId} = x.peerId;

        const {participants} = await client.invoke(
            new Api.channels.GetParticipants({
                channel: channelId,
                filter: new Api.ChannelParticipantsRecent({}),
                offset: 0,
                limit: 100,
                hash: 0,
            })
        );

        await mentionAllMembers(participants, channelId, x.id);
    }
};

const processMessages = async () => {
    console.log('processing ...');

    const xyz = await client.invoke(
        new Api.updates.GetDifference({
            ...latestState,
            date: latestDate || latestState.date,
            ptsTotalLimit: 5000,
        })
    );

    await archive('./archive/xyz.json', xyz);

    const {newMessages, otherUpdates, date} = xyz;

    if (newMessages) {
        // await archive('./archive/newMessages.json', newMessages);
        await mentionAllGroupMembersIfNeeded(newMessages);
        await mentionAllChannelMembersIfNeeded(otherUpdates.map((x) => x.message));
        await updateState();
        // latestDate = date;
    }
};

const main = async () => {
    await login();
    await updateState();

    while (true) {
        await processMessages();
        await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    }
};

main().then();
