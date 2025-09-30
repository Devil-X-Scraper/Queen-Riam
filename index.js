//Queen Riam WhatsApp Bot 
//Multifunctional WhatsApp bot 
//Not Affiliated By WhatsApp 
//Use At Your Own Risk
//Knowledge Is power, use it wisely

require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, jidDecode, proto, jidNormalizedUser, makeCacheableSignalKeyStore, delay, Browsers } = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const moment = require('moment-timezone');
const readline = require('readline');
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
require('dotenv').config();
const { File } = require('megajs'); // Use the megajs library
const { loadConfig, saveConfig } = require('./lib/config');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The rest of the new code you provided
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
// ...

const browserOptions = [
    Browsers.macOS('Safari'),
    Browsers.macOS('Chrome'),
    Browsers.windows('Firefox'),
    Browsers.ubuntu('Chrome'),
    Browsers.baileys('Baileys'), // Custom Baileys fingerprint
    Browsers.macOS('Edge'),
    Browsers.windows('Edge'),
]

// Pick one randomly each start
const randomBrowser = browserOptions[Math.floor(Math.random() * browserOptions.length)]
// Create a store object with required methods
const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
        
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    loadMessage: async (jid, id) => {
        return this.messages[jid]?.[id] || null
    }
}

let phoneNumber = "233509977126"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "Queen Riam"
global.themeemoji = "•"

const settings = require('./settings')
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve));
    } else {
        // In a non-interactive environment, use ownerNumber from settings
        // Note: Make sure `settings.ownerNumber` or `phoneNumber` is defined.
        return Promise.resolve(settings.ownerNumber || phoneNumber);
    }
};

// ... (your other code, before the startXeonBotInc function)

// Add axios to your dependencies if you haven't already
//const axios = require('axios');

