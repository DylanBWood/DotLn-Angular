import behaviorSubject from './rxjs/behavior-subject.json';
import catchError from './rxjs/catch-error.json';
import combineLatest from './rxjs/combine-latest.json';
import concatMap from './rxjs/concat-map.json';
import exhaustMap from './rxjs/exhaust-map.json';
import finalize from './rxjs/finalize.json';
import materialize from './rxjs/materialize.json';
import mergeMap from './rxjs/merge-map.json';
import observeOn from './rxjs/observe-on.json';
import repeat from './rxjs/repeat.json';
import replaySubject from './rxjs/replay-subject.json';
import retry from './rxjs/retry.json';
import scan from './rxjs/scan.json';
import share from './rxjs/share.json';
import shareReplay from './rxjs/share-replay.json';
import startWith from './rxjs/start-with.json';
import subject from './rxjs/subject.json';
import switchMap from './rxjs/switch-map.json';
import takeUntil from './rxjs/take-until.json';
import timeout from './rxjs/timeout.json';

// The work's studies load as one chunk, the first time one of them is read. The studies check
// refuses a record this list misses.
export default [
  behaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  exhaustMap,
  finalize,
  materialize,
  mergeMap,
  observeOn,
  repeat,
  replaySubject,
  retry,
  scan,
  share,
  shareReplay,
  startWith,
  subject,
  switchMap,
  takeUntil,
  timeout,
];
