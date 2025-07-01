import "./InputQuery.css";
import React, { useState, useRef, useEffect } from "react";
import ChatBox from "../ChatBox/ChatBox";

function InputQuery() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<
    { type: "user" | "ai"; text: string }[]
  >([]);
  const [isMuted, setIsMuted] = useState(false);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  function toggleMute() {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        window.speechSynthesis.cancel(); // Stop ongoing speech if muting
      }
      return newMuted;
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  // Run once on mount to prevent "jump"
  useEffect(() => {
    adjustHeight();
  }, []);

  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  function sendMessage() {
    const message = text.trim();
    if (!message) return;

    addMessage("user", message);
    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset height to default
    }

    fetch("http://127.0.0.1:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((response: Response) => response.json())
      .then((data: { reply: string }) => {
        addMessage("ai", data.reply);
        // update UI here
      })
      .catch((error: any) => {
        console.error("Error:", error);
        // show error UI
        addMessage("ai", "Sorry, something went wrong.");
      });
  }

  function addMessage(type: "user" | "ai", text: string) {
    setMessages((prev) => [...prev, { type, text }]);

    if (type === "ai" && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <>
      <ChatBox messages={messages} />
      <div id="inputquery-container">
        <button id="clear-button" title="Clear" onClick={() => setMessages([])}>
          Clear
        </button>
        <button
          id="mute-button"
          className={isMuted ? "unmuted" : "muted"}
          onClick={toggleMute}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <div className="input-wrapper">
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask me anything..."
          />
          {!text && (
            <button id="voice-mode" aria-label="Dictate" title="Use voice mode">
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
                <line x1="6" y1="8" x2="6" y2="16" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="18" y1="8" x2="18" y2="16" />
              </svg>
            </button>
          )}
          {text && (
            <button id="send-button" title="Send" onClick={sendMessage}>
              ↑
            </button>
          )}
        </div>
        <button id="dictate" title="Dictate">
          <svg
            width="24"
            height="30"
            viewBox="0 -3 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>
      </div>
    </>
  );
}

export default InputQuery;
