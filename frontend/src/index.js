import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8000/users/")
            .then(response => setUsers(response.data))
            .catch(error => console.error(error));
    }, []);

    return (
        <div>
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;