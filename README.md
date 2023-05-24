mClientApi тестовый проект
Проект: mClient


Требования
Node.js (версия 18+)
psql latest

Установка и запуск
Склонируйте репозиторий на ваше устройство:

Установите зависимости:
npm i

Заполните файл env необходимыми данными.
USERDB = "Имя пользователя базы"
HOST = "Адрес хоста"
DATABASE = "Имя базы"
PASSWORD = "Пароль от базы данных"
PORTDB = "Порт"

JWT_ACCESS = "секретный ключ для токена"
JWT_REFRESH = "секретный ключ для токена"

##данные от почты
SMTP_HOST = 
SMTP_PORT = 
SMTP_USER = 
SMTP_PASSWORD = 

## адрес сервера
API_URL = http://localhost:5001
##Адрес react приложения
CLIENT_URL = http://localhost:3000

Запустите приложение:
npm run dev

Авторы
Авторы Leonid Fedorov (https://github.com/flyonch)
