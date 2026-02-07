import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Wagmi hooks
vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      status: "disconnected",
    })),
    useConnect: vi.fn(() => ({
      connect: vi.fn(),
      connectors: [],
      isPending: false,
      error: null,
    })),
    useDisconnect: vi.fn(() => ({
      disconnect: vi.fn(),
      isPending: false,
    })),
    useBalance: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
    })),
    useChainId: vi.fn(() => 31611),
    useReadContract: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),
    useWriteContract: vi.fn(() => ({
      writeContract: vi.fn(),
      writeContractAsync: vi.fn(),
      isPending: false,
      error: null,
      data: undefined,
    })),
    useWaitForTransactionReceipt: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
    })),
  };
});

// Mock Privy
vi.mock("@privy-io/react-auth", () => ({
  usePrivy: vi.fn(() => ({
    ready: true,
    authenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    linkWallet: vi.fn(),
    unlinkWallet: vi.fn(),
  })),
  PrivyProvider: ({ children }: { children: React.ReactNode }) => children,
  useWallets: vi.fn(() => ({
    wallets: [],
    ready: true,
  })),
}));

// Mock @privy-io/wagmi
vi.mock("@privy-io/wagmi", () => ({
  useSetActiveWallet: vi.fn(() => ({
    setActiveWallet: vi.fn(),
  })),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors during tests (optional, remove if you want to see them)
// vi.spyOn(console, 'error').mockImplementation(() => {});
