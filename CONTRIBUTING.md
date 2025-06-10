# Contributing to WebLLM Security Assistant

Thank you for your interest in contributing to the WebLLM Security Assistant! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Chrome browser for testing
- Basic knowledge of JavaScript, Chrome Extensions, and WebLLM

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/webllm-security-assistant.git
   cd webllm-security-assistant
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

## 🔧 Development Workflow

### Making Changes
1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Build and test:
   ```bash
   npm run build
   ```
4. Test the extension thoroughly
5. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format
We follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🧪 Testing

### Manual Testing
1. Load the extension in Chrome
2. Test core functionality:
   - WebLLM model loading
   - Chat interface
   - Security detection features
   - Form monitoring
3. Test on various websites:
   - HTTP sites with forms
   - Sites with suspicious elements
   - Different types of content

### Test Pages
Use the included test pages in `test-pages/`:
- `http-login.html` - Test HTTP form detection
- `suspicious-scripts.html` - Test script detection
- `extension-test.html` - Basic extension functionality

## 🐛 Bug Reports

When reporting bugs, please include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if helpful)

## 💡 Feature Requests

For feature requests:
- Describe the feature clearly
- Explain the use case
- Consider security implications
- Suggest implementation approach (if applicable)

## 🔒 Security Considerations

This extension handles sensitive security data:
- All processing must remain local (no external API calls)
- Be careful with user data handling
- Follow Chrome extension security best practices
- Consider privacy implications of new features

## 📁 Project Structure

```
src/
├── background.js      # Service worker, model management
├── content.js         # Page analysis, security monitoring
├── popup.js          # UI logic for extension popup
├── popup.html        # Extension popup interface
├── popup.css         # Styling for popup
└── offscreen.js      # WebLLM model inference

test-pages/           # Test pages for development
manifest.json         # Extension manifest
package.json         # Dependencies and scripts
webpack.config.js    # Build configuration
```

## 🎯 Areas for Contribution

### High Priority
- Improve suspicious script detection accuracy
- Add more cybersecurity analysis features
- Performance optimizations
- Better error handling and recovery

### Medium Priority
- UI/UX improvements
- Additional security patterns
- Documentation improvements
- Test coverage

### Low Priority
- Code refactoring
- Build process improvements
- Developer tooling

## 📋 Pull Request Process

1. Ensure your code follows the existing style
2. Update documentation if needed
3. Add test cases for new features
4. Ensure the extension builds without errors
5. Test thoroughly before submitting
6. Create a clear PR description explaining changes

## 📞 Getting Help

- Open an issue for questions
- Check existing issues for similar problems
- Review the README for basic setup

## 🏆 Recognition

Contributors will be recognized in:
- README acknowledgments
- Release notes for significant contributions
- GitHub contributor statistics

Thank you for contributing to WebLLM Security Assistant! 🛡️