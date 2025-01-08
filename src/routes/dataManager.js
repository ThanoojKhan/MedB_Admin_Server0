const { Router } = require('express');
const adminPostController = require('../controller/adminController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = Router();

router
    .route('/doctor')
    .post(uploadMiddleware, adminPostController.addDoctor);

router
    .route('/doctor/:page')
    .get(adminPostController.getDoctors);

router
    .route('/doctor/:id')
    .delete(adminPostController.deleteDoctor);

router
    .route('/editDoctor/:id')
    .put(uploadMiddleware, adminPostController.updateDoctor);

module.exports = router;
