import { useState } from "react";
import axios from "axios";

export default function App() {
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");

    const login = async () => {
        const res = await axios.post("http://localhost:3000/login", {
            password,
        });

        setToken(res.data.token);
        alert("Login OK");
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Admin Login</h2>

            <input
                placeholder="password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={login}>Login</button>
        </div>
    );
}