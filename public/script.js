document.addEventListener('DOMContentLoaded', () => {
    fetchMessages(); // Call fetchMessages to load messages initially

    const submitButton = document.getElementById('submitButton');
    submitButton.addEventListener('click', submitMessage);
});

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
                if (msg.name && msg.message) { // Ensure 'name' and 'message' fields exist
                    const messageElement = `<p><strong>${msg.name}</strong>: ${msg.message}</p>`;
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


async function submitMessage() {
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !message) {
        alert('Both name and message are required.');
        return;
    }

    try {
        const response = await fetch('/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, message }),
        });

        if (response.ok) {
            document.getElementById('name').value = ''; // Clear the input fields
            document.getElementById('message').value = '';
            fetchMessages(); // Refresh the list of messages
        } else {
            const errorText = await response.text();
            console.error('Failed to submit message:', errorText);
            alert('Failed to submit message. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting message:', error);
        alert('An error occurred. Please try again.');
    }
}
