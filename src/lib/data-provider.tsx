import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { fileToAvatarDataUrl } from "@/lib/avatar-file";
import * as seed from "@/data/seed";
import type {
  CategorySlice,
  ExpenseCategory,
  Frequency,
  Fulfillment,
  ItemType,
  Occurrence,
  OverviewData,
  PayFrequency,
  Profile,
  RecurringItem,
} from "@/data/seed";
import {
  eachDayISO,
  generateOccurrences,
  getCurrentPeriod,
  previousRange,
  type Period,
} from "@/lib/periods";

// Re-export the domain types so screens/components consume them from the data
// layer boundary instead of importing `@/data/seed` directly (only this file
// may reach into the seed module).
export type {
  CategorySlice,
  ChartPoint,
  ExpenseCategory,
  Frequency,
  Fulfillment,
  ItemType,
  Occurrence,
  OverviewData,
  PayFrequency,
  Profile,
  RecurringItem,
} from "@/data/seed";

// ── Filter + input shapes ────────────────────────────────────────────────────

export interface RecurringItemFilters {
  type?: ItemType;
}

export interface FulfillmentFilters {
  periodStart: string;
}

export interface PeriodFilters {
  periodStart: string;
  periodEnd: string;
}

export interface ChartFilters {
  /** ISO date — first day of the selected range. */
  startDate: string;
  /** ISO date — last day of the selected range. */
  endDate: string;
}

export interface ProfileInput {
  currency: string;
  pay_frequency: PayFrequency;
  anchor_day: number;
  ftux_completed?: boolean;
}

/** Name and photo are saved on their own, from Settings › Account. */
export interface AccountInput {
  full_name?: string;
  avatar_url?: string | null;
}

export interface CreateItemInput {
  name: string;
  amount: number;
  type: ItemType;
  category: ExpenseCategory | null;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
}

export interface UpdateItemInput {
  id: string;
  name?: string;
  amount?: number;
  category?: ExpenseCategory | null;
  frequency?: Frequency;
  start_date?: string;
  end_date?: string | null;
}

export interface CreateFulfillmentInput {
  recurring_item_id: string;
  period_start: string;
  occurrence_date: string;
}

// ── Return shapes ─────────────────────────────────────────────────────────────

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
}

interface MutationResult<TInput, TResult = void> {
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<TResult>;
  isPending: boolean;
}

export interface AppDataProvider {
  // Profile
  useProfile(): QueryResult<Profile | null>;
  useUpdateProfile(): MutationResult<ProfileInput>;
  /** Save the display name and/or clear the photo. */
  useUpdateAccount(): MutationResult<AccountInput>;
  /** Put a photo on the top rung of the avatar ladder. Resolves to its URL. */
  useUploadAvatar(): MutationResult<File, string | null>;

  // Recurring items
  useRecurringItems(filters: RecurringItemFilters): QueryResult<RecurringItem[]>;
  useRecurringItem(id: string): QueryResult<RecurringItem | null>;
  useCreateRecurringItem(): MutationResult<CreateItemInput, RecurringItem | null>;
  useUpdateRecurringItem(): MutationResult<UpdateItemInput>;
  useDeleteRecurringItem(): MutationResult<string>;

  // Fulfillments
  useFulfillments(filters: FulfillmentFilters): QueryResult<Fulfillment[]>;
  /** All fulfillments for the current user, unfiltered by period — used to derive "last paid" per item. */
  useAllFulfillments(): QueryResult<Fulfillment[]>;
  useCreateFulfillment(): MutationResult<CreateFulfillmentInput, Fulfillment | null>;
  useDeleteFulfillment(): MutationResult<string>;

  // Derived / composite
  useOverviewData(filters: PeriodFilters): QueryResult<OverviewData>;
  useCategoryDonut(filters: PeriodFilters): QueryResult<CategorySlice[]>;
  useChartHistory(filters: ChartFilters): QueryResult<seed.ChartPoint[]>;
}

const DataProviderContext = createContext<AppDataProvider | null>(null);

export function useDataProvider(): AppDataProvider {
  const ctx = useContext(DataProviderContext);
  if (!ctx) throw new Error("useDataProvider must be used inside a DataProvider");
  return ctx;
}

const RECURRING_SORT = (a: RecurringItem, b: RecurringItem) => b.amount - a.amount;

