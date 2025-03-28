# Aggregation Service

## Stack
- Node.js + Express
- TypeScript
- TypeORM (with SQLite)
- Axios
- node-cron (for scheduled syncing)

## How to run the project
- Clone the repository
- Run ```npm install```
- Run ```npm run start```

## Endpoints
- ```GET /mock/transactions```
- ```GET /users/:userId/aggregation```
- ```GET /users/payouts```

## To do
- Add retry mechanism for failed jobs (started, but not finished)
- Improve logging and monitoring
