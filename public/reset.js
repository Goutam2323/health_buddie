document.addEventListener('DOMContentLoaded', () => {
    const send = document.querySelector("#send");
    const container = document.querySelector(".container");
    let expiryTime;

    send.addEventListener("click", () => {
        container.classList.add("sign-up-mode");
    });

    document.getElementById('forgot-password-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = event.target.email.value;

        fetch('/auth/forgot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'OTP sent successfully') {
                alert(data.message);
                expiryTime = data.expires;
                updateTimer(); // Initial call
                const timerInterval = setInterval(updateTimer, 1000); // Update every second
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });

    function updateTimer() {
        const now = Date.now();
        const timeLeft = expiryTime - now;

        if (timeLeft > 0) {
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
            document.getElementById('timer').textContent = 'Expired!';
            document.getElementById('reset-password-form').remove(); // Optional: Disable the form
            clearInterval(timerInterval); // Stop the timer
        }
    }

    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const otp = event.target.otp.value;
            const password = event.target.password.value;

            fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message='Password reset successful') {
                    window.location.href = `/signup.html`;
                }
                else{
                    alert(data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
