const express = require('express');
const router = express.Router();
const Campground = require('../models/campground'); // Adjust the path as necessary

// Route to get campgrounds data as JSON
router.get('/campgrounds', async (req, res) => {
    try {
        const campgrounds = await Campground.find({});
        res.json(campgrounds);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching campgrounds data' });
    }
});

module.exports = router;
