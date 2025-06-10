# 🛡️ WebLLM Security Assistant

A Chrome extension that integrates WebLLM for cybersecurity analysis and threat detection using local AI models. Built with privacy-first design - all AI processing happens locally on your device.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![WebLLM](https://img.shields.io/badge/WebLLM-Powered-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Local AI Processing**: Uses WebLLM with Qwen2-0.5B model for privacy-focused security analysis
- **🆕 Security Chatbot with Page Context**: AI assistant with deep knowledge of the current webpage's security status
- **Chat Interface**: Interactive security assistant for threat analysis and guidance
- **Page Analysis**: Comprehensive detection of suspicious elements, forms, URLs, and security risks
- **Real-time Context**: Automatic page analysis provides specific security context to the AI
- **Security Validation**: Real-time cybersecurity posture assessment with actionable insights
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

### 🆕 Security Chatbot with Page Context

The enhanced chatbot now automatically analyzes the current webpage and provides context-aware security assistance:

1. **Open the Extension**: Click the extension icon while on any webpage
2. **Automatic Analysis**: The extension immediately analyzes the current page for security issues
3. **Context Indicator**: Look for the "Page context loaded" indicator in the popup
4. **Ask Context-Aware Questions**: The AI now knows about the specific page you're viewing

### Page-Specific Example Queries
- **"Is this page safe?"** - Gets analysis based on actual page security findings
- **"Can I trust this form?"** - Analyzes specific forms detected on the current page
- **"Are there any security risks here?"** - Reviews suspicious elements and external resources
- **"Should I enter my password on this site?"** - Evaluates login form security with HTTPS status
- **"Is this download link suspicious?"** - Analyzes detected download links on the page

### General Security Queries
- "What are signs of a phishing email?"
- "How should I respond to a potential malware infection?"
- "Explain this security vulnerability to me"
- "What's the difference between HTTP and HTTPS?"

### Real-time Page Analysis
The extension automatically detects and analyzes:
- **HTTPS vs HTTP connections** - Critical for form security
- **Login and payment forms** - Validates secure submission
- **Suspicious external scripts** - Identifies potentially malicious code
- **Malicious links and URLs** - Detects URL shorteners, IP addresses, suspicious domains
- **Download links** - Flags executable and archive files
- **Page content and frameworks** - Understands site technology and structure
- **External resources** - Tracks CDNs, iframes, and third-party content

### Security Context Provided to AI
When you ask questions, the AI receives detailed information about:
- Page title, URL, and protocol security
- Detected forms and their security status
- Suspicious elements found on the page
- External resources and their trustworthiness
- Page content preview for context
- Technical frameworks in use

## Architecture

- **Background Script**: Manages WebLLM initialization, message routing, and page context integration
- **Offscreen Document**: Handles heavy WebLLM computations using Web Workers
- **Popup Interface**: Enhanced chat UI with page context indicators and security summaries
- **Content Script**: Comprehensive page analysis engine that extracts security-relevant context
- **Context Integration**: Real-time page analysis provides detailed security context to the AI model

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

## Testing

The extension includes test pages for validating security detection capabilities:

### Test Pages (located in `test-pages/`)
- **`suspicious-scripts.html`** - Tests detection of malicious scripts and suspicious URLs
- **`http-login.html`** - Tests insecure login form detection
- **`extension-test.html`** - General extension functionality testing
- **`debug-scripts.html`** - Debug and development testing

### Testing the Security Chatbot
1. Load the extension in Chrome
2. Navigate to test pages or any website
3. Open the extension popup
4. Wait for "Page context loaded" indicator
5. Ask context-aware questions like "Is this page safe?"

## Expansion Plans

### Phase 2: Advanced Security Features
- Enhanced malware signature detection
- Network traffic analysis integration
- Vulnerability scanning capabilities
- Real-time threat intelligence feeds
- Browser fingerprinting detection

### Phase 3: Enterprise Features
- Policy compliance checking
- Automated security audit reporting
- Integration with SIEM systems
- Custom model fine-tuning for specific threats
- Multi-language security analysis

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
**"Page context loading..." stuck**: Refresh the page and reopen the extension popup
**No security analysis shown**: Ensure the page has loaded completely before opening popup

### Common Issues with Page Context
- **Content script not loading**: Check if the extension has permission to access the current page
- **Context not updating**: Try refreshing the page and reopening the extension
- **Missing security warnings**: Some pages may not trigger security alerts if they appear safe

For issues, check the browser console (F12) for detailed error messages or [open an issue](https://github.com/yourusername/webllm-security-assistant/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WebLLM](https://github.com/mlc-ai/web-llm) for the local AI inference capabilities
- [MLC AI](https://mlc.ai/) for the model optimization
- Chrome Extensions API for the platform# webllm-security-assistant
# webllm-security-assistant
