import sys
import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    print(f"HF_TOKEN loaded (length: {len(HF_TOKEN)})", file=sys.stderr)
else:
    print("WARNING: HF_TOKEN is NOT set!", file=sys.stderr)

client = InferenceClient(token=HF_TOKEN)

app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Please say something so I can help!"})

    # Static identity/introduction messages
    identity_messages = {
        "who are you": "I am an advanced artificial intelligence tennis coach, trained on a wide range of tennis matches, strategies, and techniques, with expert-level knowledge of the game.",
        "what can you do": "I can analyze your tennis performance, suggest techniques to improve specific shots like your serve or backhand, create personalized training drills, explain rules and strategies, and answer any tennis-related questions you have — from beginner basics to advanced match tactics.",
        "hello": "Hey there! Ready to ace your next match or sharpen your skills with some focused training drills? Let's level up your tennis game!",
        "hi": "Hey there! Ready to improve your game with drills and winning strategies?",
    }

    for key, response_text in identity_messages.items():
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, user_message.lower()):
            return jsonify({"reply": response_text})

    # Build stateless message list for LLM
    messages = [
        {"role": "system", "content": """You are an advanced AI tennis coach.
Your sole purpose is to help users with tennis-related topics: technique, strategy, fitness, equipment, and mental game.

STRICT DOMAIN RULE: If a user asks about ANYTHING unrelated to tennis (e.g., cars, politics, coding, general life), you MUST politely refuse to answer. DO NOT try to relate the off-topic subject to tennis. Simply say: 'As a tennis coach AI, I can only help with tennis-related things. Let's discuss your serve, forehand, or match strategy instead!'

REASONING RULE: Before providing your final answer, you must first think through your response. Wrap your internal thought process in <thought> tags at the very beginning of your response.
In your thoughts, outline your plan, consider the user's skill level, and decide on the best coaching advice.
Example:
<thought> The user is asking about their backhand. I will suggest checking their grip and follow-through. </thought> Your backhand will improve if you...
"""},
        {"role": "user", "content": user_message}
    ]

    try:
        def generate():
            stream = client.chat.completions.create(
                model="Qwen/Qwen2.5-7B-Instruct",
                messages=messages,
                stream=True
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content

        return app.response_class(generate(), mimetype='text/plain')

    except Exception as e:
        print(f"Error from LLM: {str(e)}", file=sys.stderr)
        return jsonify({"reply": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
