import express from 'express';
import login from '../controllers/Auth/login.js';
import register from '../controllers/Auth/register.js';
import logout from '../controllers/Auth/logout.js';
import refreshToken from '../controllers/Auth/refreshToken.js';
import googleAuth from '../controllers/Auth/googleAuth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/google', googleAuth);

export default router;
