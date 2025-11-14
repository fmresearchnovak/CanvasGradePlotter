// Function to load the Chart.js library dynamically
function loadChartJs(callback) {
    if (typeof Chart !== 'undefined') {
        callback();
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
    script.onload = callback;
    script.onerror = () => {
        console.error("Failed to load Chart.js library.");
        alert("Could not load Charting library. Check console for details.");
    };
    document.head.appendChild(script);
}

// Function to scrape grades from the table
function scrapeGrades() {
    const table = document.getElementById('grades_summary');
    if (!table) {
        console.warn("Grades table not found. Is this the correct Grades page?");
        return null;
    }

    const rows = table.querySelectorAll('tbody tr');
    const grades = [];
    let scoreColumnIndex = -1;

    // 1. Find the index of the "Current Score" column header
    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        // Look for headers that include the text 'Current Score'
        if (header.textContent.includes('Current Score')) {
            scoreColumnIndex = index;
        }
    });

    if (scoreColumnIndex === -1) {
        console.error("Could not find 'Current Score' column in the grades table.");
        return null;
    }

    // 2. Extract scores from the identified column
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > scoreColumnIndex) {
            const scoreCell = cells[scoreColumnIndex];
            // Canvas uses a specific structure, look for the score element
            const scoreElement = scoreCell.querySelector('.score_details .score, .score_details .grade');
            
            if (scoreElement) {
                // The text content might be "95%", "100 / 100", or just "95"
                const text = scoreElement.textContent.trim();
                let percentageMatch = text.match(/(\d+\.?\d*)%/);
                let simpleNumberMatch = text.match(/^(\d+\.?\d*)$/);

                let score = null;
                if (percentageMatch) {
                    // Extract as percentage (e.g., "95%")
                    score = parseFloat(percentageMatch[1]);
                } else if (simpleNumberMatch) {
                    // Extract as simple number (assuming it's already a percentage score)
                    score = parseFloat(simpleNumberMatch[1]);
                }
                
                if (score !== null && !isNaN(score) && score >= 0) {
                    grades.push(Math.round(score)); // Use rounded integer grades for binning
                }
            }
        }
    });

    return grades;
}

// Function to calculate the frequency distribution for the histogram
function calculateDistribution(grades) {
    const binSize = 5; // e.g., 90-94, 85-89, etc.
    const maxGrade = 100;
    const labels = [];
    const data = [];

    // Create bins (0-4, 5-9, 10-14, ..., 95-100)
    for (let i = 0; i <= maxGrade; i += binSize) {
        const lower = i;
        const upper = Math.min(i + binSize - 1, maxGrade);
        const label = `${lower}-${upper}`;
        labels.push(label);
        data.push(0); // Initialize count to zero
    }
    // Fix the last label to include 100
    labels[labels.length - 1] = `${maxGrade - binSize + 1}-${maxGrade}`;


    // Count the grades into the appropriate bins
    grades.forEach(grade => {
        if (grade >= 0 && grade <= maxGrade) {
            let binIndex = Math.floor(grade / binSize);
            // Ensure the 100% grade falls into the final bin
            if (grade === 100 && binIndex * binSize < 100) {
                binIndex = data.length - 1; 
            }
            if (binIndex < data.length) {
                data[binIndex]++;
            }
        }
    });

    return { labels, data };
}

// Function to render the chart
function renderChart(distribution) {
    // 1. Create a container element for the chart
    const container = document.createElement('div');
    container.id = 'grade-histogram-container';
    container.innerHTML = `
        <h2 class="plot-title">Class Total Grade Distribution</h2>
        <canvas id="grade-histogram-canvas"></canvas>
    `;

    // Try to find a good place to insert the chart (e.g., above the main grades table)
    const gradesHeader = document.querySelector('.course-title') || document.querySelector('.ic-Dashboard-header__title');
    if (gradesHeader) {
        // Insert the container right after the page title
        gradesHeader.parentElement.insertBefore(container, gradesHeader.nextSibling);
    } else {
        // Fallback: append to the main content area
        document.body.appendChild(container); 
    }

    // 2. Get the canvas element and draw the chart
    const ctx = document.getElementById('grade-histogram-canvas').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: distribution.labels,
            datasets: [{
                label: 'Number of Students',
                data: distribution.data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Histogram of Final Percentage Grades',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Student Count'
                    },
                    ticks: {
                        // Ensure y-axis ticks are integers
                        callback: function(value) { if (value % 1 === 0) { return value; } }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Grade Range (%)'
                    }
                }
            }
        }
    });
}

// Main execution function
function initPlotter() {
    alert("LFG?")
    console.log("LFG!");
    const grades = scrapeGrades();

    if (!grades || grades.length === 0) {
        // This is fine if there are no student grades yet.
        console.log("No student grades found to plot. Skipping histogram creation.");
        return;
    } else {
        console.log("Plotting grades!");
    }

    const distribution = calculateDistribution(grades);
    
    // Load Chart.js and then render the chart
    loadChartJs(() => {
        renderChart(distribution);
    });
}

// Wait for the window to load before running the script
window.addEventListener('load', initPlotter);
alert("let's fucking go?")