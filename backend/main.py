from flask import Flask, request, jsonify, session
from flask_cors import CORS
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

client = InferenceClient(token=HF_TOKEN)

app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

# Helper function to get or initialize chat history
def get_chat_history():
    if 'chat_history' not in session:
        session['chat_history'] = [
            {"role": "system", "content": "You are an advanced AI tennis coach. Always answer clearly, with helpful tips, and maintain a friendly tone."}
        ]
    return session['chat_history']

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get("message", "")

    # Get chat history from session
    chat_history = get_chat_history()
    chat_history.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model="mistralai/Magistral-Small-2506",
            messages=chat_history
        )

        ai_response = completion.choices[0].message.content
        chat_history.append({"role": "assistant", "content": ai_response})

        # Save updated history
        session['chat_history'] = chat_history

        return jsonify({"reply": ai_response})

    except Exception as e:
        print("Error from LLM:", e)
        return jsonify({"reply": "Sorry, something went wrong while processing your request."})

if __name__ == '__main__':
    app.run(debug=True)