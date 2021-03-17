import { Options } from 'tsup'

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
  ],
}

export default options
