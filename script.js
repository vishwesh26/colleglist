document.getElementById('submit').addEventListener('click', async function() {
  const exam = document.getElementById('exam').value;
  const percentile = parseFloat(document.getElementById('percentile').value);
  const tolerance = 8;  // Define the tolerance range

  console.log('Selected Exam:', exam);
  console.log('Entered Percentile:', percentile);

  try {
    const response = await fetch('colleges.json');
    const data = await response.json();
    const filteredColleges = data.filter(college => {
      let cutoff = college["Percentile Cut-off"];
      let examType = college["Exam"] === 'JEE(Main)' ? 'jee' : 'cet';
      let result = exam === examType && percentile <= cutoff + tolerance && percentile >= cutoff - tolerance;
      console.log('College:', college["Institute Name"], 'Cutoff:', cutoff, 'Result:', result);
      return result;
    });

    displayResults(filteredColleges);
    populateCityFilter(filteredColleges);
    document.getElementById('city-filter').style.display = 'block';
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

function displayResults(colleges) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  // Sort colleges by percentile cutoff in descending order
  colleges.sort((a, b) => b["Percentile Cut-off"] - a["Percentile Cut-off"]);

  if (colleges.length === 0) {
    resultsDiv.innerHTML = '<p>No colleges match your criteria.</p>';
    return;
  }

  colleges.forEach((college, index) => {
    const collegeCard = document.createElement('div');
    collegeCard.classList.add('college-card', `card-color-${(index % 6) + 1}`);

    const collegeName = document.createElement('h2');
    collegeName.textContent = college["Institute Name"];
    collegeCard.appendChild(collegeName);

    const cutoff = document.createElement('p');
    cutoff.textContent = `Percentile Cut-off: ${college["Percentile Cut-off"]}`;
    collegeCard.appendChild(cutoff);

    const moreInfoButton = document.createElement('button');
    moreInfoButton.textContent = 'More Info';
    moreInfoButton.addEventListener('click', function(event) {
      toggleDetails(event.target.parentElement);
    });
    collegeCard.appendChild(moreInfoButton);

    const collegeDetails = document.createElement('div');
    collegeDetails.classList.add('college-details');

    Object.keys(college).forEach(key => {
      const detail = document.createElement('p');
      detail.textContent = `${key}: ${college[key]}`;
      collegeDetails.appendChild(detail);
    });

    collegeCard.appendChild(collegeDetails);
    resultsDiv.appendChild(collegeCard);
  });
}

function toggleDetails(card) {
  const details = card.querySelector('.college-details');
  const allCards = document.querySelectorAll('.college-card');

  allCards.forEach(otherCard => {
    if (otherCard !== card) {
      const otherDetails = otherCard.querySelector('.college-details');
      otherDetails.style.display = 'none';
    }
  });

  details.style.display = details.style.display === 'block' ? 'none' : 'block';
}

function populateCityFilter(colleges) {
  const cityFilter = document.getElementById('city');
  const cities = new Set(colleges.map(college => getCityFromCollege(college)));

  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.toLowerCase();
    option.textContent = city;
    cityFilter.appendChild(option);
  });

  cityFilter.addEventListener('change', function() {
    const selectedCity = cityFilter.value;
    const filteredColleges = colleges.filter(college => selectedCity === 'all' || getCityFromCollege(college).toLowerCase() === selectedCity);
    displayResults(filteredColleges);
  });
}

function getCityFromCollege(college) {
  const cityRegex = /(Pune|Mumbai|Nagpur)/i;
  const match = college["Institute Name"].match(cityRegex);
  return match ? match[0] : 'Other';
}

document.getElementById('download').addEventListener('click', function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const resultsDiv = document.getElementById('results');
  const collegeCards = resultsDiv.querySelectorAll('.college-card');

  if (collegeCards.length === 0) {
      alert('No colleges to download.');
      return;
  }

  const columns = ["All India Rank", "Percentile Cut-off", "Choice Code", "Institute Name", "Course Name", "Exam", "Type", "Seat Type"];
  const rows = [];

  collegeCards.forEach(card => {
      const details = card.querySelector('.college-details').querySelectorAll('p');
      const row = [];

      details.forEach(detail => {
          const text = detail.textContent.split(": ")[1];
          row.push(text);
      });

      rows.push(row);
  });

  // Add licensing info
  const licenseText = `Licensed to: Vishwesh Shinde`;
  doc.setTextColor(50);
  doc.text(licenseText, 10, doc.internal.pageSize.getHeight() - 10);

  // Generate auto table
  doc.autoTable(columns, rows);

  // Save PDF with filename
  doc.save('college_list.pdf');
});
