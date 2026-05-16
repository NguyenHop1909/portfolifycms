require('dotenv').config();

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const cloudinary =
    require('cloudinary').v2;

const {
    CloudinaryStorage
} = require(
    'multer-storage-cloudinary'
);

const { Octokit } =
    require('@octokit/rest');

const app = express();


// =========================
// GITHUB CONFIG
// =========================
const octokit = new Octokit({

    auth:
        process.env.GITHUB_TOKEN

});


// =========================
// CLOUDINARY CONFIG
// =========================
cloudinary.config({

    cloud_name:
        process.env
            .CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env
            .CLOUDINARY_API_KEY,

    api_secret:
        process.env
            .CLOUDINARY_API_SECRET

});


// =========================
// EXPRESS CONFIG
// =========================
app.use(cors());

app.use(express.json());


// =========================
// CLOUDINARY STORAGE
// =========================
const storage =
    new CloudinaryStorage({

        cloudinary,

        params: {

            folder: 'portfolio',

            allowed_formats: [
                'jpg',
                'jpeg',
                'png',
                'webp'
            ]

        }

    });

const upload = multer({
    storage
});


// =========================
// LOGIN API
// =========================
app.post('/login', (req, res) => {

    const { password } = req.body;

    if (
        password !==
        process.env.ADMIN_PASSWORD
    ) {

        return res.status(401).json({
            error: 'Wrong password'
        });

    }

    const token = jwt.sign(

        { admin: true },

        process.env.JWT_SECRET,

        { expiresIn: '7d' }

    );

    res.json({ token });

});


// =========================
// AUTH MIDDLEWARE
// =========================
function auth(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            error: 'No token'
        });

    }

    const token =
        authHeader.split(' ')[1];

    jwt.verify(

        token,

        process.env.JWT_SECRET,

        (err, user) => {

            if (err) {

                return res.status(403).json({
                    error: 'Invalid token'
                });

            }

            req.user = user;

            next();

        }

    );

}


// =========================
// UPLOAD API
// =========================
app.post(

    '/upload',

    auth,

    upload.single('image'),

    async (req, res) => {

        res.json({

            imageUrl:
                req.file.path

        });

    }

);


// =========================
// PUSH TO GITHUB
// =========================
async function pushProfileToGithub() {

    const content =
        fs.readFileSync(
            '../public/data/profile.json',
            'utf8'
        );

    const oldFile =
        await octokit.repos
            .getContent({

                owner:
                    process.env
                        .GITHUB_USERNAME,

                repo:
                    process.env
                        .GITHUB_REPO,

                path:
                    'public/data/profile.json'

            });

    await octokit.repos
        .createOrUpdateFileContents({

            owner:
                process.env
                    .GITHUB_USERNAME,

            repo:
                process.env
                    .GITHUB_REPO,

            path:
                'public/data/profile.json',

            message:
                'Update profile',

            content:
                Buffer
                    .from(content)
                    .toString('base64'),

            sha:
                oldFile.data.sha

        });

    console.log(
        'GitHub updated'
    );

}


// =========================
// SAVE PROFILE
// =========================
app.post(

    '/save-profile',

    auth,

    async (req, res) => {

        fs.writeFileSync(

            '../public/data/profile.json',

            JSON.stringify(
                req.body,
                null,
                2
            )

        );

        await pushProfileToGithub();

        res.json({
            success: true
        });

    }

);


// =========================
// START SERVER
// =========================
app.listen(3000, () => {

    console.log(
        'Server running on port 3000'
    );

});