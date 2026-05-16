import React, { useState, useEffect } from "react";

// Tự động nhận link backend khi deploy hoặc dùng localhost khi dev
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000";
const NETLIFY_URL = "https://porfolio-ngan.netlify.app/";

const AdminDashboard = () => {
    const [token, setToken] = useState(localStorage.getItem("admin_token"));
    const [password, setPassword] = useState("");
    const [profile, setProfile] = useState({ name: "", subtitle: "", image: "" });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Kiểm tra đăng nhập & Lấy dữ liệu ban đầu
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const profRes = await fetch(`${API_BASE}/profile`, { headers });
            const projRes = await fetch(`${API_BASE}/projects`, { headers });
            if (profRes.ok) setProfile(await profRes.json());
            if (projRes.ok) setProjects(await projRes.json());
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        }
    };

    // 2. Xử lý Đăng nhập
    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem("admin_token", data.token);
            setToken(data.token);
        } else {
            alert("Sai mật khẩu rồi ní ơi!");
        }
    };

    // 3. Xử lý Upload Ảnh (Tự động cập nhật link Cloudinary vào profile)
    const handleImageUpload = async (e, type, index = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        setLoading(true);
        const res = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await res.json();
        setLoading(false);

        if (data.imageUrl) {
            if (type === "profile") {
                setProfile({ ...profile, image: data.imageUrl });
            } else if (type === "project") {
                const newProjects = [...projects];
                newProjects[index].image = data.imageUrl;
                setProjects(newProjects);
            }
            console.log("Upload ảnh thành công!");
        }
    };

    // 5. Quản lý danh sách Projects
    // Cập nhật field dựa trên index (đảm bảo immutability)
    const handleProjectChange = (index, field, value) => {
        const newProjects = [...projects];
        newProjects[index][field] = value;
        setProjects(newProjects);
    };

    const addNewProject = () => {
        setProjects([
            ...projects,
            {
                id: crypto.randomUUID(), // Tạo ID duy nhất cho mỗi project
                title: "Dự án mới",
                description: "Mô tả ngắn gọn",
                link: "#",
                image: "https://via.placeholder.com/150"
            }
        ]);
    };

    const deleteProject = (index) => {
        if (window.confirm("Ní có chắc muốn xóa dự án này không?")) {
            setProjects(projects.filter((_, i) => i !== index));
        }
    };

    // 4. Lưu và Push GitHub
    const saveAndPush = async (type) => {
        setLoading(true);
        const endpoint = type === "profile" ? "/save-profile" : "/save-projects";
        const body = type === "profile" ? profile : projects;

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                alert("🚀 " + (data.message || "Đã đồng bộ thành công! Đợi 1 phút để Netlify build lại nhé."));
            }
        } catch (err) {
            alert("Lỗi khi lưu dữ liệu!");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ padding: "50px", textAlign: "center" }}>
                <h2>🔒 Admin Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu admin..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: "10px", width: "250px" }}
                    />
                    <button type="submit" style={{ padding: "10px 20px", marginLeft: "10px" }}>Vào Dashboard</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
            {/* Overlay Loading khi đang push Git */}
            {loading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                        🔄 Đang làm việc với GitHub, đợi tí nhé ní...
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1> Portfolio CMS</h1>
                <a
                    href={NETLIFY_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold", border: "1px solid", padding: "5px 10px", borderRadius: "5px" }}
                >
                    Xem trang Portfolio ↗
                </a>
            </div>

            {/* Phần chỉnh sửa Profile */}
            <section style={{ border: "1px solid #ddd", padding: "20px", marginBottom: "20px", borderRadius: "8px" }}>
                <h2>👤 Thông tin cá nhân</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label>Họ tên:</label>
                    <input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        style={{ padding: "8px" }}
                    />
                    <label>Chức danh:</label>
                    <input
                        value={profile.subtitle}
                        onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                        style={{ padding: "8px" }}
                    />
                    <label>Ảnh đại diện:</label>
                    {profile.image && <img src={profile.image} alt="Avatar" width="100" style={{ borderRadius: "50%" }} />}
                    <input type="file" onChange={(e) => handleImageUpload(e, "profile")} />
                </div>
                <button
                    onClick={() => saveAndPush("profile")}
                    disabled={loading}
                    style={{ marginTop: "15px", backgroundColor: "#28a745", color: "white", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: "5px" }}
                >
                    Lưu Profile & Push GitHub
                </button>
            </section>

            {/* Phần quản lý Projects */}
            <section style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>📁 Quản lý dự án ({projects.length})</h2>
                    <button onClick={addNewProject} style={{ backgroundColor: "#17a2b8", color: "white", border: "none", padding: "5px 15px", borderRadius: "4px", cursor: "pointer" }}>
                        + Thêm dự án
                    </button>
                </div>

                {projects.map((proj, index) => (
                    <div key={proj.id || index} style={{ border: "1px dashed #ccc", padding: "15px", marginBottom: "15px", position: "relative", borderRadius: "5px" }}>
                        <button
                            onClick={() => deleteProject(index)}
                            style={{ position: "absolute", top: "10px", right: "10px", color: "red", border: "1px solid red", background: "none", cursor: "pointer" }}
                        >
                            Xóa
                        </button>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <input
                                placeholder="Tên dự án"
                                value={proj.title}
                                onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                                style={{ padding: "8px", fontWeight: "bold" }}
                            />
                            <textarea
                                placeholder="Mô tả"
                                value={proj.description}
                                onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                                style={{ padding: "8px" }}
                            />
                            <input
                                placeholder="Link demo"
                                value={proj.link}
                                onChange={(e) => handleProjectChange(index, "link", e.target.value)}
                                style={{ padding: "8px" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img src={proj.image} alt="Project" width="60" height="40" style={{ objectFit: "cover" }} />
                                <input type="file" onChange={(e) => handleImageUpload(e, "project", index)} />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => saveAndPush("projects")}
                    disabled={loading || projects.length === 0}
                    style={{ width: "100%", marginTop: "10px", backgroundColor: "#007bff", color: "white", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: "5px" }}
                >
                    Cập nhật toàn bộ Projects lên GitHub
                </button>
            </section>

            <button
                onClick={() => { localStorage.removeItem("admin_token"); setToken(null); }}
                style={{ marginTop: "40px", background: "none", border: "none", color: "red", cursor: "pointer", textDecoration: "underline" }}
            >
                Đăng xuất
            </button>
        </div>
    );
};

export default AdminDashboard;