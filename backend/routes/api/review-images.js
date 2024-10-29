const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { reviewImageAuthorization } = require('../../utils/authorization');

const router = express.Router();

// Delete a review image
router.delete('/:imageId',
  requireAuth,
  reviewImageAuthorization,
  async (req, res) => {
    await req.reviewImage.destroy();

    return res.json({
      message: "Successfully deleted"
    });
});

module.exports = router;