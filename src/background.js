class SecurityAssistantBackground {
  constructor() {
    this.isModelReady = false;
    this.modelEngine = null;
    this.currentPageContext = null;
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.setupOffscreenDocument();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async setupOffscreenDocument() {
    try {
      // Check if offscreen document already exists
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });

      if (existingContexts.length === 0) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['WORKERS'],
          justification: 'WebLLM model inference requires Web Workers'
        });
      }
    } catch (error) {
      console.error('Failed to create offscreen document:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'INIT_MODEL':
          await this.initializeModel();
          sendResponse({ success: true });
          break;
        case 'CHAT_MESSAGE':
          await this.processChatMessage(message.message);
          sendResponse({ success: true });
          break;
        case 'MODEL_READY':
          this.handleModelReady();
          sendResponse({ success: true });
          break;
        case 'MODEL_ERROR':
          this.handleModelError(message.error);
          sendResponse({ success: true });
          break;
        case 'INFERENCE_RESPONSE':
          this.handleInferenceResponse(message.response);
          sendResponse({ success: true });
          break;
        case 'SECURITY_ALERT':
          this.handleSecurityAlert(message.alertType, message.data);
          sendResponse({ success: true });
          break;
        case 'PAGE_CONTEXT_FOR_CHAT':
          this.handlePageContext(message.context);
          // Forward to popup
          this.broadcastToPopup({
            type: 'PAGE_CONTEXT_FOR_CHAT',
            context: message.context
          });
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async initializeModel() {
    try {
      this.broadcastToPopup({
        type: 'MODEL_STATUS',
        status: 'loading',
        info: 'Loading WebLLM model...'
      });

      // Ensure offscreen document exists
      await this.setupOffscreenDocument();

      // Send message to offscreen document to initialize model
      chrome.runtime.sendMessage({
        type: 'LOAD_MODEL',
        modelId: 'Qwen2-0.5B-Instruct-q4f16_1-MLC'
      });

    } catch (error) {
      console.error('Model initialization failed:', error);
      this.broadcastToPopup({
        type: 'MODEL_STATUS',
        status: 'error',
        info: 'Failed to load model'
      });
    }
  }

  handleModelReady() {
    this.isModelReady = true;
    this.broadcastToPopup({
      type: 'MODEL_STATUS',
      status: 'ready',
      info: 'Ready'
    });
  }

  handleModelError(error) {
    this.isModelReady = false;
    this.broadcastToPopup({
      type: 'MODEL_STATUS',
      status: 'error',
      info: `Error: ${error}`
    });
  }

  async processChatMessage(userMessage) {
    if (!this.isModelReady) {
      // Try to reinitialize the model if it's not ready
      console.log('Model not ready, attempting to reinitialize...');
      await this.initializeModel();
      
      // Wait a moment and check again
      setTimeout(() => {
        if (!this.isModelReady) {
          this.broadcastToPopup({
            type: 'CHAT_ERROR',
            error: 'Model not ready - please wait for initialization'
          });
        }
      }, 1000);
      return;
    }

    try {
      // Enhance the prompt for cybersecurity context
      const securityPrompt = this.buildSecurityPrompt(userMessage);
      
      // Send to offscreen document for inference
      chrome.runtime.sendMessage({
        type: 'INFERENCE',
        prompt: securityPrompt
      });

    } catch (error) {
      console.error('Chat processing failed:', error);
      this.broadcastToPopup({
        type: 'CHAT_ERROR',
        error: 'Failed to process message'
      });
    }
  }

  buildSecurityPrompt(userMessage) {
    let contextInfo = '';
    
    if (this.currentPageContext) {
      contextInfo = this.buildPageContextPrompt(this.currentPageContext);
    }
    
    const systemPrompt = `You are a cybersecurity assistant with access to the current webpage's security context. Provide helpful, accurate information about:
- Threat analysis and risk assessment
- Security best practices
- Vulnerability identification
- Incident response guidance
- URL and domain reputation analysis
- Phishing and malware detection

${contextInfo}

Keep responses concise and actionable. When analyzing the current page, reference specific security findings. If analyzing potentially malicious content, clearly state the risks.

User question: ${userMessage}

Response:`;

    return systemPrompt;
  }

  buildPageContextPrompt(context) {
    const ctx = context;
    let prompt = '\n--- CURRENT PAGE SECURITY CONTEXT ---\n';
    
    // Basic page info
    prompt += `Page: ${ctx.basic.title} (${ctx.basic.url})\n`;
    prompt += `Protocol: ${ctx.basic.protocol} (HTTPS: ${ctx.basic.isHTTPS})\n`;
    
    // Security findings
    if (ctx.security.suspiciousElements && ctx.security.suspiciousElements.length > 0) {
      prompt += `⚠️ SUSPICIOUS ELEMENTS DETECTED: ${ctx.security.suspiciousElements.length} found\n`;
    }
    
    if (ctx.security.hasLoginForm) {
      prompt += `🔐 Login form detected${!ctx.basic.isHTTPS ? ' (INSECURE - over HTTP!)' : ''}\n`;
    }
    
    if (ctx.security.hasPaymentForm) {
      prompt += `💳 Payment form detected${!ctx.basic.isHTTPS ? ' (CRITICAL RISK - over HTTP!)' : ''}\n`;
    }
    
    // External resources
    if (ctx.security.externalResources) {
      const ext = ctx.security.externalResources;
      if (ext.scripts.length > 0) {
        prompt += `📜 External scripts: ${ext.scripts.length} (suspicious: ${ext.scripts.filter(s => s.suspicious).length})\n`;
      }
      if (ext.iframes.length > 0) {
        prompt += `🖼️ iframes: ${ext.iframes.length} (suspicious: ${ext.iframes.filter(f => f.suspicious).length})\n`;
      }
    }
    
    // Links analysis
    if (ctx.content.links) {
      const links = ctx.content.links;
      if (links.suspicious > 0) {
        prompt += `🔗 SUSPICIOUS LINKS: ${links.suspicious} of ${links.total} total links\n`;
      }
      if (links.downloadLinks > 0) {
        prompt += `📥 Download links: ${links.downloadLinks}\n`;
      }
    }
    
    // Page content summary
    if (ctx.content.visibleText) {
      prompt += `📄 Page content preview: "${ctx.content.visibleText.substring(0, 200)}..."\n`;
    }
    
    prompt += '--- END CONTEXT ---\n\n';
    
    return prompt;
  }

  handlePageContext(context) {
    this.currentPageContext = context;
    console.log('Updated page context for security analysis:', context.basic.url);
  }

  handleInferenceResponse(response) {
    this.broadcastToPopup({
      type: 'CHAT_RESPONSE',
      response: response
    });
  }

  handleSecurityAlert(alertType, data) {
    console.log(`Security Alert: ${alertType}`, data);
    
    let alertMessage = '';
    let severity = 'medium';
    
    switch (alertType) {
      case 'password_over_http':
        alertMessage = `🚨 Security Risk: Password entered on insecure site ${data.url}`;
        severity = 'high';
        break;
      case 'insecure_form_submission':
        alertMessage = `⚠️ Insecure form submission detected on ${data.url}`;
        severity = 'high';
        break;
      case 'suspicious_script_detected':
        alertMessage = `🚨 Suspicious Script: ${data.scriptSrc} on ${data.url}`;
        severity = 'high';
        break;
      case 'suspicious_link_detected':
        alertMessage = `⚠️ Suspicious Link: ${data.linkHref} on ${data.url}`;
        severity = 'medium';
        break;
      case 'insecure_protocol':
        alertMessage = `🔓 Insecure Protocol: ${data.protocol} on ${data.url}`;
        severity = 'medium';
        break;
      default:
        alertMessage = `Security alert: ${alertType}`;
        console.warn('Unknown alert type:', alertType, data);
    }
    
    // Send to popup if open
    this.broadcastToPopup({
      type: 'SECURITY_ALERT_NOTIFICATION',
      alertType: alertType,
      message: alertMessage,
      severity: severity,
      data: data
    });
    
    // Store alert for later reference
    this.storeSecurityAlert(alertType, data, alertMessage);
  }

  async storeSecurityAlert(alertType, data, message) {
    try {
      const alerts = await chrome.storage.local.get(['securityAlerts']) || { securityAlerts: [] };
      const newAlert = {
        id: Date.now(),
        type: alertType,
        message: message,
        data: data,
        timestamp: Date.now(),
        url: data.url || 'unknown'
      };
      
      alerts.securityAlerts.unshift(newAlert);
      
      // Keep only last 50 alerts
      if (alerts.securityAlerts.length > 50) {
        alerts.securityAlerts = alerts.securityAlerts.slice(0, 50);
      }
      
      await chrome.storage.local.set({ securityAlerts: alerts.securityAlerts });
    } catch (error) {
      console.error('Failed to store security alert:', error);
    }
  }

  async broadcastToPopup(message) {
    try {
      // Send to all extension contexts (popup, etc.)
      chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to broadcast message:', error);
    }
  }
}

// Initialize the background service
new SecurityAssistantBackground();