import { InjectionToken as Token } from '@angular/core';
import * as angular from '@angular/core';

export const AliasedToken = new Token<ReadonlyMap<string, number>>('wrong.namespace');
export const NamespaceToken = new angular.InjectionToken<ReadonlyArray<string>>('wrong.namespace');
