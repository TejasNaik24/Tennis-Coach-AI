# 🎾 Tennis-Coach-AI

A global voice-enabled AI tennis coach. This project was built using React and TypeScript for the frontend, providing a modern voice-enabled interface, 
and Python with Flask for backend logic. Instead of using cloud-based LLMs like OpenAI, the app uses the Hugging Face Inference API to interact with a 
Mistral language model, requiring only an API key for secure access. The system supports both speech-to-text and text-to-speech, allowing users to ask 
tennis-related questions out loud and hear spoken responses, simulating a natural conversation with a virtual tennis coach, or use dictate to send messages.

Check out the website here!:

 🔗 **[https://tennis-coach-ai.vercel.app](https://tennis-coach-ai.vercel.app)**
 > Note: With the free version of render being used, it will cause a delay when starting the backend 15 minutes after the app has not been in use. If you send a request and get an error, retry again and wait a little longer for the backend to start up, which can take up to 3 minutes.

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Frontend](#frontend)
- [Backend](#backend)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Render (Backend)](#render-backend)
- [Vercel (Frontend)](#vercel-frontend)
- [Docker (Full Stack)](#docker-full-stack)

---

## ✨ Features

- 🎙️ Toggle dictation on/off with the microphone button to enter talk to enter text
- 🗣️ Live transcription with `react-speech-recognition`
- 🧠 Chat responses powered by Hugging Face’s Inference API using open-weight models like Mistral.
- 🔊 Voice Mode: Talk naturally, like a real conversation — speak, and it automatically sends your message and talks back to you.
- 🧼 Dynamic UI with input resizing and smooth voice mode transitions
- ✅ Fully keyboard accessible

---

## 🛠️ Tech Stack

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


## 🚀 Setup

Clone the repository:

```bash
git clone https://github.com/yourname/voicegpt.git
cd voicegpt
