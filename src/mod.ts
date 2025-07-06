import { jsonc } from "jsonc";
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { ILocations } from "@spt/models/spt/server/ILocations";

class UbreakableKeys implements IPostDBLoadMod {

    private readonly modConfig = jsonc.readSync(path.join(__dirname, '..', 'config', 'config.jsonc'));
    private readonly mod = jsonc.readSync(path.join(__dirname, '..', 'package.json'));

    public postDBLoad(container: DependencyContainer): void {
        // get database
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables: IDatabaseTables = databaseServer.getTables();
        const items = Object.values(tables.templates.items);
        const laboratory = tables.locations?.laboratory;

        // get logger
        const logger = container.resolve<ILogger>("WinstonLogger");

        // Logic
        for (const item in items) {
            const itemProps = items[item]._props;

            if (this.modConfig.enable_blacklist && this.modConfig.blacklisted_items.includes(items[item]._id))
                continue;

            if (items[item]._parent == BaseClasses.KEY_MECHANICAL) {
                itemProps.DiscardLimit = -1;

                if (this.modConfig.unbreakable_keys)
                    itemProps.MaximumNumberOfUsage = 0;

                if (this.modConfig.weightless_keys)
                    itemProps.Weight = 0.0;
            }

            if (items[item]._parent == BaseClasses.KEYCARD) {
                itemProps.DiscardLimit = -1;

                if (this.modConfig.unbreakable_keycards)
                    itemProps.MaximumNumberOfUsage = 0;

                if (this.modConfig.weightless_keycards)
                    itemProps.Weight = 0.0;
            }
        }

        // if TerraGroup Labs access keycard is not blacklisted or blacklist does not contain it
        // exclude it from the Labs access requirements
        if (!this.modConfig.enable_blacklist || !this.modConfig.blacklisted_items.includes("5c94bbff86f7747ee735c08f")) {
            // TODO: prevent labs access keycard removal upon raid start
        }

        // If Free Labs event is enabled, remove access keys from laboratory requirements
        if (this.modConfig.free_labs_event) {
            laboratory.base.AccessKeys = [];
            laboratory.base.AccessKeysPvE = [];
        }

        logger.log(`"[${this.mod.name}]" has been loaded.`, LogTextColor.CYAN);
    }
}

module.exports = { mod: new UbreakableKeys() };
