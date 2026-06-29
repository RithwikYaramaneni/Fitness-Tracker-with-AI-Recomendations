const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

// @route   POST /api/upload
// @desc    Upload image to Cloudinary
// @access  Private
router.post('/', auth, (req, res) => {
  console.log('=== Upload Request ===');
  console.log('Headers:', req.headers);
  console.log('Auth user:', req.userId);
  
  upload.single('image')(req, res, function(err) {
    if (err) {
      console.error('❌ Multer/Upload error:', err);
      return res.status(400).json({
        success: false,
        message: 'Upload failed: ' + err.message
      });
    }

    try {
      console.log('File received:', req.file);
      
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      console.log('✅ Upload successful:', req.file.path);
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: req.file.path,
          publicId: req.file.filename
        }
      });
    } catch (error) {
      console.error('❌ Upload processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process upload: ' + error.message
      });
    }
  });
});

module.exports = router;

module.exports = router;
