import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
};

interface ChatBoxProps {
  messages: Message[];
}

function ChatBox({ messages }: ChatBoxProps) {
  const [glow, setGlow] = useState(false);
  const prevLength = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      setGlow(true);

      const timeout = setTimeout(() => {
        setGlow(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }

    prevLength.current = messages.length;
  }, [messages]);

  return (
    <div id="chat-box" className={glow ? "glow-once" : ""}>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.type}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}

export default ChatBox;
