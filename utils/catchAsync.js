// function catchAsync(func) {
//     return function (req, res, next) {
//         func(req, res, next).catch(next)
//     }
// }

// const catchAsync = (func) => (req, res, next) => {
//     func(req, res, next).catch(next);
// }

module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next)
    }
}