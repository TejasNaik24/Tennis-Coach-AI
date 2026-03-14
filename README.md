# 🎾 Tennis-Coach-AI

A global voice-enabled AI tennis coach. This project was built using React and TypeScript for the frontend, leveraging Vite as the build tool for a fast and modern development experience, and Python with Flask for backend logic. Instead of using cloud-based LLMs like OpenAI, the app uses the Hugging Face Inference API to interact with a Qwen language model, requiring only an API key for secure access. The system supports both speech-to-text and text-to-speech, allowing users to ask tennis-related questions out loud and hear spoken responses, simulating a natural conversation with a virtual tennis coach, or use dictate to send messages. The entire application can also be containerized using Docker for streamlined deployment and development.

Check out the website here!:

 🔗 **[https://tennis-coach-ai.vercel.app](https://tennis-coach-ai.vercel.app)**

---

## ✨ Features

- 🎙️ Toggle dictation on/off with the microphone button to enter talk to enter text
- 🗣️ Live transcription with `react-speech-recognition`
- 🧠 Chat responses powered by Hugging Face’s Inference API using open-weight models like Qwen/Qwen2.5-7B-Instruct.
- 🔊 Voice Mode: Talk naturally, like a real conversation — speak, and it automatically sends your message and talks back to you.
- 🧼 Dynamic UI with input resizing and smooth voice mode transitions
- ✅ Fully keyboard accessible

---

## 🧠 Advanced Thinking Process

Tennis-Coach-AI doesn't just give you an answer; it simulates a coaching thought process for a more transparent and engaging experience.

- **Pulse-Streaming**: Thoughts appear in pulses (sentence by sentence), making the reasoning phase feel dynamic and fast.
- **Expandable Reasoning**: Toggle the "Thought for Xs" block to see exactly how the coach derived its advice from your query.
- **Seamless Transitions**: The AI transitions smoothly from internal reasoning to direct coaching with a premium character-by-character typewriter effect.
- **Persistent Stop Control**: A sleek stop button allows you to interrupt the coach at any time during both the thinking and generating phases.
- **Partial Preservation**: Stopping a response mid-way preserves the thoughts and text generated so far, ensuring no data is lost during the conversation.

---

## 🛠️ Tech Stacks

| Layer      | Technologies Used                                       |
|------------|----------------------------------------------------------|
| Frontend   | React, TypeScript, Vite, CSS Modules                    |
| Voice Input| `react-speech-recognition`                              |
| Voice Output| Web Speech API (`speechSynthesis`)                     |
| Backend    | Python, Flask, HuggingFace                              |
| Deployment | Vercel (frontend), Render (backend), Docker optional    |

---

## 📁 Project Structure

```plaintext
TENNIS-COACH-AI/
├── backend/
│   ├── .venv/
│   ├── .dockerignore
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── node_modules/
│   ├── src/
│   │   ├── assets/
│   │   ├── Components/
│   │   │   ├── ChatBox/
│   │   │   │   ├── ChatBox.css
│   │   │   │   └── ChatBox.tsx
│   │   │   ├── Header/
│   │   │   └── InputQuery/
│   │   │       ├── declarations.d.ts
│   │   │       ├── InputQuery.css
│   │   │       └── InputQuery.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│
├── docker-compose.yml
└── README.md
```
## 🌐 Deployment Platform

| Platform | Link |
|----------|------|
| Vercel   | [https://tennis-coach-ai.vercel.app](https://tennis-coach-ai.vercel.app) |
| Render   | [https://tennis-coach-ai.onrender.com](https://tennis-coach-ai.onrender.com) |


## 🚀 Setup and Deployment

#### Prerequisites

- [Hugging Face account](https://huggingface.co/join)

### Option 1: Production Deployment (Recommended)

#### Frontend (Vercel)
1. Fork this repository
2. Connect to Vercel
3. Set environment variable:
   ```env
   VITE_API_URL = https://your-backend-url.onrender.com
   ```
4. Deploy

#### Backend (Render)
1. Connect GitHub repository

2. Create a Hugging Face API key:
Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) and create a new read access token.
Copy this key — you’ll need it to authenticate requests to the Qwen model.
   
3. Configure environment variables:
```env
HF_TOKEN = your-hf-token
```

4. **Deploy**

### Option 2: Local Development

#### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) v3.10 or higher
- [Docker & Docker Compose](https://www.docker.com/) (recommended for deployment but optional)
- [Hugging Face account](https://huggingface.co/join)

### Setup (with docker)

**make sure to have the docker application running.**

1. **Clone Repository**
```bash
git clone https://github.com/TejasNaik24/Tennis-Coach-AI.git
```

2. Create a Hugging Face API key:
Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) and create a new read access token.
Copy this key — you’ll need it to authenticate requests to the Qwen model.

3. **Create the .env file in the backend folder**

```bash
cd backend
touch .env
```
4. **Add your environment variables**

```bash
HF_TOKEN = your-hf-token
VITE_API_URL = your-localhost-server
```
> Note: the flask server will default bind to http://127.0.0.1:8000 you can change it in the last line of the main.py file

```python
app.run(host='0.0.0.0', port=8000, debug=True)
```
5. **Deploy**
 
 To delopy exit out of backend folder
```bash
cd ..
```
Then simply build and start your containers:

```bash
docker-compose up --build
```

### Setup (without docker)

**You will need to create two separate .env files**

1. **Clone Repository**
```bash
git clone https://github.com/TejasNaik24/Tennis-Coach-AI.git
```

#### Backend setup

2. Create a Hugging Face API key:
Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) and create a new read access token.
Copy this key — you’ll need it to authenticate requests to the Qwen model.

3. **Create the .env file in the backend folder**

```bash
cd backend
touch .env
```
4. **Add your environment variable**

```bash
HF_TOKEN = your-hf-token
```

5. **Create virtual environment and install dependencies**

- **Linux/macOS:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```
  
- **Windows(PowerShell):**
  ```bash
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
  
- **Windows(Command Prompt):**
  ```bash
  python -m venv .venv
  .\.venv\Scripts\activate.bat
  ```
**Then install dependencies**

- **Linux/macOS:**
  ```bash
  pip3 install -r requirements.txt
  ```
  
- **Windows:**
  ```bash
  pip install -r requirements.txt
  ```

6. **Run the backend server**

- **Linux/macOS:**
  ```bash
  python3 main.py
  ```
  
- **Windows:**
  ```bash
  python main.py
  ```

#### Frontend setup

**Open a new terminal**

1. **Create the .env file in the frontend folder**

```bash
cd frontend
touch .env
```
2. **Add your environment variable**

```bash
VITE_API_URL = your-localhost-server
```
> Note: the flask server will default bind to http://127.0.0.1:8000 you can change it in the last line of the main.py file

```python
app.run(host='0.0.0.0', port=8000, debug=True)
```

3. **Install Node Dependencies**

```bash
npm install
```
4. **Run the frontend server**

```bash
npm run dev
```

#### ✅ All Done!

Your frontend Vite server should now be running!

By default, it will be available at:

👉 [http://localhost:5173](http://localhost:5173)

## 🖼️ Images

#### 🔧 Main Hub  

![MainHub](https://github.com/user-attachments/assets/2ae25336-61cf-40ff-9eed-67850d46bbcf)

#### 🎾 Tennis-Coach-AI Demo

![Demo](https://github.com/user-attachments/assets/15f140eb-e1aa-44f8-ac07-5910bd670de3)

#### 🧑‍💻 Tennis-Coach-AI Personalized Response  

![PersonalizedResponse](https://github.com/user-attachments/assets/13b61778-1923-4502-af5d-b2960dcc6838)
