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