import { Result } from '../types';

const some = (results: Result[]): Result => {
  const filtered = results.filter((result: Result) => result);
  if (filtered.length) {
    const stringErrors = filtered.filter((result: Result) => result !== true);
    const booleanResults = filtered.filter((result: Result) => result === true);
    if (booleanResults.length) return true;

    return stringErrors[0];
  }

  return false;
}

export default some;