Hooks.once("init", () => {
	game.settings.register("shadowdark-community-content", "lastVersion", {
		name: "shadowdark-community-content.lastVersion",
		default: "",
		type: String,
	});
});

Hooks.on("ready", async () => {
    // display patch notes message
    if (game.user.isGM) {
        const lastVersion = game.settings.get("shadowdark-community-content", "lastVersion");
        const currentVersion = game.modules.get("shadowdark-community-content").version;

        if (lastVersion !== currentVersion) {
            Hotbar.toggleDocumentSheet("Compendium.shadowdark-community-content.journals.JournalEntry.jyxBG9jxQulZd33k");
            game.settings.set("shadowdark-community-content", "lastVersion", currentVersion);
        }
    }
});