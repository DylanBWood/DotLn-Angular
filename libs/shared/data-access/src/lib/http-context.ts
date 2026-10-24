import { HttpContextToken } from '@angular/common/http';

export const RequestTimeoutToken = new HttpContextToken<number>(() => 0);

export const RequestCorrelationToken = new HttpContextToken<string>(() => crypto.randomUUID());
