# Используем образ Node.js
FROM node:18

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /nodejs

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Открываем порт, который использует ваше API
EXPOSE 5001

# Команда для запуска API
CMD ["npm", "run", "dev"]