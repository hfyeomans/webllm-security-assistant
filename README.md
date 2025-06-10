# 🛡️ WebLLM Security Assistant

A Chrome extension that integrates WebLLM for cybersecurity analysis and threat detection using local AI models. Built with privacy-first design - all AI processing happens locally on your device.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![WebLLM](https://img.shields.io/badge/WebLLM-Powered-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Local AI Processing**: Uses WebLLM with Qwen2-0.5B model for privacy-focused security analysis
- **Chat Interface**: Interactive security assistant for threat analysis and guidance
- **Page Analysis**: Automatic detection of suspicious elements, forms, and URLs
- **Security Validation**: Real-time cybersecurity posture assessment
- **Offline Capability**: Runs entirely locally without sending data to external servers

## Installation

1. **Build the Extension**:
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `dist` folder

3. **Initial Setup**:
   - Click the extension icon in Chrome toolbar
   - Wait for the WebLLM model to download and initialize (~2-3 minutes first time)
   - Once ready, start chatting with the security assistant

## Usage

### Chat Interface
- Ask about cybersecurity threats and best practices
- Request analysis of URLs or domains  
- Get guidance on security incidents
- Analyze suspicious content or emails

### Example Queries
- "Is this URL suspicious: http://bit.ly/xyz123?"
- "What are signs of a phishing email?"
- "How should I respond to a potential malware infection?"
- "Analyze the security of this website"

### Page Analysis
The extension automatically analyzes web pages for:
- Non-HTTPS forms with password fields
- Suspicious URLs and redirects
- Potentially malicious scripts
- Security best practice violations

## Architecture

- **Background Script**: Manages WebLLM initialization and message routing
- **Offscreen Document**: Handles heavy WebLLM computations using Web Workers
- **Popup Interface**: Chat UI for user interactions
- **Content Script**: Analyzes web pages for security issues

## Security Model

- **Qwen2-0.5B-Instruct**: Lightweight 0.5B parameter model optimized for instruction following
- **Local Processing**: All AI inference happens locally on your device
- **No Data Transmission**: No user data or queries sent to external servers
- **Privacy First**: Designed for sensitive cybersecurity use cases

## Development

```bash
# Development mode with file watching
npm run dev

# Production build
npm run build

# Run tests
npm test
```

## Expansion Plans

### Phase 2: Advanced Security Features
- Malware signature detection
- Network traffic analysis  
- Vulnerability scanning integration
- Threat intelligence feeds

### Phase 3: Enterprise Features
- Policy compliance checking
- Security audit reporting
- Integration with SIEM systems
- Custom model fine-tuning

## Technical Notes

- Extension uses Manifest V3 for modern Chrome compatibility
- WebAssembly support required for WebLLM model execution
- Initial model download is ~2.5GB (cached locally)
- Minimum 4GB RAM recommended for optimal performance


### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/webllm-security-assistant.git`
3. Install dependencies: `npm install`
4. Make your changes
5. Build: `npm run build`
6. Test the extension
7. Submit a pull request

## 🐛 Troubleshooting

**Model not loading**: Ensure sufficient disk space (~3GB) and memory
**Extension not working**: Check Chrome developer console for errors
**Slow responses**: Model inference speed depends on device performance
**"Model not ready" errors**: Extension auto-recovers, wait for reinitialization

For issues, check the browser console (F12) for detailed error messages or [open an issue](https://github.com/yourusername/webllm-security-assistant/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WebLLM](https://github.com/mlc-ai/web-llm) for the local AI inference capabilities
- [MLC AI](https://mlc.ai/) for the model optimization
- Chrome Extensions API for the platform# webllm-security-assistant
# webllm-security-assistant
