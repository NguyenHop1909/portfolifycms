require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { Octokit } = require("@octokit/rest");

const app = express();

// =========================
// PATH BASE (FIX 100% WINDOWS SAFE)
// =========================
const DATA_DIR = path.join(__dirname, "../public/data");

// Đảm bảo thư mục dữ liệu tồn tại
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// =========================
// GITHUB CONFIG
// =========================
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

// =========================
// CLOUDINARY CONFIG
// =========================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// CLOUDINARY STORAGE
// =========================
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "portfolio",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

const upload = multer({ storage });

// =========================
// AUTH
// =========================
function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });

        req.user = user;
        next();
    });
}

// =========================
// LOGIN
// =========================
app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.json({ token });
});

// =========================
// UPLOAD IMAGE
// =========================
app.post("/upload", auth, upload.single("image"), (req, res) => {
    res.json({
        imageUrl: req.file.path,
    });
});

// =========================
// GET PROFILE
// =========================
app.get("/profile", auth, (req, res) => {
    try {
        const file = path.join(DATA_DIR, "profile.json");
        if (!fs.existsSync(file)) return res.json({ name: "", subtitle: "", image: "" });
        const data = fs.readFileSync(file, "utf8");
        res.json(JSON.parse(data || "{}"));
    } catch (error) {
        res.status(500).json({ error: "Lỗi đọc file profile" });
    }
});

// =========================
// GET PROJECTS
// =========================
app.get("/projects", auth, (req, res) => {
    try {
        const file = path.join(DATA_DIR, "projects.json");
        if (!fs.existsSync(file)) return res.json([]);
        const data = fs.readFileSync(file, "utf8");
        res.json(JSON.parse(data || "[]"));
    } catch (error) {
        res.status(500).json({ error: "Lỗi đọc file projects" });
    }
});

// =========================
// PUSH TO GITHUB (SAFE)
// =========================
async function pushToGithub(filePath, message) {
    try {
        const content = fs.readFileSync(filePath, "utf8");

        // Tính toán đường dẫn tương đối từ gốc project để lưu trên GitHub
        const githubPath = path
            .relative(path.join(__dirname, ".."), filePath)
            .replace(/\\/g, "/");

        let sha;

        // Thử lấy file hiện tại để lấy mã SHA (cần thiết để update file)
        try {
            const { data } = await octokit.repos.getContent({
                owner: process.env.GITHUB_USERNAME,
                repo: process.env.GITHUB_REPO,
                path: githubPath,
            });
            if (!Array.isArray(data)) sha = data.sha;
        } catch (e) {
            if (e.status !== 404) throw e;
            console.log(`File ${githubPath} mới, sẽ được tạo mới trên GitHub.`);
        }

        // Tương đương git add + commit + push
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: githubPath,
            message: `${message} [via CMS]`,
            content: Buffer.from(content).toString("base64"),
            sha: sha || undefined,
        });
        return true;
    } catch (error) {
        console.error("Lỗi khi push lên GitHub:", error.message);
        throw error;
    }
}

// =========================
// SAVE PROFILE
// =========================
app.post("/save-profile", auth, async (req, res) => {
    try {
        const file = path.join(DATA_DIR, "profile.json");
        fs.writeFileSync(file, JSON.stringify(req.body, null, 2));

        await pushToGithub(file, "Update profile info");

        res.json({ success: true, message: "Đã lưu và đồng bộ GitHub thành công!" });
    } catch (error) {
        res.status(500).json({ error: "Không thể lưu hoặc đồng bộ", details: error.message });
    }
});

// =========================
// SAVE PROJECTS
// =========================
app.post("/save-projects", auth, async (req, res) => {
    try {
        const file = path.join(DATA_DIR, "projects.json");
        fs.writeFileSync(file, JSON.stringify(req.body, null, 2));

        await pushToGithub(file, "Update projects list");

        res.json({ success: true, message: "Dự án đã được cập nhật lên GitHub!" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi đồng bộ dự án", details: error.message });
    }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});