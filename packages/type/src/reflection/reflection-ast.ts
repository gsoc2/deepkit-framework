/*
 * Deepkit Framework
 * Copyright (c) Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { ComputedPropertyName, Identifier, NumericLiteral, PrivateIdentifier, StringLiteral } from 'typescript/lib/tsserverlibrary';
import {
    ArrowFunction,
    EntityName,
    Expression,
    isArrowFunction,
    isComputedPropertyName,
    isIdentifier,
    isNumericLiteral,
    isPrivateIdentifier,
    isStringLiteral,
    JSDoc,
    ModifiersArray,
    Node,
    NodeArray,
    NodeFactory,
    QualifiedName,
    SyntaxKind,
    unescapeLeadingUnderscores
} from 'typescript';
import { isArray } from '@deepkit/core';
import { cloneNode as tsNodeClone, CloneNodeHook } from 'ts-clone-node';
import { PackExpression } from './compiler';

export function getIdentifierName(node: Identifier | PrivateIdentifier): string {
    return unescapeLeadingUnderscores(node.escapedText);
}

function joinQualifiedName(name: EntityName): string {
    if (isIdentifier(name)) return getIdentifierName(name);
    return joinQualifiedName(name.left) + '_' + getIdentifierName(name.right);
}

function hasJsDoc(node: any): node is { jsDoc: JSDoc[]; } {
    return 'jsDoc' in node && !!(node as any).jsDoc;
}

export function extractJSDocAttribute(node: Node, attribute: string): string {
    if (!hasJsDoc(node)) return '';

    for (const doc of node.jsDoc) {
        if (!doc.tags) continue;
        for (const tag of doc.tags) {
            if (tag.tagName.text === attribute && 'string' === typeof tag.comment) return tag.comment;
        }
    }

    return '';
}

export function getPropertyName(f: NodeFactory, node?: Identifier | StringLiteral | NumericLiteral | ComputedPropertyName | PrivateIdentifier): string | ArrowFunction {
    if (!node) return '';

    if (isIdentifier(node)) return getIdentifierName(node);
    if (isStringLiteral(node)) return node.text;
    if (isNumericLiteral(node)) return node.text;
    if (isComputedPropertyName(node)) {
        return f.createArrowFunction(undefined, undefined, [], undefined, undefined, node.expression);
    }
    if (isPrivateIdentifier(node)) return getIdentifierName(node);

    return '';
}

export function getNameAsString(node?: Identifier | StringLiteral | NumericLiteral | ComputedPropertyName | PrivateIdentifier | QualifiedName): string {
    if (!node) return '';
    if (isIdentifier(node)) return getIdentifierName(node);
    if (isStringLiteral(node)) return node.text;
    if (isNumericLiteral(node)) return node.text;
    if (isComputedPropertyName(node)) return node.getText();
    if (isPrivateIdentifier(node)) return getIdentifierName(node);

    return joinQualifiedName(node);
}

export function hasModifier(node: { modifiers?: ModifiersArray }, modifier: SyntaxKind): boolean {
    if (!node.modifiers) return false;
    return node.modifiers.some(v => v.kind === modifier);
}

export class NodeConverter {
    cloneHook: any;

    constructor(protected f: NodeFactory) {
        this.cloneHook = <T extends Node>(node: T, payload: { depth: number }): CloneNodeHook<T> | undefined => {
            if (isIdentifier(node)) {
                //ts-clone-node wants to read `node.text` which does not exist. we hook into into an provide the correct value.
                return {
                    text: () => {
                        return getIdentifierName(node);
                    }
                } as any;
            }
            return;
        };
    }

    toExpression<T extends PackExpression | PackExpression[]>(value?: T): Expression {
        if (value === undefined) return this.f.createIdentifier('undefined');

        if (isArray(value)) {
            return this.f.createArrayLiteralExpression(this.f.createNodeArray(value.map(v => this.toExpression(v))) as NodeArray<Expression>);
        }

        if ('string' === typeof value) return this.f.createStringLiteral(value, true);
        if ('number' === typeof value) return this.f.createNumericLiteral(value);
        if ('bigint' === typeof value) return this.f.createBigIntLiteral(String(value));
        if ('boolean' === typeof value) return value ? this.f.createTrue() : this.f.createFalse();

        if (value.pos === -1 && value.end === -1 && value.parent === undefined) {
            if (isArrowFunction(value)) {
                if (value.body.pos === -1 && value.body.end === -1 && value.body.parent === undefined) return value;
                return this.f.createArrowFunction(value.modifiers, value.typeParameters, value.parameters, value.type, value.equalsGreaterThanToken, this.toExpression(value.body as Expression));
            }
            return value;
        }

        try {
            return tsNodeClone(value, { preserveComments: false, factory: this.f, hook: this.cloneHook }) as Expression;
        } catch (error) {
            console.log('value', value);
            throw error;
        }
    }


}
