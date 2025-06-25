import "./InputQuery.css";
import React, { useState, useRef, useEffect } from "react";

function InputQuery() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  // Run once on mount to prevent "jump"
  useEffect(() => {
    adjustHeight();
  }, []);

  return (
    <div id="inputquery-container">
      <button id="mute-button" title="Mute">
        Mute
      </button>

      <div className="input-wrapper">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          rows={1}
          placeholder="Ask me anything..."
        />
        {text && (
          <button id="send-button" title="Send">
            ↑
          </button>
        )}
      </div>

      <button id="clear-button" title="Clear">
        Clear
      </button>
    </div>
  );
}

export default InputQuery;
