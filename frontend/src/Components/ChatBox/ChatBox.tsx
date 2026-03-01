import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
  thinking?: string;
  thinkingElapsed?: number;
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

/* ── ThinkingBlock: renders inside a normal AI message bubble ── */
const ThinkingBlock = ({
  thinkingState,
  finalThinking,
  finalAnswer,
  isLatest,
  thinkingElapsed,
}: {
  thinkingState?: { phase: string; elapsed: number; thinking: string };
  finalThinking?: string;
  finalAnswer?: string;
  isLatest: boolean;
  thinkingElapsed?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const prevPhase = useRef<string>("idle");
  const prevThinkingLen = useRef(0);
  const thinkingText = thinkingState?.thinking || finalThinking || "";

  // Auto-collapse when generating starts
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

  // Auto-expand when thinking text first arrives
  useEffect(() => {
    if (
      thinkingState &&
      thinkingState.phase === "thinking" &&
      thinkingText.length > 0 &&
      prevThinkingLen.current === 0
    ) {
      setExpanded(true);
    }
    prevThinkingLen.current = thinkingText.length;
  }, [thinkingText, thinkingState?.phase]);

  const isLive = thinkingState && thinkingState.phase !== "idle";
  const phase = thinkingState?.phase || "idle";
  const elapsed = thinkingState?.elapsed || 0;

  // ── Completed message: "Thought for Xs ▶" badge + answer ──
  if (!isLive && finalThinking) {
    return (
      <div className="message ai">
        <div className="thinking-header" onClick={() => setExpanded(!expanded)}>
          <span className="thinking-label">Thought for {thinkingElapsed || "a few"}s</span>
          <span className={`toggle-arrow ${expanded ? "expanded" : ""}`}>▶</span>
        </div>
        {expanded && (
          <div className="thought-text">
            {thinkingText.split(/\n+/).filter(Boolean).map((p, i) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </div>
        )}
        {finalAnswer && (
          <div className="final-answer-text">
            {isLatest ? <Typewriter text={finalAnswer} /> : finalAnswer}
          </div>
        )}
      </div>
    );
  }

  // ── Live thinking / generating ──
  if (isLive) {
    const showTimer = elapsed >= 2;

    return (
      <div className="message ai">
        {/* Status line */}
        <div className="thinking-header">
          <span className="thinking-label">
            {phase === "thinking" ? (
              showTimer ? (
                <>Thinking for {elapsed}s<span className="dot-anim"></span></>
              ) : (
                <>Thinking<span className="dot-anim"></span></>
              )
            ) : (
              <>Thought for {elapsed}s</>
            )}
          </span>
          {/* Arrow only shows once timer is active */}
          {showTimer && (
            <span
              className={`toggle-arrow ${expanded ? "expanded" : ""}`}
              onClick={() => setExpanded(!expanded)}
            >▶</span>
          )}
        </div>

        {/* Expandable thought process */}
        {expanded && thinkingText && (
          <div className="thought-text">
            <Typewriter text={thinkingText} speed={10} />
          </div>
        )}

        {/* Generating phase */}
        {phase === "generating" && (
          <div className="generating-label">
            Generating<span className="dot-anim"></span>
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

  const isLive = thinkingState && thinkingState.phase !== "idle";

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
              thinkingElapsed={msg.thinkingElapsed}
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
