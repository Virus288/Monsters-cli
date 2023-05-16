import * as ts from 'typescript';
import fs from 'fs';
import Log from '../../tools/logger/log';
import { EModuleInterfaces, EModuleType } from '../../enums';

export default class Abstraction {
  private readonly _dir: string;

  constructor(dir: string) {
    this._dir = dir;
  }

  private get dir(): string {
    return this._dir;
  }

  modify(name: string): void {
    const { factory } = ts;
    const fullPath = `${this.dir}/src/tools/abstract/types.d.ts`;

    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const sourceFile = ts.createSourceFile(fullPath, fileContent, ts.ScriptTarget.Latest, true);
    if (!sourceFile) {
      Log.error('Abstractions', `Source file ${fullPath} does not seem to exist`);
      return;
    }
    let newSourceFile: ts.SourceFile = sourceFile;
    let times = Object.keys(EModuleInterfaces).length;

    const importDeclaration = this.generateImports(name.charAt(0).toUpperCase() + name.slice(1));

    Object.values(EModuleInterfaces).forEach((s) => {
      const declarations = this.findDeclaration(sourceFile, s);
      const newStatements = this.modifyDeclaration(
        newSourceFile,
        declarations,
        name.charAt(0).toUpperCase() + name.slice(1),
        s,
        importDeclaration,
        times,
      );
      times--;

      newSourceFile = factory.updateSourceFile(
        sourceFile,
        newStatements,
        sourceFile.isDeclarationFile,
        sourceFile.referencedFiles,
        sourceFile.typeReferenceDirectives,
        sourceFile.hasNoDefaultLib,
        sourceFile.libReferenceDirectives,
      );
    });

    const printer = ts.createPrinter();
    const modifiedCode = printer.printFile(newSourceFile);
    fs.writeFileSync(fullPath, modifiedCode, 'utf-8');
  }

  private modifyDeclaration(
    sourceFile: ts.SourceFile,
    interfaceDeclaration: ts.InterfaceDeclaration | null,
    name: string,
    target: EModuleInterfaces,
    importDeclaration: ts.ImportDeclaration[],
    times: number,
  ): ts.Statement[] {
    if (!interfaceDeclaration) return [];
    const { factory } = ts;

    const key = factory.createComputedPropertyName(
      factory.createPropertyAccessExpression(factory.createIdentifier('EModules'), factory.createIdentifier(name)),
    );
    let signature: ts.PropertySignature | null = null;

    switch (target) {
      case EModuleInterfaces.Controller:
        signature = this.modifyController(name, key);
        break;
      case EModuleInterfaces.RoosterDefaultData:
        signature = this.modifyRoosterDefaultData(name, key);
        break;
      case EModuleInterfaces.RoosterAdd:
        signature = this.modifyRoosterAdd(name, key);
        break;
      case EModuleInterfaces.RoosterGet:
        signature = this.modifyRoosterGet(name, key);
        break;
      case EModuleInterfaces.Handler:
        signature = this.modifyHandler(name, key);
        break;
      default:
        break;
    }

    const statements = this.modifyInterface(interfaceDeclaration, sourceFile, signature!);
    if (times === 1) {
      const index = sourceFile.statements.findIndex((node) => ts.isImportDeclaration(node));
      statements.splice(index, 0, ...importDeclaration);
    }

    return statements;
  }

  private modifyController(name: string, key: ts.ComputedPropertyName): ts.PropertySignature {
    const { factory } = ts;

    return factory.createPropertySignature(
      undefined,
      key,
      undefined,
      factory.createTypeReferenceNode(`${name}Rooster`, undefined),
    );
  }

  private modifyHandler(name: string, key: ts.ComputedPropertyName): ts.PropertySignature {
    const { factory } = ts;

    return factory.createPropertySignature(
      undefined,
      key,
      undefined,
      factory.createTypeReferenceNode(`${name}Controller`, undefined),
    );
  }

  private modifyRoosterDefaultData(name: string, key: ts.ComputedPropertyName): ts.PropertySignature {
    const { factory } = ts;

    return factory.createPropertySignature(
      undefined,
      key,
      undefined,
      factory.createTypeReferenceNode('Partial', [factory.createTypeReferenceNode(`${name}Rooster`, undefined)]),
    );
  }

  private modifyRoosterAdd(name: string, key: ts.ComputedPropertyName): ts.PropertySignature {
    const { factory } = ts;

    return factory.createPropertySignature(
      undefined,
      key,
      undefined,
      factory.createTypeReferenceNode(`IAdd${name}Dto`, undefined),
    );
  }

  private modifyRoosterGet(name: string, key: ts.ComputedPropertyName): ts.PropertySignature {
    const { factory } = ts;

    return factory.createPropertySignature(
      undefined,
      key,
      undefined,
      factory.createTypeReferenceNode(`I${name}Entity`, undefined),
    );
  }

  private modifyInterface(
    interfaceDeclaration: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
    newProperty: ts.PropertySignature,
  ): ts.Statement[] {
    const { factory } = ts;

    const newMembers = factory.createNodeArray([...interfaceDeclaration.members, newProperty]);
    const modifiedInterface = factory.updateInterfaceDeclaration(
      interfaceDeclaration,
      interfaceDeclaration.modifiers,
      interfaceDeclaration.name,
      interfaceDeclaration.typeParameters,
      interfaceDeclaration.heritageClauses,
      newMembers,
    );

    return sourceFile.statements.map((node) => {
      if (node === interfaceDeclaration) {
        return modifiedInterface;
      }
      return node;
    });
  }

  private generateImports(name: string): ts.ImportDeclaration[] {
    const { factory } = ts;
    const types = Object.entries(EModuleType);

    return types.map((t) => {
      const identified = factory.createIdentifier(`${name}${t[0]}`);
      const importClause = factory.createImportClause(true, identified, undefined);
      const path = factory.createStringLiteral(`../../modules/${name}/${t[1]}`);
      return factory.createImportDeclaration(undefined, importClause, path);
    });
  }

  private findDeclaration(sourceFile: ts.SourceFile, target: string): ts.InterfaceDeclaration | null {
    let elm: ts.InterfaceDeclaration | null = null;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === target) {
        elm = node;
      }
    });

    return elm;
  }
}
