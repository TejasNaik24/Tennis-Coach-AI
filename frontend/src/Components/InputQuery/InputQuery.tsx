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
          {text && (
            <button id="send-button" title="Send" onClick={sendMessage}>
              ↑
            </button>
          )}
        </div>
        <button id="clear-button" title="Clear" onClick={() => setMessages([])}>
          Clear
        </button>
      </div>
    </>
  );
}

export default InputQuery;
