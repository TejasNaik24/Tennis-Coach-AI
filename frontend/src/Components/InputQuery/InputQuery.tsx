import "./InputQuery.css";
import React, { useState, useRef, useEffect } from "react";
import ChatBox from "../ChatBox/ChatBox";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface Message {
  type: "user" | "ai";
  text: string;
  thought?: string;
  isGenerating?: boolean;
}

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
  const [isThinking, setIsThinking] = useState(false);

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

  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isThinking]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (voiceMode && transcript.trim()) {
      // Wait a tiny bit to ensure transcript is done
      const timeout = setTimeout(() => {
        // Add user's spoken message to the chat
        addMessage("user", transcript.trim());

        // Clear the transcript and stop listening
        resetTranscript();

        // Send to backend
        setIsThinking(true);
        fetch(`${import.meta.env.VITE_API_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript.trim() }),
        })
          .then((response) => response.json())
          .then((data: { reply: string }) => {
            setIsThinking(false);
            addMessage("ai", data.reply);
          })
          .catch((error) => {
            console.error("Error:", error);
            setIsThinking(false);
            addMessage("ai", "Sorry, something went wrong.");
          });
      }, 1000); // optional buffer

      return () => clearTimeout(timeout);
    }
  }, [transcript]);

  useEffect(() => {
    if (transcript && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, [transcript]);

  const updateLastMessage = (text: string, thought?: string, isGenerating?: boolean) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const last = newMessages[newMessages.length - 1];
        newMessages[newMessages.length - 1] = { ...last, text, thought, isGenerating };
      }
      return newMessages;
    });
  };

  const sendMessage = async () => {
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

    // Add initial AI message shell
    addMessage("ai", "");
    setIsThinking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Failed to connect to AI");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";
      let currentThought = "";
      let currentAnswer = "";
      let hasStartedAnswer = false;

      setIsThinking(false); // Stop showing the generic "Thinking" bubble once streaming starts

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Simple tag parser
        const thoughtMatch = fullText.match(/<thought>([\s\S]*?)<\/thought>/);
        const thoughtStartMatch = fullText.match(/<thought>([\s\S]*)/);

        if (thoughtMatch) {
          currentThought = thoughtMatch[1];
          const parts = fullText.split("</thought>");
          currentAnswer = parts.length > 1 ? parts[1].trim() : "";
          hasStartedAnswer = currentAnswer.length > 0;
        } else if (thoughtStartMatch) {
          currentThought = thoughtStartMatch[1];
        } else {
          currentAnswer = fullText;
        }

        updateLastMessage(currentAnswer, currentThought, !hasStartedAnswer);
      }

      // Final update to clear generating state
      updateLastMessage(currentAnswer, currentThought, false);

      // Speak if voice mode is on
      if (voiceMode && currentAnswer) {
        const utterance = new SpeechSynthesisUtterance(currentAnswer);
        utterance.onend = () => {
          try {
            SpeechRecognition.startListening({ continuous: true });
          } catch (err) {
            console.error("Mic error on TTS end:", err);
          }
        };
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error("Error:", error);
      setIsThinking(false);
      updateLastMessage("Sorry, something went wrong.", "", false);
    }
  };

  const addMessage = (type: "user" | "ai", text: string, thought?: string, isGenerating?: boolean) => {
    setMessages((prev) => [...prev, { type, text, thought, isGenerating }]);
  };

  return (
    <>
      <ChatBox messages={messages} isThinking={isThinking} />
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
