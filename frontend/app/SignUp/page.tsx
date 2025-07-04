'use client';

import React from "react";
import SignUpForm from "./components/SignUpForm";
import PublicRoute from "../components/auth/PublicRoute";

const SignUpPage = () => {
    return (
        <PublicRoute>
            <SignUpForm />
        </PublicRoute>
    );
};

export default SignUpPage;