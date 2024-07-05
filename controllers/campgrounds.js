const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");

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
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
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
    res.render('campgrounds/show', { campground })
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

//From Colt
// module.exports.updateCampground = async (req, res) => {
//     const { id } = req.params;    
//     const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
//     const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
//     campground.images.push(...imgs);
//     await campground.save();
//     if(req.body.deleteImages) {
//         for (let filename of req.body.deleteImages) {
//             await cloudinary.uploader.destory(filename);
//         }
//         await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
//         console.log(campground)
//     };
//     req.flash('success', 'Successfully updated campground!');
//     res.redirect(`/campgrounds/${campground._id}`)
// }

//From Q&A Section 558
module.exports.updateCampground = async (req, res) => {
    const id = req.params.id
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
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

//From Colt
// module.exports.deleteCampground = async (req, res) => {
//     const { id } = req.params;
//     const campground = await Campground.findById(id);
//     if (!campground.author.equals(req.user._id)) {
//         req.flash('error', 'You do not have permission to do that!');
//         return res.redirect(`/campgrounds/${id}`);
//     }
//     await Campground.findByIdAndDelete(id);
//     req.flash('success', 'Successfully deleted campground!');
//     res.redirect('/campgrounds');
// }

//From Q&A Section 558
module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndDelete(id);
    for (let image of campground.images) {
        await cloudinary.uploader.destroy(image.filename);
    }
    req.flash('success', 'Successfully deleted campground!')
    res.redirect('/campgrounds');
}
