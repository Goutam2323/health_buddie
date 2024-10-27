const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

document.getElementById('register-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('usernameInput').value;
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
  }

  fetch('/auth/register', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message==='User registered successfully') {
          window.location.href = `/home.html`;
      }
          alert(data.message);
  });
});
document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const email = document.getElementById('emailinput').value;
  const password = document.getElementById('passwordinput').value;

  fetch('/auth/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message==='Login successful') {
          window.location.href = `/home.html`;
      }
         alert(data.message);
  });
});
