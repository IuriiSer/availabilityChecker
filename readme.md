# Stack
- TypeScript
- Prisma

# Init project

# in terminal
1. npm install
2. change .envTamplate to -> .env and change values to yours
3. npm run init:db
    -> create and seed db
3. - OR
   - npm run dev 
      -> run dev mode with nodemon
   - npm run start
      -> build app and run it

# Пояснение к заданию
Реализован независимые механизмы 
- Логирования, LogService, 
- Получению url для проверки, CheckService,
- Работы с csv таблицей, CsvService,
- Обработчика url, UrlService,

## Особенности 
Сервисы LogService, CheckService, CsvService имеют собственный стек заданий и работают пока они есть. Все задания выполняются асинхронно
Сервис UrlService получает ссылки без пагинации, обрабатывает их асинхронно
