document.addEventListener('DOMContentLoaded', () => {
  // Select elements
  const uploadArea = document.querySelector('#uploadArea');
  const dropZoon = document.querySelector('#dropZoon');
  const loadingText = document.querySelector('#loadingText');
  const fileInput = document.querySelector('#fileInput');
  const previewImage = document.querySelector('#previewImage');
  const fileDetails = document.querySelector('#fileDetails');
  const uploadedFile = document.querySelector('#uploadedFile');
  const uploadedFileInfo = document.querySelector('#uploadedFileInfo');
  const uploadedFileName = document.querySelector('.uploaded-file__name');
  const uploadedFileIconText = document.querySelector('.uploaded-file__icon-text');
  const uploadedFileCounter = document.querySelector('.uploaded-file__counter');
  const toolTipData = document.querySelector('.upload-area__tooltip-data');
  const resultsDiv = document.getElementById('diet-plan-results');
  const hiddenDiv = document.getElementById('hidden-diet-plan');
  const generateInsightsButton = document.getElementById('insight');
  const menu = document.querySelector(".menu");
  let name;
  let age;
  let gender;
  let summary;
  let test;
  const saveButton = document.createElement('input');
  saveButton.type = 'button';
  saveButton.value = 'Download/Save report';
  saveButton.id = 'download';

  const closeButton = document.createElement('input');
  closeButton.type = 'button';
  closeButton.value = 'Close Report';

  const imagesTypes = ["jpeg", "png", "webp"];
  toolTipData.innerHTML = imagesTypes.join(', .');

  dropZoon.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZoon.classList.add('drop-zoon--over');
  });

  dropZoon.addEventListener('dragleave', () => {
    dropZoon.classList.remove('drop-zoon--over');
  });

  dropZoon.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZoon.classList.remove('drop-zoon--over');
    const file = event.dataTransfer.files[0];
    uploadFile(file);
  });

  dropZoon.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    uploadFile(file);
  });

  function uploadFile(file) {
    const fileReader = new FileReader();
    const fileType = file.type;
    const fileSize = file.size;

    if (fileValidate(fileType, fileSize)) {
      dropZoon.classList.add('drop-zoon--Uploaded');
      loadingText.style.display = "block";
      previewImage.style.display = 'none';
      uploadedFile.classList.remove('uploaded-file--open');
      uploadedFileInfo.classList.remove('uploaded-file__info--active');

      fileReader.addEventListener('load', () => {
        setTimeout(() => {
          uploadArea.classList.add('upload-area--open');
          loadingText.style.display = "none";
          previewImage.style.display = 'block';
          fileDetails.classList.add('file-details--open');
          uploadedFile.classList.add('uploaded-file--open');
          uploadedFileInfo.classList.add('uploaded-file__info--active');
        }, 500);

        previewImage.setAttribute('src', fileReader.result);
        uploadedFileName.innerHTML = file.name;
        progressMove();
      });

      fileReader.readAsDataURL(file);
    } else {
      alert('Please make sure to upload a valid image file type and size.');
    }
  }

  function progressMove() {
    let counter = 0;
    setTimeout(() => {
      let counterIncrease = setInterval(() => {
        if (counter === 100) {
          clearInterval(counterIncrease);
        } else {
          counter += 10;
          uploadedFileCounter.innerHTML = `${counter}%`;
        }
      }, 100);
    }, 600);
  }

  function fileValidate(fileType, fileSize) {
    let isImage = imagesTypes.filter((type) => fileType.indexOf(`image/${type}`) !== -1);

    if (isImage[0] === 'jpeg') {
      uploadedFileIconText.innerHTML = 'jpg';
    } else {
      uploadedFileIconText.innerHTML = isImage[0];
    }

    if (isImage.length !== 0) {
      if (fileSize <= 15000000) {
        return true;
      } else {
        alert('Please make sure your file size is 15MB or less');
        return false;
      }
    } else {
      alert('Please make sure to upload an image file type');
      return false;
    }
  }

  generateInsightsButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    uploadArea.classList.add('hidden');
    menu.classList.add("hidden");
