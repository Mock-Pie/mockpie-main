'use client';

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "./constants";
import { getFromStorage } from "./utils";
import { STORAGE_KEYS } from "./constants";
import LoadingSpinner from "./components/shared/LoadingSpinner";

const HomePage = () => {
    const router = useRouter();

    useEffect(() => {
        const checkAuthAndRedirect = () => {
            const token = getFromStorage<string>(STORAGE_KEYS.ACCESS_TOKEN);
            const userData = getFromStorage(STORAGE_KEYS.USER_DATA);

            if (token && userData) {
                // User is authenticated, redirect to dashboard
                router.push(ROUTES.DASHBOARD);
            } else {
                // User is not authenticated, redirect to login
                router.push(ROUTES.LOGIN);
            }
        };

        checkAuthAndRedirect();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" />
        </div>
    );
}

export default HomePage;