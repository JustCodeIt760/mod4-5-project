const express = require('express');
const { Spot, Review, SpotImage, User, sequelize } = require('../../db/models');

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

module.exports = router;