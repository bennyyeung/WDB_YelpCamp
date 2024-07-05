const mongoose = require('mongoose')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers')
const Campground = require('../models/campground');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/yelp-camp', {});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const sample = array => array[Math.floor(Math.random() * array.length)]

const imagePath1 = './images/image1.jpg';
const imagePath2 = './images/image2.jpg';

const seedDB = async () => {
    try {
        await Campground.deleteMany({});
        for (let i = 0; i < 50; i++) {
            const random1000 = Math.floor(Math.random() * 1000);
            const price = Math.floor(Math.random() * 20) + 10;

            // Upload images to Cloudinary
            const imageUpload1 = await cloudinary.uploader.upload(imagePath1, {
                folder: 'YelpCamp'
            });

            const imageUpload2 = await cloudinary.uploader.upload(imagePath2, {
                folder: 'YelpCamp'
            });

            const camp = new Campground({
                author: '667d89ad4f77d157d330965f',
                location: `${cities[random1000].city}, ${cities[random1000].state}`,
                title: `${sample(descriptors)} ${sample(places)}`,
                description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ullam veniam voluptatibus animi, expedita nemo praesentium, facilis iste accusantium obcaecati delectus ab possimus dicta, error a non quia voluptatum quos libero.',
                price,
                images: [
                    {
                        url: imageUpload1.secure_url,
                        filename: imageUpload1.public_id
                    },
                    {
                        url: imageUpload2.secure_url,
                        filename: imageUpload2.public_id
                    }
                ]
            });
            await camp.save();
        }
    } catch (error) {
        console.error("Error seeding the database:", error);
    } finally {
        db.close();
    }
};

seedDB().catch(error => {
    console.error("Error initializing seedDB:", error);
    db.close();
});