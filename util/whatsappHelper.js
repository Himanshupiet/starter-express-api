
const { wAppGroupModel } = require("../models/groupWPModel");
const { wpInitClient } = require("./whatsAppClientInstance");



// 🟢 Find or fetch all groups, save to DB
async function syncGroups() {
  try {
    const client = await wpInitClient();
    console.log("client222222222222====================>", client)
    if (!client) return { success: false, error: "WhatsApp not connected" };
   
    const chats = await client.getChats();
    const groups = chats.filter((chat) => chat.isGroup);
    const dbGroups = await wAppGroupModel.find();

    for (const group of groups) {
      const existing = dbGroups.find((dbGroup) => dbGroup.groupId === group.id._serialized) || null
      if (!existing) {
        const inviteLink = await group.getInviteCode().catch(() => null);
        await wAppGroupModel.create({
          groupId: group.id._serialized,
          name: group.name,
          inviteLink: inviteLink ? `https://chat.whatsapp.com/${inviteLink}` : null,
        });
      }
    }

    return {success: true, data : await wAppGroupModel.find()};
  } catch (err) {
    console.error("❌ Error syncing groups:", err);
    return {success :false, error: 'WhatsApp connection failed'}
  }
}

// 🟢 Send message to group
async function sendMessageToGroup(groupId, message) {
  try {
    const chat = await client.getChatById(groupId);
    await chat.sendMessage(message);
    return { success: true, message: "Message sent successfully." };
  } catch (err) {
    console.error("❌ Error sending message:", err);
    return { success: false, message: err.message };
  }
}

module.exports = { syncGroups, sendMessageToGroup };