// ── Pure compute helpers (shared by both providers) ───────────────────────────

function markFulfilled(
  occurrences: Occurrence[],
  fulfillments: Fulfillment[],
): Occurrence[] {
  return occurrences.map((occ) => {
    const match = fulfillments.find(
      (f) =>
        f.recurring_item_id === occ.item_id &&
        (f.occurrence_date === occ.occurrence_date ||
          f.occurrence_date === occ.original_date),
    );
    return match
      ? { ...occ, fulfilled: true, fulfillment_id: match.id }
      : occ;
  });
}

function sumAmount(items: Occurrence[]): number {
  return items.reduce((total, occ) => total + occ.amount, 0);
}

/**
 * The full Overview waterfall + lists for a period.
 * disposable = totalIncome − totalExpenses (fulfillment state does NOT affect it — plan D11).
 */
export function computeOverview(
  items: RecurringItem[],
  fulfillments: Fulfillment[],
  period: Period,
  prevPeriod: Period,
): OverviewData {
  const occurrences = markFulfilled(
    generateOccurrences(items, period.start, period.end),
    fulfillments,
  );

  const expenses = occurrences.filter((o) => o.type === "expense");
  const incomeItems = occurrences.filter((o) => o.type === "income");
  const toPayItems = expenses.filter((o) => !o.fulfilled);
  const fulfilledItems = expenses.filter((o) => o.fulfilled);

  // Fulfilled list sorts by fulfilled_at ascending (cloudboard manifest).
  const fulfilledAt = new Map(fulfillments.map((f) => [f.id, f.fulfilled_at]));
  fulfilledItems.sort((a, b) =>
    (fulfilledAt.get(a.fulfillment_id ?? "") ?? "").localeCompare(
      fulfilledAt.get(b.fulfillment_id ?? "") ?? "",
    ),
  );

  const totalIncome = sumAmount(incomeItems);
  const totalFulfilled = sumAmount(fulfilledItems);
  const totalToPay = sumAmount(toPayItems);
  const disposable = totalIncome - totalFulfilled - totalToPay;

  // Delta vs previous period (income − expenses, both periods).
  const prevOccurrences = generateOccurrences(
    items,
    prevPeriod.start,
    prevPeriod.end,
  );
  const prevIncome = sumAmount(prevOccurrences.filter((o) => o.type === "income"));
  const prevExpenses = sumAmount(
    prevOccurrences.filter((o) => o.type === "expense"),
  );
  const prevDisposable = prevIncome - prevExpenses;

  return {
    periodStart: period.start,
    periodEnd: period.end,
    totalIncome,
    totalFulfilled,
    totalToPay,
    disposable,
    delta: disposable - prevDisposable,
    toPayItems,
    fulfilledItems,
    incomeItems,
  };
}

/** Expenses grouped by category, sorted desc, collapsed to top-4 + "Other". */
export function computeCategoryDonut(
  items: RecurringItem[],
  period: Period,
): CategorySlice[] {
  const expenses = generateOccurrences(items, period.start, period.end).filter(
    (o) => o.type === "expense",
  );

  const byCategory = new Map<string, number>();
  for (const occ of expenses) {
    const cat = occ.category ?? "Other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + occ.amount);
  }

  const total = [...byCategory.values()].reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  const sorted = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Collapse everything beyond the top 4 into a single "Other" slice.
  let slices = sorted;
  if (sorted.length > 5) {
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((s, v) => s + v.amount, 0);
    const existingOther = top.find((s) => s.category === "Other");
    if (existingOther) {
      existingOther.amount += rest;
      slices = top;
    } else {
      slices = [...top, { category: "Other", amount: rest }];
    }
  }

  return slices.map((s) => ({
    category: s.category,
    amount: s.amount,
    percentage: s.amount / total,
  }));
}

/**
 * One point PER DAY across the range, built from the same occurrence generator the
 * rest of the app uses. `cumulative` is the running disposable from the range start,
 * so the chart reads as a trend line (a staircase, since income/expenses are events).
 */
