const db = require('../config/db');

const AiModel = {
  async createConversation(userId, title) {
    const [result] = await db.query(
      'INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)',
      [userId, title]
    );
    return result.insertId;
  },

  async getConversationsByUserId(userId) {
    const [rows] = await db.query(
      'SELECT id, user_id AS userId, title, created_at AS createdAt FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async createMessage(conversationId, sender, message) {
    const [result] = await db.query(
      'INSERT INTO ai_messages (conversation_id, sender, message) VALUES (?, ?, ?)',
      [conversationId, sender, message]
    );
    return result.insertId;
  },

  async getMessagesByConversationId(conversationId) {
    const [rows] = await db.query(
      'SELECT id, conversation_id AS conversationId, sender, message, created_at AS createdAt FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
    return rows;
  },

  async getAnalytics() {
    const [convRows] = await db.query('SELECT COUNT(*) as count FROM ai_conversations');
    const [msgRows] = await db.query('SELECT COUNT(*) as count FROM ai_messages');
    return {
      totalConversations: convRows[0].count,
      totalMessages: msgRows[0].count
    };
  }
};

module.exports = AiModel;
