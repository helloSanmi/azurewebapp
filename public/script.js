document.addEventListener('DOMContentLoaded', () => {
    fetchMessages(); // Call fetchMessages to load messages initially

    document.getElementById('submitButton').addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent form from submitting in the traditional way
        await submitMessage();
    });
});

async function fetchMessages() {
    try {
        const response = await fetch('/messages');
        const messages = await response.json();
        const messagesDiv = document.getElementById('messages');

        messagesDiv.innerHTML = ''; // Clear existing messages

        if (Array.isArray(messages) && messages.length) {
            messages.forEach(msg => {
                // Assuming msg.name and msg.message are the correct properties
                const messageElement = `<p><strong>${msg.name}</strong>: ${msg.message}</p>`;
                messagesDiv.innerHTML += messageElement;
            });
        } else {
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
            await fetchMessages(); // Refresh the list of messages
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
