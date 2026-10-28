
const { answerQuestion } = require("../services/ragService");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 1000 characters or fewer.",
      });
    }

    const answer = await answerQuestion(message.trim());

    return res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      success: false,
      message: "The AI assistant is temporarily unavailable.",
    });
  }
};

module.exports = { chatWithAI };
