document.addEventListener('DOMContentLoaded', function() {
    // Initialize WebSocket connection
    let ws;
    const initWebSocket = () => {
        // Replace with your WebSocket server URL
        ws = new WebSocket('ws://your-server-url:port');

        ws.onopen = () => {
            console.log('Connected to chat server');
            // You might want to send user authentication data here
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
        };

        ws.onclose = () => {
            console.log('Disconnected from chat server');
            // Attempt to reconnect after a delay
            setTimeout(initWebSocket, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    // Handle incoming messages
    const handleIncomingMessage = (data) => {
        switch(data.type) {
            case 'message':
                appendMessage(data, false);
                break;
            case 'file':
                handleIncomingFile(data);
                break;
            case 'typing':
                handleTypingIndicator(data);
                break;
        }
    };

    // Append a new message to the chat
    const appendMessage = (data, isSent = true) => {
        const messagesContainer = document.querySelector('.messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            ${!isSent ? `<div class="message-avatar">${data.sender.initials}</div>` : ''}
            <div class="message-content">
                <div class="message-header">
                    ${!isSent ? `<span class="message-author">${data.sender.name}</span>` : ''}
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-text">${data.message}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Handle file uploads
    const handleFileUpload = (file) => {
        const formData = new FormData();
        formData.append('file', file);

        // Upload file to server
        fetch('/upload.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Send file message through WebSocket
            ws.send(JSON.stringify({
                type: 'file',
                fileUrl: data.url,
                fileName: file.name,
                fileType: file.type
            }));
        })
        .catch(error => console.error('Error uploading file:', error));
    };

    // Handle incoming files
    const handleIncomingFile = (data) => {
        const fileMessage = `
            <div class="file-attachment">
                <a href="${data.fileUrl}" target="_blank">
                    ${data.fileName}
                </a>
            </div>
        `;
        appendMessage({ message: fileMessage, sender: data.sender }, false);
    };

    // Set up UI event listeners
    const setupEventListeners = () => {
        const messageInput = document.querySelector('.message-input input');
        const sendButton = document.querySelector('.send-btn');
        const attachmentButton = document.querySelector('.attachment-btn');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Send message on enter or button click
        const sendMessage = () => {
            const message = messageInput.value.trim();
            if (message) {
                const messageData = {
                    type: 'message',
                    message: message,
                    timestamp: new Date().getTime()
                };
                ws.send(JSON.stringify(messageData));
                appendMessage({ message: message }, true);
                messageInput.value = '';
            }
        };

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', sendMessage);

        // Handle file attachment
        attachmentButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(handleFileUpload);
            fileInput.value = ''; // Reset file input
        });

        // Implement typing indicator
        let typingTimeout;
        messageInput.addEventListener('input', () => {
            if (!typingTimeout) {
                ws.send(JSON.stringify({ type: 'typing', isTyping: true }));
            }
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
                typingTimeout = null;
            }, 1000);
        });
    };

    // Initialize chat
    const init = () => {
        initWebSocket();
        setupEventListeners();
    };

    init();
}); 