showSpinner();
    if (!file) {
      alert('Please select a report file.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      loadingText.style.display = 'block';

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analysis Results:', data.generativeAIResponse);
        console.log('Analysis Results:', data.message);

        if (data.generativeAIResponse) {
          displayResults(data.message, data.generativeAIResponse);
          resultsDiv.appendChild(saveButton);
          resultsDiv.appendChild(closeButton);
        } else {
          console.error('No generativeAIResponse found in response:', data);
          alert('No analysis found. Please try again.');
        }
      } else {
        const error = await response.json();
        console.error('Error:', error);
        alert('Error analyzing report. Please try again.');
      }

      loadingText.style.display = 'none';
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading report. Please try again.');
      loadingText.style.display = 'none';
    }
    hideSpinner();
  });

  function displayResults(message, response) {
    if (message == "Non-medical report uploaded") {
      alert("This doesn't appear to be a medical report. Please upload a medical report.");
      return;
    }

    resultsDiv.innerHTML = '';
    resultsDiv.innerHTML = '<h2 class="rhead">Your Report Insights</h2>';
    for (const section in response) {
      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add('result-section');

      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = section;
      sectionDiv.appendChild(sectionTitle);

      if (section === "Personal Information") {
        const personalInfoList = document.createElement('ul');
        for (const key in response[section]) {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<span class="label-value">${key}:</span> ${response[section][key]}`;
          if(key.toLowerCase()==='name'){
            name=response[section][key];
          }
          else if(key.toLowerCase()==='age'){
            age=Number(response[section][key]);
          }
          else if(key.toLowerCase()==='gender'){
            gender=response[section][key];
          }
          personalInfoList.appendChild(listItem);
        }
        sectionDiv.appendChild(personalInfoList);
      } else if (section !== "Summary") {
        test=section.substring(5);
        const itemsList = document.createElement('ul');
        response[section].forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('item-section');

          const attributeTitle = document.createElement('h4');
          attributeTitle.textContent = item.attribute;
          itemDiv.appendChild(attributeTitle);

          const attributeList = document.createElement('ul');

          const listItemValue = document.createElement('li');
          listItemValue.innerHTML = `<span class="label-value">Actual Value:</span> ${item.actualValue}`;
          attributeList.appendChild(listItemValue);

          const listItemRange = document.createElement('li');
          listItemRange.innerHTML = `<span class="label-value">Normal Range:</span> ${item.normalRange}`;
          attributeList.appendChild(listItemRange);

          if (item.category) {
            const listItemCategory = document.createElement('li');
            listItemCategory.innerHTML = `<span class="label-value">Category:</span> ${item.category}`;
            if (item.category === "Medical Attention") {
              listItemCategory.style.color = "red";
            } else if (item.category === "Dietary Attention") {
              listItemCategory.style.color = "green";
            } else if (item.category === "Healthy") {
              listItemCategory.style.color = "#04a2a2";
            }
            attributeList.appendChild(listItemCategory);
          }

          if (item.reason) {
            const listItemReason = document.createElement('li');
            listItemReason.innerHTML = `<span class="label-value">Reason:</span> ${item.reason}`;
            attributeList.appendChild(listItemReason);
          }

          itemDiv.appendChild(attributeList);
          itemsList.appendChild(itemDiv);
        });
        sectionDiv.appendChild(itemsList);
      } else {
        const summaryParagraph = document.createElement('p');
        summaryParagraph.textContent = response[section];
        summary=response[section];
        summaryParagraph.classList.add('summary-paragraph');
        sectionDiv.appendChild(summaryParagraph);
      }

      resultsDiv.appendChild(sectionDiv);
      hiddenDiv.innerHTML = resultsDiv.innerHTML;
      uploadArea.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
      menu.classList.add("hidden");


    }
  }

  closeButton.addEventListener('click', () => {
    resultsDiv.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    menu.classList.remove('hidden');
    resultsDiv.innerHTML = '';
    resultsDiv.removeChild(closeButton);
    resultsDiv.removeChild(saveButton);
  });
  saveButton.addEventListener('click', async () => {
    try {
      const isLoggedInResponse = await fetch('/auth/isLoggedIn');
      const data = await isLoggedInResponse.json();
  
      if (!data.isLoggedIn) {
        html2pdf()
        .set({
          filename: 'Insights.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
          jsPDF: { unit: 'pt', format: 'a4', margin: [180, 0], orientation: 'portrait' }
        })
        .from(hiddenDiv)
        .save()
        .catch(err => console.error('PDF generation error:', err));
      }
    else{
    try {
      const response = await fetch('/getNextPatientId', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const { nextPatientId } = await response.json();
        const patientId = parseInt(prompt(`Enter Patient ID (next available: ${nextPatientId}):`));
        if (!patientId || isNaN(patientId)) {
          alert('Patient ID is required to save the report.');
          return;
        }
  
        // Generate PDF and get base64 content
        const pdfContent = await  html2pdf(hiddenDiv, {
          margin: 1,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
          jsPDF: { unit: 'pt', format: 'a4', margin: [180, 0], orientation: 'portrait' }
        }).from(hiddenDiv).outputPdf();
        const fileName = `report_${sanitizeFileName(patientId.toString())}.pdf`;
        const filePath = `/pdf_reports/${fileName}`; // Relative path to the server's storage directory
  
        // Send PDF content to the server
        const saveReportResponse = await saveReport(patientId, pdfContent, summary, filePath, name, age, gender,test);
        if (saveReportResponse.success) {
          html2pdf(hiddenDiv, {
            margin: 1,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
            jsPDF: { unit: 'pt', format: 'a4', margin: [180, 0], orientation: 'portrait' }
          }).from(hiddenDiv).save();
        } else {
          alert(saveReportResponse.message || 'Failed to save report.');
        }
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  }
  } catch (error) {
    console.error('Error checking login status:', error);
    alert('Error checking login status. Please try again.');
  }
  });
  
  // Modified saveReport function to send PDF content
  async function saveReport(patientId, pdfContent, summary, filePath, name, age, gender,test) {
    try {
      const response = await fetch('/auth/save-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patientId,
          pdfContent: pdfContent,
          summary: summary,
          filePath: filePath,
          name: name,
          age: age,
          gender: gender,
          test:test
        })
      });
  
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      return { success: false, message: 'Error saving report.' };
    }
  }
  
  function sanitizeFileName(fileName) {
    // Sanitize the file name to ensure it only contains safe characters
    return fileName.replace(/[^\w.-]/g, '_');
  }

  $('.btn').click(function () {
    $(this).toggleClass("click");
    $('.sidebar').toggleClass("show");
  });
  $('.active').click(function () {
    $('.btn').toggleClass("click");
    $('.sidebar').toggleClass("show");
  });
  $('.feat-btn').click(function () {
    $('.awrapper').toggleClass("hidden");
    $('nav ul .feat-show').toggleClass("show");
    $('nav ul .first').toggleClass("rotate");
  });

  $('nav ul li').click(function () {
    $(this).addClass("active").siblings().removeClass("active");
  });
  const links = document.querySelectorAll('.toggle-content');
  let targetDiv;
  const xmarks = document.querySelectorAll('.xmark');
  xmarks.forEach(xmark => {
    xmark.addEventListener('click', function (event) {
      event.preventDefault();

      // Hide all report forms
      const reportForms = document.querySelectorAll('.report-form');
      reportForms.forEach(form => form.classList.add('hidden'));

      uploadArea.classList.remove('hidden');
      menu.classList.remove('hidden');
    });
  });

  links.forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault();

      // Hide all content divs
      const contentDivs = document.querySelectorAll('.hidden-content');
      contentDivs.forEach(div => div.classList.add('hidden'));

      // Show the clicked content div
      const target = this.getAttribute('data-target');
      targetDiv = document.querySelector(target);
      if (targetDiv) {
        targetDiv.classList.remove('hidden');
        uploadArea.classList.add('hidden');
        menu.classList.add('hidden');
      }
    });
  });

  // Event listener for form submit
  const reportForms = document.querySelectorAll('.health-report-form');
  reportForms.forEach(form => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      targetDiv.classList.add('hidden');
      showSpinner(); 

      // Get form data
      const formData = new FormData(form);
       name = formData.get('name');
       age = formData.get('age');
       gender = formData.get('gender');

      // Get report type and its values
      const reportType = form.id.replace('-content', '');
      const reportValues = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        reportValues[input.id] = input.value;
      });

      // Show the spinner while waiting for the server response
    

      // Send form data to the server
      try {
        loadingText.style.display = 'block';

        const response = await fetch('/upload-form-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            age: age,
            gender: gender,
            reportType: reportType,
            reportValues: reportValues
          })
        });

        // Handle server response
        if (response.ok) {
          const data = await response.json();
          console.log('Analysis Results:', data.generativeAIResponse);
          console.log('Analysis Results:', data.message);
          form.reset();
          // Hide all report forms
          const reportForms = document.querySelectorAll('.report-form');
          reportForms.forEach(form => form.classList.add('hidden'));

          if (data.generativeAIResponse) {
            displayResults(data.message, data.generativeAIResponse);
            resultsDiv.appendChild(saveButton);
            resultsDiv.appendChild(closeButton);
          } else {
            console.error('No generativeAIResponse found in response:', data);
            alert('No analysis found. Please try again.');
          }
        } else {
          const error = await response.json();
          console.error('Error:', error);
          alert('Error analyzing form. Please try again.');
        }

        loadingText.style.display = 'none';
      } catch (error) {
        console.error('Error uploading:', error);
        alert('Error uploading form. Please try again.');
        loadingText.style.display = 'none';
      }

      // Hide the spinner after the response is received
      hideSpinner(); 
    });
  });

  // Function to show the spinner
  const spinner = document.querySelector('.spinner-box');
  function showSpinner() {
    spinner.classList.remove('hidden');
    spinner.innerHTML = `
      <div class="pulse-container">  
        <div class="pulse-bubble pulse-bubble-1"></div>
        <div class="pulse-bubble pulse-bubble-2"></div>
        <div class="pulse-bubble pulse-bubble-3"></div>
        <div class="pulse-bubble pulse-bubble-4"></div>
        <div class="pulse-bubble pulse-bubble-5"></div>
      </div>
    `;
  }

  // Function to hide the spinner
  function hideSpinner() {
    spinner.classList.add('hidden');
    }  const searchInput = document.getElementById('asearchQueryInput');
    const listItems = document.querySelectorAll('ul.feat-show > li > a');
    
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        let matchingItems = [];
        let nonMatchingItems = [];
    
        listItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.startsWith(query)) {
                matchingItems.push(item.parentElement);
            } else if (text.includes(query)) { 
                nonMatchingItems.push(item.parentElement); 
            } else {
                nonMatchingItems.push(item.parentElement);
            }
        });
    
        nonMatchingItems.sort((a, b) => {
            const textA = a.textContent.toLowerCase();
            const textB = b.textContent.toLowerCase();
            return textA.localeCompare(textB);
        });
    
        // Only update the list items within the dropdown
        const ul = document.querySelector('ul.feat-show'); 
        const searchBarContainer = ul.querySelector('.awrapper'); // Select the search bar container
    
        // Remove all existing list items (but leave the search bar)
        ul.querySelectorAll('li:not(.awrapper)').forEach(item => item.remove()); 
    
        // Add the updated items
        matchingItems.forEach(item => ul.appendChild(item));
        nonMatchingItems.forEach(item => ul.appendChild(item));
    
        if (matchingItems.length === 0 && query !== "") {
            ul.innerHTML = '<li>No matching items found !</li>'; // Show message
        } 
    });
    

});