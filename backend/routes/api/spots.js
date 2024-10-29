const express = require('express');
const { Spot, Review, SpotImage, User, sequelize } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

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

module.exports = router;