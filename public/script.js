const API = "http://localhost:3000";

// ======================
// PROFILE
// ======================
async function loadProfile() {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API}/profile`, {
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        const profile = await res.json();

        document.getElementById("hero-name").textContent =
            profile.name || "";

        document.getElementById("hero-subtitle").textContent =
            profile.subtitle || "";

        document.getElementById("hero-intro").textContent =
            profile.intro || "";
    } catch (err) {
        console.log("Profile load error");
    }
}

// ======================
// PROJECTS (CMS DATA)
// ======================
async function loadProjects() {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API}/projects`, {
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        const projects = await res.json();

        const container =
            document.querySelector(".project-list");

        container.innerHTML = projects
            .map(
                (project, index) => `
        <a href="${project.link || "#"}"
           class="project-card ${index >= 4 ? "hidden" : ""
                    }"
           target="_blank">

            <div class="project-thumb ${project.thumbClass || ""
                    }">
                <span>${project.code || ""}</span>
            </div>

            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <span class="view-more">View details →</span>
            </div>

        </a>
      `
            )
            .join("");

        initShowMore();
    } catch (err) {
        console.log("Projects load error");
    }
}

// ======================
// REVEAL ANIMATION
// ======================
const reveal = () => {
    const reveals = document.querySelectorAll(".reveal");

    reveals.forEach((el) => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;

        if (elementTop < windowHeight - 150) {
            el.classList.add("active");
        }
    });
};

window.addEventListener("scroll", reveal);

// ======================
// SMOOTH SCROLL
// ======================
const initSmoothScroll = () => {
    document
        .querySelectorAll('a[href^="#"]')
        .forEach((anchor) => {
            if (anchor.target === "_blank") return;

            anchor.addEventListener("click", function (e) {
                const target = document.querySelector(
                    this.getAttribute("href")
                );

                if (target) {
                    e.preventDefault();

                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: "smooth",
                    });
                }
            });
        });
};

// ======================
// LEAF ANIMATION
// ======================
const initLeafMotion = () => {
    window.addEventListener("scroll", () => {
        const leaves = document.querySelectorAll(
            ".leaf-decoration"
        );

        if (!leaves.length) return;

        const value = window.scrollY;

        leaves.forEach((leaf, index) => {
            const speed = index === 0 ? 0.45 : 0.25;

            leaf.style.top = `${value * speed + (index === 0 ? 120 : 220)
                }px`;
        });
    });
};

// ======================
// SHOW MORE PROJECTS
// ======================
const initShowMore = () => {
    const btn = document.getElementById("show-more-btn");

    if (!btn) return;

    btn.onclick = () => {
        const hidden = document.querySelectorAll(
            ".project-card.hidden"
        );

        if (hidden.length > 0) {
            hidden.forEach((c) => c.classList.remove("hidden"));
            btn.textContent = "Show less projects";
        } else {
            const all = document.querySelectorAll(
                ".project-card"
            );

            all.forEach((c, i) => {
                if (i >= 4) c.classList.add("hidden");
            });

            btn.textContent = "Show more projects";
        }
    };
};

// ======================
// EXTERNAL LINKS
// ======================
const initExternalLinks = () => {
    document
        .querySelectorAll(".references a")
        .forEach((link) => {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        });
};

// ======================
// INIT APP
// ======================
window.addEventListener("DOMContentLoaded", async () => {
    await loadProfile();
    await loadProjects();

    initSmoothScroll();
    initLeafMotion();
    initExternalLinks();

    reveal();
});