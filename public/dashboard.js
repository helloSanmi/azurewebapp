document.addEventListener('DOMContentLoaded', () => {
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'code-block'],
                [{ list: 'ordered'}, { list: 'bullet' }]
            ]
        }
    });

    let currentEditingId = null; // To track if we are editing a note

    fetchNotes(quill);

    document.getElementById('addNote').addEventListener('click', async () => {
        const noteHtml = quill.root.innerHTML;
        if (noteHtml && noteHtml !== '<p><br></p>') {
            if (currentEditingId) {
                await updateNote(currentEditingId, noteHtml, quill);
            } else {
                addNewNote(noteHtml, quill);
            }
        } else {
            alert('Please type a note before adding.');
        }
    });

    setupDictation(quill);

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('welcomeMessage').textContent = `Welcome, ${username.charAt(0).toUpperCase() + username.slice(1)}`;
    }
});

async function fetchNotes(quill) {
    try {
        const response = await fetch('/notes', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        });

        if (response.ok) {
            const notes = await response.json();
            const notesList = document.getElementById('notesList');
            notesList.innerHTML = '';

            notes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="note-content" style="white-space: pre-wrap;">${note.content}</div>
                    <div class="note-actions">
                        <button class="edit-note" data-id="${note.id}">Edit</button>
                        <button class="delete-note" data-id="${note.id}">Delete</button>
                    </div>`;
                notesList.appendChild(li);

                li.querySelector('.edit-note').addEventListener('click', function() {
                    quill.root.innerHTML = note.content; // Set Quill content to note content
                    currentEditingId = note.id;
                    document.getElementById('addNote').textContent = 'Save Changes';
                });

                li.querySelector('.delete-note').addEventListener('click', function() {
                    if (confirm('Are you sure you want to delete this note?')) {
                        deleteNote(note.id, quill);
                    }
                });
            });
        } else {
            throw new Error('Failed to fetch notes');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function addNewNote(noteHtml, quill) {
    try {
        const response = await fetch('/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            },
            body: JSON.stringify({ title: "Note", content: noteHtml }),
        });

        if (response.ok) {
            fetchNotes(quill);
            quill.setContents([{ insert: '\n' }]); // Clear Quill editor
            document.getElementById('addNote').textContent = 'Add Note'; // Reset button text
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        alert(`Failed to add note: ${error.message}`);
    }
}

async function updateNote(id, newContent, quill) {
    try {
        const response = await fetch(`/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            },
            body: JSON.stringify({ content: newContent })
        });
        if (response.ok) {
            fetchNotes(quill);
            quill.setContents([{ insert: '\n' }]); // Clear Quill editor
            document.getElementById('addNote').textContent = 'Add Note'; // Reset button text
            currentEditingId = null; // Clear editing state
        } else {
            throw new Error('Failed to update note');
        }
    } catch (error) {
        alert(`Error updating note: ${error.message}`);
    }
}

async function deleteNote(id, quill) {
    try {
        const response = await fetch(`/notes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            }
        });
        if (response.ok) {
            fetchNotes(quill);
        } else {
            throw new Error('Failed to delete note');
        }
    } catch (error) {
        alert(`Error deleting note: ${error.message}`);
    }
}


function setupDictation(quill) {
    const startDictationButton = document.getElementById('startDictationButton');
    const stopDictationButton = document.getElementById('stopDictationButton');

    if (!('webkitSpeechRecognition' in window)) {
        alert("Your browser does not support speech recognition. Use Google Chrome or Edge.");
        startDictationButton.disabled = true;
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = ''; // Store final text

    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        quill.root.innerHTML = finalTranscript + interimTranscript; // Update Quill content dynamically
    };

    startDictationButton.onclick = () => {
        finalTranscript = ''; // Clear previous content
        recognition.start();
        startDictationButton.style.display = 'none';
        stopDictationButton.style.display = 'inline';
    };

    stopDictationButton.onclick = () => {
        recognition.stop();
        startDictationButton.style.display = 'inline';
        stopDictationButton.style.display = 'none';
    };
}