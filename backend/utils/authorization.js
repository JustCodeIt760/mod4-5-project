const { Spot } = require('../db/models');

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

module.exports = {
  authorization
};