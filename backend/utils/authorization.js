const { Spot } = require('../db/models');
const { Review } = require('../db/models');

// Authorization middleware for spot ownership
const authorization = async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId);
  
  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found"
    });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden"
    });
  }

  req.spot = spot;
  next();
};

// Authorization middleware for review ownership
const reviewAuthorization = async (req, res, next) => {
  const review = await Review.findByPk(req.params.reviewId);
  
  if (!review) {
    return res.status(404).json({
      message: "Review couldn't be found"
    });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden"
    });
  }

  req.review = review;
  next();
};

module.exports = {
  authorization,
  reviewAuthorization
};