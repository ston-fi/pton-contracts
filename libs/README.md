# blueprint test utils

Regenerate `parser/errors.ts`:

```shell
npx peggy --plugin ./node_modules/ts-pegjs/dist/tspegjs src/parser/confParser.pegjs -o src/parser/confParser.ts 
```

check circular dependency
```shell
npx madge -c --extensions ts ./
```