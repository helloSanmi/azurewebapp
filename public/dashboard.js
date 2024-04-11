document.addEventListener('DOMContentLoaded', () => {
    fetchNotes(); // Call this function to load existing notes for the user

    document.getElementById('addNote').addEventListener('click', async () => {
        const noteInput = document.getElementById('noteInput');
        const noteText = noteInput.value.trim();
        if (noteText) {
            try {
                const response = await fetch('/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Ensure to use the correct auth header format and token
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    },
                    body: JSON.stringify({ title: "Note", content: noteText }),
                });

                if (response.ok) {
                    // If the note is successfully added to the database, fetch all notes again
                    fetchNotes();
                    noteInput.value = ''; // Clear input after adding
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            } catch (error) {
                alert(`Failed to add note: ${error.message}`);
            }
        } else {
            alert('Please type a note before adding.');
        }
    });

    const username = localStorage.getItem('username'); // Key must match exactly what was used to store
    // This key must match exactly
    if (username) {
        // Capitalize the first letter of the username
        const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
        document.getElementById('welcomeMessage').textContent = `Welcome, ${capitalizedUsername}`;
    } else {
        console.log('Username not found in localStorage');
    }
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token'); // Clear token on logout
        window.location.href = 'login.html'; // Redirect to the login page
    });
});

// Function to fetch and display notes
async function fetchNotes() {
    try {
        const response = await fetch('/notes', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            },
        });

        if (response.ok) {
            const notes = await response.json();
            const notesList = document.getElementById('notesList');
            notesList.innerHTML = ''; // Clear existing notes

            notes.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note.content; // Assuming your note structure has a content field
                notesList.appendChild(li);
            });
        } else {
            throw new Error('Failed to fetch notes');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
