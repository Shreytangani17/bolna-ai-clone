# Contributing to Bolna AI Clone

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/bolna-ai-clone.git`
3. Create a feature branch: `git checkout -b feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add feature"`
7. Push: `git push origin feature-name`
8. Create a Pull Request

## Development Setup

### Prerequisites
- Node.js 16+
- OpenAI API key
- Deepgram API key

### Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## Code Style

- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns
- Test your changes before submitting

## Pull Request Guidelines

- Describe what your PR does
- Include screenshots for UI changes
- Test on both Chrome and Firefox
- Update documentation if needed

## Issues

- Use clear, descriptive titles
- Include steps to reproduce bugs
- Mention your browser and OS
- Add screenshots if helpful