class SecurityAssistantPopup {
  constructor() {
    this.messages = [];
    this.isModelReady = false;
    this.hasPageContext = false;
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupMessageListener();
    this.initializeModel();
  }

  setupElements() {
    this.statusEl = document.getElementById('status');
    this.messagesEl = document.getElementById('messages');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.modelInfo = document.getElementById('modelInfo');
    this.pageContextIndicator = document.getElementById('pageContext');
  }

  setupEventListeners() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'MODEL_STATUS':
          this.updateModelStatus(message.status, message.info);
          break;
        case 'CHAT_RESPONSE':
          this.addMessage('assistant', message.response);
          break;
        case 'CHAT_ERROR':
          this.addMessage('system', `Error: ${message.error}`);
          break;
        case 'SECURITY_ALERT_NOTIFICATION':
          this.showSecurityAlert(message);
          break;
        case 'PAGE_CONTEXT_FOR_CHAT':
          this.handlePageContext(message.context);
          break;
      }
    });
  }

  async initializeModel() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'INIT_MODEL'
      });
      this.updateModelStatus('loading', 'Initializing model...');
      
      // Request page context after initialization
      this.requestPageContext();
    } catch (error) {
      this.updateModelStatus('error', 'Failed to initialize');
    }
  }

  async requestPageContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });
        this.updatePageContextStatus('Loading page context...');
      }
    } catch (error) {
      console.error('Failed to request page context:', error);
    }
  }

  updateModelStatus(status, info) {
    this.statusEl.textContent = info || status;
    this.statusEl.className = `status ${status}`;
    
    if (status === 'ready') {
      this.isModelReady = true;
      this.sendButton.disabled = false;
      this.modelInfo.textContent = 'Model: Qwen2-0.5B-Instruct (Security-focused)';
      this.addMessage('system', 'Security Assistant is ready! Ask me about cybersecurity threats, URL analysis, or security best practices.');
    } else if (status === 'error') {
      this.isModelReady = false;
      this.sendButton.disabled = true;
    }
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message) return;

    // Check if model is ready, if not try to reinitialize
    if (!this.isModelReady) {
      this.addMessage('system', 'Model not ready, attempting to reinitialize...');
      await this.initializeModel();
      
      // Queue the message to send after initialization
      setTimeout(() => {
        if (this.isModelReady) {
          this.sendMessage();
        } else {
          this.addMessage('system', 'Please wait for model to initialize');
        }
      }, 2000);
      return;
    }

    this.addMessage('user', message);
    this.messageInput.value = '';
    this.showTypingIndicator();

    try {
      await chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        message: message
      });
    } catch (error) {
      this.addMessage('system', 'Failed to send message - trying to reconnect...');
      this.hideTypingIndicator();
      
      // Try to reinitialize on error
      this.isModelReady = false;
      await this.initializeModel();
    }
  }

  addMessage(sender, content) {
    this.hideTypingIndicator();
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.textContent = content;
    
    this.messagesEl.appendChild(messageEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    
    this.messages.push({ sender, content, timestamp: Date.now() });
  }

  showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'message assistant typing-indicator';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
      <span>Assistant is thinking</span>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    this.messagesEl.appendChild(typingEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  hideTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
  }

  showSecurityAlert(alertData) {
    // Add the security alert as a system message
    this.addMessage('system', alertData.message);
    
    // Also show a temporary notification banner
    this.showAlertBanner(alertData);
  }

  showAlertBanner(alertData) {
    // Remove any existing banner
    const existingBanner = document.querySelector('.security-alert-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    const banner = document.createElement('div');
    banner.className = `security-alert-banner ${alertData.severity}`;
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 8px 12px;
      background: ${alertData.severity === 'high' ? '#ffebee' : '#fff3cd'};
      border-bottom: 1px solid ${alertData.severity === 'high' ? '#f44336' : '#ffc107'};
      color: ${alertData.severity === 'high' ? '#c62828' : '#856404'};
      font-size: 12px;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    
    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${alertData.message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  handlePageContext(context) {
    this.hasPageContext = true;
    this.updatePageContextStatus('Page context loaded');
    
    // Add initial context message
    this.addContextMessage(context);
  }

  updatePageContextStatus(status) {
    if (this.pageContextIndicator) {
      this.pageContextIndicator.textContent = status;
      this.pageContextIndicator.className = this.hasPageContext ? 'context-loaded' : 'context-loading';
    }
  }

  addContextMessage(context) {
    const securitySummary = this.buildSecuritySummary(context);
    this.addMessage('system', `Page Security Analysis: ${securitySummary}`);
    
    // Add helpful suggestions
    this.addMessage('system', 'I now have context about this page. You can ask questions like: "Is this page safe?", "Should I trust this form?", or "Are there any security risks here?"');
  }

  buildSecuritySummary(context) {
    const issues = [];
    const positives = [];
    
    // Check for security issues
    if (!context.basic.isHTTPS) {
      issues.push('insecure HTTP connection');
    }
    
    if (context.security.hasLoginForm && !context.basic.isHTTPS) {
      issues.push('login form over insecure connection');
    }
    
    if (context.security.hasPaymentForm && !context.basic.isHTTPS) {
      issues.push('payment form over insecure connection');
    }
    
    if (context.security.suspiciousElements && context.security.suspiciousElements.length > 0) {
      issues.push(`${context.security.suspiciousElements.length} suspicious elements`);
    }
    
    if (context.content.links.suspicious > 0) {
      issues.push(`${context.content.links.suspicious} suspicious links`);
    }
    
    // Check for positive security indicators
    if (context.basic.isHTTPS) {
      positives.push('secure HTTPS connection');
    }
    
    if (context.security.hasLoginForm && context.basic.isHTTPS) {
      positives.push('secure login form');
    }
    
    let summary = '';
    
    if (issues.length > 0) {
      summary += `⚠️ Issues: ${issues.join(', ')}`;
    }
    
    if (positives.length > 0) {
      if (summary) summary += ' | ';
      summary += `✅ Good: ${positives.join(', ')}`;
    }
    
    if (!summary) {
      summary = '✅ No obvious security issues detected';
    }
    
    return summary;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SecurityAssistantPopup();
});