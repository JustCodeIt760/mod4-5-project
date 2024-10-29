const express = require('express');
const { Spot, Review, SpotImage, User, sequelize } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { authorization } = require('../../utils/authorization');

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

// Get all spots
router.get('/', async (req, res) => {
  const spots = await Spot.findAll({
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

module.exports = router;