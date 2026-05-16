import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3000";

export default function App() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);

  // ======================
  // LOAD PROFILE
  // ======================
  const loadProfile = async (tk: string) => {
    try {
      const res = await axios.get(`${API}/profile`, {
        headers: {
          Authorization: `Bearer ${tk}`,
        },
      });

      setName(res.data.name || "");
      setSubtitle(res.data.subtitle || "");
      setImage(res.data.image || "");
    } catch (err) {
      console.log("Load profile failed");
    }
  };

  // ======================
  // LOGIN
  // ======================
  const login = async () => {
    const res = await axios.post(`${API}/login`, {
      password,
    });

    const tk = res.data.token;

    setToken(tk);
    localStorage.setItem("token", tk);

    await loadProfile(tk);
  };

  // ======================
  // AUTO LOGIN
  // ======================
  useEffect(() => {
    const tk = localStorage.getItem("token");

    if (tk) {
      setToken(tk);
      loadProfile(tk);
    }
  }, []);

  // ======================
  // UPLOAD IMAGE
  // ======================
  const uploadImage = async () => {
    if (!file || !token) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(`${API}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setImage(res.data.imageUrl);
    } finally {
      setUploading(false);
    }
  };

  // ======================
  // SAVE PROFILE
  // ======================
  const saveProfile = async () => {
    if (!token) return;

    await axios.post(
      `${API}/save-profile`,
      { name, subtitle, image },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Saved to GitHub 🔥");
  };

  // ======================
  // LOGIN SCREEN
  // ======================
  if (!token) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Login CMS</h2>

        <input
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // ======================
  // DASHBOARD
  // ======================
  return (
    <div style={{ padding: 30 }}>
      <h2>🔥 CMS Dashboard</h2>

      {/* NAME */}
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />

      {/* SUBTITLE */}
      <input
        placeholder="Subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
      />
      <br />

      {/* IMAGE UPLOAD */}
      <div style={{ marginTop: 20 }}>
        <h3>Upload Image</h3>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button onClick={uploadImage} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Image"}
        </button>

        {image && (
          <div style={{ marginTop: 10 }}>
            <img
              src={image}
              style={{ width: 200, borderRadius: 10 }}
            />
          </div>
        )}
      </div>

      <br />

      <button onClick={saveProfile}>Save Profile</button>
    </div>
  );
}