export function computeDailySeries(
  items: RecurringItem[],
  range: Period,
): seed.ChartPoint[] {
  const occurrences = generateOccurrences(items, range.start, range.end);
  const byDay = new Map<string, { income: number; expenses: number }>();
  for (const occ of occurrences) {
    const bucket = byDay.get(occ.occurrence_date) ?? { income: 0, expenses: 0 };
    if (occ.type === "income") bucket.income += occ.amount;
    else bucket.expenses += occ.amount;
    byDay.set(occ.occurrence_date, bucket);
  }

  let running = 0;
  return eachDayISO(range.start, range.end).map((date) => {
    const { income, expenses } = byDay.get(date) ?? { income: 0, expenses: 0 };
    const disposable = income - expenses;
    running += disposable;
    return { date, income, expenses, disposable, cumulative: running };
  });
}

// ── SeedDataProvider (public /demo/* routes) ──────────────────────────────────

/**
 * The bills the demo opens with already paid.
 *
 * The seed names *which* items are paid; the dates are worked out here, from
 * each item's own recurrence inside the period the visitor lands on. That is
 * why it has to happen in code rather than in the seed file: the app shifts an
 * occurrence that falls on a weekend to the Monday, and a fulfillment only
 * matches if it sits on the same shifted date. Writing the dates down by hand
 * meant they were right on the day they were written and wrong ever after.
 */
function seedFulfillments(items: RecurringItem[]): Fulfillment[] {
  const period = getCurrentPeriod(
    seed.profile.pay_frequency,
    seed.profile.anchor_day,
  );
  const paid = new Set(seed.paidThisPeriod);
  const occurrences = generateOccurrences(
    items.filter((item) => paid.has(item.id)),
    period.start,
    period.end,
  );

  // One fulfillment per item — its first occurrence in this period. A weekly
  // shop has four or five, and marking every one of them paid would leave the
  // "to pay" list empty, which is not what a mid-period budget looks like.
  const seen = new Set<string>();
  return occurrences
    .filter((occ) => {
      if (seen.has(occ.item_id)) return false;
      seen.add(occ.item_id);
      return true;
    })
    .map((occ, index) => ({
      id: `seed-fulfillment-${index + 1}`,
      user_id: "demo-user",
      recurring_item_id: occ.item_id,
      period_start: period.start,
      occurrence_date: occ.occurrence_date,
      fulfilled_at: `${occ.occurrence_date}T09:00:00.000Z`,
    }));
}

/**
 * The demo is the real app on a database that forgets.
 *
 * Every write below actually writes — to React state seeded from
 * `src/data/seed.ts`, never to Supabase. Nothing is a no-op and nothing asks
 * the visitor to sign in: a demo is seeded and starts over on the next page
 * load, so nothing here was ever theirs to lose, and "Sign in to save" would be
 * a promise about data that does not exist. See the demo-and-seed house rule.
 *
 * The one thing that differs from the paying app is the forgetting. Reload and
 * you are back to the seed.
 */
