import type { MetaFunction, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react/dist/components";
import { useState } from "react";
import type { FileStats, File } from "../../server/cdn/files/list";
import type envConfig from "../../server/config";
import FileTree from "../components/FileTree";

export const meta: MetaFunction = () => [
  { title: "Download server" },
  { name: "description", content: "github.com/biaw/file-download-network" },
];

export async function loader({ context: { config } }: { context: { config: typeof envConfig } }): Promise<TypedResponse<{
  files: FileStats;
  config: typeof envConfig;
}>> {
  const res = await fetch(`${config.cdn.urlGlobal ?? config.cdn.urlSpecific}/files.json`);
  if (res.status !== 200) return json({ files: [], config });
  return json({
    files: await res.json() as never,
    config,
  });
}

export default function Index(): JSX.Element {
  const { files, config } = useLoaderData<typeof loader>();
  const [selectedFile, setSelectedFile] = useState<string>();

  return (
    <div className="position-absolute flex h-screen w-screen xl:py-20">
      <div className="w-screen xl:m-auto xl:max-w-5xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="size-full bg-gray-500 p-6 xl:rounded-2xl">
            <h1 className="text-center text-3xl font-bold">{config.ui.title}</h1>
            <div className="my-6 h-px w-full bg-white" />
            <p>{config.ui.description}</p>
          </div>
          <div className="size-full bg-gray-500 p-6 xl:rounded-2xl">
            <h1 className="truncate text-center text-3xl font-bold">{selectedFile ?? "Select a file below"}</h1>
            <div className="my-6 h-px w-full bg-white" />
            {selectedFile ?
              <>
                {<p>Hash: <code>{getFileStats(selectedFile)!.hash ?? "Unavailable"}</code></p>}
                {<p>Size: <code>{humanFileSize(getFileStats(selectedFile)!.size)}</code></p>}
                <p className="w-full truncate"><a href={`${config.cdn.urlGlobal ?? config.cdn.urlSpecific}/${selectedFile}`} download className="w-full truncate text-nowrap text-blue-300 hover:text-blue-100">{config.cdn.urlGlobal ?? config.cdn.urlSpecific}/{selectedFile}</a></p>
                {config.cdn.all.filter(url => config.cdn.urlGlobal ?? url !== config.cdn.urlSpecific).map(url => <p key={url} className="w-full truncate"><a href={`${url}/${selectedFile}`} download className="w-full truncate text-nowrap text-blue-300 hover:text-blue-100">{url}/{selectedFile}</a></p>)}
              </> :
              <>
                {["hash", "size", ...config.cdn.all].map((_, index) => <p key={index} className="opacity-0">.</p>)}
              </>}
          </div>
        </div>
        <div className="mt-4 size-full bg-gray-500 p-6 xl:rounded-2xl">
          {files.length === 0 ? <div/> : <FileTree objects={files} setSelectedFile={setSelectedFile} />}
        </div>
      </div>
    </div>
  );

  function getFileStats(file: string, next?: FileStats): File | null {
    const parts = file.split("/");
    const current: FileStats = next ?? files;
    const obj = current.find(({ name }) => name === parts[0]);
    if (!obj) return null;
    if (obj.type === "file") return obj;
    return getFileStats(parts.slice(1).join("/"), obj.files);
  }
}

function humanFileSize(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return `${Number((size / 1024 ** i).toFixed(2))} ${["B", "kB", "MB", "GB", "TB"][i]}`;
}
