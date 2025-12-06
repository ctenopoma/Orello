// Stub stripe module for offline-only desktop app
export const updateSubscriptionSeats = async (subscriptionId: string, change: number) => {
    // No-op for offline app
    return {};
};

export const createCheckoutSession = async () => null;
export const createBillingSession = async () => null;
