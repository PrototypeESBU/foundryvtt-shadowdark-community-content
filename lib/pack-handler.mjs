import {ClassicLevel} from "classic-level";
import {globSync} from "glob";
import fs, { readdirSync } from "fs";
import path from "path";

import Logger from "./logger.mjs";
import stringify from "json-stable-stringify-pretty";

export default class PackHandler {

	constructor() {
		this.destination = "./module/packs";
		this.source = "./data/packs";
	}

	async pack() {
		const isDataDirectory = this.source.endsWith(".db")
			&& fs.existsSync(this.source)
			&& fs.lstatSync(this.source).isDirectory();

		let dbDirectories = [this.source];
		if (!isDataDirectory) {
			dbDirectories = globSync(`${this.source}/*.db`);
		}

		for (const inputDbDirectory of dbDirectories) {
			const packFileName = path.basename(inputDbDirectory).replace(".db", "");

			if (!await fs.existsSync(this.destination)) {
				fs.mkdirSync(this.destination, {recursive: true});
			}

			const outputDbFile = path.join(this.destination, packFileName);

			Logger.info(`LevelDb::Pack ${inputDbDirectory} into ${outputDbFile}`);

			const dbFileExists = await fs.existsSync(outputDbFile)
				&& fs.lstatSync(outputDbFile).isFile();

			if (dbFileExists) {
				Logger.warn(`DB file ${outputDbFile} already exists and will be replaced`);
				fs.unlinkSync(outputDbFile);
			}

			const db = new ClassicLevel(outputDbFile, {keyEncoding: "utf8", valueEncoding: "json"});
			const batch = db.batch();

			const files = fs.readdirSync(inputDbDirectory);
			const seenKeys = new Set();
			let inserted = 0;
			for (const file of files) {
				const rawData = fs.readFileSync(path.join(inputDbDirectory, file));
				const dbEntry = JSON.parse(rawData);

				let key = null;
				if (dbEntry._key) {
					key = dbEntry._key;

					delete dbEntry._key;

					seenKeys.add(key);
				}

				if (key !== null) {
					batch.put(key, dbEntry);
				}
				else {
					batch.put(dbEntry);
				}
				inserted++;
			}

			for (const key of await db.keys().all()) {
				if (!seenKeys.has(key)) {
					batch.del(key);
					Logger.info(`Removed ${key}`);
				}
			}
			await batch.write();
			await db.close();

			Logger.info(`Inserted ${inserted}/${files.length} records into ${outputDbFile}`);
		}
	}

	async unpack() {
		const isDirectory = fs.existsSync(this.destination)
			&& fs.lstatSync(this.destination).isDirectory();

		const lockPath = path.join(this.destination, "LOCK");

		const isLevelDbDirectory = isDirectory && fs.existsSync(lockPath);
       
		let compendiumDirs = [this.destination];
      
		if (!isLevelDbDirectory) {
			compendiumDirs = readdirSync(this.destination, {withFileTypes: true})
				.filter(entry => entry.isDirectory())
				.map(entry => path.join(this.destination, entry.name));

			compendiumDirs = compendiumDirs.filter(entry => {
				return fs.existsSync(path.join(entry, "LOCK"));
			});
		}

		for (const compendiumDir of compendiumDirs) {
			const db = new ClassicLevel(
				compendiumDir,
				{
					keyEncoding: "utf8",
					valueEncoding: "json",
				}
			);
			const basename = path.basename(compendiumDir);

			const outputDir = path.join(this.source, `${basename}.db`);

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, {recursive: true});
			}

			for await (const [key, value] of db.iterator()) {
				const name = value.name
					? `${value.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}__${value._id}`
					: key;

				value._key = key;

				// Tidy up some junky top-level fields we don't want to store
				delete value._stats;
				delete value.ownership;
				delete value.flags;
				delete value.sort;

				const basefileName = `${outputDir}/${name}`;

                Logger.log(`Writing ${basefileName}.json`);

                let jsonData = stringify(value, {space: "\t", undef: true});
                jsonData += "\n";

                fs.writeFileSync(`${basefileName}.json`, jsonData);
				
			}

			await db.close();
		}
	}

	_isFileLocked(filepath) {
		try {
			// Try to open the file for writing
			const fd = fs.openSync(filepath, "w");

			// If the file was successfully opened, it is not locked
			fs.closeSync(fd);
			return false;
		}
		catch(error) {
			// If the file could not be opened, it is locked
			if (error.code === "EBUSY") {
				return true;
			}
			else {
				throw error;
			}
		}
	}

}
