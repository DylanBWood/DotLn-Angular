import { Events, Dispatcher } from '@ngrx/signals/events';
import { boardHttpEvents, boardPageEvents } from '@dotln-angular/events';
events.on(boardHttpEvents.loadSuccess).pipe(map(() => boardHttpEvents.load()));
