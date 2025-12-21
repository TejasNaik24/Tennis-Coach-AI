import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
};

interface ChatBoxProps {
  messages: Message[];
  isThinking?: boolean;
}

const Typewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayedText}</>;
};

function ChatBox({ messages, isThinking }: ChatBoxProps) {
  const [glow, setGlow] = useState(false);
  const prevLength = useRef(messages.length);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      setGlow(true);

      const timeout = setTimeout(() => {
        setGlow(false);
      }, 1500);

      // Scroll the latest message to the top
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return () => clearTimeout(timeout);
    }

    prevLength.current = messages.length;
  }, [messages]);

  return (
    <div id="chat-box" className={glow ? "glow-once" : ""}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.type}`}
          ref={index === messages.length - 1 ? lastMessageRef : null}
        >
          {msg.type === "ai" && index === messages.length - 1 ? (
            <Typewriter text={msg.text} />
          ) : (
            msg.text
          )}
        </div>
      ))}
      {isThinking && (
        <div className="message ai thinking" ref={lastMessageRef}>
          Thinking
        </div>
      )}
    </div>
  );
}

export default ChatBox;
