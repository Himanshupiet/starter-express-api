const { makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const WhatsappSession = require('../models/WhatsappSession');

let sock; // global socket instance

function makeMongoKeyStore(initialKeys = {}) {
  const store = { ...initialKeys };
  return {
    get: async (type, ids) => {
      const result = {};
      ids.forEach(id => {
        if (store[type]?.[id]) result[id] = store[type][id];
      });
      return result;
    },
    set: async (data) => {
      for (const type in data) {
        if (!store[type]) store[type] = {};
        Object.assign(store[type], data[type]);
      }
    },
    clear: async () => { for (const type in store) delete store[type]; },
    export: async () => store,
  };
}

function restoreBuffers(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj._bsontype === 'Binary' && obj.buffer) {
    return Buffer.from(obj.buffer);
  }

  for (const key of Object.keys(obj)) {
    obj[key] = restoreBuffers(obj[key]);
  }
  return obj;
}

async function wpInitClient(sessionId = 'bmms_office') {
  console.log(`🟢 Initializing WhatsApp session: ${sessionId}`);

  let session = await WhatsappSession.findOne({ sessionId });
  let authState;
  let saveFromMongo = true
  if (session?.data && saveFromMongo) {
    // Use existing MongoDB session
    const restoredCreds = restoreBuffers(session.data.creds);
    authState = {
      creds: restoredCreds,
      keys: makeMongoKeyStore(session.data.keys),
    };
  } else {
    // FIRST TIME: use temp folder to generate QR & creds
    const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
    const { state, saveCreds } = await useMultiFileAuthState('./temp');
    authState = state;

    // Save initial state to MongoDB
    await WhatsappSession.updateOne(
      { sessionId },
      { data: { creds: state.creds, keys: {} } },
      { upsert: true }
    );
  }

  sock = makeWASocket({
    auth: authState,
    printQRInTerminal: false,
  });

  // Save session creds on updates
  sock.ev.on('creds.update', async () => {
    await WhatsappSession.updateOne(
      { sessionId },
      { data: { creds: sock.authState.creds, keys: await authState.keys.export() } },
      { upsert: true }
    );
  });

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      global.currentQr = await QRCode.toDataURL(qr);
      console.log('📲 QR code generated. Scan it to connect.');
    }
    if (connection === 'open') global.currentQr = null;
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(() => wpInitClient(sessionId), 5000);
    }
  });

  return sock;
}

/**
 * Get latest QR code (for frontend or API response)
 */
function getQRorPairCode() {
  const qr ={ qr : global.currentQr || null , pairCode: ''}
  return  qr
}

module.exports = { wpInitClient };
