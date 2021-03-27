import path from 'path'
import fs from 'fs'
import { Project, SourceFile } from 'ts-morph'
import glob from 'fast-glob'

export type Options = {
  input: string | string[]
  outDir?: string
}

let vueCompiler: typeof import('@vue/compiler-sfc')

const getVueCompiler = () => {
  if (!vueCompiler) {
    try {
      vueCompiler = require(path.resolve('node_modules/@vue/compiler-sfc'))
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(`@vue/compiler-sfc is not founded in ./node_modules`)
      }
      throw error
    }
  }

  return vueCompiler
}

export async function build({ input, outDir }: Options) {
  const vueCompiler = getVueCompiler()
  const tsConfigFilePath = fs.existsSync('tsconfig.json')
    ? 'tsconfig.json'
    : undefined
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      noEmitOnError: true,
      outDir,
    },
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
  })
  const files = await glob(input)

  const sourceFiles: SourceFile[] = []

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf8')
      const sfc = vueCompiler.parse(content)
      const { script, scriptSetup } = sfc.descriptor
      if (script || scriptSetup) {
        let content = ''
        let isTS = false
        if (script && script.content) {
          content += script.content
          if (script.lang === 'ts') isTS = true
        }
        if (scriptSetup) {
          const compiled = vueCompiler.compileScript(sfc.descriptor, {
            id: 'xxx',
          })
          content += compiled.content
          if (scriptSetup.lang === 'ts') isTS = true
        }
        const sourceFile = project.createSourceFile(
          path.relative(process.cwd(), file) + (isTS ? '.ts' : '.js'),
          content,
        )
        sourceFiles.push(sourceFile)
      }
    }),
  )

  const diagnostics = project.getPreEmitDiagnostics()
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  project.emitToMemory()

  for (const sourceFile of sourceFiles) {
    const emitOutput = sourceFile.getEmitOutput()
    for (const outputFile of emitOutput.getOutputFiles()) {
      const filepath = outputFile.getFilePath().replace('.vue.d.ts', '.d.ts')
      await fs.promises.writeFile(filepath, outputFile.getText(), 'utf8')
      console.log(`Emitted ${filepath}`)
    }
  }
}
