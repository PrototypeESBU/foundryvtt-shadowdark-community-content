import fs from "fs";
import { marked } from "marked";

import stringify from "json-stable-stringify-pretty";

const NOTES_SRC_PATH = "./RELEASE_NOTES.md";
const JOURNAL_JSON =
	"./data/packs/journals.db/release_notes__0hRI4ofgCntXMWAg.json";

function compileReleaseNotes(cb) {
	const source = fs.readFileSync(NOTES_SRC_PATH, "utf8");
	const html = marked.parse(source);

	const journalJson = fs.readFileSync(JOURNAL_JSON, "utf8");
	const journal = JSON.parse(journalJson);
	journal.text.content = `${html}`;

	let jsonData = stringify(journal, {space: "\t", undef: true});
	jsonData += "\n";

	fs.writeFileSync(JOURNAL_JSON, jsonData);
	cb();
}
export const compile = compileReleaseNotes;
