const QuestionModel = require('../models/QuestionModel');

const practiceController = {
  async getQuestions(req, res, next) {
    try {
      const topic = req.query.topic;
      const limit = parseInt(req.query.limit) || 10;

      let questions;
      if (topic) {
        questions = await QuestionModel.getByTopic(topic);
      } else {
        questions = await QuestionModel.getAll();
      }

      // Shuffle questions
      const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
      
      // Select limit
      const selectedQuestions = shuffledQuestions.slice(0, limit);

      // Shuffle options for each question
      const formattedQuestions = selectedQuestions.map(q => {
        const rawOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        const shuffledOptions = [...rawOptions].sort(() => 0.5 - Math.random());
        return {
          id: q.id,
          topic: q.topic,
          question: q.question,
          options: shuffledOptions,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty
        };
      });

      res.status(200).json({
        success: true,
        count: formattedQuestions.length,
        data: formattedQuestions
      });
    } catch (err) {
      next(err);
    }
  },

  async getTopics(req, res, next) {
    try {
      const topics = await QuestionModel.getDistinctTopics();
      res.status(200).json({ success: true, data: topics });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = practiceController;
