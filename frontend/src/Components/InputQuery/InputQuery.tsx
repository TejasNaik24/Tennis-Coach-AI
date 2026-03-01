import "./InputQuery.css";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ChatBox from "../ChatBox/ChatBox";
import type { Message } from "../ChatBox/ChatBox";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function InputQuery(): React.ReactElement | null {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  if (!browserSupportsSpeechRecognition) return null;

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);
  const [thinkingState, setThinkingState] = useState<{
    phase: "thinking" | "generating" | "idle";
    elapsed: number;
    thinking: string;
  }>({ phase: "idle", elapsed: 0, thinking: "" });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      const maxHeight = 200; // match this to your CSS `max-height`
      setIsMaxed(textareaRef.current.scrollHeight >= maxHeight);
    }
  };

  const toggleMuteMic = () => {
    if (listening) {
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Mic error:", err);
      }
    } else {
      window.speechSynthesis.cancel();
      try {
        SpeechRecognition.startListening({ continuous: true });
      } catch (err) {
        console.error("Mic error:", err);
      }
    }
  };

  const toggleMuteDictate = () => {
    if (listening) {
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Dictate error:", err);
      }
    } else {
      resetTranscript();
      try {
        SpeechRecognition.startListening({ continuous: true });
      } catch (err) {
        console.error("Dictate error:", err);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
    if (voiceMode) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    setText(transcript);
    adjustHeight();
  }, [transcript]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  const voiceModeOn = () => {
    setVoiceMode(true);
    resetTranscript();
    try {
      SpeechRecognition.startListening({ continuous: true });
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  useEffect(() => {
    if (!voiceMode) {
      adjustHeight();
    }
  }, [voiceMode]);

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const voiceModeOff = () => {
    setVoiceMode(false);
    window.speechSynthesis.cancel();
    try {
      SpeechRecognition.stopListening();
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  // Run once on mount to prevent "jump"
  useEffect(() => {
    adjustHeight();
  }, []);

  const startThinkingTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setThinkingState({ phase: "thinking", elapsed: 0, thinking: "" });
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setThinkingState((prev) => ({
        ...prev,
        elapsed: Math.floor((Date.now() - start) / 1000),
      }));
    }, 1000);
  }, []);

  const stopThinkingTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Manual scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollButton(false);
    }
  }, []);

  // Monitor scroll position to show/hide button
  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    const handleScroll = () => {
      const isAtBottom =
        chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };

    chatBox.addEventListener("scroll", handleScroll);
    return () => chatBox.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll ONLY when a new user message is added
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const addMessage = useCallback((type: "user" | "ai", text: string, thinking?: string, thinkingElapsed?: number) => {
    setMessages((prev) => [...prev, { type, text, thinking, thinkingElapsed }]);

    if (type === "ai" && voiceMode) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Mic error before TTS:", err);
      }

      utterance.onend = () => {
        try {
          SpeechRecognition.startListening({ continuous: true });
        } catch (err) {
          console.error("Mic error on TTS end:", err);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [voiceMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApiResponse = useCallback(
    (data: { thinking: string; reply: string }) => {
      const thinkingText = data.thinking || "";

      // Step 1: Keep thinking phase, but feed in the thinking text so it streams
      setThinkingState((prev) => ({
        ...prev,
        phase: "thinking",
        thinking: thinkingText,
      }));

      // Step 2: After enough time for text to stream in, stop timer & go to generating
      const streamDuration = Math.max(thinkingText.length * 10, 1000);
      setTimeout(() => {
        stopThinkingTimer();

        // Capture elapsed and move to generating phase
        setThinkingState((prev) => {
          const capturedElapsed = prev.elapsed;

          // Switch to generating
          setTimeout(() => {
            setThinkingState((p) => ({ ...p, phase: "generating" }));

            // Step 3: Wait 3 seconds in generating phase then finalize
            setTimeout(() => {
              setThinkingState({ phase: "idle", elapsed: 0, thinking: "" });
              addMessage("ai", data.reply, data.thinking, capturedElapsed);
            }, 3000);
          }, 0);

          return prev;
        });
      }, streamDuration);
    },
    [stopThinkingTimer, addMessage]
  );

  const handleApiError = useCallback(
    (error: any) => {
      console.error("Error:", error);
      stopThinkingTimer();
      setThinkingState({ phase: "idle", elapsed: 0, thinking: "" });
      addMessage("ai", "Sorry, something went wrong.");
    },
    [stopThinkingTimer]
  );

  useEffect(() => {
    if (voiceMode && transcript.trim()) {
      const timeout = setTimeout(() => {
        addMessage("user", transcript.trim());
        resetTranscript();

        startThinkingTimer();
        fetch(`${import.meta.env.VITE_API_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript.trim() }),
        })
          .then((response) => response.json())
          .then(handleApiResponse)
          .catch(handleApiError);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [transcript]);

  useEffect(() => {
    if (transcript && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, [transcript]);

  const sendMessage = () => {
    const message = text.trim();
    if (!message) return;

    addMessage("user", message);
    setText("");

    try {
      SpeechRecognition.stopListening();
    } catch (err) {
      console.error("Mic error:", err);
    }
    resetTranscript();

    startThinkingTimer();
    fetch(`${import.meta.env.VITE_API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((response: Response) => response.json())
      .then(handleApiResponse)
      .catch(handleApiError);
  };



  return (
    <>
      <ChatBox messages={messages} thinkingState={thinkingState} />

      {/* Manual Scroll Button */}
      <div
        className={`scroll-arrow ${showScrollButton ? "" : "hidden"}`}
        onClick={scrollToBottom}
        title="Scroll to bottom"
      >
        ↓
      </div>

      <div id="inputquery-container">
        {!voiceMode && (
          <button id="clear-button" title="Clear" onClick={clearMessages}>
            Clear
          </button>
        )}
        <div className="input-wrapper">
          {!voiceMode && (
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ overflowY: isMaxed ? "auto" : "hidden" }}
              placeholder={!listening ? "Ask me anything..." : "Listening..."}
              disabled={listening}
              className="scroll-class"
            />
          )}
          {!text && !voiceMode && (
            <button
              id="voice-mode"
              title="Use voice mode"
              onClick={voiceModeOn}
            >
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
          {text && !voiceMode && (
            <button id="send-button" title="Send" onClick={sendMessage}>
              ↑
            </button>
          )}
        </div>
        {!voiceMode && (
          <button id="dictate" title="Dictate" onClick={toggleMuteDictate}>
            {!listening ? (
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
                <line
                  x1="4"
                  y1="4"
                  x2="20"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
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
            )}
          </button>
        )}
        {voiceMode && (
          <div className="voice-mode-controls">
            <button id="mute-button" onClick={toggleMuteMic}>
              {!listening ? (
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
                  <line
                    x1="4"
                    y1="4"
                    x2="20"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              ) : (
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
              )}
            </button>
            {voiceMode && (
              <button
                id="clear-button"
                title="Clear"
                onClick={clearMessages}
                className="voice-mode-controls"
              >
                Clear
              </button>
            )}
            <button id="exit" title="End" onClick={voiceModeOff}>
              X
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default InputQuery;
