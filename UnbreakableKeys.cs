using System.Reflection;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Items;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace UnbreakableKeys;

public record ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "eu.thescrewcollab.unbreakablekeys";
    public string Name { get; init; } = "UnbreakableKeys";
    public string Author { get; init; } = "Toha3673";
    public List<string>? Contributors { get; init; } = ["Super", "ScrewTSW (4.1.2 port)"];
    public SemanticVersioning.Version Version { get; init; } = new("1.3.0");
    public SemanticVersioning.Range SptVersion { get; init; } = new("~4.1.0");
    public bool HasPrepatcher { get; init; } = false;
    public List<string>? Incompatibilities { get; init; }
    public Dictionary<string, SemanticVersioning.Range>? ModDependencies { get; init; }
    public string? Url { get; init; } = "https://github.com/ScrewTSW/unbreakable-keys";
    public string License { get; init; } = "CC BY-NC-SA 3.0";
}

[Injectable(TypePriority = OnLoadOrder.PostLoad + 1)]
public class UnbreakableKeys(
    ISptLogger<UnbreakableKeys> logger,
    ModHelper modHelper,
    TemplateTable templateTable,
    ItemHelper itemHelper) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken)
    {
        var pathToMod = modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());
        var config = modHelper.GetJsonDataFromFile<ModConfig>(pathToMod, "config.jsonc");

        var blacklist = new HashSet<string>(config.KeysBlacklist ?? []);
        var markedKeys = new HashSet<string>(config.MarkedKeys ?? []);
        var coloredKeycards = new HashSet<string>(config.ColoredKeycards ?? []);

        int keysModified = 0;
        int keycardsModified = 0;

        foreach (var (tpl, item) in templateTable.Items)
        {
            var tplStr = tpl.ToString()!;
            if (blacklist.Contains(tplStr))
                continue;

            if (itemHelper.IsOfBaseclass(tpl, BaseClasses.KEY_MECHANICAL))
            {
                bool isMarked = markedKeys.Contains(tplStr);
                bool shouldApply = isMarked ? config.UnbreakableMarkedKeys : config.UnbreakableKeys;

                if (shouldApply && item.Properties != null)
                {
                    item.Properties.MaximumNumberOfUsage = 0;
                    item.Properties.DiscardLimit = -1;
                    keysModified++;
                }
            }
            else if (itemHelper.IsOfBaseclass(tpl, BaseClasses.KEYCARD))
            {
                bool isColored = coloredKeycards.Contains(tplStr);
                bool shouldApply = isColored ? config.UnbreakableColoredKeycards : config.UnbreakableKeycards;

                if (shouldApply && item.Properties != null)
                {
                    item.Properties.MaximumNumberOfUsage = 0;
                    item.Properties.DiscardLimit = -1;
                    keycardsModified++;
                }
            }
        }

        logger.Info($"[UnbreakableKeys] Modified {keysModified} keys and {keycardsModified} keycards");
        return Task.CompletedTask;
    }
}

public class ModConfig
{
    public bool UnbreakableKeys { get; set; }
    public bool UnbreakableMarkedKeys { get; set; }
    public List<string>? MarkedKeys { get; set; }
    public bool UnbreakableKeycards { get; set; }
    public bool UnbreakableColoredKeycards { get; set; }
    public List<string>? ColoredKeycards { get; set; }
    public List<string>? KeysBlacklist { get; set; }
}
