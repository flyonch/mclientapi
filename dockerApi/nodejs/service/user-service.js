const db = require('../pgdb/pgHelp');
const bcrypt = require('bcrypt')
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dto/user-dto');
const ApiError = require('../exceptions/api-error');
const moment = require('moment');
const { format } = require('date-fns');


//TODO: разгранчить по по разным файлам сервисам //




class UserService {

    async registration(email, phone, password) {
        const candidate = await db.query(`SELECT * from users WHERE user_email = '${email}'`)
        if (candidate.rowCount != 0) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`)
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();
        try {
            // Отправка письма активации
            console.log("URL активации", `${process.env.API_URL}/api/activate/${activationLink}`)

            //TODO: добавить таймаут отправки письма если не удалось попадать в error и отправлять 
            // сейчас чет яндекс-почта не работает вывожу пока в консоль ссылку //
            // await mailService.sendActiovationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

            // Создание пользователя в базе данных
            let userSql = `INSERT INTO users (user_email, user_password, isActivated, activationLink, user_phone, created_at, updated_at)
                VALUES ('${email}', '${hashPassword}', 'N', '${activationLink}', '${phone}', NOW(), NOW());`;

            const user = await db.query(userSql);

            // Возвращаем успешный результат

        } catch (error) {
            // Обработка ошибок
            throw ApiError.BadRequest(`Письмо не было отправлено на ${email}`)

        }


        const constGetUser = await db.query(`SELECT * from users WHERE user_email = '${email}'`)

        const user_one = constGetUser.rows[0];
        const tokens = tokenService.generateTokens({
            user_id: user_one.user_id,
            email: user_one.email,
            userrole: user_one.userrole,
            isactivated: user_one.isactivated
        });
        await tokenService.saveToken(user_one.user_id, tokens.refreshToken, user_one.isactivated);

        return {
            ...tokens,
            userId: user_one.user_id,
            user_fullname: user_one.user_fullname || null,
            email: user_one.user_email,
            userrole: user_one.userrole,
            isactivated: user_one.isactivated
        }
    }

    async activate(activationLink) {
        const user = await db.query(`
            select * from users where activationlink = '${activationLink}' ; 
        `)
        if (!user) {
            throw ApiError.BadRequest(`Некорректная ссылка для актиации  ${activationLink}`)

        }
        await db.query(`
            UPDATE users SET isactivated=true where activationlink = '${activationLink}';
        `)
    }


    //LOGIN
    //TODO: сделать отдельный логин для менеджеров/админов или совместить //

    async login(email, password) {
        const user = await db.query(`SELECT * from users WHERE user_email = '${email}'`)
        if (user.rowCount === 0) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} не найден!`)
        }

        //сравиниваем хеши
        const isPassEquals = await bcrypt.compare(password, user.rows[0].user_password);
        if (!isPassEquals) {
            throw ApiError.BadRequest(`Неверный пароль`);
        }

        const constGetUser = await db.query(`SELECT * from users WHERE user_email = '${email}'`)
        const user_one = constGetUser.rows[0];
        console.log("user_one", user_one);

        const tokens = tokenService.generateTokens({
            user_id: user_one.user_id,
            email: user_one.email,
            userrole: user_one.userrole,
            isactivated: user_one.isactivated
        });
        await tokenService.saveToken(user_one.user_id, tokens.refreshToken, user_one.isactivated);

        return {
            ...tokens,
            userId: user_one.user_id,
            email: user_one.user_email,
            isactivated: user_one.isactivated,
            user_fullname: user_one.user_fullname || null,
            user_phone: user_one.phone,
            userrole: user_one.userrole || null,
            avatarurl: user_one.atarurl || null,
            isactivated: user_one.isactivated
        }
    }


    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        console.log('Refreshing token', refreshToken);
        try {
            if (!refreshToken) {
                throw ApiError.UnAuthorizedError();
            }

            const userData = tokenService.validateRefreshToken(refreshToken);
            const tokenDB = await tokenService.findToken(refreshToken);

            if (!tokenDB || !userData) {
                throw ApiError.UnAuthorizedError();
            }

            const constGetUser = await db.query(`SELECT * from users WHERE user_id = '${tokenDB.rows[0].user_id}'`);
            const user_one = constGetUser.rows[0];

            if (!user_one) {
                throw ApiError.UnAuthorizedError();
            }

            console.log("user one", user_one.user_id)

            const tokens = tokenService.generateTokens({
                user_id: user_one.user_id,
                email: user_one.email,
                isactivated: user_one.isactivated
            });

            let result = await tokenService.saveToken(user_one.user_id, tokens.refreshToken, user_one.isactivated);

            return {
                ...tokens,
                userId: user_one.user_id,
                email: user_one.user_email,
                isactivated: user_one.isactivated,
                user_fullname: user_one.fullname || null,
                user_phone: user_one.phone,
                userrole: user_one.userrole || null,
                avatarurl: user_one.atarurl || null,
                isactivated: user_one.isactivated
            }
        } catch (error) {
            console.log("refresh ", error);
            throw error; // Возможно, нужно добавить throw error для дальнейшей обработки ошибки
        }
    }


    async getAllUsers() {
        const users = await db.query(`SELECT * from users;`);
        return users
    }

    // для авторизованых пользователей

    //получить время записи для определеного менеджера 
    //если ничего не передаем в body получаем записи всех менеджеров 
    async getFreeTimeManager(user_id) {

        let query

        if (user_id) {
            query = `
            select u.user_fullname , work_date, work_hours_start, work_hours_end from work_hours wh 
            inner join users u on wh.manager_id  = u.user_id 
            where  u.user_id  = ${user_id}
            AND (wh.busy = false OR wh.busy IS NULL);
            `
        } else {
            query = `
            select u.user_fullname , work_date, work_hours_start from work_hours wh 
            inner join users u on wh.manager_id  = u.user_id 
        `
        }


        const freeTimeManager = await db.query(query)
        console.log("freeTime", freeTimeManager.rows[0])
        return freeTimeManager

    }


    //создать запись на прием пользователю/менеджеру
    async createAppointment(user_id,manager_id, service_id, date_time_service, selectTime) {

        console.log("createAppointment debug")
        console.log(selectTime)

        const date = new Date(date_time_service);
        const formattedDate = format(date, 'yyyy-MM-dd');

        try {
            // Проверяем, что такой пользователь и менеджер существуют
            const queryCheckUser = `
                SELECT user_id FROM users WHERE user_id = $1;
            `;
            const resultCheckUser = await db.query(queryCheckUser, [user_id]);

            if (resultCheckUser.rowCount === 0) {
                throw ApiError.BadRequest(`Пользователь с id=${user_id} не найден`);
            }


            // Проверяем, есть ли уже запись на данное время у данного менеджера

            const queryCheckConflict = `         
                select count(*)
                FROM users u
                LEFT JOIN work_hours wh ON u.user_id = wh.manager_id 
                WHERE u.user_id = ${manager_id} 
                    AND wh.work_date = '${formattedDate}'
                    AND wh.work_hours_start = '${selectTime}'
                    AND wh.busy = true;
            `;
            const resultConflict = await db.query(queryCheckConflict);

            if (resultConflict.rows[0].count > 0) {
                throw ApiError.BadRequest('К сожалению, данное время уже занято');
            }

            // Проверяем, свободно ли данное время у данного менеджера
            const queryCheckFree = `
                SELECT COUNT(*) FROM work_hours
                WHERE manager_id = $1 AND work_date = $2 AND work_hours_start = $3 AND busy = false;
            `;

            const isoDateString = date_time_service;
            const date = isoDateString.split('T')[0];
            const time = isoDateString.split('T')[1].slice(0, -5);

            const resultCheckFree = await db.query(queryCheckFree, [manager_id, date, time]);

            if (resultCheckFree.rows[0].count === 0) {
                throw ApiError.BadRequest('К сожалению, данное время не доступно');
            }

            // Помечаем выбранный слот как занятый


            //получаем интервал работы сервиса
            let selectInterval = `
                SELECT duration FROM services WHERE service_id = $1;
            `

            let resultServiceDuration = await db.query(selectInterval, [service_id])
            const serviceDuration = resultServiceDuration.rows[0].duration;
            const durationSeconds = moment.duration(serviceDuration).asSeconds();
            const durationFormatted = moment.utc(durationSeconds * 1000).format('HH:mm:ss');


            const timeisNeed = moment(time, 'HH:mm:ss');
            const duration = moment.duration(durationFormatted);
            const endTime = timeisNeed.add(duration);
            const endTimeInterval = endTime.format('HH:mm:ss');


            const querySetBusy = `                
                UPDATE work_hours
                SET busy = true
                WHERE manager_id = $1 AND work_date = $2
                AND work_hours_start = $3;
            `;
            let resBusy = await db.query(querySetBusy, [manager_id, formattedDate, selectTime]);
            console.log("RES BUSY", manager_id,formattedDate,time);
            console.log("RES BUSY", resBusy);

            // Создаем новую запись
            const queryInsert = `
                INSERT INTO appointments (appointment_user_id, appointment_manager_id, service_id, date_time_service, time_servce)
                VALUES ($1, $2, $3, $4, $5);
            `;
            const res = await db.query(queryInsert, [user_id, manager_id, service_id, date_time_service, selectTime]);

            return { "message": "Запись на прием успешно создана" }
        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }



    //просмотр записей на прием у определенного пользователя 
    async showAppointmentUser(user_id) {
        try {
            const query = `
                SELECT 
                    u.user_fullname as user_name ,
                    um.user_fullname as manager_name,
                    s.name_service ,
                    s.price,
                    s.duration,
                    a.date_time_service,
                    a.time_servce,
                    a.appointment_id 
                FROM appointments a
                JOIN users u ON u.user_id = a.appointment_user_id
                JOIN users um ON um.user_id = a.appointment_manager_id
                JOIN services s ON s.service_id = a.service_id
                WHERE u.user_id = $1; 
            `

            const result = await db.query(query, [user_id]
                )
                console.log(result)
            return result.rows
        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }

    // отмена записи на прием по user_id и appointment_id
    async updateStatusAppointment(user_id, appointment_id, status) {
        try {

            const query = `
                UPDATE appointments AS a
                SET canceled = $1 
                WHERE a.appointment_user_id  = $2 
                AND a.appointment_id = $3;
            `

            const res = await db.query(
                query,
                [status, user_id, appointment_id]
            );

            if (res.rowCount === 0) {
                throw ApiError.BadRequest('Нет такой записи / ничего не обновлено')
            }

            return {"CancelStatusAppoint": `${status}`};
        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }

    //получение списка сервисов если не передаем тип(категорию) то получаем полный перечень 
    async getAllTypeServices(type_service) {
        try {
            let query

            if (type_service) {
                query = `select * from type_services where type_services_id = ${type_service}`
            } else {
                query = 'select * from type_services '
            }

            const result = await db.query(query)
            console.log(query)
            return result.rows

        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }

    async getAllServices(type_service) {
        try {
            let query

            if (type_service) {
                query = `select * from services where type_services_id = ${type_service}`
            } else {
                query = 'select * from services '
            }

            const result = await db.query(query)
            console.log(query)
            return result.rows

        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }

    async getServiceManager(service_id) {
        try {
            let query = `
            SELECT users.user_id, users.user_fullname
            FROM users
            JOIN manager_services ON users.user_id = manager_services.user_id 
            WHERE manager_services.service_id = ${service_id};
            `

            const result = await db.query(query)
            console.log(query)
            return result.rows

        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }

    //получение информации о пользователе
    async showUserProfile(user_id) {
        try {
            const query = `
                select 
                    user_id,
                    user_fullname, 
                    user_phone, 
                    user_email, 
                    avatarurl, 
                    isactivated, 
                    userrole, 
                    created_at, 
                    updated_at  
                from users u 
                where user_id = $1;
            `

            const result = await db.query(query, [user_id])

            return result.rows[0]

        } catch (error) {
            console.log(error);
            throw ApiError.BadRequest(error);
        }
    }



    // только для админов/менеджеров
    async createManager() {

    }

    async deletedManager() {

    }

    async createService() {

    }

    async deleteService() {

    }

    async createManagerService() {

    }

    async deleteManagerService() {

    }



}

module.exports = new UserService();
