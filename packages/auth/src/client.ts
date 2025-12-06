// Stub auth client module for offline-only desktop app
import { createContext } from "react";

const AuthContext = createContext<any>(null);

export const useSession = () => ({
    data: {
        user: {
            id: "local-user",
            name: "Local User",
            email: "local@orello.app",
            image: null,
        },
    },
    status: "authenticated" as const,
    isPending: false,
});

export const signOut = async () => { };
export const signIn = async () => { };

// authClient stub that provides all needed methods
export const authClient = {
    useSession,
    signOut,
    signIn,
    apiKey: {
        list: async () => ({ data: [] }),
        create: async () => ({ data: null }),
        delete: async () => ({ data: null }),
    },
    changePassword: async () => ({ data: null }),
    deleteUser: async () => ({ data: null }),
};

export { AuthContext };

