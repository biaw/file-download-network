import { createWriteStream, mkdirSync } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import { WritableStream } from "stream/web";
import config from "../../config";
import type { FullFile } from "./list";
import { updateFile, fileList } from "./list";

export const currentlyDownloading = new Set<string>();

export default async function syncWithMaster(): Promise<void> {
  const url = new URL(config.cdn.masterUrl!);
  const request = await fetch(new URL("/master_files.json", url)).catch(() => null);
  if (request?.status !== 200) {
    setTimeout(() => void syncWithMaster(), 1000 * 60 * 1);
    return console.log("Master server is busy, will try again later");
  }

  const files = await request.json() as Record<string, FullFile<true>>;

  // check if something is removed
  for (const filePath of Array.from(fileList.keys())) {
    if (!files[filePath]) {
      void unlink(join(config.cdn.fileDirectory, filePath)).then(() => updateFile(filePath));
    }
  }

  // check if something is new or updated
  for (const filePath of Object.keys(files)) {
    const file = files[filePath]!;
    const localFile = fileList.get(filePath);

    if (!localFile || await localFile.hash !== file.hash) await downloadFile(filePath).catch();
  }

  setTimeout(() => void syncWithMaster(), 1000 * 60 * 5);
}

function downloadFile(filePath: string): Promise<void> {
  currentlyDownloading.add(filePath);
  console.log("Downloading file", filePath, "from master server");
  const promise = new Promise<void>((resolve, reject) => {
    const url = new URL(config.cdn.masterUrl!);
    url.pathname = filePath;

    void fetch(url.toString()).then(res => {
      if (!res.ok) reject(new Error(`Failed to download file ${filePath}`));

      mkdirSync(
        join(config.cdn.fileDirectory, filePath)
          .split("/")
          .slice(0, -1)
          .join("/"),
        { recursive: true },
      );

      const file = createWriteStream(join(config.cdn.fileDirectory, filePath), { });

      void res.body!.pipeTo(new WritableStream({
        write(chunk) { file.write(chunk); },
        close() {
          file.end();
          resolve();
          updateFile(filePath, true);
        },
        abort(error) {
          file.destroy(error as Error);
          reject(error);
        },
      }));
    });
  });

  void promise.finally(() => currentlyDownloading.delete(filePath));
  return promise;
}
