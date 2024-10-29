'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ReviewImages', [
      {
        reviewId: 1,
        url: 'https://example.com/review1-image1.jpg',
      },
      {
        reviewId: 2,
        url: 'https://example.com/review2-image1.jpg',
      },
      {
        reviewId: 3,
        url: 'https://example.com/review3-image1.jpg',
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'ReviewImages';
    return queryInterface.bulkDelete(options);
  }
};