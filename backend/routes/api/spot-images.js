const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { spotImageAuthorization } = require('../../utils/authorization');

const router = express.Router();

// Delete a spot image
router.delete('/:imageId',
  requireAuth,
  spotImageAuthorization,
  async (req, res) => {
    await req.spotImage.destroy();

    return res.json({
      message: "Successfully deleted"
    });
});

module.exports = router;