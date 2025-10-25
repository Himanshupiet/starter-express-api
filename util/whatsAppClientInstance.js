// helpers/whatsappHelper.js
const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');

let sock; // global socket instance

/**
 * Initialize WhatsApp client
 */
async function wpInitClient() {
  const { state, saveCreds } = await useMultiFileAuthState('./temp'); // session folder
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // we'll handle QR manually
  });

  // Save session credentials when updated
  sock.ev.on('creds.update', saveCreds);

  // Listen for connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Generate QR as Data URL for frontend use
      const qrData = await QRCode.toDataURL(qr);
      global.currentQr = qrData;
      console.log('📲 QR code generated. Scan it to connect.');
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected successfully!');
      global.currentQr = null; // clear QR when connected
    }

    if (connection === 'close') {
      const reason =
        lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.message;
      console.log('❌ Connection closed:', reason);

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('🔁 Reconnecting in 5 seconds...');
        setTimeout(wpInitClient, 5000);
      } else {
        console.log('🚫 Logged out — need to re-scan QR.');
      }
    }
  });

  // Handle received messages (optional)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text) {
      console.log(`📩 Message from ${sender}: ${text}`);
    }
  });

  return sock;
}

/**
 * Send WhatsApp message
 * @param {string} number - Phone number without country code prefix (+91 not needed)
 * @param {string} message - Message text
 */
async function sendMessage(number, message) {
  if (!sock) throw new Error('⚠️ WhatsApp not connected yet.');
  const jid = `${number}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: message });
  console.log(`📤 Message sent to ${number}: ${message}`);
}

/**
 * Get latest QR code (for frontend or API response)
 */
function getQRorPairCode() {
  const qr ={ qr : global.currentQr || null , pairCode: ''}
  return  qr
}

module.exports = {
  wpInitClient,
  sendMessage,
  getQRorPairCode,
};
