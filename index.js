require('dotenv').config();
const express = require('express');
const db = require('./pgdb/pgHelp');
const cors = require('cors');
const router = require('./router/index');
const cookieParser = require('cookie-parser');
const app = express();
const errorMiddleware = require('./middlewares/error-middleware');
const path = require('path');



const PORT = 5001;

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api', router);



//обработка ошибок
app.use(errorMiddleware);

const start = async () => {
    try {
        app.listen(PORT, () => console.log('listening on port ' + PORT));
        db.connect();
    } catch (error) {
        console.log(error);
    }
}
start()



