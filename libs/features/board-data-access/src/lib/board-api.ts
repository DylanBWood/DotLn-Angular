import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import type { BoardResponse } from '@dotln-angular/models';

@Injectable()
export class BoardApi {
  readonly #http = inject(HttpClient);

  load() {
    return this.#http.get<BoardResponse>('/uifa-board-v1');
  }
}
