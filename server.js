// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data storage
const dataFilePath = path.join(__dirname, 'temperature_data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({ 
    data: [],
    lastReset: new Date().toISOString()
  }));
}

// Load data
let temperatureData = JSON.parse(fs.readFileSync(dataFilePath));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all temperature data
app.get('/api/temperature', (req, res) => {
  res.json(temperatureData);
});

// Add new temperature reading
app.post('/api/temperature', (req, res) => {
  const reading = {
    timestamp: new Date().toISOString(),
    ...req.body
  };
  
  temperatureData.data.push(reading);
  
  // Save to file
  fs.writeFileSync(dataFilePath, JSON.stringify(temperatureData, null, 2));
  
  res.status(201).json({ message: 'Data saved successfully', reading });
});

// Reset all data
app.post('/api/reset', (req, res) => {
  temperatureData = { 
    data: [],
    lastReset: new Date().toISOString()
  };
  
  fs.writeFileSync(dataFilePath, JSON.stringify(temperatureData, null, 2));
  
  res.json({ message: 'Data reset successfully' });
});

// Export data as CSV
app.get('/api/export', (req, res) => {
  if (temperatureData.data.length === 0) {
    return res.status(404).json({ message: 'No data to export' });
  }

  // Generate CSV header
  const sensorNames = ['tempC1', 'tempF1', 'tempC2', 'tempF2'];
  for (let i = 1; i <= 6; i++) {
    sensorNames.push(`tempDS${i}`);
  }
  
  const header = ['timestamp', ...sensorNames].join(',');
  
  // Generate CSV rows
  const rows = temperatureData.data.map(reading => {
    const row = [reading.timestamp];
    sensorNames.forEach(sensor => {
      row.push(reading[sensor] !== undefined ? reading[sensor] : '');
    });
    return row.join(',');
  });
  
  const csv = [header, ...rows].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=temperature_data.csv');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
