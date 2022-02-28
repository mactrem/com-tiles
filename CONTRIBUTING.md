The dependencies between the different libraries are managed via npm workspaces.  
The dependencies are hoisted, meaning they get installed in the root node_modules folder.

To install the dependencies in all packages run the following command in the top-level directory:
````bash
npm install
````

If you want to add a dependency named `abbrev` from the registry as a dependency 
of your workspace `a`, you may use the workspace config to tell the npm installer that package should 
be added as a dependency of the provided workspace:
```bash
npm install abbrev -w a
```

Install `package-a` on `package-b`:
```
npm install package-a --workspace package-b
```

To define a new workspace run:
```bash
npm init -w ./packages/a
```