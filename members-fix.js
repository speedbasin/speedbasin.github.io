(() => {
    "use strict";

    const API = "https://api.chess.com/pub";
    const CLUB_URL = `${API}/club/anti-lightspeed-and-more/members`;
    const CORS_PROXY = "https://corsproxy.io/?url=";
    const REQUEST_TIMEOUT = 12000; 

    const groups = [
        {
            name: "Super Admin",
            icon: "♛",
            players: [
                "ultra_saa", "azmdihih", "rose_5525", "glitchy81",
                "aliceluhu", "randomchiken", "Zyflin",
                "Spectrum6767", "josephtoasteph"
            ]
        },
        {
            name: "Admin",
            icon: "♜",
            players: [
                "ECZ32", "toaster1222e", "Hampder", "sh1ori_0",
                "Blazefire800", "I_sus_I", "xiaoshenfan"
            ]
        },
        {
            name: "Coordinator",
            icon: "♝",
            players: [
                "MEEP74295", "XxT_N_HxX", "collinwew", "GrindyGunk",
                "BurgerEatersInc", "shartlord77", "AaronJudge67",
                "Lukas-Swagger", "Disinigration", "Penguin_dOnuTx",
                "tim_the_mentally_depresed", "sack_smasher", "jkjump"
            ]
        }
    ];

    const leaderTotal = groups.reduce(
        (total, group) => total + group.players.length,
        0
    );

    const state = {
        completed: 0,
        total: leaderTotal + 1,
        leadershipDone: false,
        membersDone: false
    };

    const $ = id => document.getElementById(id);

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character]));
    }

    function addStyles() {
        if (document.getElementById("members-fix-styles")) return;

        const style = document.createElement("style");
        style.id = "members-fix-styles";

        style.textContent = `
            .sync-indicator {
                position: relative;
                margin: 0 0 25px;
                padding: 14px 17px;
                overflow: hidden;
                color: var(--muted);
                font-size: 13px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: rgba(38,37,34,.9);
                transition: opacity .35s, max-height .35s,
                            margin .35s, padding .35s;
            }

            .sync-indicator::after {
                position: absolute;
                right: 0;
                bottom: 0;
                left: 0;
                height: 3px;
                content: "";
                background: linear-gradient(
                    90deg,
                    var(--green) var(--progress, 0%),
                    rgba(255,255,255,.08) var(--progress, 0%)
                );
            }

            .sync-indicator.done {
                opacity: 0;
                max-height: 0;
                margin: 0;
                padding-top: 0;
                padding-bottom: 0;
            }

            .sync-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
            }

            .sync-title {
                color: var(--cream);
                font-weight: 700;
            }

            .sync-percent {
                color: var(--green);
                font-weight: 700;
            }

            .animation-toggle {
                margin-top: 8px;
                padding: 10px 13px;
                color: var(--text);
                font: inherit;
                font-size: 12px;
                font-weight: 700;
                border: 1px solid var(--border);
                border-radius: 8px;
                cursor: pointer;
                background: rgba(255,255,255,.08);
            }

            .animation-toggle:hover {
                border-color: var(--green);
            }

            body.no-animations *,
            body.no-animations *::before,
            body.no-animations *::after {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
            }
        `;

        document.head.appendChild(style);
    }

    function createIndicator() {
        if ($("sync-indicator")) return;

        const indicator = document.createElement("div");
        indicator.id = "sync-indicator";
        indicator.className = "sync-indicator";
        indicator.innerHTML = `
            <div class="sync-row">
                <span class="sync-title">
                    ♞ Connecting to Chess.com...
                </span>
                <span class="sync-percent">0%</span>
            </div>
        `;

        $("leadership").before(indicator);
    }

    function createAnimationToggle() {
        if (document.querySelector(".animation-toggle")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "animation-toggle";
        button.textContent = "Animations: On";
        button.setAttribute("aria-pressed", "true");

        button.addEventListener("click", () => {
            const disabled =
                document.body.classList.toggle("no-animations");

            button.textContent = disabled
                ? "Animations: Off"
                : "Animations: On";

            button.setAttribute("aria-pressed", String(!disabled));
        });

        document.querySelector(".search-box").appendChild(button);
    }

    function updateIndicator(message, completed = state.completed) {
        const indicator = $("sync-indicator");
        if (!indicator) return;

        state.completed = completed;

        const percentage = state.total
            ? Math.min(
                100,
                Math.round(state.completed / state.total * 100)
            )
            : 0;

        indicator.style.setProperty("--progress", `${percentage}%`);
        indicator.querySelector(".sync-title").textContent = `♞ ${message}`;
        indicator.querySelector(".sync-percent").textContent =
            `${percentage}%`;
    }

    function finishLoading() {
        if (!state.leadershipDone || !state.membersDone) return;

        const indicator = $("sync-indicator");
        if (!indicator) return;

        indicator.style.setProperty("--progress", "100%");
        indicator.querySelector(".sync-title").textContent = "♞ Done!";
        indicator.querySelector(".sync-percent").textContent = "100%";

        setTimeout(() => {
            indicator.classList.add("done");

            setTimeout(() => {
                indicator.remove();
            }, 400);
        }, 900);
    }

    async function fetchWithTimeout(url) {
        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async function request(apiUrl) {
        try {
            return await fetchWithTimeout(apiUrl);
        } catch (directError) {
            console.warn("Direct Chess.com request failed:", directError);

            const proxyUrl =
                CORS_PROXY + encodeURIComponent(apiUrl);

            return fetchWithTimeout(proxyUrl);
        }
    }

    function fallbackProfile(username, role = "Club Member") {
        return {
            username,
            role,
            avatar: "",
            country: "Chess.com member",
            location: "Location unavailable"
        };
    }

    async function getProfile(username, role = "Club Member") {
        try {
            const data = await request(
                `${API}/player/${encodeURIComponent(username)}`
            );

            return {
                username: data.username || username,
                role,
                avatar: data.avatar || "",
                country: data.country
                    ? data.country.split("/").pop()
                    : "Country unavailable",
                location: data.location || "Location unavailable"
            };
        } catch {
            return fallbackProfile(username, role);
        }
    }

    function createCard(profile) {
        const initials = escapeHtml(
            profile.username.slice(0, 2).toUpperCase()
        );

        const avatar = profile.avatar
            ? `<img src="${escapeHtml(profile.avatar)}"
                    alt="${escapeHtml(profile.username)} avatar"
                    loading="lazy"
                    onerror="this.remove()">`
            : initials;

        const searchableText = [
            profile.username,
            profile.role,
            profile.country,
            profile.location
        ].join(" ").toLowerCase();

        return `
            <article class="card"
                     data-username="${escapeHtml(profile.username)}"
                     data-search="${escapeHtml(searchableText)}">
                <div class="card-top">
                    <div class="avatar">${avatar}</div>

                    <div class="identity">
                        <p class="username">
                            ${escapeHtml(profile.username)}
                        </p>
                        <span class="role">
                            ${escapeHtml(profile.role.toUpperCase())}
                        </span>
                    </div>
                </div>

                <div class="details">
                    <div class="detail">
                        <span class="detail-icon">◈</span>
                        <span class="country">
                            ${escapeHtml(profile.country)}
                        </span>
                    </div>

                    <div class="detail">
                        <span class="detail-icon">⌖</span>
                        <span class="location">
                            ${escapeHtml(profile.location)}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    function createLeadershipSections() {
        $("leadership").innerHTML = groups.map(group => {
            const id = group.name.replace(/\W/g, "");

            return `
                <section class="section">
                    <div class="section-heading">
                        <h3>${group.icon} ${group.name}</h3>
                        <span class="section-count">
                            ${group.players.length} members
                        </span>
                    </div>

                    <div id="${id}" class="cards">
                        <div class="loading">
                            Loading profiles...
                        </div>
                    </div>
                </section>
            `;
        }).join("");
    }

    async function loadLeadership() {
        createLeadershipSections();
        updateIndicator("Loading leadership profiles", 0);

        const requests = groups.flatMap(group =>
            group.players.map(async username => {
                const profile = await getProfile(username, group.name);

                state.completed++;
                updateIndicator(
                    "Loading leadership profiles",
                    state.completed
                );

                return {
                    group: group.name,
                    profile
                };
            })
        );

        const profiles = await Promise.all(requests);

        groups.forEach(group => {
            const groupProfiles = profiles.filter(
                item => item.group === group.name
            );

            $(group.name.replace(/\W/g, "")).innerHTML =
                groupProfiles.map(item =>
                    createCard(item.profile)
                ).join("");
        });

        $("profile-count").textContent = leaderTotal;
        state.leadershipDone = true;
        finishLoading();
    }

    function extractMembers(data) {
        const names = new Map();

        [
            data.all,
            data.all_time,
            data.weekly,
            data.monthly
        ].forEach(list => {
            if (!Array.isArray(list)) return;

            list.forEach(member => {
                const username = typeof member === "string"
                    ? member
                    : member?.username;

                if (username) {
                    names.set(username.toLowerCase(), username);
                }
            });
        });

        return [...names.values()];
    }

    async function loadMembers() {
        const grid = $("members-grid");
        const status = $("members-status");

        updateIndicator("Loading club members", state.completed);

        let data;

        try {
            data = await request(CLUB_URL);
        } catch (error) {
            console.error("Club member request failed:", error);

            status.textContent = "API unavailable";
            grid.innerHTML = `
                <div class="message">
                    Could not load club members. The Chess.com API or
                    CORS proxy did not respond within 12 seconds.
                </div>
            `;

            state.membersDone = true;
            finishLoading();
            return;
        }

        const usernames = extractMembers(data);

        $("member-count").textContent = usernames.length;
        status.textContent = `${usernames.length} members`;

        if (!usernames.length) {
            grid.innerHTML = `
                <div class="message">
                    Chess.com returned no members.
                </div>
            `;

            state.membersDone = true;
            finishLoading();
            return;
        }

        state.total = Math.max(
            state.total,
            leaderTotal + usernames.length
        );

        // hopfully works now
        grid.innerHTML = usernames.map(username =>
            createCard(fallbackProfile(username))
        ).join("");

        state.completed = Math.min(
            state.total,
            state.completed + usernames.length
        );

        updateIndicator(
            "Member list loaded",
            state.completed
        );

        // lazy loading
        const cards = [...grid.querySelectorAll(".card")];
        const loaded = new Set();

        async function enrich(card) {
            const username = card.dataset.username;

            if (loaded.has(username)) return;
            loaded.add(username);

            const profile = await getProfile(username);
            const avatar = card.querySelector(".avatar");

            if (profile.avatar) {
                avatar.innerHTML = `
                    <img src="${escapeHtml(profile.avatar)}"
                         alt="${escapeHtml(username)} avatar"
                         loading="lazy">
                `;
            }

            card.querySelector(".country").textContent =
                profile.country;

            card.querySelector(".location").textContent =
                profile.location;

            card.dataset.search = [
                username,
                profile.country,
                profile.location,
                "club member"
            ].join(" ").toLowerCase();

            $("profile-count").textContent =
                leaderTotal + loaded.size;
        }

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        observer.unobserve(entry.target);
                        enrich(entry.target);
                    }
                });
            }, { rootMargin: "400px" });

            cards.forEach(card => observer.observe(card));
        } else {
            cards.slice(0, 20).forEach(enrich);
        }

        state.membersDone = true;
        finishLoading();
    }

    function enableSearch() {
        $("search").addEventListener("input", event => {
            const query = event.target.value.toLowerCase().trim();
            let visible = 0;

            document.querySelectorAll(".section").forEach(section => {
                const cards = [...section.querySelectorAll(".card")];
                let sectionVisible = 0;

                cards.forEach(card => {
                    const matches = card.dataset.search.includes(query);

                    card.classList.toggle("hidden", !matches);

                    if (matches) {
                        visible++;
                        sectionVisible++;
                    }
                });

                section.classList.toggle(
                    "hidden",
                    cards.length > 0 && sectionVisible === 0
                );
            });

            $("empty").classList.toggle("hidden", visible > 0);
        });
    }

    function start() {
        addStyles();
        createIndicator();
        createAnimationToggle();
        enableSearch();

        loadLeadership().catch(error => {
            console.error("Leadership loading failed:", error);
            state.leadershipDone = true;
            finishLoading();
        });

        loadMembers().catch(error => {
            console.error("Member loading failed:", error);
            state.membersDone = true;
            finishLoading();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
