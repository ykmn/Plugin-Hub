# Plugin Hub

> English translation in progress...

## Explanation of Plugin Repository Directory

```
Plugin Hub
└─ plugins          // Plugin directory
   ├─ Generic       // Directory for generic plugins
   ├─ GFC           // Directory for GUI.for.Clash plugins
   ├─ GFS           // Directory for GUI.for.SingBox plugins
   ├─ generic.json  // Plugin index file
   ├─ gfc.json      // Plugin index file
   └─ gfs.json      // Plugin index file
```

## How to Use

Simply add following links in the plugin center of the [client](https://github.com/GUI-for-Cores/GUI.for.SingBox):

**General:**
```
https://raw.githubusercontent.com/ykmn/Plugin-Hub/main/plugins/generic.json
```

**GUI.for.Singbox:**
```
https://raw.githubusercontent.com/ykmn/Plugin-Hub/main/plugins/gfs.json
```

For detailed instructions, please visit: [Plugin System Usage Tutorial](https://gui-for-cores.github.io/guide/04-plugins)

## How to Contribute Plugins

Submit a pull request (PR).

## Plugin Writing Standards

1. Code should be formatted, easy to read, and not encrypted.

2. Perform IO operations under the program's data directory, avoiding access to the user's private directory.

3. Temporary files should be stored in the data/.cache directory and should be deleted after use.

4. Third-party programs should be placed in the data/third directory and corresponding directories should be deleted upon uninstallation.

5. Dynamic creation of script, style tags, and importing external JS, CSS, etc., operations are prohibited.

6. Modifications that intrude upon the system require restoration operations upon uninstallation.
