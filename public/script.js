async function loadProfile() {

    const res = await fetch('./data/profile.json');
    const profile = await res.json();

    document.getElementById('hero-name')
        .textContent = profile.name;

    document.getElementById('hero-subtitle')
        .textContent = profile.subtitle;

    document.getElementById('hero-intro')
        .textContent = profile.intro;
}

async function loadProjects() {

    const res =
        await fetch('./data/projects.json');

    const projects =
        await res.json();

    const container =
        document.querySelector('.project-list');

    container.innerHTML = projects.map((project, index) => `

        <a href="${project.link}"
           class="project-card ${index >= 4 ? 'hidden' : ''}"
           target="_blank">

            <div class="project-thumb ${project.thumbClass}"
                 aria-hidden="true">

                <span>${project.code}</span>

            </div>

            <div class="project-info">

                <h3>${project.title}</h3>

                <p>${project.description}</p>

                <span class="view-more">
                    View details →
                </span>

            </div>

        </a>

    `).join('');

    initShowMore();
}

// Reveal elements on scroll
const reveal = () => {

    const reveals =
        document.querySelectorAll('.reveal');

    reveals.forEach(el => {

        const windowHeight =
            window.innerHeight;

        const elementTop =
            el.getBoundingClientRect().top;

        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {

            el.classList.add('active');

        }

    });

};

const initSmoothScroll = () => {

    document.querySelectorAll('a[href^="#"]')
        .forEach(anchor => {

            // Skip if it's an external link or opens in new tab
            if (anchor.target === '_blank') return;

            anchor.addEventListener('click', function (e) {

                const target =
                    document.querySelector(
                        this.getAttribute('href')
                    );

                if (target) {

                    e.preventDefault();

                    window.scrollTo({

                        top: target.offsetTop - 80,

                        behavior: 'smooth'

                    });

                }

            });

        });

};

const initLeafMotion = () => {

    window.addEventListener('scroll', () => {

        const leaves =
            document.querySelectorAll('.leaf-decoration');

        if (!leaves.length) return;

        const value = window.scrollY;

        leaves.forEach((leaf, index) => {

            const speed =
                index === 0 ? 0.45 : 0.25;

            leaf.style.top =
                `${value * speed + (index === 0 ? 120 : 220)}px`;

        });

    });

};

window.addEventListener('scroll', reveal);

const initShowMore = () => {

    const showMoreBtn =
        document.getElementById('show-more-btn');

    if (!showMoreBtn) return;

    showMoreBtn.onclick = () => {

        const hiddenProjects =
            document.querySelectorAll(
                '.project-card.hidden'
            );

        const isHidden =
            hiddenProjects.length > 0;

        if (isHidden) {

            hiddenProjects.forEach(card => {
                card.classList.remove('hidden');
            });

            showMoreBtn.textContent =
                'Show less projects';

        } else {

            const allProjects =
                document.querySelectorAll(
                    '.project-card'
                );

            allProjects.forEach((card, index) => {

                if (index >= 4) {
                    card.classList.add('hidden');
                }

            });

            showMoreBtn.textContent =
                'Show more projects';
        }

    };

};

const initExternalLinks = () => {

    // Ensure all links in references section open in a new tab
    const refLinks =
        document.querySelectorAll('.references a');

    refLinks.forEach(link => {

        link.setAttribute('target', '_blank');

        link.setAttribute(
            'rel',
            'noopener noreferrer'
        );

    });

};

window.addEventListener('DOMContentLoaded', async () => {

    await loadProfile();

    await loadProjects();

    initSmoothScroll();

    initLeafMotion();

    initExternalLinks();

    reveal();

});