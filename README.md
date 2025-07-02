# 🎾 Tennis-Coach-AI

A global voice-enabled AI tennis coach. This project was built using React and TypeScript for the frontend, providing a modern voice-enabled interface, 
and Python with Flask for backend logic. Instead of using cloud-based LLMs like OpenAI, the app uses the Hugging Face Inference API to interact with a 
Mistral language model, requiring only an API key for secure access. The system supports both speech-to-text and text-to-speech, allowing users to ask 
tennis-related questions out loud and hear spoken responses, simulating a natural conversation with a virtual tennis coach.
## 📚 Table of Contents

- [Demo](#-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Setup](#-setup)
  - [Frontend](#-frontend)
  - [Backend](#-backend)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
  - [Render (Backend)](#render-backend)
  - [Vercel (Frontend)](#vercel-frontend)
  - [Docker (Full Stack)](#docker-full-stack)
- [License](#-license)

---

## 🎥 Demo

**Live Demo:** [your-vercel-link.vercel.app](https://your-vercel-link.vercel.app)

---

## ✨ Features

- 🎙️ Toggle voice input on/off with microphone button
- 🗣️ Live transcription with `react-speech-recognition`
- 🧠 Chat responses powered by OpenAI’s API
- 🔊 Voice output via Web Speech Synthesis
- 🧼 Dynamic UI with input resizing and smooth voice mode transitions
- ✅ Fully keyboard accessible
- 💡 Works in most Chromium browsers

---

## 🛠️ Tech Stack

| Layer      | Technologies Used                                       |
|------------|----------------------------------------------------------|
| Frontend   | React, TypeScript, Vite, CSS Modules                    |
| Voice Input| `react-speech-recognition`                              |
| Voice Output| Web Speech API (`speechSynthesis`)                     |
| Backend    | Node.js, Express, OpenAI API                            |
| Deployment | Vercel (frontend), Render (backend), Docker optional    |

---

## 🚀 Setup

Clone the repository:

```bash
git clone https://github.com/yourname/voicegpt.git
cd voicegpt
