import { InjectionToken } from '@angular/core';

export const BadToken = new InjectionToken<Map<string, ReadonlyArray<number>>>('wrong.namespace');
