import React from 'react';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | URL;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string;
  legacyBehavior?: boolean;
};

export default function Link(props: LinkProps): JSX.Element {
  const {
    href,
    children,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    shallow: _shallow,
    locale: _locale,
    legacyBehavior: _legacyBehavior,
    ...rest
  } = props;
  const resolvedHref = typeof href === 'string' ? href : href.toString();

  return (
    <a href={resolvedHref} {...rest}>
      {children}
    </a>
  );
}