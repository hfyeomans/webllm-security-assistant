class SecurityContentScript {
  constructor() {
    console.log('🛡️ Security Content Script loaded on:', window.location.href);
    this.isActive = false;
    this.monitoredForms = new Set();
    this.alertedElements = new Set(); // Prevent duplicate alerts
    this.lastAnalysis = 0; // Throttle analysis
    this.init();
  }

  init() {
    this.setupMessageListener();
    
    // Run analysis immediately and after DOM is ready
    this.analyzePage();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.analyzePage(), 100);
      });
    }
    
    // Also run after page fully loads
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        setTimeout(() => this.analyzePage(), 100);
      });
    }
    
    this.setupFormMonitoring();
    this.setupMutationObserver();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ANALYZE_PAGE':
          this.performPageAnalysis();
          break;
        case 'CHECK_URL':
          this.analyzeCurrentURL();
          break;
      }
    });
  }

  analyzePage() {
    // Throttle analysis to prevent excessive calls
    const now = Date.now();
    if (now - this.lastAnalysis < 1000) return; // Max once per second
    this.lastAnalysis = now;
    
    console.log('Starting security analysis of page:', window.location.href);
    
    // Perform basic security analysis of the current page
    const analysis = {
      url: window.location.href,
      protocol: window.location.protocol,
      hasHTTPS: window.location.protocol === 'https:',
      domain: window.location.hostname,
      suspiciousElements: this.findSuspiciousElements(),
      forms: this.analyzeForm(),
      timestamp: Date.now()
    };

    // Send analysis to background script if needed
    if (analysis.suspiciousElements.length > 0) {
      analysis.suspiciousElements.forEach(element => {
        if (element.type === 'suspicious_link') {
          this.triggerSecurityAlert('suspicious_link_detected', {
            url: window.location.href,
            linkHref: element.href,
            linkText: element.text,
            timestamp: Date.now()
          });
        }
      });
    }
    
    if (!analysis.hasHTTPS) {
      this.triggerSecurityAlert('insecure_protocol', {
        url: window.location.href,
        protocol: window.location.protocol,
        timestamp: Date.now()
      });
    }
  }

  findSuspiciousElements() {
    const suspicious = [];
    
    console.log('Analyzing page for suspicious elements...');
    
    // Check for suspicious links
    const links = document.querySelectorAll('a[href]');
    console.log(`Found ${links.length} links to analyze`);
    links.forEach(link => {
      const href = link.href;
      if (this.isSuspiciousURL(href)) {
        console.log('Suspicious link detected:', href);
        suspicious.push({
          type: 'suspicious_link',
          element: 'a',
          href: link.href,
          text: link.textContent.substring(0, 100)
        });
      }
    });

    // Check for suspicious scripts
    const scripts = document.querySelectorAll('script[src]');
    console.log(`Found ${scripts.length} external scripts to analyze`);
    scripts.forEach(script => {
      const src = script.src;
      console.log('Analyzing script source:', src);
      if (this.isSuspiciousURL(src)) {
        console.log('Suspicious script detected:', src);
        suspicious.push({
          type: 'suspicious_script',
          element: 'script',
          src: script.src
        });
        
        // Immediately alert for suspicious scripts (prevent duplicates)
        if (!this.alertedElements.has(src)) {
          this.alertedElements.add(src);
          this.triggerSecurityAlert('suspicious_script_detected', {
            url: window.location.href,
            scriptSrc: script.src,
            timestamp: Date.now()
          });
        }
      }
    });

    console.log(`Total suspicious elements found: ${suspicious.length}`);
    return suspicious;
  }

  isSuspiciousURL(url) {
    const suspiciousPatterns = [
      // URL shorteners
      /bit\.ly|tinyurl|t\.co|goo\.gl|short\.link/i,
      // IP addresses
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,
      // Long random domains
      /[a-z0-9]{15,}\.com/i,
      // Suspicious keywords
      /phishing|malware|virus|suspicious|payload|exploit/i,
      // Example domains (for testing)
      /example\.com|malicious-cdn\.example\.com/i,
      // Suspicious TLDs with random names
      /[a-z0-9]{10,}\.(tk|ml|ga|cf)/i
    ];

    console.log('🔍 Checking URL for suspicious patterns:', url);
    
    // Test each pattern individually for debugging
    for (let i = 0; i < suspiciousPatterns.length; i++) {
      const pattern = suspiciousPatterns[i];
      const match = pattern.test(url);
      console.log(`Pattern ${i + 1} (${pattern}): ${match ? '✅ MATCH' : '❌ no match'}`);
      if (match) {
        console.log('🚨 SUSPICIOUS PATTERN MATCHED:', pattern, 'for URL:', url);
        return true;
      }
    }
    
    console.log('✅ URL appears clean:', url);
    return false;
  }

  analyzeForm() {
    const forms = document.querySelectorAll('form');
    const formAnalysis = [];

    forms.forEach(form => {
      const analysis = {
        action: form.action,
        method: form.method,
        hasPasswordField: form.querySelector('input[type="password"]') !== null,
        hasEmailField: form.querySelector('input[type="email"]') !== null,
        isHTTPS: form.action.startsWith('https://') || form.action.startsWith('/'),
        inputCount: form.querySelectorAll('input').length
      };

      if (analysis.hasPasswordField && !analysis.isHTTPS) {
        analysis.securityRisk = 'high';
        analysis.reason = 'Password form over HTTP';
      }

      formAnalysis.push(analysis);
    });

    return formAnalysis;
  }

  performPageAnalysis() {
    const pageData = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      forms: this.analyzeForm(),
      suspicious: this.findSuspiciousElements(),
      meta: this.getMetaInfo()
    };

    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYSIS_RESULT',
      data: pageData
    });
  }

  getMetaInfo() {
    const metaTags = document.querySelectorAll('meta');
    const metaInfo = {};

    metaTags.forEach(meta => {
      if (meta.name) {
        metaInfo[meta.name] = meta.content;
      }
    });

    return metaInfo;
  }

  analyzeCurrentURL() {
    const urlAnalysis = {
      url: window.location.href,
      suspicious: this.isSuspiciousURL(window.location.href),
      protocol: window.location.protocol,
      domain: window.location.hostname,
      path: window.location.pathname
    };

    chrome.runtime.sendMessage({
      type: 'URL_ANALYSIS_RESULT',
      analysis: urlAnalysis
    });
  }

  setupFormMonitoring() {
    // Monitor existing forms
    this.monitorForms();
    
    // Set up input event listeners for password fields
    this.setupPasswordFieldListeners();
  }

  setupMutationObserver() {
    // Watch for new forms being added to the page
    const observer = new MutationObserver((mutations) => {
      let hasNewForms = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || node.querySelector('form')) {
              hasNewForms = true;
            }
          }
        });
      });
      
      if (hasNewForms) {
        setTimeout(() => {
          this.monitorForms();
          this.setupPasswordFieldListeners();
          this.analyzePage(); // Re-analyze when new content is added
        }, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  monitorForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      if (this.monitoredForms.has(form)) return;
      
      this.monitoredForms.add(form);
      
      // Check for password fields
      const passwordFields = form.querySelectorAll('input[type="password"]');
      const isHTTPS = window.location.protocol === 'https:';
      
      if (passwordFields.length > 0 && !isHTTPS) {
        this.showSecurityWarning(form);
      }
      
      // Monitor form submission
      form.addEventListener('submit', (e) => {
        this.handleFormSubmission(form, e);
      });
    });
  }

  setupPasswordFieldListeners() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
      if (field.dataset.securityMonitored) return;
      field.dataset.securityMonitored = 'true';
      
      field.addEventListener('input', () => {
        this.handlePasswordInput(field);
      });
      
      field.addEventListener('focus', () => {
        this.handlePasswordFocus(field);
      });
    });
  }

  handlePasswordInput(passwordField) {
    const form = passwordField.closest('form');
    const isHTTPS = window.location.protocol === 'https:';
    
    if (!isHTTPS && passwordField.value.length > 0) {
      this.triggerSecurityAlert('password_over_http', {
        url: window.location.href,
        formAction: form ? form.action : 'unknown',
        timestamp: Date.now()
      });
    }
  }

  handlePasswordFocus(passwordField) {
    const isHTTPS = window.location.protocol === 'https:';
    
    if (!isHTTPS) {
      this.showInlineWarning(passwordField);
    }
  }

  handleFormSubmission(form, event) {
    const analysis = this.analyzeFormSecurity(form);
    
    if (analysis.securityRisk === 'high') {
      // Don't prevent submission, but alert the user
      this.triggerSecurityAlert('insecure_form_submission', analysis);
    }
  }

  analyzeFormSecurity(form) {
    const passwordFields = form.querySelectorAll('input[type="password"]');
    const emailFields = form.querySelectorAll('input[type="email"], input[name*="email"], input[name*="username"]');
    const isHTTPS = window.location.protocol === 'https:';
    const formAction = form.action;
    const actionIsHTTPS = formAction.startsWith('https://') || formAction.startsWith('/');
    
    const analysis = {
      hasPasswordField: passwordFields.length > 0,
      hasEmailField: emailFields.length > 0,
      pageIsHTTPS: isHTTPS,
      actionIsHTTPS: actionIsHTTPS,
      action: formAction,
      securityRisk: 'low'
    };
    
    if (passwordFields.length > 0 && (!isHTTPS || !actionIsHTTPS)) {
      analysis.securityRisk = 'high';
      analysis.reason = 'Password submitted over HTTP';
    }
    
    return analysis;
  }

  showSecurityWarning(form) {
    if (form.querySelector('.security-warning')) return;
    
    const warning = document.createElement('div');
    warning.className = 'security-warning';
    warning.style.cssText = `
      background: #ffebee;
      border: 1px solid #f44336;
      color: #c62828;
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 10000;
      position: relative;
    `;
    warning.innerHTML = '⚠️ <strong>Security Warning:</strong> This form sends passwords over an unencrypted connection. Your data may be intercepted.';
    
    form.insertBefore(warning, form.firstChild);
  }

  showInlineWarning(passwordField) {
    if (passwordField.nextElementSibling && passwordField.nextElementSibling.className === 'inline-security-warning') return;
    
    const warning = document.createElement('div');
    warning.className = 'inline-security-warning';
    warning.style.cssText = `
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    warning.textContent = '⚠️ Insecure connection - password may be intercepted';
    
    passwordField.parentNode.insertBefore(warning, passwordField.nextSibling);
  }

  triggerSecurityAlert(alertType, data) {
    chrome.runtime.sendMessage({
      type: 'SECURITY_ALERT',
      alertType: alertType,
      data: data,
      timestamp: Date.now()
    });
    
    console.warn(`[Security Alert] ${alertType}:`, data);
  }
}

// Initialize content script
new SecurityContentScript();