const form = document.getElementById('diet-plan-form');
const resultsDiv = document.getElementById('diet-plan-results');
const hiddenDiv =document.getElementById('hidden-diet-plan');
const bgimage = document.querySelector('.bgimage img');

// Create the buttons dynamically
const saveButton = document.createElement('input');
saveButton.type = 'button'; // Change to 'button' for download
saveButton.value='Download Diet Plan';
saveButton.id = 'download'; // Add the id attribute

const closeButton = document.createElement('input');
closeButton.type = 'button'; 
closeButton.value = 'Close Diet Plan';

// You already have the hidden div in your HTML, so no need to create it here

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Hide the form and background image
  form.style.display = 'none';
  bgimage.style.display = 'none';

  // Show the pulse loader
  resultsDiv.innerHTML = `
    <div class="spinner-box">
      <div class="pulse-container">  
        <div class="pulse-bubble pulse-bubble-1"></div>
        <div class="pulse-bubble pulse-bubble-2"></div>
        <div class="pulse-bubble pulse-bubble-3"></div>
        <div class="pulse-bubble pulse-bubble-4"></div>
        <div class="pulse-bubble pulse-bubble-5"></div>
      </div>
    </div>
  `;

  try {
    const formData = new FormData(form);

    // Convert form data to JSON
    const jsonData = {};
    formData.forEach((value, key) => {
      jsonData[key] = value;
    });

    // Send the data to the server
    const response = await fetch('/diet-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    });

    // Handle the response correctly
    if (response.ok) {
      const data = await response.json();

      if (data.dietPlan) {
        const dietPlan = data.dietPlan;
        // Display the diet plan in a readable format
        resultsDiv.innerHTML = '<h2 class="rhead">Your Personalized Diet Plan:</h2>';
        for (const sectionTitle in dietPlan) {
          if (dietPlan.hasOwnProperty(sectionTitle)) {
            resultsDiv.innerHTML += `<p class="phead">${sectionTitle}</p>`;
            resultsDiv.innerHTML += `<div>`;
            dietPlan[sectionTitle].forEach(meal => {
              if (meal.includes(":")) {
                const [mealNumber, mealDescription] = meal.split(':');
                resultsDiv.innerHTML += `<p class="points"><b class="mhead">${mealNumber}:</b>${mealDescription}</p>`;
              } else {
                resultsDiv.innerHTML += `<p class="points">${meal}</p>`;
              }
            });
            resultsDiv.innerHTML += `<hr class="line"></hr>`;
            resultsDiv.innerHTML += `<div>`;
          }
        }
        // Append the buttons to the resultsDiv
        hiddenDiv.innerHTML=resultsDiv.innerHTML;
        resultsDiv.appendChild(saveButton);
        resultsDiv.appendChild(closeButton);
        saveButton.addEventListener('click', () => {
          html2pdf()
            .set({
              filename: 'diet-plan.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true,scrollX:0,scrollY:0},
              jsPDF: { unit: 'pt', format: 'a4',margin: [180,0], orientation: 'portrait' }
            })
            .from(hiddenDiv)
            .save()
            .catch(err => console.error('PDF generation error:', err));
        });
    } else {
        resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
      }
    } else {
      // Handle error response (e.g., status code 500)
      resultsDiv.innerHTML = `<p>An error occurred while generating your diet plan.</p>`;
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    resultsDiv.innerHTML = `<p>An error occurred while generating your diet plan.</p>`;
  }
});

// Event listener for "Close Diet Plan" button



closeButton.addEventListener('click', () => {
  // Hide the diet plan results
  resultsDiv.style.display = 'none';

  // Show the form and background image again
  form.style.display = 'block';
  bgimage.style.display = 'block';

  // Clear the resultsDiv content
  resultsDiv.innerHTML = '';
});

// Show resultsDiv again when form is submitted
form.addEventListener('submit', () => {
  resultsDiv.style.display = 'block';
}); 