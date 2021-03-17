import { Options } from 'tsup'
import resolve from 'resolve-from'
import { builtinModules } from 'module'

const options: Options = {
  esbuildPlugins: [
    {
      // somehow the bundled typescript in ts-morph doesn't work with pnpm
      name: 'replace-typescript',
      setup(build) {
        build.onResolve({ filter: /\.\/typescript/ }, (args) => {
          return { path: require.resolve('typescript') }
        })
      },
    },
    {
      // Some modules like `pug` are required in consolidate but should not be bundled
      name: 'ignore-require-in-consolidate',
      setup(build) {
        build.onResolve({ filter: /^[a-z]/ }, (args) => {
          if (builtinModules.includes(args.path))
            return {
              path: args.path,
              external: true,
            }
          if (args.importer.includes('consolidate')) {
            const id = resolve.silent(args.resolveDir, args.path)
            if (id) {
              return { path: id }
            }
            return { path: args.path, external: true }
          }
        })
      },
    },
  ],
}

export default options
