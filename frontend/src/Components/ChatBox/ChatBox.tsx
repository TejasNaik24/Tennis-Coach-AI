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

/* ── ThinkingBlock ── */
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
  const [streamedText, setStreamedText] = useState("");
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordIndexRef = useRef(0);
  const prevPhase = useRef<string>("idle");
  const thinkingText = thinkingState?.thinking || finalThinking || "";
  const hasThinkingText = thinkingText.length > 0;

  // Stream thinking text word-by-word (persists across expand/collapse)
  useEffect(() => {
    if (!thinkingText || finalThinking) return; // Don't stream for completed messages

    const words = thinkingText.split(/(\s+)/); // Keep whitespace
    wordIndexRef.current = 0;
    setStreamedText("");

    streamRef.current = setInterval(() => {
      if (wordIndexRef.current < words.length) {
        const nextChunk = words.slice(0, wordIndexRef.current + 1).join("");
        setStreamedText(nextChunk);
        wordIndexRef.current++;
        const chatBox = document.getElementById("chat-box");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        if (streamRef.current) clearInterval(streamRef.current);
      }
    }, 30); // ~30ms per word token for fast streaming

    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, [thinkingText, finalThinking]);

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

  const isLive = thinkingState && thinkingState.phase !== "idle";
  const phase = thinkingState?.phase || "idle";
  const elapsed = thinkingState?.elapsed || 0;

  // ── Completed message ──
  if (!isLive && finalThinking) {
    return (
      <div className="message ai thinking-msg">
        <div className="thinking-header" onClick={() => setExpanded(!expanded)}>
          <span className="thinking-label">Thought for {thinkingElapsed || "a few"}s</span>
          <span className={`toggle-arrow ${expanded ? "expanded" : ""}`}>{'>'}</span>
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
    return (
      <div className="message ai thinking-msg">
        {/* Status line */}
        <div className="thinking-header">
          <span className="thinking-label">
            {phase === "thinking" ? (
              !hasThinkingText ? (
                <>Thinking<span className="dot-anim"></span></>
              ) : (
                <>Thinking for {elapsed}s<span className="dot-anim"></span></>
              )
            ) : (
              <>Thought for {elapsed}s</>
            )}
          </span>
          {/* Arrow only shows once thinking text has arrived */}
          {hasThinkingText && (
            <span
              className={`toggle-arrow ${expanded ? "expanded" : ""}`}
              onClick={() => setExpanded(!expanded)}
            >{'>'}</span>
          )}
        </div>

        {/* Thought process - always rendered, visibility toggled via CSS */}
        {hasThinkingText && (
          <div className={`thought-text ${expanded ? "visible" : "hidden"}`}>
            {streamedText}
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

/* ── ChatBox ── */
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

      {isLive && (
        <ThinkingBlock thinkingState={thinkingState} isLatest={true} />
      )}
    </div>
  );
}

export default ChatBox;
export type { Message };
