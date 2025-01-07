const { Router } = require('express');
const authController = require('../controller/authController');

const router = Router();

router
    .route('/registerAdmin')
    .post(authController.newAdmin);

router
    .route('/login')
    .post(authController.login);

router
    .route('/refreshToken')
    .post(authController.refreshAccessToken);

router
    .route('/logout')
    .post(authController.logout);

module.exports = router;
