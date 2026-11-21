import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'inventory',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.inventory',
      lane: 0,
    },
    {
      id: 'order-entry',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.order-entry',
      lane: 0,
    },
    {
      id: 'payments',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.payments',
      lane: 0,
    },
    {
      id: 'stock-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.stock-team',
      lane: 1,
    },
    {
      id: 'checkout-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.checkout-team',
      lane: 1,
    },
    {
      id: 'billing-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.nodes.billing-team',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'reserve',
      from: 'order-entry',
      to: 'inventory',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.reserve',
    },
    {
      id: 'authorize',
      from: 'order-entry',
      to: 'payments',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.authorize',
    },
    {
      id: 'stock-owner',
      from: 'inventory',
      to: 'stock-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.stock-owner',
    },
    {
      id: 'checkout-owner',
      from: 'order-entry',
      to: 'checkout-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.checkout-owner',
    },
    {
      id: 'billing-owner',
      from: 'payments',
      to: 'billing-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.billing-owner',
    },
    {
      id: 'reservation-contract',
      from: 'checkout-team',
      to: 'stock-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.reservation-contract',
    },
    {
      id: 'payment-contract',
      from: 'checkout-team',
      to: 'billing-team',
      label: 'studyTt.reverse-conway-manoeuvre.model.relations.payment-contract',
    },
  ],
  steps: [
    {
      id: 'target-reservation',
      focus: {
        relation: 'reserve',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.target-reservation',
    },
    {
      id: 'target-payment',
      focus: {
        relation: 'authorize',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.target-payment',
    },
    {
      id: 'assign-stock',
      focus: {
        relation: 'stock-owner',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.assign-stock',
    },
    {
      id: 'assign-checkout',
      focus: {
        relation: 'checkout-owner',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.assign-checkout',
    },
    {
      id: 'assign-billing',
      focus: {
        relation: 'billing-owner',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.assign-billing',
    },
    {
      id: 'migrate',
      focus: {
        relation: 'reservation-contract',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.migrate',
    },
    {
      id: 'agree-payment',
      focus: {
        relation: 'payment-contract',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.agree-payment',
    },
    {
      id: 'pilot',
      focus: {
        node: 'stock-team',
      },
      note: 'studyTt.reverse-conway-manoeuvre.model.steps.pilot',
    },
  ],
  moments: [
    {
      step: 'target-reservation',
      label: 'studyTt.reverse-conway-manoeuvre.model.moments.target-reservation',
    },
    {
      step: 'assign-stock',
      label: 'studyTt.reverse-conway-manoeuvre.model.moments.assign-stock',
    },
    {
      step: 'migrate',
      label: 'studyTt.reverse-conway-manoeuvre.model.moments.migrate',
    },
    {
      step: 'pilot',
      label: 'studyTt.reverse-conway-manoeuvre.model.moments.pilot',
    },
  ],
  caption: 'studyTt.reverse-conway-manoeuvre.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
