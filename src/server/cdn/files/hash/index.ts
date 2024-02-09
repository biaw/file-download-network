import type { ChildProcess } from "child_process";
import { fork } from "child_process";
import path from "path";

const currentlyHashing = new Map<string, { worker: ChildProcess; resolve(hash: string): void }>();

export default function getFileHash(filePath: string): Promise<string> {
  const current = currentlyHashing.get(filePath);

  const promise = new Promise<string>(resolve => {
    const worker = fork(path.join(__dirname, "./worker.js"), { stdio: "ignore" });
    worker.on("message", (hash: string) => {
      currentlyHashing.delete(filePath);
      resolve(hash);
    });
    worker.on("exit", code => {
      currentlyHashing.delete(filePath);
      if (code !== 0) void getFileHash(filePath).then(resolve);
    });
    worker.send(filePath);
    currentlyHashing.set(filePath, { worker, resolve });
  });

  if (current) {
    current.worker.kill();
    void promise.then(current.resolve);
  }

  return promise;
}
