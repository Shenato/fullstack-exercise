import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readCapacity, updatePerson } from "../mocks/capacityMock";
import type { CapacityData, DateRange, Person } from "../types/capacity";

export function useCapacity(range: DateRange, refreshSeconds: number | false) {
  const client = useQueryClient();
  const updateCaches = (person: Person) =>
    client.setQueriesData<CapacityData>(
      { queryKey: ["capacity"] },
      (previous) =>
        previous && {
          ...previous,
          people: previous.people.map((row) =>
            row.id === person.id ? { ...row, ...person } : row,
          ),
        },
    );
  const mutation = useMutation({
    mutationFn: ({ id, weeklyHours }: Person) => updatePerson(id, weeklyHours),
    onMutate: async (person) => {
      await client.cancelQueries({ queryKey: ["capacity"] });
      const snapshots = client.getQueriesData<CapacityData>({
        queryKey: ["capacity"],
      });
      updateCaches(person);
      return { snapshots };
    },
    onSuccess: (person) => updateCaches(person),
    onError: (_error, person, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        const original = data?.people.find((row) => row.id === person.id);
        if (!original) continue;
        client.setQueryData<CapacityData>(
          key,
          (current) =>
            current && {
              ...current,
              people: current.people.map((row) =>
                row.id === person.id
                  ? { ...row, weeklyHours: original.weeklyHours }
                  : row,
              ),
            },
        );
      }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
  const query = useQuery({
    queryKey: ["capacity", range.from, range.to],
    queryFn: ({ signal }) => readCapacity(range, signal),
    enabled: !mutation.isPending,
    staleTime: 30_000,
    refetchInterval: refreshSeconds === false ? false : refreshSeconds * 1000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
  return { query, mutation };
}
