import { CreateMLCEngine } from "@mlc-ai/web-llm";

class WebLLMOffscreen {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.currentModelId = null;
    this.init();
  }

  init() {
    this.setupMessageListener();
    console.log('WebLLM Offscreen initialized');
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'LOAD_MODEL':
          await this.loadModel(message.modelId);
          sendResponse({ success: true });
          break;
        case 'INFERENCE':
          await this.performInference(message.prompt);
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async loadModel(modelId) {
    try {
      console.log(`Loading model: ${modelId}`);
      this.updateStatus('Loading model...');

      // Initialize the engine with the specified model
      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          const percent = Math.round(progress.progress * 100);
          this.updateStatus(`Loading model: ${percent}%`);
          console.log(`Model loading progress: ${percent}%`);
        }
      });

      this.isReady = true;
      this.currentModelId = modelId;
      this.updateStatus('Model ready');
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'MODEL_READY'
      });

      console.log('Model loaded successfully');

    } catch (error) {
      console.error('Failed to load model:', error);
      this.updateStatus(`Error: ${error.message}`);
      
      chrome.runtime.sendMessage({
        type: 'MODEL_ERROR',
        error: error.message
      });
    }
  }

  async performInference(prompt) {
    if (!this.isReady || !this.engine) {
      console.log('Model not ready for inference, current state:', {
        isReady: this.isReady,
        hasEngine: !!this.engine,
        modelId: this.currentModelId
      });
      
      chrome.runtime.sendMessage({
        type: 'MODEL_ERROR',
        error: 'Model not ready'
      });
      return;
    }

    try {
      console.log('Performing inference...');
      
      // Check if engine is still valid
      if (!this.engine.chat || !this.engine.chat.completions) {
        throw new Error('Engine is corrupted, needs reinitialization');
      }
      
      // Use the engine to generate a response
      const response = await this.engine.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 512,
      });

      const assistantMessage = response.choices[0].message.content;
      
      // Send response back to background script
      chrome.runtime.sendMessage({
        type: 'INFERENCE_RESPONSE',
        response: assistantMessage
      });

      console.log('Inference completed successfully');

    } catch (error) {
      console.error('Inference failed:', error);
      
      // Mark as not ready if there's an engine error
      if (error.message.includes('corrupted') || error.message.includes('disposed')) {
        this.isReady = false;
        this.engine = null;
      }
      
      chrome.runtime.sendMessage({
        type: 'MODEL_ERROR',
        error: error.message
      });
    }
  }

  updateStatus(status) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }
}

// Initialize when the offscreen document loads
document.addEventListener('DOMContentLoaded', () => {
  new WebLLMOffscreen();
});