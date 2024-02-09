import createCdnServer from "./cdn";
import { updateDirectory } from "./cdn/files/list";
import config from "./config";
import createUiServer from "./ui";

// cdn
createCdnServer();
updateDirectory(config.cdn.fileDirectory);

// ui
if (config.ui.enabled) createUiServer();
