import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

type Message = {
  type: "user" | "ai";
  text: string;
  thinking?: string;
  thinkingElapsed?: number;
  stopped?: boolean;
};

interface ChatBoxProps {
  messages: Message[];
  thinkingState?: {
    phase: "thinking" | "generating" | "idle" | "typing";
    elapsed: number;
    thinking: string;
  };
}

const Typewriter = ({ text, speed = 15, stopped = false }: { text: string; speed?: number; stopped?: boolean }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (stopped) return; // Freeze if stopped
    
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, stopped]);

  // If stopped, we just show what was already displayed (or the full text if it finished before stop)
  return <>{displayed || text}</>;
};

/* ── ThinkingBlock ── */
const ThinkingBlock = ({
  thinkingState,
  finalThinking,
  finalAnswer,
  isLatest,
  thinkingElapsed,
  stopped,
}: {
  thinkingState?: { phase: string; elapsed: number; thinking: string };
  finalThinking?: string;
  finalAnswer?: string;
  isLatest: boolean;
  thinkingElapsed?: number;
  stopped?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thoughtBoxRef = useRef<HTMLDivElement>(null);
  const chunkIndexRef = useRef(0);
  const prevPhase = useRef<string>("idle");
  const thinkingText = thinkingState?.thinking || finalThinking || "";
  const hasThinkingText = thinkingText.length > 0;

  // Stream thinking text sentence-by-sentence (faster)
  useEffect(() => {
    if (!thinkingText || finalThinking) return;

    // Split by sentence-like boundaries (punctuation followed by space)
    const chunks = thinkingText.split(/(?<=[.!?])\s+/);
    chunkIndexRef.current = 0;
    setStreamedText("");

    streamRef.current = setInterval(() => {
      if (chunkIndexRef.current < chunks.length) {
        const nextChunk = chunks.slice(0, chunkIndexRef.current + 1).join(" ");
        setStreamedText(nextChunk);
        chunkIndexRef.current++;
      } else {
        if (streamRef.current) clearInterval(streamRef.current);
      }
    }, 600); // Pulse in a chunk every 600ms (slower for better readability)

    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, [thinkingText, finalThinking]);

  // Internal auto-scroll for the thought box (with manual override)
  useEffect(() => {
    if (thoughtBoxRef.current && expanded) {
      const box = thoughtBoxRef.current;
      const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 50;

      if (isAtBottom) {
        box.scrollTop = box.scrollHeight;
      }
    }
  }, [streamedText, expanded]);

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

  // ── Completed message (not live anymore) ──
  if (!isLive && (finalThinking || finalAnswer)) {
    return (
      <>
        {finalThinking && (
          <div className="message ai thinking-msg">
            <div className="thinking-header" onClick={() => setExpanded(!expanded)}>
              <span className="thinking-label">Thought for {thinkingElapsed || "a few"}s</span>
              <span className={`toggle-arrow ${expanded ? "expanded" : ""}`}>{'>'}</span>
            </div>
            <div
              ref={thoughtBoxRef}
              className={`thought-text ${expanded ? "visible" : "hidden"}`}
            >
              {finalThinking.split(/\n+/).filter(Boolean).map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            </div>
          </div>
        )}
        {finalAnswer && (
          <div className="final-answer-text">
            {isLatest ? <Typewriter text={finalAnswer} stopped={stopped} /> : finalAnswer}
          </div>
        )}
      </>
    );
  }

  // ── Live thinking / generating / typing ──
  if (isLive) {
    const isTyping = thinkingState?.phase === "typing";
    return (
      <>
        <div className="message ai thinking-msg">
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
            {hasThinkingText && (
              <span
                className={`toggle-arrow ${expanded || isTyping ? "expanded" : ""}`}
                onClick={() => setExpanded(!expanded)}
              >{'>'}</span>
            )}
          </div>

          <div
            ref={thoughtBoxRef}
            className={`thought-text ${expanded || isTyping ? "visible" : "hidden"}`}
          >
            {streamedText || thinkingText}
          </div>
        </div>
        
        {isTyping && finalAnswer && (
          <div className="final-answer-text">
            <Typewriter text={finalAnswer} />
          </div>
        )}
      </>
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
              stopped={msg.stopped}
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
