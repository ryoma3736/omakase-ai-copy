/**
 * Omakase AI Chat Widget
 * Embeddable chat widget for EC sites
 */

(function() {
  'use strict';

  const OmakaseWidget = {
    config: {
      agentId: null,
      position: 'bottom-right',
      theme: 'light',
      primaryColor: '#6366f1',
      welcomeMessage: 'こんにちは！何かお探しですか？',
      apiBaseUrl: window.location.origin
    },

    isOpen: false,
    messages: [],
    container: null,
    iframe: null,

    init: function(options) {
      if (!options.agentId) {
        console.error('OmakaseWidget: agentId is required');
        return;
      }

      this.config = { ...this.config, ...options };
      this.createWidget();
      this.attachEventListeners();
    },

    createWidget: function() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'omakase-widget-container';
      this.container.innerHTML = this.getWidgetHTML();
      document.body.appendChild(this.container);

      // Add styles
      const style = document.createElement('style');
      style.textContent = this.getWidgetCSS();
      document.head.appendChild(style);
    },

    getWidgetHTML: function() {
      const { position, theme, primaryColor } = this.config;
      const positionClass = position === 'bottom-left' ? 'omakase-left' : 'omakase-right';
      const themeClass = theme === 'dark' ? 'omakase-dark' : 'omakase-light';

      return `
        <div class="omakase-widget ${positionClass} ${themeClass}">
          <!-- Chat Window -->
          <div class="omakase-chat-window" id="omakase-chat-window" style="display: none;">
            <div class="omakase-header" style="background-color: ${primaryColor};">
              <div class="omakase-header-info">
                <div class="omakase-avatar">${this.config.agentName ? this.config.agentName.charAt(0) : 'A'}</div>
                <div class="omakase-header-text">
                  <div class="omakase-agent-name">${this.config.agentName || 'アシスタント'}</div>
                  <div class="omakase-status">オンライン</div>
                </div>
              </div>
              <button class="omakase-close-btn" id="omakase-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="omakase-messages" id="omakase-messages"></div>
            <div class="omakase-input-area">
              <input type="text" class="omakase-input" id="omakase-input" placeholder="メッセージを入力..." />
              <button class="omakase-send-btn" id="omakase-send-btn" style="background-color: ${primaryColor};">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

          <!-- Toggle Button -->
          <button class="omakase-toggle-btn" id="omakase-toggle-btn" style="background-color: ${primaryColor};">
            <svg id="omakase-icon-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg id="omakase-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    },

    getWidgetCSS: function() {
      const { theme } = this.config;
      const bgColor = theme === 'dark' ? '#1f2937' : '#ffffff';
      const textColor = theme === 'dark' ? '#ffffff' : '#1f2937';
      const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
      const messageBg = theme === 'dark' ? '#374151' : '#f3f4f6';

      return `
        .omakase-widget {
          position: fixed;
          z-index: 999999;
          bottom: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .omakase-right { right: 20px; }
        .omakase-left { left: 20px; }

        .omakase-chat-window {
          width: 360px;
          height: 500px;
          background: ${bgColor};
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid ${borderColor};
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .omakase-header {
          padding: 16px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .omakase-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .omakase-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .omakase-agent-name {
          font-weight: 600;
          font-size: 14px;
        }

        .omakase-status {
          font-size: 12px;
          opacity: 0.8;
        }

        .omakase-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .omakase-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .omakase-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: ${messageBg};
        }

        .omakase-message {
          margin-bottom: 12px;
          display: flex;
        }

        .omakase-message.user {
          justify-content: flex-end;
        }

        .omakase-message-content {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .omakase-message.assistant .omakase-message-content {
          background: ${bgColor};
          color: ${textColor};
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .omakase-message.user .omakase-message-content {
          color: white;
          border-bottom-right-radius: 4px;
        }

        .omakase-input-area {
          padding: 16px;
          border-top: 1px solid ${borderColor};
          display: flex;
          gap: 8px;
          background: ${bgColor};
        }

        .omakase-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid ${borderColor};
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: ${bgColor};
          color: ${textColor};
        }

        .omakase-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .omakase-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .omakase-send-btn:hover {
          opacity: 0.9;
        }

        .omakase-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .omakase-toggle-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .omakase-toggle-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .omakase-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .omakase-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: omakase-bounce 1.4s infinite ease-in-out both;
        }

        .omakase-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .omakase-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes omakase-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `;
    },

    attachEventListeners: function() {
      const toggleBtn = document.getElementById('omakase-toggle-btn');
      const closeBtn = document.getElementById('omakase-close-btn');
      const sendBtn = document.getElementById('omakase-send-btn');
      const input = document.getElementById('omakase-input');

      toggleBtn.addEventListener('click', () => this.toggle());
      closeBtn.addEventListener('click', () => this.close());
      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Show welcome message on first open
      if (this.config.welcomeMessage) {
        this.messages.push({
          role: 'assistant',
          content: this.config.welcomeMessage
        });
      }
    },

    toggle: function() {
      this.isOpen ? this.close() : this.open();
    },

    open: function() {
      this.isOpen = true;
      document.getElementById('omakase-chat-window').style.display = 'flex';
      document.getElementById('omakase-icon-chat').style.display = 'none';
      document.getElementById('omakase-icon-close').style.display = 'block';
      document.getElementById('omakase-input').focus();
      this.renderMessages();
    },

    close: function() {
      this.isOpen = false;
      document.getElementById('omakase-chat-window').style.display = 'none';
      document.getElementById('omakase-icon-chat').style.display = 'block';
      document.getElementById('omakase-icon-close').style.display = 'none';
    },

    renderMessages: function() {
      const container = document.getElementById('omakase-messages');
      container.innerHTML = this.messages.map(msg => `
        <div class="omakase-message ${msg.role}">
          <div class="omakase-message-content" ${msg.role === 'user' ? `style="background-color: ${this.config.primaryColor};"` : ''}>
            ${this.escapeHtml(msg.content)}
          </div>
        </div>
      `).join('');
      container.scrollTop = container.scrollHeight;
    },

    showTyping: function() {
      const container = document.getElementById('omakase-messages');
      const typingHtml = `
        <div class="omakase-message assistant" id="omakase-typing">
          <div class="omakase-message-content">
            <div class="omakase-typing">
              <div class="omakase-typing-dot"></div>
              <div class="omakase-typing-dot"></div>
              <div class="omakase-typing-dot"></div>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', typingHtml);
      container.scrollTop = container.scrollHeight;
    },

    hideTyping: function() {
      const typing = document.getElementById('omakase-typing');
      if (typing) typing.remove();
    },

    async sendMessage() {
      const input = document.getElementById('omakase-input');
      const content = input.value.trim();
      if (!content) return;

      // Add user message
      this.messages.push({ role: 'user', content });
      input.value = '';
      this.renderMessages();
      this.showTyping();

      try {
        const response = await fetch(`${this.config.apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: this.config.agentId,
            messages: this.messages.map(m => ({ role: m.role, content: m.content }))
          })
        });

        if (!response.ok) throw new Error('Failed to send message');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        this.hideTyping();
        this.messages.push({ role: 'assistant', content: '' });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantContent += parsed.content;
                  this.messages[this.messages.length - 1].content = assistantContent;
                  this.renderMessages();
                }
              } catch {
                if (data.trim()) {
                  assistantContent += data;
                  this.messages[this.messages.length - 1].content = assistantContent;
                  this.renderMessages();
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        this.hideTyping();
        this.messages.push({
          role: 'assistant',
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。'
        });
        this.renderMessages();
      }
    },

    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Expose globally
  window.OmakaseWidget = OmakaseWidget;
})();
