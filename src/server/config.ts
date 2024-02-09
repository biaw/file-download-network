import path from "path";
import "dotenv/config";

if (!process.env["CDN_PORT"]) throw new Error("CDN_PORT is not set");
if (!process.env["CDN_URL"]) throw new Error("CDN_URL is not set");
if (process.env["UI_ENABLED"] === "true" && !process.env["UI_PORT"]) throw new Error("UI_PORT is not set");

export default {
  cdn: {
    isMaster: process.env["THIS_IS_MASTER"] === "true",
    masterUrl: process.env["THIS_IS_MASTER"] === "true" ? null : String(process.env["MASTER_URL"]),
    port: Number(process.env["CDN_PORT"]),
    urlSpecific: process.env["CDN_URL"],
    urlGlobal: process.env["CDN_GLOBAL_URL"],
    all: [process.env["CDN_URL"], ...(process.env["OTHER_CDNS"] ?? "").split(",")].filter((value, index, arr) => value && arr.indexOf(value) === index),
    fileDirectory: process.env["FILE_DIRECTORY"] ?? path.join(__dirname, "../../storage"),
    numberOfProxies: Number(process.env["NUMBER_OF_PROXIES"]) || 0,
  },
  ui: {
    enabled: process.env["UI_ENABLED"] === "true",
    port: Number(process.env["UI_PORT"]),
    numberOfProxies: Number(process.env["NUMBER_OF_PROXIES"]) || 0,
    title: process.env["UI_TITLE"] ?? "Download server",
    description: process.env["UI_DESCRIPTION"] ?? "Welcome to the download server.",
  },
} as const;
