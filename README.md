# 🎤 IDEA ASSISTANCE - AI-Powered Voice Note & Task Manager

An intelligent voice-enabled note-taking and task management application powered by AI. Capture your ideas naturally through voice or text, and let AI organize them for you.

## ✨ Features

### 🎙️ Voice Chat
- **Natural Voice Input**: Speak naturally and see your words appear instantly
- **AI-Powered Understanding**: Automatically detects whether you're creating notes, tasks, or asking questions
- **Image Analysis**: Upload images for AI to analyze and extract information
- **Conversation History**: All your chats are saved and searchable
- **Context-Aware**: AI remembers your conversation context

### 📝 Smart Notes
- **Dynamic Categories**: AI automatically categorizes your notes
- **Quick Search**: Find notes instantly with voice or text search
- **Rich Content**: Support for text and voice recordings

### ✅ Task Management
- **Priority Levels**: Low, Medium, High priority tasks
- **Date & Time**: Set due dates and times for tasks
- **Completed Tasks**: Track your completed tasks by date
- **Trash System**: Deleted tasks are kept for 30 days before permanent deletion
- **Batch Creation**: Create multiple tasks at once with AI

### 🔍 Intelligent Search (RAG)
- **Semantic Search**: Find relevant notes and tasks based on meaning, not just keywords
- **AI Summaries**: Get AI-generated summaries of search results
- **Context-Aware**: Search understands your intent

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Ready**: Beautiful interface with smooth animations
- **PWA Support**: Install as a native app on any device
- **Offline Capable**: Works offline with IndexedDB storage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API Key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NosVision/IDEA-ASSISTANCE.git
   cd IDEA-ASSISTANCE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### First Time Setup

1. Go to **Profile** page
2. Enter your **OpenAI API Key**
3. Start using the app!

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with CSS Variables
- **Database**: Dexie.js (IndexedDB wrapper)
- **AI/ML**: 
  - OpenAI GPT-4 (Chat & Intent Detection)
  - Transformers.js (Local embeddings for RAG)
  - Web Speech API (Voice recognition)
- **PWA**: Vite PWA Plugin
- **Routing**: React Router v6
- **Animations**: Framer Motion

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
```bash
npm run build
# Then deploy the dist/ folder to gh-pages branch
```

## 🔒 Privacy & Security

- **Local Storage**: All your data is stored locally in your browser's IndexedDB
- **API Keys**: Stored securely in IndexedDB, never sent to any server except OpenAI
- **No Backend**: This is a fully client-side application
- **Your Data**: You own all your data - notes, tasks, and conversations

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Core features work offline
- **Fast Loading**: Service worker caching for instant loads
- **Native Feel**: Behaves like a native app

## 🎯 Use Cases

- **Quick Idea Capture**: Speak your ideas and they're automatically organized
- **Meeting Notes**: Record meeting notes with voice and AI categorization
- **Task Management**: Create and manage tasks with natural language
- **Research Assistant**: Ask questions and search through your knowledge base
- **Daily Journal**: Keep track of thoughts and ideas effortlessly

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Hugging Face for Transformers.js
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ by NosVision**
