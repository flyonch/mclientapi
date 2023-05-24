const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const path = require('path');


class UserController {

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            console.log(req.body);
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error)
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken', { path: '/' });
            return res.json(token);
        } catch (error) {
            next(error);
        }
    }


    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }
            const { email, phone, password } = req.body;
            const userData = await userService.registration(email, phone, password)
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error)
        }
    }


    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error)
        }
    }

    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL)
        } catch (error) {
            next(error)
        }
    }


    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users)
        } catch (error) {
            next(error)
        }
    }

    // получаем время работы  менеджера
    async getFreeTimeManager(req, res, next) {
        const { user_id } = req.query
        try {
            const freeTimeManager = await userService.getFreeTimeManager(user_id);
            return res.json(freeTimeManager.rows)
        } catch (error) {
            next(error)
        }
    }

    // создаем запись на прием
    async createAppointments(req, res, next) {
        try {
            const { user_id, manager_id, service_id, date_time_service, selectTime } = req.body;
            console.log(`selectTime`, user_id)
            const appointments = await userService.createAppointment(user_id, manager_id, service_id, date_time_service, selectTime);
            return res.json(appointments)
        } catch (error) {
            next(error)
        }
    }

    //обновляем статус записи canceled = true значит отменена
    async updateStatusAppointment(req, res, next) {
        try {
            const { user_id, appointment_id, status } = req.body;
            const cancelAppointments = await userService.updateStatusAppointment(user_id, appointment_id, status)
            return res.json(cancelAppointments);
        } catch (error) {
            next(error);
        }
    }

    async showAppointmentUser(req, res, next) {
        try {
            const { user_id } = req.query;
            const showAppointmentUser = await userService.showAppointmentUser(user_id);

            return res.json(showAppointmentUser);
        } catch (error) {
            next(error);
        }
    }

    async getAllTypeServices(req, res, next) {
        try {
            const { type_service } = req.query;
            const allServices = await userService.getAllTypeServices(type_service);

            return res.json(allServices);
        } catch (error) {
            next(error);
        }
    }

    async getAllServices(req, res, next) {
        try {
            const { type_service } = req.query;
            const allServices = await userService.getAllServices(type_service);

            return res.json(allServices);
        } catch (error) {
            next(error);
        }
    }

    async getUserProfile(req, res, next) {
        try {
            const { user_id } = req.query;
            const userProfileData = await userService.showUserProfile(user_id);

            return res.json(userProfileData);
        } catch (error) {
            next(error);
        }
    }


    async getServiceManager(req, res, next) {
        try {
            const { service_id } = req.query;
            const userProfileData = await userService.getServiceManager(service_id);

            return res.json(userProfileData);
        } catch (error) {
            next(error);
        }
    }

    async getImage(req, res, next) {
        try {
            // Маршрут для получения картинок по URL
            const imageName = req.params.imageName;
            const imagePath = path.resolve(__dirname, '..', '..', 'sclients_api', 'assets', imageName);

            res.sendFile(imagePath, (err) => {
                if (err) {
                    console.error(err);
                    res.status(err.status).end();
                } else {
                    console.log('Файл отправлен успешно');
                }
            });
        } catch (error) {
            console.log(error);
        }
    }



}

module.exports = new UserController;
