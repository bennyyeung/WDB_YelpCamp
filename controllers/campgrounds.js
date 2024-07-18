const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");
const NodeGeocoder = require('node-geocoder');

const options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

const geocoder = NodeGeocoder(options);

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const { title, location, description, price } = req.body.campground;
    try {
        const geocodeRes = await geocoder.geocode(location);
        if (geocodeRes.length === 0) {
            if (req.files.length > 0) {
                for (let file of req.files) {
                    await cloudinary.uploader.destroy(file.filename);
                }
            }
            req.flash('error', `${req.body.campground.location} is an invalid location! Please enter a valid location`);
            return res.redirect('/campgrounds/new');
        }
        const newCampground = {
            title,
            location,
            description,
            price,
            latitude: geocodeRes[0].latitude,
            longitude: geocodeRes[0].longitude,
            images: req.files.map(f => ({ url: f.path, filename: f.filename })),
            author: req.user._id
        };
        const campground = await Campground.create(newCampground);
        req.flash('success', 'Successfully made a new campground!');
        res.redirect(`/campgrounds/${campground._id}`);
    } catch (err) {
        console.error('Error creating campground:', err);
        req.flash('error', 'Failed to create campground');
        res.redirect('/campgrounds/new');
    }
};


module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
        .populate({
            path: 'reviews',
            populate: {
                path: 'author',
            }
        }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    let lat, lng;
    if (campground.latitude && campground.longitude) {
        lat = campground.latitude;
        lng = campground.longitude;
    } else {
        const geocodeRes = await geocoder.geocode(campground.location);
        if (geocodeRes.length > 0) {
            lat = geocodeRes[0].latitude;
            lng = geocodeRes[0].longitude;
        }
    }
    res.render('campgrounds/show', { campground, lat, lng });   
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params    
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    }
    if (req.body.campground.location !== campground.location) {
        const geocodeRes = await geocoder.geocode(req.body.campground.location);
        if (geocodeRes.length === 0) {
            req.flash('error', `${req.body.campground.location} is an invalid location! Please enter a valid location`);
            return res.redirect(`/campgrounds/${id}/edit`);
        }
        newLatitude = geocodeRes[0].latitude;
        newLongitude = geocodeRes[0].longitude;

        campground.title = req.body.campground.title;
        campground.price = req.body.campground.price;
        campground.description = req.body.campground.description;
        if (newLatitude && newLongitude) {
            campground.latitude = newLatitude;
            campground.longitude = newLongitude;
            campground.location = req.body.campground.location;
        }
    }
    if (req.files.length > 0) {
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
        campground.images.push(...imgs);
    }
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campground!')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndDelete(id);
    for (let image of campground.images) {
        await cloudinary.uploader.destroy(image.filename);
    }
    req.flash('success', 'Successfully deleted campground!')
    res.redirect('/campgrounds');
}
