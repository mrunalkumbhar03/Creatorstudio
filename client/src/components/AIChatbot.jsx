import { useState, useRef, useEffect } from "react";
import "./AIChatbot.css";

export default function AIChatbot({ isFloating = false, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Welcome to CreatorStudio. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function postMessage(messageText) {
    const message = messageText.trim();
    if (!message || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: message },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to get an answer.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: error.message || "Unable to connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function sendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    postMessage(input);
  }

  const cardContent = (
    <div className={`ai-chat-card ${isFloating ? "ai-chat-card-floating" : ""}`}>
      <header className="ai-chat-header">
        <div className="ai-chat-avatar">✦</div>
        <div className="ai-chat-header-info">
          <h2>CreatorStudio AI</h2>
          <p>Ask about creative services</p>
        </div>
        <span className="ai-online-dot" title="Online" />
        {isFloating && onClose && (
          <button
            type="button"
            className="ai-chat-close-btn"
            onClick={onClose}
            aria-label="Close chat"
            title="Close"
          >
            ✕
          </button>
        )}
      </header>

      <div className="ai-chat-messages" aria-live="polite">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`ai-message ${msg.role}`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant ai-loading-message">
            <span>Thinking</span>
            <span className="ai-loading-dots">
              <i>.</i><i>.</i><i>.</i>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="ai-chat-suggestions">
          <button
            type="button"
            className="ai-chat-chip"
            onClick={() => postMessage("What services are available?")}
          >
            Explore services
          </button>
          <button
            type="button"
            className="ai-chat-chip"
            onClick={() => postMessage("How much does logo design cost?")}
          >
            Logo pricing
          </button>
          <button
            type="button"
            className="ai-chat-chip"
            onClick={() => postMessage("How do I book a service?")}
          >
            How to book
          </button>
        </div>
      )}

      <form className="ai-chat-form" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          placeholder="Ask about services, prices..."
          aria-label="Your message"
          maxLength={1000}
          disabled={loading}
          autoFocus={isFloating}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? "..." : "Send ↑"}
        </button>
      </form>

      <p className="ai-chat-note">
        AI-generated answers may need verification.
      </p>
    </div>
  );

  if (isFloating) {
    return cardContent;
  }

  return (
    <div className="ai-chat-page">
      {cardContent}
    </div>
  );
}
