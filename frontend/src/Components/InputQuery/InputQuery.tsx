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

  /* ---------- new local mic‑state ---------- */
  const [micActive, setMicActive] = useState(false);

  const startMic = async () => {
    try {
      await SpeechRecognition.startListening({ continuous: true });
      setMicActive(true);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        alert(
          "Microphone access is blocked for this site. Click the pad‑lock in the address bar → Site settings → Microphone → Allow."
        );
      }
    }
  };

  const stopMic = () => {
    SpeechRecognition.stopListening();
    setMicActive(false);
  };

  /*  keep local flag in sync with library flag (in case it
      stops on its own) */
  useEffect(() => {
    setMicActive(listening);
  }, [listening]);
  /* ----------------------------------------- */

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

  /* ---------- handlers updated to use start/stop ---------- */
  const toggleMuteMic = () => {
    micActive ? stopMic() : startMic();
  };

  const toggleMuteDictate = () => {
    if (micActive) {
      stopMic();
    } else {
      resetTranscript();
      startMic();
    }
  };

  const voiceModeOn = () => {
    setVoiceMode(true);
    startMic();
  };

  const voiceModeOff = () => {
    setVoiceMode(false);
    window.speechSynthesis.cancel();
    stopMic();
  };
  /* -------------------------------------------------------- */

  const clearMessages = () => {
    setMessages([]);
    if (voiceMode) window.speechSynthesis.cancel();
  };

  useEffect(() => {
    setText(transcript);
    adjustHeight();
  }, [transcript]);

  // Run once on mount to prevent "jump"
  useEffect(() => {
    adjustHeight();
  }, []);

  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (voiceMode && transcript.trim()) {
      const timeout = setTimeout(() => {
        addMessage("user", transcript.trim());
        resetTranscript();

        fetch(`${import.meta.env.VITE_API_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript.trim() }),
        })
          .then((r) => r.json())
          .then((data: { reply: string }) => addMessage("ai", data.reply))
          .catch(() => addMessage("ai", "Sorry, something went wrong."));
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
    adjustHeight();

    stopMic(); /* <‑‑ ensure mic is off */
    resetTranscript();

    fetch(`${import.meta.env.VITE_API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((r) => r.json())
      .then((data: { reply: string }) => addMessage("ai", data.reply))
      .catch(() => addMessage("ai", "Sorry, something went wrong."));
  };

  const addMessage = (type: "user" | "ai", text: string) => {
    setMessages((prev) => [...prev, { type, text }]);

    if (type === "ai" && voiceMode) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
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
              onChange={(e) => {
                setText(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ overflowY: isMaxed ? "auto" : "hidden" }}
              placeholder={!micActive ? "Ask me anything..." : "Listening..."}
              disabled={micActive}
              className="scroll-class"
            />
          )}

          {!text && !voiceMode && (
            <button
              id="voice-mode"
              title="Use voice mode"
              onClick={voiceModeOn}
            >
              {/* …svg unchanged… */}
            </button>
          )}

          {text && !voiceMode && (
            <button id="send-button" title="Send" onClick={sendMessage}>
              ↑
            </button>
          )}
        </div>

        {/* -------- Dictate button -------- */}
        {!voiceMode && (
          <button id="dictate" title="Dictate" onClick={toggleMuteDictate}>
            {!micActive ? (
              /* muted icon */
              /* …svg unchanged… */
              <></>
            ) : (
              /* un‑muted icon */
              /* …svg unchanged… */
              <></>
            )}
          </button>
        )}

        {/* -------- Voice‑mode controls -------- */}
        {voiceMode && (
          <div className="voice-mode-controls">
            <button id="mute-button" onClick={toggleMuteMic}>
              {!micActive ? (
                /* muted icon */
                /* …svg unchanged… */
                <></>
              ) : (
                /* un‑muted icon */
                /* …svg unchanged… */
                <></>
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
