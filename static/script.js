// Fungsi untuk membaca CSV
async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    return data;
}

// Fungsi untuk mengolah CSV menjadi array objek
function parseCSV(csvData) {
    const rows = csvData.split("\n").map(row => row.trim());
    const headers = rows[0].split(",");
    const data = rows.slice(1).map(row => {
        const values = row.split(",");
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });
    return data;
}

function filterData(items, key) {
    const uniqueValues = new Set();
    const filteredItems = [];

    items.forEach(item => {
        const value = item[key]?.trim(); // Ambil nilai dari kolom tertentu

        // Syarat filter: Tidak kosong, hanya angka & titik, dan unik
        if (value && /^["0-9."]+$/.test(value) && !uniqueValues.has(value)) {
            uniqueValues.add(value);
            filteredItems.push(item);
        }
    });

    return filteredItems;
}

// Fungsi untuk mengisi dropdown
async function populateDropdown() {
    const dropdown = document.getElementById("dropdown-select");
    const csvData = await loadCSV("static/tiktok-reviews.csv");
    const items = parseCSV(csvData);

    // Filter data menggunakan kolom "name"
    const filteredItems = filterData(items, "reviewCreatedVersion");

    filteredItems.forEach(item => {
        const option = document.createElement("option");
        option.id = "reviewCreatedVersion";
        option.value = item.reviewCreatedVersion; // value dari ID
        option.textContent = item.reviewCreatedVersion; // teks untuk ditampilkan
        dropdown.appendChild(option);
    });
}

// Jalankan fungsi untuk mengisi dropdown
populateDropdown();

// Tambahkan event listener pada tombol prediksi
document.getElementById("predict-button").addEventListener("click", handlePrediction);

document.getElementById('reviewForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    const response = await fetch('/predict', {
        method: 'POST',
        body: formData
    });
    
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        const ctx = document.getElementById('sentimentChart').getContext('2d');
        
        // Get sentiment data from server response
        const positifCount = parseInt("{{ sentiment['positif'] }}");
        const negatifCount = parseInt("{{ sentiment['negatif'] }}");
        
        if (window.sentimentChart) {
            window.sentimentChart.destroy();
        }
        
        window.sentimentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Positif', 'Negatif'],
                datasets: [{
                    label: 'Sentiment Count',
                    data: [positifCount, negatifCount],
                    backgroundColor: ['#4CAF50', '#FF5252']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Sentiment Analysis Distribution'
                    }
                }
            }
        });
        chartContainer.style.display = 'block';
    }
});
