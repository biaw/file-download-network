import { existsSync, statSync, watch } from "fs";
import { readdir, stat } from "fs/promises";
import path, { join } from "path";
import config from "../../config";
import getFileHash from "./hash";
import { currentlyDownloading } from "./syncWithMaster";

export interface FullFile<HashComplete extends boolean = boolean> {
  name: string;
  size: number;
  hash: HashComplete extends false ? Promise<string> : string;
}

export const fileList = new Map<string, FullFile>();
const fileDirectoryFullPath = join(config.cdn.fileDirectory, ".");

export function updateFile(filePath: string, force = false): void {
  const fullPath = filePath.startsWith(fileDirectoryFullPath) ? filePath : join(fileDirectoryFullPath, filePath);
  const relativePath = fullPath.replace(`${fileDirectoryFullPath}/`, "");
  if (!force && currentlyDownloading.has(relativePath)) return void null;
  if (!existsSync(fullPath)) {
    fileList.delete(relativePath);
    console.log("File removed", relativePath);
    return void null;
  }

  const file = statSync(fullPath);
  const fullFile: FullFile<false> = {
    name: filePath.split("/").pop()!,
    size: file.size,
    hash: getFileHash(fullPath),
  };

  fileList.set(relativePath, fullFile);
  console.log("File", relativePath, "updated");

  void fullFile.hash.then(hash => {
    // change the same object
    (fullFile as unknown as FullFile<true>).hash = hash;
    console.log("Hash for file", relativePath, "updated to", hash);
  });


  return void fullFile;
}

export function updateDirectory(directoryPath: string): void {
  if (!existsSync(directoryPath)) {
    return Array.from(fileList.keys())
      .filter(file => file.startsWith(directoryPath))
      .forEach(() => { fileList.delete(directoryPath); });
  }

  void readdir(directoryPath, { withFileTypes: true }).then(dirents => {
    dirents.forEach(dirent => {
      const fullPath = path.join(directoryPath, dirent.name);
      if (dirent.isFile()) updateFile(fullPath);
      if (dirent.isDirectory()) updateDirectory(fullPath);
    });
  });

  // having multiple watches is fine, the system handles it well
  watch(directoryPath, (_, fileName) => {
    if (!fileName) return updateDirectory(directoryPath);
    const fullPath = path.join(directoryPath, fileName);
    void stat(fullPath).then(stats => {
      if (stats.isDirectory()) return updateDirectory(fullPath);
      if (stats.isFile()) return updateFile(fullPath);
    })
      // if the file or folder is removed, let's just ... update both if it's a file or a directory
      .catch(() => {
        updateDirectory(fullPath);
        updateFile(fullPath);
      });
  });
}

export interface Directory { type: "directory"; name: string; files: FileStats }
export interface File { type: "file"; name: string; size: number; hash: string | null }
export type FileStats = Array<Directory | File>;

export function generateListOfFiles(): FileStats {
  const files: FileStats = [];

  for (const filePath of Array.from(fileList.keys()).sort()) {
    const file = fileList.get(filePath)!;
    const parts = filePath.split("/");

    let current: Directory | null = null;
    for (const i in parts) {
      const part = parts[i]!;
      const isDirectory = Number(i) !== parts.length - 1;

      if (isDirectory) {
        const existingDirectory: Directory | null =
          (current && current.files.find(obj => obj.type === "directory" && obj.name === part) as Directory | null) ??
          (files.length ? files.find(obj => obj.type === "directory" && obj.name === part) as Directory | null : null);

        const directory: Directory = existingDirectory ?? {
          type: "directory",
          name: part,
          files: [],
        };

        if (existingDirectory !== directory) {
          if (current) current.files.push(directory);
          else files.push(directory);
        }
        current = directory;
      } else {
        const fileDetails: File = {
          type: "file",
          name: part,
          size: file.size,
          hash: file.hash instanceof Promise ? null : file.hash,
        };

        if (current) current.files.push(fileDetails);
        else files.push(fileDetails);
      }
    }
  }

  return sortFileTree(files);
}

function sortFileTree(files: FileStats): FileStats {
  return files
    .sort((a, b) => {
      if (a.type === "directory" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    })
    .map(obj => {
      if (obj.type === "directory") {
        return {
          ...obj,
          files: sortFileTree(obj.files),
        };
      }
      return obj;
    })
    .filter(obj => obj.type === "file" || obj.files.length > 0);
}
