/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
//path: apps/api-gateway/src/main.ts
import express from 'express';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '@packages/libs/redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import initializeSiteConfig from './libs/initializeSiteConfig';

const app = express();

app.use(cors({
origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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
  // counters live in Redis so limits survive gateway restarts and are shared across instances
  store: new RedisStore({
    prefix: 'rl:gateway:',
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
  }),
  // if Redis is unreachable, let requests through rather than failing every request
  passOnStoreError: true,
  max: (req:any)=> (req.user ? 1000 : 100), // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message : {error: "Too many requests, please try again later."},
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // enable the `X-RateLimit-*` headers
  keyGenerator: (req:any) => ipKeyGenerator(req.ip), // keyed by client IP; IPv6 clients are grouped by /56 subnet so they can't dodge limits by rotating addresses
});

app.use(limiter);

// app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use("/recommendation", proxy("http://localhost:6010"));
app.use("/seller", proxy("http://localhost:6009"));
app.use("/chatting", proxy("http://localhost:6006"));
app.use("/admin", proxy("http://localhost:6005"));
app.use("/order", proxy("http://localhost:6004"));
app.use("/product", proxy("http://localhost:6002"));
app.use("/", proxy("http://localhost:6001"));


const port = process.env.PORT || 8080;
const server = app.listen(port, () => {

  try
  {
    initializeSiteConfig();
    console.log("Site configuration initialized successfully.");
  }
  catch(error)
  {
    console.error("Failed to initialize site configuration.");
  }
});
server.on('error', console.error);
