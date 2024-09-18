document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0]; 
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const epwData = e.target.result;
            processEPWData(epwData);
        };
        reader.readAsText(file);
    }
});

function processEPWData(data) {
    const lines = data.split("\n");
    const weatherData = [];

    for (let i = 8; i < lines.length; i++) {
        const line = lines[i];
        const columns = line.split(",");
        if (columns.length > 6) {
            weatherData.push({
                Year: parseInt(columns[0]),
                Month: parseInt(columns[1]),
                Day: parseInt(columns[2]),
                Hour: parseInt(columns[3]),
                Minute: parseInt(columns[4]),
                DryBulbTemperature: parseFloat(columns[6])
            });
        }
    }

    const dailyTempMap = new Map();

    weatherData.forEach(entry => {
        const dateKey = `${entry.Month}-${entry.Day}`;
        if (!dailyTempMap.has(dateKey)) {
            dailyTempMap.set(dateKey, { temps: [], minTemp: Infinity, maxTemp: -Infinity });
        }
        const dayData = dailyTempMap.get(dateKey);
        dayData.temps.push(entry.DryBulbTemperature);
        dayData.minTemp = Math.min(dayData.minTemp, entry.DryBulbTemperature);
        dayData.maxTemp = Math.max(dayData.maxTemp, entry.DryBulbTemperature);
    });

    const dailyTempData = [];
    dailyTempMap.forEach((dayData, key) => {
        const [month, day] = key.split("-");
        const avgTemp = dayData.temps.reduce((sum, val) => sum + val, 0) / dayData.temps.length;
        dailyTempData.push({
            Date: new Date(2020, month - 1, day),
            AvgTemp: avgTemp,
            MinTemp: dayData.minTemp,
            MaxTemp: dayData.maxTemp
        });
    });

    dailyTempData.sort((a, b) => a.Date - b.Date);

    const dates = dailyTempData.map(d => d.Date);
    const avgTemps = dailyTempData.map(d => d.AvgTemp);
    const minTemps = dailyTempData.map(d => d.MinTemp);
    const maxTemps = dailyTempData.map(d => d.MaxTemp);

    const traceRange = {
        x: dates,
        y: maxTemps.map((maxTemp, i) => maxTemp - minTemps[i]),
        base: minTemps,
        type: 'bar',
        marker: {
            color: 'rgba(255, 0, 0, 0.3)',
        },
        width: 0.9 * 86400000,
        name: 'Dry Bulb Temperature Range'
    };

    const traceAvg = {
        x: dates,
        y: avgTemps,
        type: 'scatter',
        mode: 'lines',
        line: {
            color: 'red',
            width: 2
        },
        name: 'Average Dry Bulb Temperature'
    };

    const layout = {
        title: 'Average Daily Dry Bulb Temperature with Min-Max Range',
        xaxis: {
            title: 'Date',
            linecolor: 'black',
            linewidth: 2,
        },
        yaxis: {
            title: 'Temperature(˚C)',
            linecolor: 'black',
            linewidth: 2,
            gridcolor: 'lightgrey',
            gridwidth: 1
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        showlegend: true,
    };

    Plotly.newPlot('chart', [traceRange, traceAvg], layout);
}
