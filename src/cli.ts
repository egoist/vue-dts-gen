#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../package.json'

const cli = cac('vue-dts-gen')

cli
  .command('[...vue files]', 'Generate .d.ts for .vue files')
  .action(async (input) => {
    const { build } = await import('./')
    await build({ input })
  })

cli.version(version)
cli.help()
cli.parse()