export function SeedDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecurringItem[]>(() => [
    ...seed.recurringItems,
  ]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>(() =>
    seedFulfillments(seed.recurringItems),
  );
  const [profile, setProfile] = useState<Profile>(() => ({ ...seed.profile }));

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Math.random());

  const provider: AppDataProvider = {
    useProfile: () => ({ data: profile, isLoading: false }),

    useUpdateProfile: () => {
      const save = (input: ProfileInput) =>
        setProfile((prev) => ({ ...prev, ...input }));
      return {
        mutate: save,
        mutateAsync: async (input: ProfileInput) => save(input),
        isPending: false,
      };
    },

    useUpdateAccount: () => {
      const save = (input: AccountInput) =>
        setProfile((prev) => ({
          ...prev,
          ...(input.full_name !== undefined && { full_name: input.full_name }),
          ...(input.avatar_url !== undefined && {
            avatar_url: input.avatar_url,
          }),
        }));
      return {
        mutate: save,
        mutateAsync: async (input: AccountInput) => save(input),
        isPending: false,
      };
    },

    // A real photo, shrunk to a data URL and held in memory. There is no bucket
    // to upload to in the demo, and there does not need to be — the picture only
    // has to survive until the page reloads.
    useUploadAvatar: () => {
      const upload = async (file: File): Promise<string | null> => {
        const dataUrl = await fileToAvatarDataUrl(file);
        setProfile((prev) => ({ ...prev, avatar_url: dataUrl }));
        return dataUrl;
      };
      return {
        mutate: (file: File) => {
          void upload(file).catch((error: unknown) =>
            toast(error instanceof Error ? error.message : "That photo would not open"),
          );
        },
        mutateAsync: upload,
        isPending: false,
      };
    },

    useRecurringItems: (filters) => {
      const data = items
        .filter((item) => !filters.type || item.type === filters.type)
        .slice()
        .sort(RECURRING_SORT);
      return { data, isLoading: false };
    },

    useRecurringItem: (id) => ({
      data: items.find((item) => item.id === id) ?? null,
      isLoading: false,
    }),

    useCreateRecurringItem: () => {
      const create = (input: CreateItemInput): RecurringItem => {
        const item: RecurringItem = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : String(Math.random()),
          user_id: "demo",
          created_at: new Date().toISOString(),
          ...input,
        };
        setItems((prev) => [...prev, item]);
        return item;
      };
      return {
        mutate: (input: CreateItemInput) => {
          create(input);
        },
        mutateAsync: async (input: CreateItemInput) => create(input),
        isPending: false,
      };
    },


    useUpdateRecurringItem: () => {
      const save = (input: UpdateItemInput) =>
        setItems((prev) =>
          prev.map((item) =>
            item.id === input.id
              ? {
                  ...item,
                  ...(input.name !== undefined && { name: input.name }),
                  ...(input.amount !== undefined && { amount: input.amount }),
                  ...(input.category !== undefined && {
                    category: input.category,
                  }),
                  ...(input.frequency !== undefined && {
                    frequency: input.frequency,
                  }),
                  ...(input.start_date !== undefined && {
                    start_date: input.start_date,
                  }),
                  ...(input.end_date !== undefined && {
                    end_date: input.end_date,
                  }),
                }
              : item,
          ),
        );
      return {
        mutate: save,
        mutateAsync: async (input: UpdateItemInput) => save(input),
        isPending: false,
      };
    },

    // Deleting an item takes its fulfillments with it, the way the database's
    // foreign key would. Otherwise "last paid" would keep quoting a bill that
    // no longer exists.
    useDeleteRecurringItem: () => {
      const remove = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setFulfillments((prev) =>
          prev.filter((f) => f.recurring_item_id !== id),
        );
      };
      return {
        mutate: remove,
        mutateAsync: async (id: string) => remove(id),
        isPending: false,
      };
    },

    useFulfillments: (filters) => ({
      data: fulfillments
        .filter((f) => f.period_start === filters.periodStart)
        .slice()
        .sort((a, b) => a.fulfilled_at.localeCompare(b.fulfilled_at)),
      isLoading: false,
    }),

    useAllFulfillments: () => ({
      data: fulfillments
        .slice()
        .sort((a, b) => b.occurrence_date.localeCompare(a.occurrence_date)),
      isLoading: false,
    }),

    useCreateFulfillment: () => {
      const create = (input: CreateFulfillmentInput): Fulfillment => {
        const record: Fulfillment = {
          id: newId(),
          user_id: "demo-user",
          recurring_item_id: input.recurring_item_id,
          period_start: input.period_start,
          occurrence_date: input.occurrence_date,
          fulfilled_at: new Date().toISOString(),
        };
        setFulfillments((prev) => [...prev, record]);
        return record;
      };
      return {
        mutate: (input: CreateFulfillmentInput) => {
          create(input);
        },
        mutateAsync: async (input: CreateFulfillmentInput) => create(input),
        isPending: false,
      };
    },

    useDeleteFulfillment: () => {
      const remove = (id: string) =>
        setFulfillments((prev) => prev.filter((f) => f.id !== id));
      return {
        mutate: remove,
        mutateAsync: async (id: string) => remove(id),
        isPending: false,
      };
    },

    useOverviewData: (filters) => {
      const prev = previousRange({
        start: filters.periodStart,
        end: filters.periodEnd,
      });
      // Range-aware: the interval selector can span several pay periods.
      const inRange = fulfillments.filter(
        (f) =>
          f.period_start >= filters.periodStart &&
          f.period_start <= filters.periodEnd,
      );
      const data = computeOverview(
        items,
        inRange,
        { start: filters.periodStart, end: filters.periodEnd },
        prev,
      );
      return { data, isLoading: false };
    },

    useCategoryDonut: (filters) => ({
      data: computeCategoryDonut(items, {
        start: filters.periodStart,
        end: filters.periodEnd,
      }),
      isLoading: false,
    }),

    useChartHistory: (filters) => ({
      data: computeDailySeries(items, {
        start: filters.startDate,
        end: filters.endDate,
      }),
      isLoading: false,
    }),
  };

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}

