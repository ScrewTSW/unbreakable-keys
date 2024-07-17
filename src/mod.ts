import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";

class UbreakableKeys implements IPostDBLoadMod 
{

    private modConfig = require("../config/config.json");
    private mod = require("../package.json");

    private color = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
    private baseClasses = require("C:/snapshot/project/obj/models/enums/BaseClasses");

    public postDBLoad(container: DependencyContainer): void 
    {

        const config = this.modConfig
        const color = this.color.LogTextColor
        const baseClasses = this.baseClasses.BaseClasses

        // get database
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables: IDatabaseTables = databaseServer.getTables();
        const items = Object.values(tables.templates.items);
    
        // get logger
        const logger = container.resolve<ILogger>("WinstonLogger");

        // Logic
        for (const item in items) 
        {
            const itemProps = items[item]._props;

            if (config.enable_blacklist && config.blacklisted_keys.includes(items[item]._id))
                continue;

            if (items[item]._parent == baseClasses.KEY_MECHANICAL) 
            {
                itemProps.DiscardLimit = -1;

                if (config.unbreakable_keys) 
                    itemProps.MaximumNumberOfUsage = 0;

                if (config.weightless_keys) 
                    itemProps.Weight = 0.0;
            }

            if (items[item]._parent == baseClasses.KEYCARD) 
            {
                itemProps.DiscardLimit = -1;

                if (config.unbreakable_keycards) 
                    itemProps.MaximumNumberOfUsage = 0;

                if (config.weightless_keycards) 
                    itemProps.Weight = 0.0;
            }
        }

        logger.log(`"${this.mod.name}" has been loaded.`, color.CYAN)
    }
}

module.exports = { mod: new UbreakableKeys() };
