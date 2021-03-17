import path from 'path'
import fs from 'fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { Project, SourceFile } from 'ts-morph'
import glob from 'fast-glob'

export type Options = {
  input: string | string[]
  outDir?: string
}

export async function build({ input, outDir }: Options) {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      outDir,
    },
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })
  const files = await glob(input)

  const sourceFiles: SourceFile[] = []

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf8')
      const sfc = parse(content)
      const { script, scriptSetup } = sfc.descriptor
      if (script || scriptSetup) {
        let content = ''
        let isTS = false
        if (script && script.content) {
          content += script.content
          if (script.lang === 'ts') isTS = true
        }
        if (scriptSetup) {
          const compiled = compileScript(sfc.descriptor, { id: 'xxx' })
          content += compiled.content
          if (scriptSetup.lang === 'ts') isTS = true
        }
        const sourceFile = project.createSourceFile(
          path
            .relative(process.cwd(), file)
            .replace('.vue', isTS ? '.ts' : '.js'),
          content,
        )
        sourceFiles.push(sourceFile)
      }
    }),
  )

  const diagnostics = project.getPreEmitDiagnostics()
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  const result = await project.emit()

  console.log(
    project.formatDiagnosticsWithColorAndContext(result.getDiagnostics()),
  )

  for (const sourceFile of sourceFiles) {
    const emitOutput = sourceFile.getEmitOutput()
    for (const outputFile of emitOutput.getOutputFiles()) {
      console.log(`Emitted ${outputFile.getFilePath()}`)
    }
  }
}
