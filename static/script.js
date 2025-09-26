// ChatGPT-like Interface JavaScript
class XtarzLabApp {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.analysisForm = document.getElementById('analysisForm');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.historyList = document.getElementById('historyList');
        this.toast = document.getElementById('toast');
        
        this.analysisInProgress = false;
        this.chatHistory = JSON.parse(localStorage.getItem('xtarzlab_history') || '[]');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadChatHistory();
        this.autoResizeTextarea();
        this.checkServerHealth();
    }
    
    bindEvents() {
        this.analysisForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.newAnalysisBtn.addEventListener('click', () => this.startNewAnalysis());
        
        // Auto-resize textarea
        const textarea = document.getElementById('topic');
        textarea.addEventListener('input', () => this.autoResizeTextarea());
    }
    
    autoResizeTextarea() {
        const textarea = document.getElementById('topic');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.analysisInProgress) return;
        
        const formData = new FormData(this.analysisForm);
        const topic = formData.get('topic').trim();
        
        if (!topic) {
            this.showToast('Please enter a topic to analyze', 'error');
            return;
        }
        
        this.startAnalysis(topic);
    }
    
    async startAnalysis(topic) {
        try {
            this.analysisInProgress = true;
            
            // Add user message
            this.addMessage('user', topic);
            
            // Add assistant typing indicator
            const typingId = this.addTypingIndicator();
            
            // Update button state
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Make API call
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic: topic })
            });
            
            const result = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            if (result.success) {
                this.addMessage('assistant', result.result, true);
                this.addToHistory(topic, result.result);
                this.showToast('Analysis completed successfully!', 'success');
            } else {
                this.addMessage('assistant', `Sorry, I encountered an error: ${result.error}`, false);
                this.showToast('Analysis failed', 'error');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered a network error. Please try again.', false);
            this.showToast('Network error', 'error');
        } finally {
            this.analysisInProgress = false;
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            this.analysisForm.reset();
            this.autoResizeTextarea();
        }
    }
    
    addMessage(type, content, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatar}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    ${isHtml ? content : this.escapeHtml(content)}
                </div>
                <div class="message-actions">
                    <button class="message-action-btn" onclick="this.copyMessage(this)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    ${type === 'assistant' ? `
                        <button class="message-action-btn" onclick="this.downloadMessage(this)">
                            <i class="fas fa-download"></i> Download
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    addTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.id = typingId;
        messageDiv.className = 'message assistant-message';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <p style="color: #8e8ea0; margin-top: 8px;">AI agents are working on your analysis...</p>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return typingId;
    }
    
    removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    addToHistory(topic, result) {
        const historyItem = {
            id: Date.now(),
            topic: topic,
            result: result.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.unshift(historyItem);
        this.chatHistory = this.chatHistory.slice(0, 10); // Keep only last 10
        
        localStorage.setItem('xtarzlab_history', JSON.stringify(this.chatHistory));
        this.loadChatHistory();
    }
    
    loadChatHistory() {
        this.historyList.innerHTML = '';
        
        this.chatHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 4px;">${item.topic}</div>
                <div style="font-size: 12px; color: #8e8ea0;">${new Date(item.timestamp).toLocaleDateString()}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.loadHistoryItem(item);
            });
            
            this.historyList.appendChild(historyItem);
        });
    }
    
    loadHistoryItem(item) {
        // Clear current chat
        this.chatMessages.innerHTML = `
            <div class="message assistant-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <h3>Welcome to XtarzLab AI Content Analyzer!</h3>
                        <p>I'm your AI assistant powered by advanced AI agents. I can help you analyze any topic with comprehensive research, writing, and review.</p>
                        <p>Simply enter a topic below and I'll provide you with a detailed analysis report.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add the history item
        this.addMessage('user', item.topic);
        this.addMessage('assistant', item.result, true);
    }
    
    startNewAnalysis() {
        // Clear chat
        this.chatMessages.innerHTML = `
            <div class="message assistant-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <h3>Welcome to XtarzLab AI Content Analyzer!</h3>
                        <p>I'm your AI assistant powered by advanced AI agents. I can help you analyze any topic with comprehensive research, writing, and review.</p>
                        <p>Simply enter a topic below and I'll provide you with a detailed analysis report.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Clear form
        this.analysisForm.reset();
        this.autoResizeTextarea();
        
        // Focus on input
        document.getElementById('topic').focus();
    }
    
    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    async checkServerHealth() {
        try {
            const response = await fetch('/api/health');
            const result = await response.json();
            console.log('Server status:', result.status);
        } catch (error) {
            console.warn('Server health check failed:', error);
            this.showToast('Unable to connect to server', 'error');
        }
    }
}

// Global functions for message actions
window.copyMessage = function(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text');
    const text = messageText.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    });
};

window.downloadMessage = function(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text');
    const text = messageText.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `xtarzlab-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(url);
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    new XtarzLabApp();
});