import { useEffect, useRef } from 'react';

/**
 * usePrevious with generics
 *
 * got from https://gist.github.com/jeongtae/896be1318c4b74b726262ba8d269aa9f
 *
 * @params {T} value
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default usePrevious;
