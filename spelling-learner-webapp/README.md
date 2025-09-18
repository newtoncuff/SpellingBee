# SpellingBee - Spelling Learning Web App

A web application designed to help children improve spelling skills through interactive image-based word puzzles.

## System Requirements

- **OS:** Windows 10 or later
- **IDE:** Visual Studio Code (VS Code)
- **Package Managers:** Node.js (with npm or yarn), Python (with pip)
- **Database:** SQLite

## Project Overview

SpellingBee is an educational web application that presents words of varying difficulty alongside relevant images, prompting users to fill in missing letters. The app offers different difficulty levels and provides immediate visual feedback on letter selections.

- Frontend: React with TypeScript
- Backend: Python Flask
- Database: SQLite

## Project Structure

```
spelling-learner-webapp/
├── backend/               # Flask backend
│   ├── app.py             # Main application file
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Docker configuration for backend
├── frontend/              # React frontend
│   ├── src/               
│   │   ├── components/    # React components
│   │   │   ├── AlphabetSelector/
│   │   │   ├── DifficultySelector/
│   │   │   ├── FeedbackPopup/
│   │   │   ├── ImageDisplay/
│   │   │   └── PuzzleWord/
│   │   ├── App.tsx        # Main App component
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── ...
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Docker configuration for frontend
├── data/                  # SQLite database and images
│   └── images/            # Word images
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # Project documentation
```

## Installation and Setup

### Prerequisites Installation

1. Install Node.js & npm:
   ```
   Download from https://nodejs.org/
   ```

2. Install Python 3.x:
   ```
   Download from https://www.python.org/downloads/
   ```

3. Install SQLite:
   ```
   Download from https://www.sqlite.org/download.html
   ```

### Project Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd spelling-learner-webapp
   ```

2. Backend setup:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate    # Windows (PowerShell)
   pip install -r requirements.txt
   ```

3. Frontend setup:
   ```
   cd frontend
   npm install
   ```

### Running the Application

#### Method 1: Manual Startup

1. Start the backend:
   ```
   cd backend
   venv\Scripts\activate
   python app.py
   ```

2. Start the frontend:
   ```
   cd frontend
   npm start
   ```

3. Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

#### Method 2: Docker

If you have Docker installed:

```
docker-compose up --build
```

Then access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features

- Three difficulty levels (easy, medium, hard) based on word length
- Interactive puzzle solving with immediate visual feedback
- Random word/image combinations with repetition prevention
- Progressive letter filling (left to right)
- Visual feedback for correct/incorrect answers
- Stats tracking

## Development

### Running Tests

Frontend tests:
```
cd frontend
npm test
```

### Project Requirements

See the Software Requirements Specification (SRS) document for detailed requirements.

## License

This project is for educational purposes only.