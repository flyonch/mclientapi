const nodemailer = require('nodemailer');

class MailSerivice {

    constructor() {

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true, // если используется SSL
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
        })
    };

    async sendActiovationMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: 'Actiovations account email' + process.env.API_URL, 
            text: '',
            html:
            `
            <div>
                <h1>Для активации перейдите по ссылке</h1>
                <a href="${link}">${link}</a>
            </div>
            `
        })
    }
}

module.exports = new MailSerivice();