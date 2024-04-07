async function fetchMessages() {
    try {
        const response = await fetch('/messages');
        const messages = await response.json(); // Parse the JSON response
        const messagesDiv = document.getElementById('messages');
        
        // Clear existing messages
        messagesDiv.innerHTML = '';

        // Check if messages exist and is an array
        if (Array.isArray(messages) && messages.length) {
            // Iterate over each message and append it to the messagesDiv
            messages.forEach(msg => {
                if (msg.Name && msg.Message) { // Ensure 'Name' and 'Message' fields exist
                    const messageElement = `<p><strong>${msg.Name}</strong>: ${msg.Message}</p>`;
                    messagesDiv.innerHTML += messageElement;
                }
            });
        } else {
            // Display a 'no messages' message or handle empty state
            messagesDiv.innerHTML = '<p>No messages found.</p>';
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Ensure this function is called to load messages initially and after submitting a new message
fetchMessages();