import React from "react";
import { FiVideo, FiRadio } from "react-icons/fi";

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
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginBottom: "16px"
            }}>
                <div style={{
                    background: "var(--naples-yellow)",
                    padding: "12px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px rgba(250, 216, 93, 0.3)"
                }}>
                    <FiVideo size={32} color="var(--chinese-black)" />
                </div>
                <div style={{
                    background: "var(--naples-yellow)",
                    padding: "16px 24px",
                    borderRadius: "16px",
                    boxShadow: "0 8px 20px rgba(250, 216, 93, 0.3)"
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: "3rem",
                        fontWeight: "800",
                        color: "var(--chinese-black)",
                        letterSpacing: "-0.02em"
                    }}>
                        Record Studio
                    </h1>
                </div>
            </div>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "12px",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontWeight: "500"
            }}>
                <FiRadio size={16} />
                <span>Ready to capture your best performance</span>
            </div>
        </header>
    );
};

export default Header;