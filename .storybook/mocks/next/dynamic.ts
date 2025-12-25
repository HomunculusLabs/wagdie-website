import React, { lazy, Suspense } from 'react';

type Loader<T> = () => Promise<{ default: React.ComponentType<T> } | React.ComponentType<T>>;

type DynamicOptions = {
  loading?: React.ComponentType;
  ssr?: boolean;
};

export default function dynamic<T>(loader: Loader<T>, options: DynamicOptions = {}): React.ComponentType<T> {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    if (typeof loaded === 'function') {
      return { default: loaded };
    }
    return loaded;
  });

  const Loading = options.loading;

  const DynamicComponent = (props: T) => (
    <Suspense fallback={Loading ? <Loading /> : null}>
      <LazyComponent {...props} />
    </Suspense>
  );

  DynamicComponent.displayName = 'DynamicComponent';

  return DynamicComponent;
}