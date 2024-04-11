document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginButton').addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            alert('Username and password are required!');
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });


            if (response.ok) {
                const data = await response.json();
                console.log(data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username); // Store username
                alert('Login successful! Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            alert(`${error.message}: Please try again`);
        }
    });
});
