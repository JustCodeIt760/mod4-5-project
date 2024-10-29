const express = require('express');
const { Spot, Review, SpotImage, User, sequelize, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check, query } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { authorization } = require('../../utils/authorization');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validateSpot = [
  check('address')
    .exists({ checkFalsy: true })
    .withMessage('Street address is required'),
  check('city')
    .exists({ checkFalsy: true })
    .withMessage('City is required'),
  check('state')
    .exists({ checkFalsy: true })
    .withMessage('State is required'),
  check('country')
    .exists({ checkFalsy: true })
    .withMessage('Country is required'),
  check('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be within -90 and 90'),
  check('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be within -180 and 180'),
  check('name')
    .exists({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters'),
  check('description')
    .exists({ checkFalsy: true })
    .withMessage('Description is required'),
  check('price')
    .exists({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price per day must be a positive number'),
  handleValidationErrors
];

// Validation middleware for creating a review
const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .withMessage('Review text is required'),
  check('stars')
    .exists({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be an integer from 1 to 5'),
  handleValidationErrors
];

// Validation middleware for query parameters
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than or equal to 1'),
  query('size')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Size must be between 1 and 20'),
  query('minLat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Minimum latitude is invalid'),
  query('maxLat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Maximum latitude is invalid'),
  query('minLng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Minimum longitude is invalid'),
  query('maxLng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Maximum longitude is invalid'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be greater than or equal to 0'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be greater than or equal to 0'),
  handleValidationErrors
];

// Get all spots
router.get('/', validateQueryParams, async (req, res) => {
  let { page = 1, size = 20 } = req.query;
  const { minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  // Convert to numbers
  page = parseInt(page);
  size = parseInt(size);

  // Build where clause for filtering
  const where = {};

  if (minLat || maxLat) {
    where.lat = {};
    if (minLat) where.lat[Op.gte] = parseFloat(minLat);
    if (maxLat) where.lat[Op.lte] = parseFloat(maxLat);
  }

  if (minLng || maxLng) {
    where.lng = {};
    if (minLng) where.lng[Op.gte] = parseFloat(minLng);
    if (maxLng) where.lng[Op.lte] = parseFloat(maxLng);
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  const spots = await Spot.findAll({
    where,
    include: [
      {
        model: Review,
        attributes: []
      },
      {
        model: SpotImage,
        where: { preview: true },
        attributes: [],
        required: false
      }
    ],
    attributes: {
      include: [
        [
          sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('Reviews.stars')), 1),
          'avgRating'
        ],
        [
          sequelize.col('SpotImages.url'),
          'previewImage'
        ]
      ]
    },
    group: ['Spot.id', 'SpotImages.url'],
    limit: size,
    offset: size * (page - 1),
    subQuery: false
  });

  return res.json({
    Spots: spots,
    page,
    size
  });
});

// Get all spots owned by current user
router.get('/current', requireAuth, async (req, res) => {
    const spots = await Spot.findAll({
      where: {
        ownerId: req.user.id 
      },
      include: [
        {
          model: Review,
          attributes: []
        },
        {
          model: SpotImage,
          attributes: [],
          where: {
            preview: true
          },
          required: false
        }
      ],
      attributes: {
        include: [
          [
            sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('Reviews.stars')), 1),
            'avgRating'
          ],
          [
            sequelize.col('SpotImages.url'),
            'previewImage'
          ]
        ]
      },
      group: ['Spot.id', 'SpotImages.url']
    });
  
    return res.json({ Spots: spots });
  });
  
// Get details of a spot from an id
router.get('/:spotId', async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      {
        model: SpotImage,
        attributes: ['id', 'url', 'preview']
      },
      {
        model: User,
        as: 'Owner',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Review,
        attributes: []
      }
    ],
    attributes: {
      include: [
        [
          sequelize.fn('COUNT', sequelize.col('Reviews.id')),
          'numReviews'
        ],
        [
          sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('Reviews.stars')), 1),
          'avgStarRating'
        ]
      ]
    },
    group: ['Spot.id', 'SpotImages.id', 'Owner.id']
  });

  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found"
    });
  }

  return res.json(spot);
});

// Create a spot
router.post('/', requireAuth, validateSpot, async (req, res) => {
  const {
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price
  } = req.body;

  const spot = await Spot.create({
    ownerId: req.user.id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price
  });

  return res.status(201).json(spot);
});

// Add an image to a spot
router.post('/:spotId/images', 
  requireAuth, 
  authorization,
  async (req, res) => {
    const { url, preview } = req.body;

    const image = await SpotImage.create({
      spotId: req.params.spotId,
      url,
      preview
    });

    return res.status(201).json({
      id: image.id,
      url: image.url,
      preview: image.preview
    });
});

// Edit a spot
router.put('/:spotId', 
  requireAuth, 
  authorization,
  validateSpot,
  async (req, res) => {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price
    } = req.body;

    const spot = req.spot; 
    // Update the spot
    await spot.update({
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price
    });

    return res.json(spot);
});

// Delete a spot
router.delete('/:spotId',
  requireAuth,
  authorization,
  async (req, res) => {
    await req.spot.destroy();

    return res.json({
      message: "Successfully deleted"
    });
});

// Get all reviews by a spot's id
router.get('/:spotId/reviews', async (req, res) => {
  // First check if spot exists
  const spot = await Spot.findByPk(req.params.spotId);
  
  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found"
    });
  }

  const reviews = await Review.findAll({
    where: {
      spotId: req.params.spotId
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: ReviewImage,
        attributes: ['id', 'url']
      }
    ]
  });

  return res.json({ Reviews: reviews });
});

// Create a review for a spot
router.post('/:spotId/reviews',
  requireAuth,
  validateReview,
  async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);
    
    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found"
      });
    }

    const existingReview = await Review.findOne({
      where: {
        spotId: req.params.spotId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(500).json({
        message: "User already has a review for this spot"
      });
    }

    const { review, stars } = req.body;

    const newReview = await Review.create({
      userId: req.user.id,
      spotId: parseInt(req.params.spotId),
      review,
      stars
    });

    return res.status(201).json(newReview);
});

module.exports = router;