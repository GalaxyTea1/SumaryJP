# 🇯🇵 SumaryJP - Japanese Vocabulary Learning Platform

SumaryJP is a modern, feature-rich web application designed to help learners master Japanese vocabulary through scientifically proven methods like **Spaced Repetition System (SRS)** and interactive learning tools.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)

---

## 🚀 Key Features

- **Spaced Repetition System (SRS)**: Optimized review schedules based on your memory performance.
- **Interactive Flashcards**: 3D flip-card experience for traditional memorization.
- **OCR Search**: Upload images to scan and search for Japanese characters instantly.
- **JLPT Focused**: Comprehensive vocabulary lists covering N5 to N1 levels.
- **Gamification**: Stay motivated with streaks, weekly goals, experience points (XP), and league rankings.
- **Dark Mode**: Sleek, modern interface with glassmorphism aesthetics, easy on the eyes.
- **Offline Support**: PWA-ready for learning on the go without a constant internet connection.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla JavaScript**: Modular MPA architecture for high performance.
- **Tailwind CSS**: Modern styling with glassmorphism effects.
- **Chart.js**: Visual progress tracking and statistics.
- **PWA**: Service Workers and Manifest for a native app-like experience.

### Backend
- **Node.js & Express**: Robust and scalable API server.
- **SQLite**: Lightweight, file-based database for efficient data management.
- **JWT Authentication**: Secure user sessions and role-based access control.

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SumaryJapanese.git
   cd SumaryJapanese
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   # Simply serve index.html using Live Server or any static host
   ```

---

## 📂 Project Structure

```text
├── frontend/             # Client-side application
│   ├── components/       # Reusable UI components
│   ├── partials/         # HTML snippets loaded dynamically
│   ├── images/           # Assets and icons
│   └── script.js         # Core frontend logic
├── backend/              # API Server
    ├── controllers/      # Business logic
    ├── models/           # Database interactions (SQL)
    ├── routes/           # API Endpoints
    └── server.js         # Server entry point

```

---

## 🗺️ Roadmap

- [ ] **TypeScript Migration**: Refactoring both frontend and backend for better maintainability.
- [ ] **AI Sensei**: Integration with Gemini/GPT for contextual grammar explanations.
- [ ] **Mobile App**: Developing a dedicated mobile version using Flutter or React Native.
- [ ] **Community Features**: Shared decks and collaborative learning rooms.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ for Japanese learners.
