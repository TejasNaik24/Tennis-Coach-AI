import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
};

interface ChatBoxProps {
  messages: Message[];
}

function ChatBox({ messages }: ChatBoxProps) {
  return (
    <div id="chat-box">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.type}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}

export default ChatBox;
