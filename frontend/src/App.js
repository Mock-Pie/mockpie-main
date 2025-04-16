import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [apiUrl, setApiUrl] = useState("");

    useEffect(() => {
        // Determine the API URL based on the environment
        const url = window.location.hostname === "localhost" 
            ? "http://localhost"  // Running in browser on host machine
            : "http://backend:8000";   // Running inside Docker (for SSR, etc.)
            
        setApiUrl(url);
        console.log("Using API URL:", url);
        
        // Test the message endpoint
        axios.get(`${url}/message/`, { timeout: 5000 })
            .then(response => {
                console.log("Message API response:", response.data);
                setMessage(response.data.message);
                setLoading(false);
            })
            .catch(error => {
                console.error("Message API Error:", error);
                let errorInfo = {
                    message: error.message,
                    config: error.config,
                };
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    errorInfo.response = {
                        data: error.response.data,
                        status: error.response.status,
                        headers: error.response.headers,
                    };
                } else if (error.request) {
                    // The request was made but no response was received
                    errorInfo.request = error.request;
                }
                setError(`Message API failed: ${error.message}`);
                setErrorDetails(errorInfo);
                setLoading(false);
            });
            
        // Separate call for CORS test
        axios.get(`${url}/test-cors`, { timeout: 5000 })
            .then(response => {
                console.log("CORS test response:", response.data);
            })
            .catch(error => {
                console.error("CORS test error:", error);
                let errorInfo = {
                    message: error.message,
                    config: error.config,
                };
                if (error.response) {
                    errorInfo.response = {
                        data: error.response.data,
                        status: error.response.status,
                        headers: error.response.headers,
                    };
                } else if (error.request) {
                    errorInfo.request = error.request;
                }
                setError(`CORS test failed: ${error.message}`);
                setErrorDetails(errorInfo);
            });
    }, []);

    return (
        <div>
            <h1>MockPie Application</h1>
            
            <div style={{background: "#f5f5f5", padding: "10px", margin: "10px 0", border: "1px solid #ddd"}}>
                <h2>Debug Information:</h2>
                <p>API URL: {apiUrl}</p>
                <p>Connection Status: {loading ? "Connecting..." : error ? "Error" : "Connected"}</p>
                {error && <p style={{color: "red"}}>{error}</p>}
                {errorDetails && (
                    <div style={{color: "red", marginTop: "10px"}}>
                        <h3>Error Details:</h3>
                        <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                    </div>
                )}
            </div>
            
            {loading ? (
                <p>Loading data from backend...</p>
            ) : error ? (
                <div style={{color: 'red', padding: '10px', border: '1px solid red'}}>
                    {error}
                </div>
            ) : (
                <div>
                    <div style={{
                        margin: "20px 0",
                        padding: "15px",
                        backgroundColor: "#f0f0f0",
                        borderLeft: "5px solid #3498db"
                    }}>
                        <h2>Message from Backend:</h2>
                        <p>{message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
