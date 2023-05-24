//корневые роутеры

const Router = require('express').Router;
const userController = require('../controllers/userController')
const router = new Router();
const { body } = require('express-validator')
const authAdminMiddteware = require('../middlewares/auth-middleware');
const authUserMiddteware = require('../middlewares/auth-user-middleware');



router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min: 6,max: 32}),
    userController.registration
    );


//публичный роут
router.post('/login',userController.login);
router.post('/logout',userController.logout);
router.get('/activate/:link',userController.activate);
router.get('/refresh', userController.refresh);
router.get('/show/typeservices', userController.getAllTypeServices);
router.get('/show/services', userController.getAllServices);
router.get('/manager/freetime',userController.getFreeTimeManager);
router.get('/manager/sevice',userController.getServiceManager);
router.get('/images/:imageName', userController.getImage)




//админ роут
router.get('/users', authAdminMiddteware, userController.getUsers);

//юзер роут
router.post('/appointment',authUserMiddteware, userController.createAppointments)
router.put('/appointment/update/status',authUserMiddteware,userController.updateStatusAppointment)
router.get('/user/show/appointment',userController.showAppointmentUser)
router.get('/user/show/profile',authUserMiddteware,userController.getUserProfile)








module.exports = router;