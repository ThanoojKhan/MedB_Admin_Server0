const { Router } = require('express');
const adminPostController = require('../controller/adminController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = Router();

// ------------- ADMIN ---------------
router
    .route('/doctor')
    .post(uploadMiddleware, adminPostController.addDoctor)
    .patch(adminPostController.updateDoctor)

router
    .route('/doctor/:page')
    .get(adminPostController.getDoctors)

router
    .route('/doctor/:id')
    .delete(adminPostController.deleteDoctor)

module.exports = router;
