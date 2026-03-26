// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

import { AuthProvider, useAuth } from "./AuthProvider";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    // Mock window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
  });

  it("provides null user when no session exists", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("provides user when session exists", async () => {
    const mockSession = {
      user: { id: "user-1", email: "test@example.com" },
      access_token: "token",
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.session).toEqual(mockSession);
  });

  it("subscribes to auth state changes", () => {
    renderHook(() => useAuth(), { wrapper });
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes on unmount", () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("signOut calls supabase signOut and redirects to /login", async () => {
    mockSignOut.mockResolvedValue({});
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-1" },
          access_token: "token",
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");
  });

  it("updates user when auth state changes", async () => {
    let authCallback: (event: string, session: any) => void;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();

    // Simulate auth state change
    const newSession = {
      user: { id: "user-2", email: "new@example.com" },
      access_token: "new-token",
    };

    act(() => {
      authCallback!("SIGNED_IN", newSession);
    });

    expect(result.current.user).toEqual(newSession.user);
    expect(result.current.session).toEqual(newSession);
  });
});
