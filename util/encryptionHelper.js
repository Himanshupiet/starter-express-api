// encryptionHelper.js
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ivLength = 16;

function encryptData(data, secretKey) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    algorithm,
    crypto.createHash('sha256').update(secretKey).digest(),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptData(encryptedData, secretKey) {
  if (!encryptedData || typeof encryptedData !== "string") return null;
  const [ivHex, encryptedText] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    crypto.createHash('sha256').update(secretKey).digest(),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

module.exports = { encryptData, decryptData };
