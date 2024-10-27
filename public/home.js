const searchQuerySubmit = document.getElementById('searchQuerySubmit');
const searchQueryInput = document.getElementById('searchQueryInput'); // Get the input field
const responseDiv = document.querySelector('.response'); 

// Add event listener for Enter key press on the input field
searchQueryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchQuerySubmit.click(); // Simulate a click on the submit button
  }
});

searchQuerySubmit.addEventListener('click', async () => {
  const query = searchQueryInput.value; // Get the query from the input field

  if (query) {
    responseDiv.classList.remove('hidden');
    responseDiv.innerHTML = `<p>Your response is generating...!</p>`;

    // Attach the event listener to the xmark ONCE

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      const responseText = data.response;
      const cleanedResponse = responseText.replace(/\*/g, '');

      // Remove 'hidden' class to show the xmar

      // Remove 'hidden' class to show the div
      responseDiv.innerHTML = ` <div class="xmark ">
          <span class="fa-solid fa-xmark"></span>
        </div>`;
      responseDiv.innerHTML += `Response:<pre>${cleanedResponse}</pre>`; // Add the response text to the div
      document.querySelector('.xmark').addEventListener('click', () => {
        responseDiv.classList.add('hidden');
      });

    } catch (error) {
      responseDiv.classList.remove('hidden');
      responseDiv.innerHTML = `<p>Error fetching query response:</p>`;
    }
  } else {
    alert('Please enter a query.');
  }
}); 