// ── SupabaseDataProvider (protected /* routes) ────────────────────────────────

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();

  const provider: AppDataProvider = {
    useProfile: () => {
      const q = useQuery({
        queryKey: ["profiles", uid],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("profiles")
            // full_name and avatar_url are selected on purpose: a column that
            // exists but is never selected is the same as having no photo.
            .select(
              "id, currency, pay_frequency, anchor_day, dark_mode, ftux_completed, full_name, avatar_url",
            )
            .eq("id", uid!)
            .maybeSingle();
          if (error) throw error;
          return (data ?? null) as Profile | null;
        },
        enabled: !!uid,
      });
      return { data: q.data ?? null, isLoading: q.isLoading };
    },

    useUpdateProfile: () => {
      const mutation = useMutation({
        mutationFn: async (input: ProfileInput) => {
          // Upsert so brand-new users (no trigger-created profile row) still save cleanly.
          const { error } = await supabase
            .from("profiles")
            .upsert({
              id: uid!,
              currency: input.currency,
              pay_frequency: input.pay_frequency,
              anchor_day: input.anchor_day,
              ftux_completed: input.ftux_completed ?? true,
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
          if (error) throw error;
        },
        onMutate: async (input: ProfileInput) => {
          await queryClient.cancelQueries({ queryKey: ["profiles", uid] });
          const previous = queryClient.getQueryData<Profile | null>([
            "profiles",
            uid,
          ]);
          queryClient.setQueryData<Profile | null>(["profiles", uid], (old) =>
            old ? { ...old, ...input } : old,
          );
          return { previous };
        },
        onError: (_err, _input, context) => {
          queryClient.setQueryData(["profiles", uid], context?.previous);
          toast.error("Could not save settings. Check your connection and try again.");
        },
        onSuccess: () => toast.success("Settings saved"),
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: ["profiles", uid] }),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useUpdateAccount: () => {
      const mutation = useMutation({
        mutationFn: async (input: AccountInput) => {
          const { error } = await supabase
            .from("profiles")
            .upsert(
              {
                id: uid!,
                ...(input.full_name !== undefined
                  ? { full_name: input.full_name }
                  : {}),
                ...(input.avatar_url !== undefined
                  ? { avatar_url: input.avatar_url }
                  : {}),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          if (error) throw error;
        },
        onError: () =>
          toast.error("Could not save your account. Check your connection and try again."),
        // The new photo has to appear everywhere the avatar is shown — the menu
        // trigger included — without a reload. One invalidate does that,
        // because every avatar reads the same profile query.
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: ["profiles", uid] }),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useUploadAvatar: () => {
      const mutation = useMutation({
        mutationFn: async (file: File) => {
          // Shrunk in the browser and kept on the profile row itself. There is
          // no file bucket: this workspace does not allow public ones, and a
          // link that expires would leave a face missing later.
          const dataUrl = await fileToAvatarDataUrl(file);

          const { error } = await supabase
            .from("profiles")
            .upsert(
              {
                id: uid!,
                avatar_url: dataUrl,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          if (error) throw error;
          return dataUrl;
        },
        // A failed save says so and leaves the old photo alone — nothing here
        // clears avatar_url on the way out.
        onError: () => toast.error("Could not save that photo. Your old one is still there."),
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: ["profiles", uid] }),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useRecurringItems: (filters) => {
      const q = useQuery({
        queryKey: ["recurring_items", uid, filters],
        queryFn: async () => {
          let query = supabase
            .from("recurring_items")
            .select(
              "id, user_id, name, amount, type, category, frequency, start_date, end_date, created_at",
            )
            .eq("user_id", uid!);
          if (filters.type) query = query.eq("type", filters.type);
          const { data, error } = await query.order("amount", {
            ascending: false,
          });
          if (error) throw error;
          return (data ?? []) as RecurringItem[];
        },
        enabled: !!uid,
      });
      return { data: q.data ?? [], isLoading: q.isLoading };
    },

    useRecurringItem: (id) => {
      const q = useQuery({
        queryKey: ["recurring_items", uid, id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("recurring_items")
            .select(
              "id, user_id, name, amount, type, category, frequency, start_date, end_date, created_at",
            )
            .eq("user_id", uid!)
            .eq("id", id)
            .single();
          if (error) throw error;
          return data as RecurringItem;
        },
        enabled: !!uid && !!id,
      });
      return { data: q.data ?? null, isLoading: q.isLoading };
    },

    useCreateRecurringItem: () => {
      const mutation = useMutation({
        mutationFn: async (input: CreateItemInput) => {
          const { data, error } = await supabase
            .from("recurring_items")
            .insert({ user_id: uid, ...input })
            .select()
            .single();
          if (error) throw error;
          return data as RecurringItem;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["recurring_items", uid] });
        },
        onError: () =>
          toast.error("Could not save item. Check your connection and try again."),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useUpdateRecurringItem: () => {
      const mutation = useMutation({
        mutationFn: async (input: UpdateItemInput) => {
          const { id, ...changes } = input;
          const { error } = await supabase
            .from("recurring_items")
            .update({ ...changes, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", uid!);
          if (error) throw error;
        },
        onMutate: async (input: UpdateItemInput) => {
          await queryClient.cancelQueries({ queryKey: ["recurring_items", uid] });
          const previousList = queryClient.getQueriesData<RecurringItem[]>({
            queryKey: ["recurring_items", uid],
          });
          const previousItem = queryClient.getQueryData<RecurringItem | null>([
            "recurring_items",
            uid,
            input.id,
          ]);
          // Optimistically patch every cached list variant + the single-item cache.
          queryClient.setQueriesData<RecurringItem[]>(
            { queryKey: ["recurring_items", uid] },
            (old) =>
              Array.isArray(old)
                ? old.map((item) =>
                    item.id === input.id ? { ...item, ...input } : item,
                  )
                : old,
          );
          queryClient.setQueryData<RecurringItem | null>(
            ["recurring_items", uid, input.id],
            (old) => (old ? { ...old, ...input } : old),
          );
          return { previousList, previousItem };
        },
        onError: (_err, input, context) => {
          context?.previousList?.forEach(([key, value]) =>
            queryClient.setQueryData(key, value),
          );
          queryClient.setQueryData(
            ["recurring_items", uid, input.id],
            context?.previousItem,
          );
          toast.error("Could not save changes. Check your connection and try again.");
        },
        onSuccess: () => toast.success("Changes saved"),
        onSettled: (_data, _err, input) => {
          queryClient.invalidateQueries({ queryKey: ["recurring_items", uid] });
          queryClient.invalidateQueries({
            queryKey: ["recurring_items", uid, input.id],
          });
        },
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useDeleteRecurringItem: () => {
      const mutation = useMutation({
        mutationFn: async (id: string) => {
          const { error } = await supabase
            .from("recurring_items")
            .delete()
            .eq("id", id)
            .eq("user_id", uid!);
          if (error) throw error;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["recurring_items", uid] });
          queryClient.invalidateQueries({ queryKey: ["fulfillments", uid] });
        },
        onError: () =>
          toast.error("Could not delete item. Check your connection and try again."),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useFulfillments: (filters) => {
      const q = useQuery({
        queryKey: ["fulfillments", uid, filters.periodStart],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("fulfillments")
            .select(
              "id, user_id, recurring_item_id, period_start, occurrence_date, fulfilled_at",
            )
            .eq("user_id", uid!)
            .eq("period_start", filters.periodStart)
            .order("fulfilled_at", { ascending: true });
          if (error) throw error;
          return (data ?? []) as Fulfillment[];
        },
        enabled: !!uid,
      });
      return { data: q.data ?? [], isLoading: q.isLoading };
    },

    useAllFulfillments: () => {
      const q = useQuery({
        queryKey: ["fulfillments", uid, "all"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("fulfillments")
            .select(
              "id, user_id, recurring_item_id, period_start, occurrence_date, fulfilled_at",
            )
            .eq("user_id", uid!)
            .order("occurrence_date", { ascending: false });
          if (error) throw error;
          return (data ?? []) as Fulfillment[];
        },
        enabled: !!uid,
      });
      return { data: q.data ?? [], isLoading: q.isLoading };
    },

    useCreateFulfillment: () => {
      const mutation = useMutation({
        mutationFn: async (input: CreateFulfillmentInput) => {
          const { data, error } = await supabase
            .from("fulfillments")
            .insert({
              user_id: uid,
              recurring_item_id: input.recurring_item_id,
              period_start: input.period_start,
              occurrence_date: input.occurrence_date,
              fulfilled_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          return data as Fulfillment;
        },
        onMutate: async (input: CreateFulfillmentInput) => {
          const key = ["fulfillments", uid, input.period_start];
          await queryClient.cancelQueries({ queryKey: key });
          const previous = queryClient.getQueryData<Fulfillment[]>(key);
          const optimistic: Fulfillment = {
            id: `optimistic-${input.recurring_item_id}-${input.occurrence_date}`,
            user_id: uid ?? "",
            recurring_item_id: input.recurring_item_id,
            period_start: input.period_start,
            occurrence_date: input.occurrence_date,
            fulfilled_at: new Date().toISOString(),
          };
          queryClient.setQueryData<Fulfillment[]>(key, (old) => [
            ...(old ?? []),
            optimistic,
          ]);
          return { previous, key };
        },
        onError: (_err, _input, context) => {
          if (context) queryClient.setQueryData(context.key, context.previous);
          toast.error("Could not mark as paid. Check your connection and try again.");
        },
        onSettled: (_data, _err, input) =>
          queryClient.invalidateQueries({
            queryKey: ["fulfillments", uid, input.period_start],
          }),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useDeleteFulfillment: () => {
      const mutation = useMutation({
        mutationFn: async (id: string) => {
          const { error } = await supabase
            .from("fulfillments")
            .delete()
            .eq("id", id)
            .eq("user_id", uid!);
          if (error) throw error;
        },
        onMutate: async (id: string) => {
          const snapshots = queryClient.getQueriesData<Fulfillment[]>({
            queryKey: ["fulfillments", uid],
          });
          await queryClient.cancelQueries({ queryKey: ["fulfillments", uid] });
          queryClient.setQueriesData<Fulfillment[]>(
            { queryKey: ["fulfillments", uid] },
            (old) => (Array.isArray(old) ? old.filter((f) => f.id !== id) : old),
          );
          return { snapshots };
        },
        onError: (_err, _id, context) => {
          context?.snapshots?.forEach(([key, value]) =>
            queryClient.setQueryData(key, value),
          );
          toast.error("Could not undo. Check your connection and try again.");
        },
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: ["fulfillments", uid] }),
      });
      return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
      };
    },

    useOverviewData: (filters) => {
      const profileQuery = provider.useProfile();
      const itemsQuery = provider.useRecurringItems({});
      // All fulfillments: the selected interval can span several pay periods.
      const fulfillmentsQuery = provider.useAllFulfillments();

      const freq = profileQuery.data?.pay_frequency ?? "Monthly";
      const anchor = profileQuery.data?.anchor_day ?? 25;

      const data = useMemo(
        () =>
          computeOverview(
            itemsQuery.data,
            fulfillmentsQuery.data,
            { start: filters.periodStart, end: filters.periodEnd },
            previousRange({ start: filters.periodStart, end: filters.periodEnd }),
          ),
        [
          itemsQuery.data,
          fulfillmentsQuery.data,
          filters.periodStart,
          filters.periodEnd,
          freq,
          anchor,
        ],
      );

      return {
        data,
        isLoading:
          itemsQuery.isLoading ||
          fulfillmentsQuery.isLoading ||
          profileQuery.isLoading,
      };
    },

    useCategoryDonut: (filters) => {
      const itemsQuery = provider.useRecurringItems({ type: "expense" });
      const data = useMemo(
        () =>
          computeCategoryDonut(itemsQuery.data, {
            start: filters.periodStart,
            end: filters.periodEnd,
          }),
        [itemsQuery.data, filters.periodStart, filters.periodEnd],
      );
      return { data, isLoading: itemsQuery.isLoading };
    },

    useChartHistory: (filters) => {
      // Real mode derives the same daily series from the user's recurring items.
      const itemsQuery = provider.useRecurringItems({});

      const data = useMemo(
        () =>
          computeDailySeries(itemsQuery.data, {
            start: filters.startDate,
            end: filters.endDate,
          }),
        [itemsQuery.data, filters.startDate, filters.endDate],
      );

      return { data, isLoading: itemsQuery.isLoading };
    },
  };

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
