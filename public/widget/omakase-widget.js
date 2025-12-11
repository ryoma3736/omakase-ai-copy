/**
 * Omakase AI Widget - 埋め込みチャットウィジェット
 *
 * 使用方法:
 * <script src="https://yourdomain.com/widget/omakase-widget.js" data-agent-id="YOUR_AGENT_ID"></script>
 */

(function() {
  'use strict';

  // 設定取得
  const script = document.currentScript;
  const agentId = script?.getAttribute('data-agent-id') || 'default';
  const position = script?.getAttribute('data-position') || 'bottom-right';
  const primaryColor = script?.getAttribute('data-primary-color') || '#06b6d4';
  const baseUrl = script?.src.replace('/widget/omakase-widget.js', '') || '';

  // スタイル注入
  const styles = `
    .omakase-widget-container {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .omakase-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .omakase-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,0.4);
    }

    .omakase-widget-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    .omakase-widget-chat {
      position: absolute;
      ${position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
      ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 380px;
      height: 550px;
      background: #111;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .omakase-widget-chat.open {
      display: flex;
    }

    .omakase-widget-header {
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .omakase-widget-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, ${primaryColor}, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .omakase-widget-avatar svg {
      width: 20px;
      height: 20px;
      fill: white;
    }

    .omakase-widget-title {
      flex: 1;
    }

    .omakase-widget-title h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }

    .omakase-widget-title p {
      margin: 2px 0 0;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }

    .omakase-widget-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .omakase-widget-close:hover {
      background: rgba(255,255,255,0.2);
    }

    .omakase-widget-close svg {
      width: 16px;
      height: 16px;
      stroke: white;
    }

    .omakase-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .omakase-widget-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
    }

    .omakase-widget-message.user {
      align-self: flex-end;
      background: ${primaryColor};
      color: black;
      border-bottom-right-radius: 4px;
    }

    .omakase-widget-message.assistant {
      align-self: flex-start;
      background: rgba(255,255,255,0.1);
      color: white;
      border-bottom-left-radius: 4px;
    }

    .omakase-widget-input-area {
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 8px;
    }

    .omakase-widget-input {
      flex: 1;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 14px;
      outline: none;
    }

    .omakase-widget-input::placeholder {
      color: rgba(255,255,255,0.4);
    }

    .omakase-widget-input:focus {
      border-color: ${primaryColor};
    }

    .omakase-widget-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .omakase-widget-send:hover {
      transform: scale(1.05);
    }

    .omakase-widget-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .omakase-widget-send svg {
      width: 18px;
      height: 18px;
      fill: black;
    }

    .omakase-widget-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
    }

    .omakase-widget-typing span {
      width: 8px;
      height: 8px;
      background: ${primaryColor};
      border-radius: 50%;
      animation: omakase-bounce 1s infinite;
    }

    .omakase-widget-typing span:nth-child(2) { animation-delay: 0.1s; }
    .omakase-widget-typing span:nth-child(3) { animation-delay: 0.2s; }

    @keyframes omakase-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-8px); }
    }

    @media (max-width: 480px) {
      .omakase-widget-chat {
        width: calc(100vw - 40px);
        height: 70vh;
        ${position.includes('right') ? 'right: -10px;' : 'left: -10px;'}
      }
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // HTML構造
  const container = document.createElement('div');
  container.className = 'omakase-widget-container';
  container.innerHTML = `
    <div class="omakase-widget-chat" id="omakase-chat">
      <div class="omakase-widget-header">
        <div class="omakase-widget-avatar">
          <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 13H7v-2h4v2zm6-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </div>
        <div class="omakase-widget-title">
          <h3>Omakase AI</h3>
          <p>いつでもお気軽にどうぞ</p>
        </div>
        <button class="omakase-widget-close" id="omakase-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="omakase-widget-messages" id="omakase-messages">
        <div class="omakase-widget-message assistant">
          こんにちは！おまかせAIです。商品のご質問やおすすめなど、何でもお気軽にどうぞ！
        </div>
      </div>
      <div class="omakase-widget-input-area">
        <input type="text" class="omakase-widget-input" id="omakase-input" placeholder="メッセージを入力...">
        <button class="omakase-widget-send" id="omakase-send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <button class="omakase-widget-button" id="omakase-button">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
  `;
  document.body.appendChild(container);

  // イベント
  const button = document.getElementById('omakase-button');
  const chat = document.getElementById('omakase-chat');
  const closeBtn = document.getElementById('omakase-close');
  const input = document.getElementById('omakase-input');
  const sendBtn = document.getElementById('omakase-send');
  const messagesEl = document.getElementById('omakase-messages');

  let isOpen = false;
  let isLoading = false;
  const history = [];

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    chat.classList.toggle('open', isOpen);
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    chat.classList.remove('open');
  });

  function addMessage(role, content) {
    const msg = document.createElement('div');
    msg.className = `omakase-widget-message ${role}`;
    msg.textContent = content;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    history.push({ role, content });
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'omakase-widget-message assistant';
    typing.id = 'omakase-typing';
    typing.innerHTML = '<div class="omakase-widget-typing"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('omakase-typing');
    if (typing) typing.remove();
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    addMessage('user', text);
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch(`${baseUrl}/api/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, agentId, history }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'partial') {
              fullResponse += data.text;
            }
          } catch (e) {}
        }
      }

      removeTyping();
      addMessage('assistant', fullResponse || '申し訳ありません、エラーが発生しました。');
    } catch (error) {
      removeTyping();
      addMessage('assistant', '接続エラーが発生しました。');
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();
