import path from "path";
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import config from "../config.js";
import createExpressApp from "../util/express.js";

export default function createUiServer(): void {
  // @ts-expect-error - the import will work when the server is built
  void import("../../index.js").then((build: never) => {
    const uiApp = createExpressApp(config.ui.port, config.ui.numberOfProxies);

    uiApp.use(express.static(path.join(__dirname, "../../public")));

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    uiApp.all("*", createRequestHandler({ build, getLoadContext: () => ({ config }) }));
  });
}
