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

module.exports.createCampground = (async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    // Geocode location and cache lat/lng
    const geocodeRes = await geocoder.geocode(campground.location);
    if (geocodeRes.length > 0) {
        campground.lat = geocodeRes[0].latitude;
        campground.lng = geocodeRes[0].longitude;
    }
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
})


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
        console.log("Using Database Geodata")
    } else {
        //Backup: Get geocode for the campground's location using a geocoding API
        const geocodeRes = await geocoder.geocode(campground.location);
        if (geocodeRes.length > 0) {
            lat = geocodeRes[0].latitude;
            lng = geocodeRes[0].longitude;
            console.log("Using Google API")
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
    const id = req.params.id
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    // If location is updated, re-geocode and update lat/lng
    if (req.body.campground.location !== campground.location) {
        const geocodeRes = await geocoder.geocode(req.body.campground.location);
        if (geocodeRes.length > 0) {
            campground.lat = geocodeRes[0].latitude;
            campground.lng = geocodeRes[0].longitude;
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
