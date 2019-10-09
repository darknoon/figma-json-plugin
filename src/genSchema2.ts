import * as ts from "typescript";
import { readFileSync, writeFileSync } from "fs";

const fileName = "./figma.d.ts";

const program = ts.createProgram({
  projectReferences: [{ path: fileName }],
  rootNames: ["figma"],
  options: {
    noImplicitAny: true,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
  }
});

const sourceFile = program.getSourceFiles()[0];

const findInterface = (name: string): ts.InterfaceDeclaration | undefined => {
  const found = sourceFile.statements.find(node => {
    if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
      const nodeName = ts.getNameOfDeclaration(node as ts.InterfaceDeclaration);
      return (
        nodeName !== undefined && "text" in nodeName && nodeName.text === name
      );
    } else {
      return false;
    }
  });
  return found as ts.InterfaceDeclaration | undefined;
};

const checker = program.getTypeChecker();

const frameNodeIdecl = findInterface("FrameNode");

if (frameNodeIdecl === undefined) {
  throw new Error("Couldn't find FrameNode!");
}

const frameNodeType = checker.getTypeAtLocation(frameNodeIdecl);

const props = checker.getPropertiesOfType(frameNodeType);

const blacklist = new Set(["parent"]);

const propsNotFunc = props.filter(
  p => p.flags === ts.SymbolFlags.Property && !blacklist.has(p.name)
);

console.log("props", propsNotFunc.map(p => p.name));
