import * as ts from "typescript";
import { readFileSync, writeFileSync } from "fs";

const fileName = "./figma.d.ts";

// Parse a file
const sourceFile = ts.createSourceFile(
  fileName,
  readFileSync(fileName).toString(),
  ts.ScriptTarget.ES2015,
  /*setParentNodes */ true
);

const DefinitionsToConvert = [
  "SliceNode",
  "FrameNode",
  "ComponentNode",
  "InstanceNode",
  "BooleanOperationNode",
  "VectorNode",
  "StarNode",
  "LineNode",
  "EllipseNode",
  "PolygonNode",
  "RectangleNode",
  "TextNode"
];

export namespace BadSchema {
  export interface EitherTypeDefinition {
    type: "either";
    // Hardcoded to "type" at the moment
    variantKey: "type";
    possibilities: { [variantKeyValue: string]: string };
  }

  export interface ArrayPropertyDefinition {
    type: "array";
    subType: string;
  }

  export type PropertyType =
    | string
    | ArrayPropertyDefinition
    | EitherTypeDefinition;

  export type InterfaceDefinition = { [key: string]: PropertyType };

  export type TypeDefinition =
    | InterfaceDefinition
    | "number"
    | "boolean"
    | "string";
}

const findTypeAlias = (name: string): ts.TypeAliasDeclaration | undefined => {
  const found = sourceFile.statements.find(node => {
    if (ts.isTypeAliasDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text === name;
    } else {
      return false;
    }
  });
  return found as ts.TypeAliasDeclaration | undefined;
};

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

// See https://astexplorer.net/#/gist/140376c742be14f16997e5bd82eaf66c/3e77777964fdf168dc0170afc0bf7a2a49538b06

function memberToTuple(
  e: ts.TypeElement
): [string, BadSchema.PropertyType] | undefined {
  // a: number
  if (ts.isPropertySignature(e)) {
    const { name, type } = e;
    if (type === undefined || name === undefined) {
      return undefined;
    }

    let nameText;
    if (ts.isIdentifier(name)) {
      nameText = name.text;
    } else {
      return undefined;
    }
    if (ts.isTypeReferenceNode(type)) {
      const idOrQid = type.typeName;
      if (ts.isIdentifier(idOrQid)) {
        const typeName = idOrQid.text;
        if (typeName == "ReadonlyArray") {
          console.log("Found readonly array.");
          const [firstTypeArg] = type.typeArguments || [];
          if (
            ts.isTypeReferenceNode(firstTypeArg) &&
            ts.isIdentifier(firstTypeArg.typeName)
          ) {
            const subType = firstTypeArg.typeName.text;
            return [nameText, { type: "array", subType: subType }];
          } else if (firstTypeArg.kind == ts.SyntaxKind.NumberKeyword) {
            return [nameText, { type: "array", subType: "number" }];
          } else if (firstTypeArg.kind == ts.SyntaxKind.StringKeyword) {
            return [nameText, { type: "array", subType: "string" }];
          } else if (firstTypeArg.kind == ts.SyntaxKind.BooleanKeyword) {
            return [nameText, { type: "array", subType: "boolean" }];
          } else {
            console.error("firstTypeArg is not an identifier", firstTypeArg);
            return undefined;
          }
        } else {
          return [nameText, typeName];
        }
      } else {
        // ts.QualifiedIdentifier, eg:
        // a: foo.bar;
        // not needed for this use case
        return undefined;
      }
    } else if (type.kind === ts.SyntaxKind.StringKeyword) {
      return [nameText, "string"];
    } else if (type.kind === ts.SyntaxKind.NumberKeyword) {
      return [nameText, "number"];
    } else if (type.kind === ts.SyntaxKind.BooleanKeyword) {
      return [nameText, "boolean"];
    }
  } else if (ts.isMethodSignature(e)) {
    // console.info(
    //   "ignoring method:",
    //   ts.isIdentifier(e.name) ? e.name.text : "__"
    // );
  } else {
    console.log("non property sig encountered");
  }
  return undefined;
}

// Flat polyfill, since it's 2019 but not ES2019 yet
const flat = <T>(arr: Array<T | T[]>): T[] =>
  arr.reduce(
    // @ts-ignore Doesn't like acc type
    (acc: T[], cur: T | T[]) => {
      Array.isArray(cur) ? cur.forEach(c => acc.push(c)) : acc.push(cur);
      return cur;
    },
    []
  );

