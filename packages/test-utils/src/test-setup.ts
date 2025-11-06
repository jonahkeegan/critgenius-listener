import { installTestRuntime } from './runtime';
import { registerMatchers } from './matchers';
import { configureAxe, registerAccessibilityMatchers } from './accessibility';

const runtime = installTestRuntime();
runtime.installGlobals();
registerMatchers();
configureAxe();
registerAccessibilityMatchers();
