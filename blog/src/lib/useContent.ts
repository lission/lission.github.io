import { useEffect, useState, type DependencyList } from 'react';

export interface ContentState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** 按需加载 JSON 产物的轻量 hook，路由切换时自动丢弃过期结果。 */
export function useContent<T>(
  loader: () => Promise<T>,
  deps: DependencyList = []
): ContentState<T> {
  const [state, setState] = useState<ContentState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    loader()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (alive) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      alive = false;
    };
  }, deps);

  return state;
}
