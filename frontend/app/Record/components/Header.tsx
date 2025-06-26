import React from "react";

const Header = () => {
    return (
        <header style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "transparent",
            color: "#fff",
            position: "relative",
            zIndex: 10
        }}>
            <h1 style={{
                margin: 0,
                fontSize: "3rem",
                fontWeight: "500",
                background: "linear-gradient(135deg, var(--white), var(--naples-yellow))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "var(--white)",
                letterSpacing: "-0.02em",
                marginBottom: "16px"
            }}>
                Record Studio
            </h1>
            <p style={{
                fontSize: "1.2rem",
                color: "#FFFFFF",
                fontWeight: "400",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.5"
            }}>
                Professional video recording with real-time preview and seamless upload
            </p>
            <div style={{
                marginTop: "12px",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontWeight: "500"
            }}>
                <span>Ready to capture your best performance</span>
            </div>
        </header>
    );
};

export default Header;