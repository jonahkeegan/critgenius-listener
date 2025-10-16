import core from './windows-reserved-names.core.cjs';

const {
  WINDOWS_RESERVED_NAMES,
  isWindowsReservedName,
  sanitizeWindowsFilename,
  getReservedNameError,
} = core;

export {
  WINDOWS_RESERVED_NAMES,
  isWindowsReservedName,
  sanitizeWindowsFilename,
  getReservedNameError,
};
export default core;
