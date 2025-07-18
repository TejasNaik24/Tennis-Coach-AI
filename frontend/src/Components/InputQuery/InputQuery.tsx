import "./InputQuery.css";
import React, { useState, useRef, useEffect } from "react";
import ChatBox from "../ChatBox/ChatBox";
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
  const [messages, setMessages] = useState<
    { type: "user" | "ai"; text: string }[]
  >([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

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

  useEffect(() => {
    adjustHeight();
  }, []);

  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages]);

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
        fetch(`${import.meta.env.VITE_API_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript.trim() }),
        })
          .then((response) => response.json())
          .then((data: { reply: string }) => {
            addMessage("ai", data.reply);
          })
          .catch((error) => {
            console.error("Error:", error);
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

    fetch(`${import.meta.env.VITE_API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((response: Response) => response.json())
      .then((data: { reply: string }) => {
        addMessage("ai", data.reply);
        // update UI here
      })
      .catch((error: any) => {
        console.error("Error:", error);
        // show error UI
        addMessage("ai", "Sorry, something went wrong.");
      });
  };

  const addMessage = (type: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { type, text }]);

    if (type === "ai" && voiceMode) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speaking error:", err);
      }
    }
  };

  return (
    <>
      <ChatBox messages={messages} />
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