// Add these to the top of your index.js file
async function acceptGroupInvite(sock, inviteCode, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sock.groupAcceptInvite(inviteCode);
            console.log(chalk.green(`🚀 Joined group with invite: ${inviteCode}`));
            return true; // Success
        } catch (err) {
            console.error(chalk.red(`❌ Failed to join group (Attempt ${attempt}/${maxRetries}): ${err.message}`));
            if (attempt === maxRetries) {
                return false; // Give up
            } else {
                // Wait 5 seconds before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}



async function main() {
    const sessionDir = path.join(__dirname, 'session');
    const credsPath = path.join(sessionDir, 'creds.json');
    try {
        await fs.promises.mkdir(sessionDir, { recursive: true });

        const sessionId = process.env.SESSION_ID;
        if (!sessionId) {
            console.log(chalk.red('No session id found. Falling back to use terminal pairing.'));
            startXeonBotInc();
            return;
        }

        if (sessionId.startsWith('RIAM~')) {
            console.log(chalk.yellow('[ ⏳ ] Decoding base64 session...'));
            const base64Data = sessionId.replace('RIAM~', '');
            if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
                throw new Error('Invalid base64 format in SESSION_ID');
            }
            const decodedData = Buffer.from(base64Data, 'base64');
            let sessionData;
            try {
                sessionData = JSON.parse(decodedData.toString('utf-8'));
            } catch (error) {
                throw new Error('Failed to parse decoded base64 session data: ' + error.message);
            }
            await fs.promises.writeFile(credsPath, decodedData);
            console.log(chalk.green('[ ✅ ] Base64 session decoded and saved successfully'));
        } else if (sessionId.startsWith('Queen~')) {
            console.log(chalk.yellow('[ ⏳ ] Downloading MEGA.nz session...'));
            const megaFileId = sessionId.replace('Queen~', '');
            const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
            const data = await new Promise((resolve, reject) => {
                filer.download((err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            await fs.promises.writeFile(credsPath, data);
            console.log(chalk.green('[ ✅ ] MEGA session downloaded successfully'));
        } else {
            throw new Error(
                "Invalid SESSION_ID format. Use 'prosxd~' for base64 or 'mega~' for MEGA.nz"
            );
        }

        startXeonBotInc();
    } catch (error) {
        console.error(chalk.red('❌ Error loading session:'), error.message);
        console.log(chalk.yellow('Falling back to QR/Pairing code method.'));
        startXeonBotInc();
    }
}

         
async function startXeonBotInc() {
    // --- choose whether to use hardcoded version ---
const USE_HARDCODED_VERSION = true  // change to false if you want auto-detect

let version
if (USE_HARDCODED_VERSION) {
    // Hardcoded version (example from your code)
    version = [2, 3000, 2017531287]
} else {
    // Auto-detect latest version from Baileys
    let fetched = await fetchLatestBaileysVersion()
    version = fetched.version
}
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: randomBrowser,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })
    
setInterval(async () => {
    try {
        const cfg = loadConfig();
        if (cfg.AUTOBIO === 'true') {
            const tz = settings.timezone || "UTC";

            const currentTime = new Date().toLocaleString('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const currentDay = new Date().toLocaleString('en-US', {
                timeZone: tz,
                weekday: 'long'
            });

            const currentDate = new Date().toLocaleString('en-GB', {
                timeZone: tz,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            await XeonBotInc.updateProfileStatus(
                `${currentTime}, ${currentDay}; ${currentDate} :- ${settings.botName}`
            );
        }
    } catch (err) {
        console.error("❌ Autobio Error:", err.message);
    }
}, 60 * 1000); // update every 1 min

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            
            
// === Anti-Edit Feature ===
// === Anti-Edit Feature ===
if (mek.message?.protocolMessage?.type === 14) {
    try {
        const cfg = loadConfig();
        if (!["private", "chat"].includes(cfg.ANTIEDIT)) return;

        const editedKey = mek.message.protocolMessage.key;
        const chatId = editedKey.remoteJid;
        const editor = mek.key.participant || mek.key.remoteJid;

        const storeMsg = XeonBotInc?.store?.messages[chatId]?.get(editedKey.id);

        let originalText = "[Original not found]";
        let originalSender = editor;
        let timeSent = "-";
        let dateSent = "-";

        if (storeMsg) {
            originalSender = storeMsg.key.participant || storeMsg.key.remoteJid || editor;
            if (storeMsg.message?.conversation) originalText = storeMsg.message.conversation;
            else if (storeMsg.message?.extendedTextMessage?.text) originalText = storeMsg.message.extendedTextMessage.text;
            else originalText = "[Non-text message]";

            const ts = Number(storeMsg.messageTimestamp) * 1000;
            timeSent = moment(ts).tz(settings.timezone || "UTC").format("HH:mm z");
            dateSent = moment(ts).tz(settings.timezone || "UTC").format("DD/MM/YYYY");
        }

        const newMsg =
            mek.message.protocolMessage?.editedMessage?.conversation ||
            mek.message.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
            "[Non-text message]";

        const antiEditMsg =
`🚨 *EDITED MESSAGE DETECTED!* 🚨
📌 Chat: ${chatId.endsWith("@g.us") ? "(Group)" : "(Private)"}
👤 Sent By: @${originalSender.split("@")[0]}
🕒 Sent At: ${timeSent}
📅 Date: ${dateSent}
✏️ Edited By: @${editor.split("@")[0]}

*Original:* ${originalText}
*Edited To:* ${newMsg}`;

        if (cfg.ANTIEDIT === "private") {
            await XeonBotInc.sendMessage(XeonBotInc.user.id, {
                text: antiEditMsg,
                mentions: [originalSender, editor]
            });
        } else if (cfg.ANTIEDIT === "chat") {
            await XeonBotInc.sendMessage(chatId, {
                text: antiEditMsg,
                mentions: [originalSender, editor]
            });
        }
    } catch (err) {
        console.error("❌ Anti-edit error:", err);
    }
}
            
// --- Auto-react and reply to WhatsApp Status ---
if (
    mek.key &&
    mek.key.remoteJid === 'status@broadcast' && // must be a status update
    mek.key.participant &&                      // participant must exist
    mek.key.participant !== XeonBotInc.user.id  // not your own status!
) {
    try {
        if (settings.AUTO_STATUS_REACT === "true") {
            const botJid = XeonBotInc.decodeJid(XeonBotInc.user.id);
            const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '💚'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await XeonBotInc.sendMessage(
                mek.key.remoteJid,
                { react: { text: randomEmoji, key: mek.key } },
                { statusJidList: [mek.key.participant, botJid] }
            );
            console.log(chalk.cyan(`[ 😺 ] Reacted to status from ${mek.key.participant} with ${randomEmoji}`));
        }

        if (settings.AUTO_STATUS_REPLY === "true") {
            await XeonBotInc.sendMessage(
                mek.key.participant,
                { text: settings.AUTO_STATUS_MSG, react: { text: '💜', key: mek.key } },
                { quoted: mek }
            );
            console.log(chalk.cyan(`[ 📩 ] Replied to status from ${mek.key.participant} with message: ${config.AUTO_STATUS_MSG}`));
        }
    } catch (err) {
        console.error('[AutoStatus Error]', err);
    }
    return; // Prevent further message handling for this status
}
//End
    
if (settings.AUTOREAD === 'true') {
    await XeonBotInc.readMessages([mek.key]);
    console.log(chalk.cyan(`[ 📖 ] Marked message from ${mek.key.remoteJid} as read.`));
}


          
            
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            
            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, { 
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363404284793169@newsletter',
                                newsletterName: 'Queen Riam',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })









    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

// --- Anti-call handler ---
XeonBotInc.ev.on('call', async (incomingCalls) => {
    try {
        const cfg = loadConfig(); // load from config.json
        if (!["decline", "block"].includes(cfg.ANTICALL)) return;

        for (let call of incomingCalls) {
            if (!call.isGroup && call.status === "offer") {
                let message = `🚨 *CALL DETECTED!* 🚨\n\n`;
                message += `@${call.from.split('@')[0]}, my owner cannot receive ${call.isVideo ? `video` : `audio`} calls at the moment.\n\n`;

                if (cfg.ANTICALL === "block") {
                    message += `❌ You are being *blocked*. Contact my owner if this was a mistake.`;
                } else {
                    message += `⚠️ Your call has been *declined*. Please avoid calling.`;
                }

                await XeonBotInc.sendMessage(call.from, {
                    text: message,
                    mentions: [call.from]
                });

                await XeonBotInc.rejectCall(call.id, call.from);

                if (cfg.ANTICALL === "block") {
                    await new Promise((r) => setTimeout(r, 8000));
                    await XeonBotInc.updateBlockStatus(call.from, "block");
                }
            }
        }
    } catch (err) {
        console.error("❌ Anti-call handler error:", err);
    }
});

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
    if (useMobile) throw new Error('Cannot use pairing code with mobile api');

    let phoneNumber;
    if (!!global.phoneNumber) {
        phoneNumber = global.phoneNumber;
    } else {
        phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please Input your WhatsApp number 😍\nFormat: 233509977126 :- `)));
    }

    // Clean the phone number - remove any non-digit characters
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Validate the phone number
    const pn = require('awesome-phonenumber');
    if (!pn('+' + phoneNumber).isValid()) {
        console.log(chalk.red('Invalid phone number. Please enter a valid WhatsApp Number international format. '));
        process.exit(1);
    }

    setTimeout(async () => {
        try {
            let code = await XeonBotInc.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)));
            console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`));
        } catch (error) {
            console.error('Error requesting pairing code:', error);
            console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'));
        }
    }, 3000);
}

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))
    
