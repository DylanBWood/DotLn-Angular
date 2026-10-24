import { Events, Dispatcher } from '@ngrx/signals/events';
import { boardHttpEvents, boardPageEvents } from '@dotln-angular/events';
events.on(boardPageEvents.opened).pipe(map(() => boardPageEvents.refreshRequested()));
