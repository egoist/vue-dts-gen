#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../package.json'

const cli = cac('vue-dts-gen')

cli
  .command('[...vue files]', 'Generate .d.ts for .vue files')
  .option('--outDir <dir>', 'Output directory')
  .option('--tsconfig <dir>','specified tsconfig.json path')
  .action(async (input, flags: { outDir?: string,tsconfig?:string }) => {
    const { build } = await import('./')
    await build({ input, outDir: flags.outDir,tsconfig:flags.tsconfig })
  })

cli.version(version)
cli.help()
cli.parse()