// --- Auto-join WhatsApp group ---
    try {
        // Full WhatsApp invite link
        const inviteLink = 'https://chat.whatsapp.com/CBpwu1gNYaRJ76d7SRoyrY?mode=ems_copy_t'; // replace with your invite link
        
        // Extract the invite code from the link
        const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/;
        const codeMatch = inviteLink.match(regex);

        if (!codeMatch) {
            console.warn(chalk.red('❌ Invalid invite code format in autojoin!'));
        } else {
            const inviteCode = codeMatch[1];

            // Optional: Get group info before joining
            try {
                const metadata = await XeonBotInc.groupGetInviteInfo(inviteCode);
                console.log(chalk.cyan(`📢 Group Name: ${metadata.subject}`));
                console.log(chalk.cyan(`👥 Members: ${metadata.size}`));
            } catch {
                console.warn(chalk.yellow(`⚠️ Could not fetch group info for code: ${inviteCode}`));
            }

            // Join the group
            await XeonBotInc.groupAcceptInvite(inviteCode);
            console.log(chalk.green(`✅ Auto-joined WhatsApp group using invite code: ${inviteCode}`));
        }
    } catch (err) {
        console.error(chalk.red('❌ Auto-join group failed:'), err.message);
    }
            
            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await XeonBotInc.sendMessage(XeonBotInc.user.id, {
    text:
        `👑 *${settings.botName}* is Online!\n\n` +
        `> 📌 User: ${XeonBotInc.user.name}\n` +
        `> ⚡ Prefix: ${settings.prefix}\n` +
        `> 🚀 Mode: ${settings.commandMode}\n` +
        `> 🤖 Version: ${settings.version}\n` +
        `> 👑 Owner: ${settings.botOwner}\n\n` +
        `✅ᴮᵒᵗ ᶜᵒⁿⁿᵉᶜᵗᵉᵈ ˢᵘᶜᶜᵉˢˢᶠᵘˡˡʸ\n` +
        `📢 Join our channel below 👇`,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363404284793169@newsletter', // your channel JID
            newsletterName: settings.botName,
            serverMessageId: -1
        }
    }
}, { ephemeralExpiration: 1800 });

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'Queen Riam'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: Hector Manuel`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: DevKango`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: HECTOR MANUEL`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startXeonBotInc()
        }
    })

    XeonBotInc.ev.on('creds.update', saveCreds)
    
    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
}


// Start the bot with error handling
// Start the entire process
main().catch(error => {
    console.error('Fatal error in main process:', error);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})


// --- Keep this at the very end of index.js ---

const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ Queen Riam WhatsApp Bot is running on Render!");
});

app.listen(PORT, () => {
  console.log(`🌐 Express server started on port ${PORT}`);
});