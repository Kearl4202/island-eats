const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'restaurants.json');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
}

// Read restaurants
async function readRestaurants() {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write restaurants
async function writeRestaurants(restaurants) {
    await fs.writeFile(DATA_FILE, JSON.stringify(restaurants, null, 2));
}

// API Routes

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await readRestaurants();
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read restaurants' });
    }
});

// Add new restaurant
app.post('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await readRestaurants();
        const newRestaurant = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        restaurants.push(newRestaurant);
        await writeRestaurants(restaurants);
        res.json(newRestaurant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add restaurant' });
    }
});

// Update restaurant
app.put('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurants = await readRestaurants();
        const index = restaurants.findIndex(r => r.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        restaurants[index] = {
            ...restaurants[index],
            ...req.body,
            id: req.params.id
        };
        
        await writeRestaurants(restaurants);
        res.json(restaurants[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update restaurant' });
    }
});

// Delete restaurant
app.delete('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurants = await readRestaurants();
        const filtered = restaurants.filter(r => r.id !== req.params.id);
        
        if (filtered.length === restaurants.length) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        await writeRestaurants(filtered);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete restaurant' });
    }
});

// Clear all restaurants
app.delete('/api/restaurants', async (req, res) => {
    try {
        await writeRestaurants([]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear restaurants' });
    }
});

// Start server
initDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
