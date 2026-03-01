import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
  thinking?: string;
};

interface ChatBoxProps {
  messages: Message[];
  thinkingState?: {
    phase: "thinking" | "generating" | "idle";
    elapsed: number;
    thinking: string;
  };
}

/* ── Typewriter: streams text character-by-character ── */
const Typewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const chatBox = document.getElementById("chat-box");
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayed}</>;
};

/* ── ThoughtChunker: streams thinking text in paragraph chunks ── */
const ThoughtChunker = ({ text }: { text: string }) => {
  const [chunks, setChunks] = useState<string[]>([]);

  useEffect(() => {
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let i = 0;
    const timer = setInterval(() => {
      if (i < paragraphs.length) {
        setChunks((prev) => [...prev, paragraphs[i]]);
        i++;
        const chatBox = document.getElementById("chat-box");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <>
      {chunks.map((chunk, i) => (
        <p key={i}>{chunk}</p>
      ))}
    </>
  );
};

/* ── ThinkingBlock: the full thinking mode UI ── */
const ThinkingBlock = ({
  thinkingState,
  finalThinking,
  finalAnswer,
  isLatest,
}: {
  thinkingState?: { phase: string; elapsed: number; thinking: string };
  finalThinking?: string;
  finalAnswer?: string;
  isLatest: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const prevPhase = useRef<string>("idle");
  const thinkingText = thinkingState?.thinking || finalThinking || "";

  // Auto-expand during thinking, auto-collapse when generating starts
  useEffect(() => {
    if (!thinkingState) return;
    if (
      thinkingState.phase === "generating" &&
      prevPhase.current === "thinking"
    ) {
      setExpanded(false);
    }
    prevPhase.current = thinkingState.phase;
  }, [thinkingState?.phase]);

  const isLive = thinkingState && thinkingState.phase !== "idle";
  const phase = thinkingState?.phase || "idle";
  const elapsed = thinkingState?.elapsed || 0;

  // For completed messages: show the badge
  if (!isLive && finalThinking) {
    return (
      <div className="thinking-block">
        <div className="thought-toggle" onClick={() => setExpanded(!expanded)}>
          <span className={`arrow ${expanded ? "expanded" : ""}`}>▶</span>
          Thought process
        </div>
        <div className={`thought-content ${expanded ? "expanded" : ""}`}>
          {thinkingText.split(/\n+/).filter(Boolean).map((p, i) => (
            <p key={i}>{p.trim()}</p>
          ))}
        </div>
        {finalAnswer && (
          <div className="final-answer">
            {isLatest ? <Typewriter text={finalAnswer} /> : finalAnswer}
          </div>
        )}
      </div>
    );
  }

  // Live thinking / generating
  if (isLive) {
    return (
      <div className="thinking-block">
        {/* Status line */}
        <div className="thinking-status">
          {phase === "thinking" ? (
            elapsed < 2 ? (
              <>Thinking<span className="dot-animation"></span></>
            ) : (
              <>Thinking for {elapsed}s<span className="dot-animation"></span></>
            )
          ) : (
            <>Thought for {elapsed}s</>
          )}
        </div>

        {/* Collapsible thought process - always show toggle */}
        <div
          className="thought-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          <span className={`arrow ${expanded ? "expanded" : ""}`}>▶</span>
          Thought process
        </div>
        <div className={`thought-content ${expanded ? "expanded" : ""}`}>
          {thinkingText ? (
            <ThoughtChunker text={thinkingText} />
          ) : (
            <p>Thinking...</p>
          )}
        </div>

        {/* Generating phase */}
        {phase === "generating" && (
          <div className="generating-status">
            Generating<span className="dot-animation"></span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

/* ── ChatBox: main chat container ── */
function ChatBox({ messages, thinkingState }: ChatBoxProps) {
  const [glow, setGlow] = useState(false);
  const prevLength = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      setGlow(true);
      const timeout = setTimeout(() => setGlow(false), 1500);
      return () => clearTimeout(timeout);
    }
    prevLength.current = messages.length;
  }, [messages]);

  const isLive =
    thinkingState && thinkingState.phase !== "idle";

  return (
    <div id="chat-box" className={glow ? "glow-once" : ""}>
      {messages.map((msg, index) => {
        const isLatest = index === messages.length - 1;

        if (msg.type === "ai" && msg.thinking) {
          return (
            <ThinkingBlock
              key={index}
              finalThinking={msg.thinking}
              finalAnswer={msg.text}
              isLatest={isLatest && !isLive}
            />
          );
        }

        return (
          <div key={index} className={`message ${msg.type}`}>
            {msg.type === "ai" && isLatest && !isLive ? (
              <Typewriter text={msg.text} />
            ) : (
              msg.text
            )}
          </div>
        );
      })}

      {/* Live thinking block */}
      {isLive && (
        <ThinkingBlock thinkingState={thinkingState} isLatest={true} />
      )}
    </div>
  );
}

export default ChatBox;
export type { Message };
