import {deleteAsync} from "del";
import PackHandler from "./lib/pack-handler.mjs";

const PACK_DST_PATH  = "./module/packs";
const packHandler = new PackHandler();

function cleanupPackFiles() {
	return deleteAsync(PACK_DST_PATH);
}
export const clean = cleanupPackFiles;

function compilePacks() {
	return packHandler.pack();
}
export const compile = compilePacks;

function decompilePacks() {
	return packHandler.unpack();
}
export const decompile = decompilePacks;

