import './InputQuery.css'

function InputQuery() {
    return(
        <>
        <button id="mute-button">Mute</button>
        <input type="text" id="chat-input" placeholder="Ask Me Anything..." />
        <button id="send-button">↑</button>
        <button id="clear-button">Clear</button>
        </>
    );
}

export default InputQuery