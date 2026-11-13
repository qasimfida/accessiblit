import { init } from '@qasimfida/accessiblit';
import type { FeatureId } from '@qasimfida/accessiblit';
const id: FeatureId = 'fontSize';
init({ features: [id], position: 'top-right' }).destroy();
