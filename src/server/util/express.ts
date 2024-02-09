import express from "express";
import morgan from "morgan";

export default function createExpressApp(port: number, numberOfProxies = 0): express.Express {
  const app = express();

  app.set("trust proxy", numberOfProxies);
  app.use(morgan(":remote-addr :method :url :status :res[content-length] - :response-time ms"));

  app.listen(port);
  return app;
}
