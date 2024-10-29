'use strict';

const { Review } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 2,
        review: "This was an awesome spot!",
        stars: 5
      },
      {
        spotId: 1,
        userId: 3,
        review: "Pretty good location.",
        stars: 4
      },
      {
        spotId: 2,
        userId: 1,
        review: "Great coding atmosphere",
        stars: 5
      },
      {
        spotId: 2,
        userId: 3,
        review: "Decent spot for work",
        stars: 3
      },
      {
        spotId: 3,
        userId: 1,
        review: "Amazing tech community",
        stars: 5
      },
      {
        spotId: 3,
        userId: 2,
        review: "Good spot for networking",
        stars: 4
      }
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};