const fromEntries = <T>(tups: [string, T][]) =>
  tups.reduce((acc, [key, value]: [string, T]) => {
    // @ts-ignore
    acc[key] = value;
    return acc;
  }, {});

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

function parseInterface(
  interfaceDef: ts.InterfaceDeclaration
): BadSchema.TypeDefinition | undefined {
  const keyTypeTuples = interfaceDef.members
    .map(memberToTuple)
    .filter(a => a !== undefined) as [string, string][];

  const main: BadSchema.InterfaceDefinition = fromEntries(keyTypeTuples);

  // A extends B, C, D => merge all properties together
  if (Array.isArray(interfaceDef.heritageClauses)) {
    const heritageClauses = flat(
      interfaceDef.heritageClauses.map(h =>
        h.types.map(t =>
          ts.isIdentifier(t.expression) ? t.expression.text : undefined
        )
      )
    );
    const joined = heritageClauses
      .filter(notUndefined)
      .map(findInterface)
      .filter(notUndefined)
      .map(parseInterface)
      .filter(notUndefined)
      .reduce((acc, k) => Object.assign(acc, k), main);
    return joined;
  }
  return main;
}

// Support type D = A | B | C
function parseTypealias(
  alias: ts.TypeAliasDeclaration
): BadSchema.EitherTypeDefinition | string | undefined {
  if (ts.isUnionTypeNode(alias.type)) {
    // Check D = "A" | "B" | "C"
    if (alias.type.types.every(t => ts.isLiteralTypeNode(t))) {
      // Technically, they could be other literals, doesn't really matter for our purposes
      return "string";
    }

    // Check type Blah = A | B | C
    if (alias.type.types.every(t => ts.isTypeReferenceNode(t))) {
      // look for a key called type
      const key = "type";
      const typeRefNames = alias.type.types
        .map(t => {
          const tn = (t as ts.TypeReferenceNode).typeName;
          if (ts.isIdentifier(tn)) {
            return tn.text;
          } else {
            return undefined;
          }
        })
        .filter(notUndefined);

      // Now lookup all of the interfaces by this key
      const typesReferenced = typeRefNames
        .map(findInterface)
        .filter(notUndefined);

      console.log("typeRefNames", typeRefNames);

      const keyValues = typesReferenced.map((t, i) => {
        // Look for eg
        /// readonly type: "DROP_SHADOW" | "INNER_SHADOW";
        const member = t.members.find(
          m =>
            ts.isPropertySignature(m) &&
            ts.isIdentifier(m.name) &&
            m.initializer !== undefined &&
            ts.isStringLiteral(m.initializer) &&
            m.name.text == key
        );
        console.log(`${typeRefNames[i]} mmbers`, t.members.map(t => t.name));
        if (
          member !== undefined &&
          ts.isPropertySignature(member) &&
          member.initializer !== undefined &&
          ts.isStringLiteral(member.initializer)
        ) {
          return member.initializer.text;
        }
      });
    }
  }
}

const registry: { [typeName: string]: BadSchema.TypeDefinition } = {
  string: "string",
  number: "number",
  boolean: "boolean"
};

let todo = new Set(DefinitionsToConvert);

while (todo.size > 0) {
  const typeName = todo.values().next().value as string;
  todo.delete(typeName);

  const addIfNecessary = (t: string) => {
    if (!(t in registry)) {
      todo.add(t);
    }
  };

  const interfaceDec = findInterface(typeName);
  const typeDec = findTypeAlias(typeName);

  if (interfaceDec !== undefined) {
    const s = parseInterface(interfaceDec);
    if (s !== undefined) {
      registry[typeName] = s;
      // Add result types to dot
      Object.values(s).forEach(destType => {
        if (typeof destType === "string") {
          addIfNecessary(destType);
        } else if (typeof destType === "object") {
          if (destType.type === "array") {
            addIfNecessary(destType.subType);
          } else if (destType.type === "either") {
            Object.values(destType.possibilities).forEach(addIfNecessary);
          }
        }
      });
    }
  } else if (typeDec !== undefined) {
    const t = parseTypealias(typeDec);
    if (t !== undefined) {
      registry[typeName] = t;
      if (typeof t === "object") {
        if (t.type === "either") {
          Object.values(t.possibilities).forEach(addIfNecessary);
        }
      }
    }
  }
}

// Quick convert
const result = fromEntries(
  DefinitionsToConvert.map(key => [key, registry[key]])
);

const [_, __, resultPath = "schema.json"] = process.argv;
writeFileSync(resultPath, JSON.stringify(result, null, 2));
