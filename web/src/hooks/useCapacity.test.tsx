import type { ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readCapacity, updatePerson } from "../api/capacity";
import type { CapacityData, Person } from "../types/capacity";
import { useCapacity } from "./useCapacity";

vi.mock("../api/capacity", () => ({
  readCapacity: vi.fn(),
  updatePerson: vi.fn(),
}));

const range = { from: "2026-01-05", to: "2026-01-11" };
const activeKey = ["capacity", range.from, range.to];
const inactiveKey = ["capacity", "2026-01-12", "2026-01-18"];
const person = { id: 1, name: "Ana", weeklyHours: 40 };
let client: QueryClient;

function data(weeklyHours = 40): CapacityData {
  return {
    weeks: [{ start: range.from, ...range, workdays: 5 }],
    people: [
      { ...person, weeklyHours, allocations: [35] },
      { id: 2, name: "Bo", weeklyHours: 32, allocations: [20] },
    ],
  };
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Value>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 }, mutations: { retry: false } },
  });
  client.setQueryData(inactiveKey, data());
});

afterEach(() => {
  cleanup();
  client.clear();
});

it("updates cached ranges optimistically and waits for invalidation to refetch with polling off", async () => {
  const patch = deferred<Person>();
  const refresh = deferred<CapacityData>();
  vi.mocked(readCapacity)
    .mockResolvedValueOnce(data())
    .mockReturnValueOnce(refresh.promise);
  vi.mocked(updatePerson).mockReturnValue(patch.promise);
  const { result } = renderHook(() => useCapacity(range, false), { wrapper });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

  act(() => result.current.mutation.mutate({ ...person, weeklyHours: 20 }));
  await waitFor(() =>
    expect(
      client.getQueryData<CapacityData>(activeKey)?.people[0].weeklyHours,
    ).toBe(20),
  );
  expect(
    client.getQueryData<CapacityData>(inactiveKey)?.people[0].weeklyHours,
  ).toBe(20);
  expect(
    client.getQueryData<CapacityData>(activeKey)?.people[0].allocations,
  ).toEqual([35]);

  await act(async () => patch.resolve({ ...person, weeklyHours: 22 }));
  await waitFor(() => expect(readCapacity).toHaveBeenCalledTimes(2));
  expect(result.current.mutation.isPending).toBe(true);
  expect(
    client.getQueryData<CapacityData>(activeKey)?.people[0].weeklyHours,
  ).toBe(22);
  expect(client.getQueryState(inactiveKey)?.isInvalidated).toBe(true);

  await act(async () => refresh.resolve(data(22)));
  await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));
  expect(result.current.query.data?.people[0].weeklyHours).toBe(22);
  expect(updatePerson).toHaveBeenCalledWith({ ...person, weeklyHours: 20 });
});

it("rolls back only the failed person's hours and reconciles with the server", async () => {
  const patch = deferred<Person>();
  vi.mocked(readCapacity).mockResolvedValue(data());
  vi.mocked(updatePerson).mockReturnValue(patch.promise);
  const { result } = renderHook(() => useCapacity(range, false), { wrapper });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.mutation.mutate({ ...person, weeklyHours: 20 }));
  await waitFor(() =>
    expect(
      client.getQueryData<CapacityData>(inactiveKey)?.people[0].weeklyHours,
    ).toBe(20),
  );
  client.setQueryData<CapacityData>(inactiveKey, (previous) => ({
    ...previous!,
    people: previous!.people.map((row) =>
      row.id === 2 ? { ...row, weeklyHours: 12 } : row,
    ),
  }));
  await act(async () => patch.reject(new Error("Save rejected")));
  await waitFor(() => expect(result.current.mutation.isError).toBe(true));
  expect(result.current.mutation.error?.message).toBe("Save rejected");
  expect(
    client
      .getQueryData<CapacityData>(inactiveKey)
      ?.people.map((row) => row.weeklyHours),
  ).toEqual([40, 12]);
  expect(result.current.query.data?.people[0].weeklyHours).toBe(40);
  expect(readCapacity).toHaveBeenCalledTimes(2);
});

it("does not undo a successful save when the follow-up GET fails", async () => {
  vi.mocked(readCapacity)
    .mockResolvedValueOnce(data())
    .mockRejectedValue(new Error("Refresh unavailable"));
  vi.mocked(updatePerson).mockResolvedValue({ ...person, weeklyHours: 20 });
  const { result } = renderHook(() => useCapacity(range, false), { wrapper });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.mutation.mutate({ ...person, weeklyHours: 20 }));
  await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));
  expect(result.current.query.isError).toBe(true);
  expect(result.current.query.data?.people[0].weeklyHours).toBe(20);
  expect(
    client.getQueryData<CapacityData>(inactiveKey)?.people[0].weeklyHours,
  ).toBe(20);
});

it("cancels an in-flight stale read before applying an optimistic edit", async () => {
  const patch = deferred<Person>();
  let staleSignal: AbortSignal | undefined;
  vi.mocked(readCapacity)
    .mockResolvedValueOnce(data())
    .mockImplementationOnce((_range, signal) => {
      staleSignal = signal;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        ),
      );
    })
    .mockResolvedValue(data(20));
  vi.mocked(updatePerson).mockReturnValue(patch.promise);
  const { result } = renderHook(() => useCapacity(range, false), { wrapper });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => {
    void result.current.query.refetch();
  });
  await waitFor(() => expect(staleSignal).toBeDefined());
  act(() => result.current.mutation.mutate({ ...person, weeklyHours: 20 }));
  await waitFor(() => expect(staleSignal?.aborted).toBe(true));
  expect(
    client.getQueryData<CapacityData>(activeKey)?.people[0].weeklyHours,
  ).toBe(20);
  await act(async () => patch.resolve({ ...person, weeklyHours: 20 }));
  await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));
  expect(result.current.query.data?.people[0].weeklyHours).toBe(20);
});
