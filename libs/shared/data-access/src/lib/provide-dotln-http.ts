import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { baseUrlInterceptor, errorInterceptor, timeoutInterceptor } from './interceptors';

export function provideDotlnHttp() {
  return provideHttpClient(
    withFetch(),
    withInterceptors([baseUrlInterceptor, errorInterceptor, timeoutInterceptor]),
  );
}
