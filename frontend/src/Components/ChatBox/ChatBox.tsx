import { useEffect, useState } from "react";
import "./ChatBox.css";

interface Message {
  type: "user" | "ai";
  text: string;
  thought?: string;
  isGenerating?: boolean;
}

interface ChatBoxProps {
  messages: Message[];
  isThinking?: boolean;
}

const Typewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const chatBox = document.getElementById("chat-box");
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayedText}</>;
};

const ReasoningMessage = ({ msg, isLast }: { msg: Message; isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const hasThoughts = msg.thought && msg.thought.trim().length > 0;

  useEffect(() => {
    let interval: any;
    if (msg.type === "ai" && !msg.text && totalSeconds === null) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (msg.text && totalSeconds === null) {
      setTotalSeconds(seconds);
    }
    return () => clearInterval(interval);
  }, [msg.text, totalSeconds, seconds]);

  // Auto-collapse logic when done thinking (optional, based on req)
  useEffect(() => {
    if (msg.text && isExpanded) {
      setIsExpanded(false);
    }
  }, [msg.text]);

  return (
    <div className={`message ai reasoning-block ${isLast ? "glow-once" : ""}`}>
      {/* Thinking / Thought Status */}
      <div className="thinking-status">
        {!msg.text ? (
          <>
            <span className="pulsing-dots">Thinking</span>
            <span className="thinking-timer">({seconds}s)</span>
          </>
        ) : (
          <div className="thought-summary-badge" onClick={() => setIsExpanded(!isExpanded)}>
            Thought for {totalSeconds || seconds}s {isExpanded ? "▾" : "▶"}
          </div>
        )}
      </div>

      {/* Thought Collapsible */}
      {hasThoughts && (
        <div className="thought-collapsible">
          {isExpanded && (
            <div className="thought-content">
              {msg.thought}
            </div>
          )}
        </div>
      )}

      {/* Generating Status */}
      {msg.isGenerating && !msg.text && (
        <div className="generating-status pulsing-dots">Generating</div>
      )}

      {/* Final Answer */}
      {msg.text && (
        <div className="final-answer">
          {isLast ? <Typewriter text={msg.text} /> : msg.text}
        </div>
      )}
    </div>
  );
};

function ChatBox({ messages, isThinking }: ChatBoxProps) {

  // We don't need the local glow state anymore as ReasoningMessage handles its own entry
  return (
    <div id="chat-box">
      {messages.map((msg, index) => {
        if (msg.type === "user") {
          return (
            <div key={index} className="message user">
              {msg.text}
            </div>
          );
        }
        return (
          <ReasoningMessage
            key={index}
            msg={msg}
            isLast={index === messages.length - 1}
          />
        );
      })}
      {isThinking && (
        <div className="message ai reasoning-block pulsing-dots">
          <div className="thinking-status">Thinking</div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
