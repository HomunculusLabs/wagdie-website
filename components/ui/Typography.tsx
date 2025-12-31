import React from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'
export type HeadingLevel = 1 | 2 | 3 | 4

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingTag
  level?: HeadingLevel
  className?: string
  children: React.ReactNode
}

const HEADING_TAG_BY_LEVEL: Record<HeadingLevel, HeadingTag> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
}

const HEADING_SIZE_BY_LEVEL: Record<HeadingLevel, string> = {
  1: 'text-h1',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-h4',
}

const HEADING_SIZE_BY_TAG: Record<HeadingTag, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
}

export const Heading: React.FC<HeadingProps> = ({
  as,
  level,
  className = '',
  children,
  ...props
}) => {
  const resolvedTag: HeadingTag = as ?? (level ? HEADING_TAG_BY_LEVEL[level] : 'h2')
  const resolvedSize = level ? HEADING_SIZE_BY_LEVEL[level] : HEADING_SIZE_BY_TAG[resolvedTag]
  const combinedClassName = `${resolvedSize} font-display text-bone ${className}`.trim()

  return React.createElement(
    resolvedTag,
    {
      ...props,
      className: combinedClassName,
    },
    children
  )
}

export type TextVariant = 'body' | 'body-sm' | 'caption' | 'tiny'
type TextTag = 'p' | 'span' | 'div'

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextTag
  variant?: TextVariant
  muted?: boolean
  className?: string
  children: React.ReactNode
}

const TEXT_SIZE_BY_VARIANT: Record<TextVariant, string> = {
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
  tiny: 'text-tiny',
}

function getTextColorClass(variant: TextVariant, muted: boolean): string {
  if (variant === 'caption' || variant === 'tiny') {
    return muted ? 'text-mist/60' : 'text-mist'
  }
  return muted ? 'text-mist' : 'text-ash'
}

export const Text: React.FC<TextProps> = ({
  as = 'p',
  variant = 'body',
  muted = false,
  className = '',
  children,
  ...props
}) => {
  const sizeClass = TEXT_SIZE_BY_VARIANT[variant]
  const colorClass = getTextColorClass(variant, muted)
  const combinedClassName = `${sizeClass} ${colorClass} font-eskapade ${className}`.trim()

  return React.createElement(
    as,
    {
      ...props,
      className: combinedClassName,
    },
    children
  )
}

export type UiLabelAs = 'label' | 'span'

export type UiLabelProps =
  | ({ as?: 'label'; required?: boolean; className?: string; children: React.ReactNode } &
      React.LabelHTMLAttributes<HTMLLabelElement>)
  | ({ as: 'span'; required?: boolean; className?: string; children: React.ReactNode } &
      React.HTMLAttributes<HTMLSpanElement>)

export const UiLabel: React.FC<UiLabelProps> = ({
  as = 'label',
  required = false,
  className = '',
  children,
  ...props
}) => {
  const combinedClassName = `text-caption tracking-widest uppercase text-mist font-eskapade inline-flex items-center gap-1 ${className}`.trim()

  return React.createElement(
    as,
    {
      ...(props as Record<string, unknown>),
      className: combinedClassName,
    },
    <>
      {children}
      {required && <span className="text-red-900">*</span>}
    </>
  )
}

export const Blockquote: React.FC<{ children: React.ReactNode, cite?: string }> = ({ children, cite }) => {
  return (
    <figure className="my-6">
      <blockquote className="border-l-2 border-soul-accent/40 pl-6 italic text-ash text-lg font-eskapade leading-relaxed relative">
        <span className="absolute -top-4 -left-3 text-4xl text-soul-accent/20 font-display">&ldquo;</span>
        {children}
      </blockquote>
      {cite && (
        <figcaption className="mt-3 pl-6 text-md font-display text-mist uppercase tracking-widest opacity-60">
          — {cite}
        </figcaption>
      )}
    </figure>
  );
};

export const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <code className="bg-midnight border border-midnight-light/50 rounded px-1.5 py-0.5 text-sm font-mono text-soul-accent/80">
      {children}
    </code>
  );
};

export const List: React.FC<{ children: React.ReactNode, type?: 'ul' | 'ol' }> = ({ children, type = 'ul' }) => {
  if (type === 'ol') {
    return (
      <ol className="list-decimal list-inside space-y-2 text-ash font-eskapade marker:text-soul-accent marker:font-display">
        {children}
      </ol>
    );
  }
  return (
    <ul className="space-y-2 text-ash font-eskapade">
      {React.Children.map(children, (child) => (
        <li className="flex items-start gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-soul-accent/50 shrink-0" />
          <span>{child}</span>
        </li>
      ))}
    </ul>
  );
};
