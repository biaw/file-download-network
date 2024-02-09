import crypto from "crypto";
import { createReadStream } from "fs";

process.on("message", (filePath: string) => {
  const hash = crypto.createHash("md5");

  const stream = createReadStream(filePath);
  stream.on("data", data => hash.update(data));
  stream.on("end", () => process.send!(hash.digest("hex")) && process.exit(0));
  stream.on("close", () => process.exit(1));
  stream.on("error", () => process.exit(1));
});
