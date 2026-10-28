import { useState, useEffect } from "react";
import AIChatbot from "./AIChatbot";
import "./FloatingChatbot.css";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  // Close when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <aside className="cs-floating-chat-container" aria-label="AI Assistant Chatbot">
      <div
        className={`cs-floating-chat-window ${isOpen ? "open" : "closed"}`}
        aria-hidden={!isOpen}
      >
        <AIChatbot isFloating={true} onClose={() => setIsOpen(false)} />
      </div>

      <button
        type="button"
        className={`cs-floating-chat-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI Assistant" : "Open CreatorStudio AI Assistant"}
        aria-expanded={isOpen}
        title={isOpen ? "Close chat" : "Ask CreatorStudio AI"}
      >
        {isOpen ? (
          <span className="cs-close-icon" aria-hidden="true">✕</span>
        ) : (
          <span className="cs-chat-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="cs-sparkle-dot">✦</span>
          </span>
        )}
      </button>
    </aside>
  );
}
