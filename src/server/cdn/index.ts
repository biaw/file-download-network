import fs from "fs";
import path from "path";
import config from "../config";
import createExpressApp from "../util/express";
import { fileList, generateListOfFiles } from "./files/list";
import syncWithMaster from "./files/syncWithMaster";

export default function createCdnServer(): void {
  const cdnApp = createExpressApp(config.cdn.port, config.cdn.numberOfProxies);

  cdnApp.get("/ping", (_, res) => res.sendStatus(200));
  cdnApp.get("/files.json", (_, res) => res.json(generateListOfFiles()));

  if (config.cdn.isMaster) {
    cdnApp.get("/master_files.json", (_, res) => {
      if (Array.from(fileList.values()).some(file => file.hash instanceof Promise)) return res.sendStatus(503);
      return res.json(Object.fromEntries(fileList.entries()));
    });
  } else void syncWithMaster();

  cdnApp.get("*", (_, res) => {
    const file = path.join(config.cdn.fileDirectory, decodeURIComponent(res.req.path));
    if (file.startsWith(config.cdn.fileDirectory) && fs.existsSync(file)) res.download(file);
    else res.sendStatus(404);
  });
}
