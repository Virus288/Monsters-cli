import * as ts from 'typescript';
import fs from 'fs';
import Log from '../../tools/logger/log';
import * as path from 'path';
import { MissingSourceFileError } from '../../errors';

export default class Module {
  private readonly _dir: string;

  constructor(dir: string) {
    this._dir = dir;
  }

  private get dir(): string {
    return this._dir;
  }

  generate(name: string): void {
    this.copy(name);
    this.fill(name);
  }

  private copy(name: string): void {
    const local = path.join(__dirname, '..', '..', '..', '..', 'src', 'modules', 'creator', 'templates', 'module');
    const target = path.join(this.dir, 'src', 'modules', name);

    fs.cpSync(local, target, { recursive: true });
  }

  private fill(name: string): void {
    const bigName = name.charAt(0).toUpperCase() + name.slice(1);
    const paths = {
      dto: `${this.dir}/src/modules/${name}/dto.d.ts`,
      entity: `${this.dir}/src/modules/${name}/entity.d.ts`,
      types: `${this.dir}/src/modules/${name}/types.d.ts`,
    };

    const entity = this.generateEntity(bigName);
    const dto = this.generateDto(bigName);
    const types = this.generateTypes(bigName);

    this.fillFile(paths.dto, dto);
    this.fillFile(paths.entity, entity);
    this.fillFile(paths.types, types);
  }

  private fillFile(fullPath: string, interfaceDeclaration: ts.InterfaceDeclaration): void {
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const sourceFile = ts.createSourceFile(fullPath, fileContent, ts.ScriptTarget.Latest, true);
    if (!sourceFile) {
      Log.error('Abstractions', `Source file ${fullPath} does not seem to exist`);
      return;
    }

    const { factory } = ts;
    let newSourceFile: ts.SourceFile = sourceFile;

    const { source, statements } = this.modifyDeclaration(newSourceFile, interfaceDeclaration);

    newSourceFile = factory.updateSourceFile(
      source,
      statements,
      source.isDeclarationFile,
      source.referencedFiles,
      source.typeReferenceDirectives,
      source.hasNoDefaultLib,
      source.libReferenceDirectives,
    );

    const printer = ts.createPrinter();
    const modifiedCode = printer.printFile(newSourceFile);

    fs.writeFileSync(fullPath, modifiedCode, 'utf-8');
  }

  private modifyDeclaration(
    sourceFile: ts.SourceFile,
    interfaceDeclaration: ts.InterfaceDeclaration | null,
  ): { source: ts.SourceFile; statements: ts.Statement[] } {
    if (!interfaceDeclaration) throw new MissingSourceFileError();

    const newSource = this.modifyInterface(interfaceDeclaration, sourceFile);
    const statements = [...newSource.statements];

    return { statements, source: newSource };
  }

  private modifyInterface(interfaceDeclaration: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ts.SourceFile {
    const { factory } = ts;

    const newStatements = [...sourceFile.statements, interfaceDeclaration];

    return factory.updateSourceFile(
      sourceFile,
      newStatements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives,
    );
  }

  private generateDto(name: string): ts.InterfaceDeclaration {
    const { factory } = ts;

    const id = factory.createIdentifier('_id');

    return ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(`I${name}Dto`),
      [],
      undefined,
      [factory.createPropertySignature(undefined, id, undefined, factory.createTypeReferenceNode('string', undefined))],
    );
  }

  private generateTypes(name: string): ts.InterfaceDeclaration {
    const { factory } = ts;

    const id = factory.createIdentifier('_id');

    return ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(`I${name}`),
      [],
      undefined,
      [
        factory.createPropertySignature(
          undefined,
          id,
          undefined,
          factory.createTypeReferenceNode('mongoose.Types.ObjectId', undefined),
        ),
      ],
    );
  }

  private generateEntity(name: string): ts.InterfaceDeclaration {
    const { factory } = ts;

    const id = factory.createIdentifier('_id');

    return ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(`I${name}Entity`),
      [],
      undefined,
      [factory.createPropertySignature(undefined, id, undefined, factory.createTypeReferenceNode('string', undefined))],
    );
  }
}
