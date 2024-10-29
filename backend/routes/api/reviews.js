const express = require('express');
const { Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { reviewAuthorization } = require('../../utils/authorization');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Get all reviews of the current user
router.get('/current', requireAuth, async (req, res) => {
  const reviews = await Review.findAll({
    where: {
      userId: req.user.id
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Spot,
        attributes: {
          exclude: ['description', 'createdAt', 'updatedAt']
        },
        include: [
          {
            model: SpotImage,
            where: { preview: true },
            attributes: ['url'],
            required: false
          }
        ]
      },
      {
        model: ReviewImage,
        attributes: ['id', 'url']
      }
    ]
  });

  // Format the response
  const formattedReviews = reviews.map(review => {
    const reviewJSON = review.toJSON();
    
    // Add previewImage to Spot
    if (reviewJSON.Spot) {
      reviewJSON.Spot.previewImage = reviewJSON.Spot.SpotImages?.[0]?.url || null;
      delete reviewJSON.Spot.SpotImages;
    }

    return reviewJSON;
  });

  return res.json({ Reviews: formattedReviews });
});

// Validation middleware
const validateReviewImage = [
    check('url')
      .exists({ checkFalsy: true })
      .withMessage('URL is required')
      .isURL()
      .withMessage('Must be a valid URL'),
    handleValidationErrors
  ];
  
  // Add an image to a review
  router.post('/:reviewId/images',
    requireAuth,
    reviewAuthorization,
    validateReviewImage,
    async (req, res) => {
      // Check if review already has 10 images
      const imageCount = await ReviewImage.count({
        where: { reviewId: req.params.reviewId }
      });
  
      if (imageCount >= 10) {
        return res.status(403).json({
          message: "Maximum number of images for this resource was reached"
        });
      }
  
      const { url } = req.body;
  
      const reviewImage = await ReviewImage.create({
        reviewId: req.params.reviewId,
        url
      });
  
      // Return only the specified fields
      return res.status(201).json({
        id: reviewImage.id,
        url: reviewImage.url
      });
  });

module.exports = router;