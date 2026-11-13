import * as core from '@qasimfida/accessiblit';
import * as adapter from '@qasimfida/accessiblit/react';
const options: Parameters<typeof core.init>[0] = {
  position: 'top-left',
  features: ['readingGuide'],
};
core.init(options).destroy();
const component: typeof adapter.AccessiblitWidget = adapter.AccessiblitWidget;
console.log(component);
// @ts-expect-error The require declaration must preserve the options union too.
core.init({ position: 'middle' });
