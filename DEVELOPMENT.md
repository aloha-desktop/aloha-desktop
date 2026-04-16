# Developer Context Information

## Externalized Dependencies

In an Electron app, native Node modules (the ones you compile with electron-rebuild) must be externalized. They cannot be bundled, therefore should be installed with `npm i --save ...` into `dependencies` section.

Command for detecting node native modules:

```bash
find node_modules -type f -name "*.node" 2>/dev/null | grep -v "obj\.target"
```

### baileys

The `baileys` package and its dependencies are externalized:
- `bufferutil`
- `utf-8-validate`

These 2 dependencies contain electron-rebuilt node native modules. The `baileys` package itself is also externalized for compatibility.

### better-sqlite3

`better-sqlite3` contain node native modules and needs to be externalized.