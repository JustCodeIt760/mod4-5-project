'use strict';

const { Spot } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "123 Disney Lane",
        city: "San Francisco",
        state: "California",
        country: "United States of America",
        lat: 37.7645358,
        lng: -122.4730327,
        name: "App Academy",
        description: "Place where web developers are created",
        price: 123
      },
      {
        ownerId: 2,
        address: "456 Coding Blvd",
        city: "New York",
        state: "New York",
        country: "United States of America",
        lat: 40.7127753,
        lng: -74.0059728,
        name: "Coding Paradise",
        description: "A peaceful place to code",
        price: 250
      },
      {
        ownerId: 3,
        address: "789 Tech Street",
        city: "Seattle",
        state: "Washington",
        country: "United States of America",
        lat: 47.6062095,
        lng: -122.3320708,
        name: "Tech Haven",
        description: "Perfect spot for tech enthusiasts",
        price: 175
      }
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      name: { [Op.in]: ['App Academy', 'Coding Paradise', 'Tech Haven'] }
    }, {});
  }
};