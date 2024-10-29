const { Spot } = require('../db/models');
const { Review } = require('../db/models');
const { SpotImage } = require('../db/models');
const { ReviewImage } = require('../db/models');

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

// Authorization middleware for spot images
const spotImageAuthorization = async (req, res, next) => {
  const spotImage = await SpotImage.findByPk(req.params.imageId, {
    include: [{
      model: Spot,
      attributes: ['ownerId']
    }]
  });
  
  if (!spotImage) {
    return res.status(404).json({
      message: "Spot Image couldn't be found"
    });
  }

  if (spotImage.Spot.ownerId !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden"
    });
  }

  req.spotImage = spotImage;
  next();
};

// Authorization middleware for review images
const reviewImageAuthorization = async (req, res, next) => {
  const reviewImage = await ReviewImage.findByPk(req.params.imageId, {
    include: [{
      model: Review,
      attributes: ['userId']
    }]
  });
  
  if (!reviewImage) {
    return res.status(404).json({
      message: "Review Image couldn't be found"
    });
  }

  if (reviewImage.Review.userId !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden"
    });
  }

  req.reviewImage = reviewImage;
  next();
};

module.exports = {
  authorization,
  reviewAuthorization,
  spotImageAuthorization,
  reviewImageAuthorization
};