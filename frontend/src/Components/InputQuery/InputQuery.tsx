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

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<
    { type: "user" | "ai"; text: string }[]
  >([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

  // Mic support check
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  if (!browserSupportsSpeechRecognition) return null;

  // Resize input height
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      setIsMaxed(textareaRef.current.scrollHeight >= 200); // match CSS
    }
  };

  // Update text on transcript change
  useEffect(() => {
    setText(transcript);
    adjustHeight();
  }, [transcript]);

  // Autoscroll on new message
  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages]);

  // Speech synthesis cancel if new input starts
  useEffect(() => {
    if (transcript && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, [transcript]);

  // Handle Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  // Send message manually
  const sendMessage = () => {
    const message = text.trim();
    if (!message) return;

    addMessage("user", message);
    setText("");
    adjustHeight();

    SpeechRecognition.stopListening();
    resetTranscript();

    fetch(`${import.meta.env.VITE_API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((res) => res.json())
      .then((data: { reply: string }) => {
        addMessage("ai", data.reply);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        addMessage("ai", "Sorry, something went wrong.");
      });
  };

  // Voice mode on/off
  const voiceModeOn = () => {
    setVoiceMode(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log("Mic permission granted");
        SpeechRecognition.startListening({ continuous: true });
      })
      .catch((err) => {
        console.error("Mic permission denied", err);
        alert("Microphone access is required for voice mode.");
      });
  };

  const voiceModeOff = () => {
    setVoiceMode(false);
    window.speechSynthesis.cancel();
    SpeechRecognition.stopListening();
  };

  const toggleMuteMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const toggleMuteDictate = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const clearMessages = () => {
    setMessages([]);
    if (voiceMode) window.speechSynthesis.cancel();
  };

  const addMessage = (type: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { type, text }]);

    if (type === "ai" && voiceMode) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice mode transcript -> message
  useEffect(() => {
    if (!voiceMode || !transcript.trim()) return;

    const trimmed = transcript.trim();

    const timeout = setTimeout(() => {
      addMessage("user", trimmed);
      resetTranscript();

      fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
        .then((res) => res.json())
        .then((data: { reply: string }) => {
          addMessage("ai", data.reply);
        })
        .catch((err) => {
          console.error("Voice fetch error:", err);
          addMessage("ai", "Sorry, something went wrong.");
        });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [transcript, voiceMode]);

  return (
    <>
      <ChatBox messages={messages} />
      <div id="inputquery-container">
        <button
          id="clear-button"
          title="Clear"
          className={voiceMode ? "shifted-clear" : ""}
          onClick={clearMessages}
        >
          Clear
        </button>

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
              {/* Voice Mode Icon */}
              {/* (unchanged - your SVGs are good) */}
              ...
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
            {/* Dictation mic SVGs (muted / unmuted) */}
            ...
          </button>
        )}

        {voiceMode && (
          <div className="voice-mode-controls">
            <button id="mute-button" onClick={toggleMuteMic}>
              {/* Listening vs muted SVG */}
              ...
            </button>
            <button id="exit" onClick={voiceModeOff}>
              X
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default InputQuery;
