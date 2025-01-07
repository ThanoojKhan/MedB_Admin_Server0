const { Router } = require('express');
const adminPostController = require('../controller/adminPostController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = Router();

// ------------- ADMIN POST ---------------
router
    .route('/adminPost')
    .get(adminPostController.getPosts)
    .post(uploadMiddleware, adminPostController.uploadPost)
    .patch(adminPostController.updatePost)
    .delete(adminPostController.deletePost);

module.exports = router;
