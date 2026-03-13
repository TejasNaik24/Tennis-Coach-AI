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
    }

    for key, response_text in identity_messages.items():
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, user_message.lower()):
            return jsonify({"reply": response_text})

    # Build stateless message list for LLM
    messages = [
        {"role": "system", "content": (
            "You are an advanced AI tennis coach. Your sole purpose is to help users with tennis-related topics: technique, strategy, fitness, equipment, and mental game. "
            "STRICT RULE: If a user asks about ANYTHING unrelated to tennis (e.g., cars, politics, coding, general life), you MUST politely refuse. DO NOT relate it to tennis. Simply say: 'As a tennis coach AI, I can only help with tennis-related things. Let's discuss your serve, forehand, or match strategy instead!' "
            "THINKING RULE: You MUST always begin your response with a <think> block containing your internal reasoning and planning. Inside <think>, analyze the user question step by step, consider relevant tennis concepts, and plan your answer. Then close with </think> and write your final polished answer. "
            "Example format:\n<think>\nThe user is asking about improving their serve. I should cover grip, toss, and follow-through...\n</think>\nHere are some tips to improve your serve..."
        )},
        {"role": "user", "content": user_message}
    ]

    try:
        completion = client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=messages
        )
        ai_response = completion.choices[0].message.content

        # Parse <think>...</think> block from the response
        think_match = re.search(r'<think>(.*?)</think>', ai_response, re.DOTALL)
        if think_match:
            thinking_text = think_match.group(1).strip()
            final_answer = ai_response[think_match.end():].strip()
        else:
            thinking_text = ""
            final_answer = ai_response.strip()

        return jsonify({"thinking": thinking_text, "reply": final_answer})

    except Exception as e:
        print(f"Error from LLM: {str(e)}", file=sys.stderr)
        return jsonify({"thinking": "", "reply": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
