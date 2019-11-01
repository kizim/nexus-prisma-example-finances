import { Result } from '../types';

const every = (results: Result[]): Result => {
  const filtered = results.filter((result: Result) => result);

  if (filtered.length === results.length) {
    const stringErrors = filtered.filter((result: Result) => result !== true);
    if (stringErrors.length) return stringErrors[0];

    return true;
  }

  return false
}

export default every;
