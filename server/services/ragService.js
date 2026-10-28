const { GoogleGenAI } = require("@google/genai");
require("../models/User");
const Service = require("../models/Service");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function answerQuestion(message) {
  const services = await Service.find({ status: "Active" })
    .select("title description category price deliveryTime creatorId")
    .populate("creatorId", "name username")
    .limit(100)
    .lean();

  const serviceContext = services.map((service) => ({
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    deliveryTime: service.deliveryTime,
    creator:
      service.creatorId?.name ||
      service.creatorId?.username ||
      "Creator",
  }));

  const context = serviceContext
    .map(
      (service) =>
        `Title: ${service.title}\n` +
        `Category: ${service.category}\n` +
        `Description: ${service.description}\n` +
        `Price: Rs. ${service.price}\n` +
        `Delivery: ${service.deliveryTime} days\n` +
        `Creator: ${service.creator}`
    )
    .join("\n\n");

  const prompt = `
You are CreatorStudio's helpful AI assistant.

Answer the user's question using the CreatorStudio service
information provided below.

Rules:
- Use simple, clear language.
- Use only the provided data for service prices and details.
- Do not invent services, prices, or creators.
- If the information is unavailable, say so clearly.
- If there are no services, explain that no active services
  are currently available.
- Answer general questions helpfully when appropriate.

CreatorStudio service information:
${context || "No active services are currently available."}

User question:
${message}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text ||
    "Sorry, I could not generate an answer. Please try again.";
}

module.exports = { answerQuestion };
