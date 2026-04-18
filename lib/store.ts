/**
 * Client-side state store using Zustand + localStorage persistence.
 * In production, this would sync with a database via API routes.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DigestSubscription, User, OnboardingState, OnboardingStep } from "./types";
import { MOCK_SUBSCRIPTION, MOCK_USER } from "./mock-data";
import { generateId } from "./utils";

interface AppStore {
  user: User | null;
  subscription: DigestSubscription | null;
  isOnboarded: boolean;
  onboarding: OnboardingState;

  setUser: (user: User) => void;
  setSubscription: (sub: DigestSubscription) => void;
  updateSubscription: (partial: Partial<DigestSubscription>) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  updateOnboarding: (partial: Partial<OnboardingState>) => void;
  completeOnboarding: () => void;
  loadDemoData: () => void;
  reset: () => void;
}

function getDefaultOnboarding(): OnboardingState {
  return {
    step: "welcome",
    name: "",
    sections: [
      { id: generateId(), title: "Today's Weather", type: "weather", config: { city: "New York" },                          order: 0, enabled: true, mode: "brief" },
      { id: generateId(), title: "Morning Headlines", type: "news",   config: { categories: ["general"] },                   order: 1, enabled: true, mode: "brief" },
      { id: generateId(), title: "Sports News",       type: "sports", config: { leagues: [] },                               order: 2, enabled: true, mode: "brief" },
      { id: generateId(), title: "Market Snapshot",   type: "finance",config: { tickers: [] },                              order: 3, enabled: true, mode: "brief" },
      { id: generateId(), title: "Quote of the Day",  type: "quote",  config: { tone: "any" },                               order: 4, enabled: true, mode: "brief" },
    ],
    delivery: {
      time: "07:00",
      timezone: "America/New_York",
      channels: ["email"],
      email: "",
    },
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      isOnboarded: false,
      onboarding: getDefaultOnboarding(),

      setUser: (user: User) => set({ user }),

      setSubscription: (subscription: DigestSubscription) => set({ subscription }),

      updateSubscription: (partial: Partial<DigestSubscription>) => {
        const current = get().subscription;
        if (!current) return;
        set({ subscription: { ...current, ...partial, updatedAt: new Date().toISOString() } });
      },

      setOnboardingStep: (step: OnboardingStep) =>
        set((s) => ({ onboarding: { ...s.onboarding, step } })),

      updateOnboarding: (partial: Partial<OnboardingState>) =>
        set((s) => ({ onboarding: { ...s.onboarding, ...partial } })),

      completeOnboarding: () => {
        const { onboarding } = get();
        const userId = generateId();
        const subId = generateId();
        const now = new Date().toISOString();

        const user: User = {
          id: userId,
          name: onboarding.name,
          email: onboarding.delivery.email,
          phone: onboarding.delivery.phone,
          timezone: onboarding.delivery.timezone,
          createdAt: now,
          updatedAt: now,
        };

        const subscription: DigestSubscription = {
          id: subId,
          userId,
          name: "My Morning Digest",
          sections: onboarding.sections.map((s, i) => ({ ...s, order: i })),
          delivery: onboarding.delivery,
          status: "active",
          templateId: onboarding.templateId,
          createdAt: now,
          updatedAt: now,
        };

        set({ user, subscription, isOnboarded: true, onboarding: getDefaultOnboarding() });
      },

      loadDemoData: () => {
        set({
          user: MOCK_USER,
          subscription: MOCK_SUBSCRIPTION,
          isOnboarded: true,
        });
      },

      reset: () =>
        set({
          user: null,
          subscription: null,
          isOnboarded: false,
          onboarding: getDefaultOnboarding(),
        }),
    }),
    {
      name: "morning-digest-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
