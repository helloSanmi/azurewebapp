document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !email || !password) {
            alert('All fields are required!');
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                alert('Registration successful! Redirecting to login...');
                window.location.href = 'login.html';
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            alert(`Failed to register: ${error.message}`);
        }
    });
});
