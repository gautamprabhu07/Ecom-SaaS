/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as path from 'path';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
origin: ["http://localhost:3000"],
allowedHeaders: ["Authorization", "Content-Type"],
credentials: true
}));


app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express. urlencoded( { limit: "100mb", extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);

const limiter=rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req:any)=> (req.user ? 1000 : 100), // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message : {error: "Too many requests, please try again later."},
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // enable the `X-RateLimit-*` headers
  keyGenerator: (req:any) => req.ip, // Use user ID as key if authenticated, otherwise use IP address
});

app.use(limiter);

// app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
