document.addEventListener('DOMContentLoaded', () => {
    fetchNotes(); // Initial call to load existing notes

    // Handler for adding a new note
    document.getElementById('addNote').addEventListener('click', async () => {
        const noteInput = document.getElementById('noteInput');
        const noteText = noteInput.value.trim();
        if (noteText) {
            try {
                const response = await fetch('/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    },
                    body: JSON.stringify({ title: "Note", content: noteText }),
                });

                if (response.ok) {
                    fetchNotes(); // Reload notes after adding
                    noteInput.value = ''; // Clear input field
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

    // Display the user's name, if available
    const username = localStorage.getItem('username');
    if (username) {
        const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
        document.getElementById('welcomeMessage').textContent = `Welcome, ${capitalizedUsername}`;
    } else {
        console.log('Username not found in localStorage');
    }

    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
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
                li.innerHTML = `
                    <div class="note-content">${note.content}</div>
                    <div class="note-actions">
                        <button class="edit-note" data-id="${note.id}">Edit</button>
                        <button class="delete-note" data-id="${note.id}">Delete</button>
                    </div>
                `;
                notesList.appendChild(li);

                // Add event listeners for edit and delete buttons
                li.querySelector('.edit-note').addEventListener('click', async function() {
                    const newContent = prompt('Edit your note:', note.content);
                    if (newContent && newContent !== note.content) {
                        await fetch('/notes/' + note.id, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            },
                            body: JSON.stringify({ title: "Note", content: newContent }),
                        });
                        fetchNotes();
                    }
                });

                li.querySelector('.delete-note').addEventListener('click', async function() {
                    if (confirm('Are you sure you want to delete this note?')) {
                        await fetch('/notes/' + note.id, {
                            method: 'DELETE',
                            headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
                        });
                        fetchNotes();
                    }
                });
            });
        } else {
            throw new Error('Failed to fetch notes');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};
