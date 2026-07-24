//Path: apps/seller-service/src/main.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/seller.routes";

const app = express();

app.use(
   cors({
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true,
   })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
   res.send({ message: "Welcome to seller-service!" });
});

app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6009;
const server = app.listen(port, () => {
   console.log(`Seller service running at http://localhost:${port}/api`);
});
server.on("error", console.error);