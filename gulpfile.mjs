import fs from "fs";
import path from "node:path";
import {deleteAsync} from "del";
import { marked } from "marked";
import stringify from "json-stable-stringify-pretty";
import Logger from "./lib/logger.mjs";
import PackHandler from "./lib/pack-handler.mjs";

/********************/
/*      Config      */
/********************/
const PACKAGE_ID = "shadowdark-community-content";
const MODULE_SOURCE_PATH = "./module";
const PACK_DST_PATH  = "./module/packs";
const NOTES_SRC_PATH = "./RELEASE_NOTES.md";
const JOURNAL_JSON = "./data/packs/journals.db/release_notes__0hRI4ofgCntXMWAg.json";

const packHandler = new PackHandler();


/********************/
/*      BUILD       */
/********************/
export async function compile() {
    return packHandler.pack();
}

/********************/
/*      EXPORT      */
/********************/
export async function decompile() {
    return packHandler.unpack();
}

/********************/
/*      CLEAN       */
/********************/
export async function clean() {
    return deleteAsync(PACK_DST_PATH);
}

/********************/
/*      LINK        */
/********************/
export async function link() {
    const args = process.argv.splice(3, process.argv.length - 3);
    if (args.length !== 2 || args[0] !== "--user-data-path") {
        Logger.error("ERROR: Missing --user-data-path Argument");
        return;
    }

    const dataPath = args[1];
    if (!fs.existsSync(dataPath)){
        Logger.error("ERROR: User data path not found");
        return;
    }

    const linkFile = `${dataPath}/Data/modules/${PACKAGE_ID}`;
    if (fs.existsSync(linkFile)){
        Logger.error("ERROR: module directory already exists. Uninstall module and try again.");
        return;
    }

    fs.symlink(path.resolve(MODULE_SOURCE_PATH), linkFile, "dir", (err) => {
        if (err) 
            Logger.error("ERROR: failed to link");
        else
            Logger.info(`Linked ${path.resolve(MODULE_SOURCE_PATH)} folder to ${linkFile}.`);
    });
}

/********************/
/*      NOTES       */
/********************/
export async function compileReleaseNotes() {
	const source = fs.readFileSync(NOTES_SRC_PATH, "utf8");
	const html = marked.parse(source);

	const journalJson = fs.readFileSync(JOURNAL_JSON, "utf8");
	const journal = JSON.parse(journalJson);
	journal.text.content = `${html}`;

	let jsonData = stringify(journal, {space: "\t", undef: true});
	jsonData += "\n";

	fs.writeFileSync(JOURNAL_JSON, jsonData);
}