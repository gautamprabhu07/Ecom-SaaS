//Path: apps/recommendation-service/src/main.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import router from './routes/reccomendation.routes';
import { startRetrainJob } from './jobs/retrain.job';

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to reccomendation-service!' });
});

app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6010;
const server = app.listen(port, () => {
  console.log(`Recommendation service running at http://localhost:${port}/api`);
  startRetrainJob();
});
server.on('error', console.error);
