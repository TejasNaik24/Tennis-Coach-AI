import './InputQuery.css'
import React, { useState, useRef } from "react";

function InputQuery() {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    return(
        <div id="inputquery-container">
        <button id="mute-button" title='Mute'>Mute</button>
        <div className='input-wrapper'>
        <textarea id="chat-input" ref={textareaRef} value={text} onChange={handleChange} rows={1} placeholder="Ask me anything..."/>
        { text && <button id="send-button" title='Send'>↑</button> }
        </div>
        <button id="clear-button" title='Clear'>Clear</button>
        </div>
    );
}

export default InputQuery
