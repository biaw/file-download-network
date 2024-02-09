import { useCallback, useState } from "react";
import type { FileStats } from "../../server/cdn/files/list";

export default function FileTree({ objects, setSelectedFile, folders = [] }: { objects: FileStats; setSelectedFile: ReturnType<typeof useState<string>>[1]; folders?: string[] }): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(!folders.length);
  const toggleIsExpanded = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  return <>
    {Boolean(folders.length) && <p onClick={toggleIsExpanded} className="hover:cursor-pointer">{`/${folders.join("/")}`}</p>}
    <ul className={` ${folders.length % 2 ? "bg-gray-600" : "bg-gray-500"}`}>
      {objects.map((obj, index) => <li key={index} className={`px-2 ${isExpanded ? "block" : "hidden"}`}>
        {obj.type === "file" ?
          <>
            <p onClick={() => setSelectedFile(folders.map(name => `${name}/`).join("") + obj.name)} className="hover:cursor-pointer">{obj.name}</p>
          </> :
          Boolean(obj.files.length) && <FileTree objects={obj.files} setSelectedFile={setSelectedFile} folders={[...folders, obj.name]} />}
        {/* eslint-disable-next-line @stylistic/jsx/jsx-closing-tag-location */}
      </li>)}
    </ul>
    {/* eslint-disable-next-line @stylistic/jsx/jsx-closing-tag-location */}
  </>;
}
