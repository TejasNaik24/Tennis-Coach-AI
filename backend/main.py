from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import InferenceClient

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

client = InferenceClient(
    provider = "featherless-ai",
    api_key = HF_TOKEN,
)

app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get("message", "")

    try:
        completion = client.chat.completions.create(
            model="mistralai/Magistral-Small-2506",
            messages=[
                {"role": "user", "content": user_message}
            ],
        )
        ai_response = completion.choices[0].message.content or "Sorry, I couldn't think of a reply."
        return jsonify({"reply": ai_response.strip()})
    except Exception as e:
        return jsonify({"reply": "Sorry, something went wrong while processing your request."})

if __name__ == '__main__':
    app.run(debug=True)
