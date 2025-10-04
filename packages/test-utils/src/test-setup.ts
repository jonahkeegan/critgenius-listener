import { installTestRuntime } from './runtime';
import { registerMatchers } from './matchers';

const runtime = installTestRuntime();
runtime.installGlobals();
registerMatchers();
