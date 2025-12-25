export type MockRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => Promise<void>;
};

export function useRouter(): MockRouter {
  return {
    push: (_href: string) => {},
    replace: (_href: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: async (_href: string) => {},
  };
}

export function usePathname(): string {
  return '/';
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useParams(): Record<string, string> {
  return {};
}

export function redirect(_url: string): void {}

export function notFound(): void {}