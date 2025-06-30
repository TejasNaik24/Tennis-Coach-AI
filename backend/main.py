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

    identity_messages = {
        "who are you": "I am your advanced tennis AI coach.",
        "what can you do": "I can help with tennis rules, training tips, and match strategies.",
        "hello": "Hey there! Ready to ace your next match?",
        "who are you": "I am an advanced artificial intelligence tennis coach, trained on a wide range of tennis matches, strategies, and techniques, with expert-level knowledge of the game.",
        "what can you do": "I can analyze your tennis performance, suggest techniques to improve specific shots like your serve or backhand, create personalized training drills, explain rules and strategies, and answer any tennis-related questions you have — from beginner basics to advanced match tactics.",
        "hello": "Hey there! Ready to ace your next match or sharpen your skills with some focused training drills? Let's level up your tennis game!",
        "hi": "Hey there! Ready to improve your game with drills and winning strategies?",
    }

    for key, response_text in identity_messages.items():
        if key in user_message:
            return jsonify({"reply": response_text})

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