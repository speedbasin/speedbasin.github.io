(() => {
    const API = "https://api.chess.com/pub";
    const CLUB_URL = `${API}/club/anti-lightspeed-and-more/members`;
    const CORS_PROXY = "https://corsproxy.io/?url=";

    const groups = [
        {
            name: "Super Admin",
            icon: "♛",
            players: [
                "ultra_saa", "azmdihih", "rose_5525", "glitchy81",
                "aliceluhu", "randomchiken", "JoeMomma2105",
                "Spectrum6767", "josephtoasteph"
            ]
        },
        {
            name: "Admin",
            icon: "♜",
            players: [
                "ECZ32", "toaster1222e", "Hampder", "sh1ori_0",
                "Blazefire800", "I_sus_I", "Zyflin", "xiaoshenfan"
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

    const $ = id => document.getElementById(id);
    const leaderTotal = groups.reduce(
        (total, group) => total + group.players.length,
        0
    );

    let loadingState = {
        completed: 0,
        total: leaderTotal
    };

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character]));
    }

    function addControls() {
        const style = document.createElement("style");

        style.textContent = `
            .sync-indicator {
                position: relative;
                margin-bottom: 25px;
                padding: 14px 17px;
                overflow: hidden;
                color: var(--muted);
                font-size: 13px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: rgba(38,37,34,.86);
                transition: opacity .35s, max-height .35s, margin .35s, padding .35s;
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
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                scroll-behavior: auto !important;
                transition: none !important;
            }
        `;

        document.head.appendChild(style);

        const indicator = document.createElement("div");
        indicator.id = "sync-indicator";
        indicator.className = "sync-indicator";
        indicator.innerHTML = `
            <div class="sync-row">
                <span class="sync-title">♞ Loading Chess.com data...</span>
                <span class="sync-percent">0%</span>
            </div>
        `;

        $("leadership").before(indicator);

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "animation-toggle";
        toggle.textContent = "Animations: On";
        toggle.setAttribute("aria-pressed", "true");

        toggle.addEventListener("click", () => {
            const disabled = document.body.classList.toggle("no-animations");

            toggle.textContent = disabled
                ? "Animations: Off"
                : "Animations: On";

            toggle.setAttribute("aria-pressed", String(!disabled));
        });

        document.querySelector(".search-box").appendChild(toggle);
    }

    function updateLoading(phase, completed = loadingState.completed) {
        const indicator = $("sync-indicator");
        if (!indicator) return;

        loadingState.completed = completed;

        const percent = loadingState.total
            ? Math.min(
                100,
                Math.round(
                    loadingState.completed / loadingState.total * 100
                )
            )
            : 0;

        indicator.style.setProperty("--progress", `${percent}%`);
        indicator.querySelector(".sync-title").textContent = `♞ ${phase}`;
        indicator.querySelector(".sync-percent").textContent = `${percent}%`;
    }

    function finishLeadershipLoading() {
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

    function fallback(username, role = "Club Member") {
        return {
            username,
            role,
            avatar: "",
            country: "Chess.com member",
            location: "Location unavailable"
        };
    }

    async function request(apiUrl) {
        try {
            const response = await fetch(apiUrl, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        } catch {
            const proxyUrl = CORS_PROXY + encodeURIComponent(apiUrl);
            const response = await fetch(proxyUrl, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
            return response.json();
        }
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
            return fallback(username, role);
        }
    }

    function card(profile) {
        const initials = escapeHtml(
            profile.username.slice(0, 2).toUpperCase()
        );

        const avatar = profile.avatar
            ? `<img src="${escapeHtml(profile.avatar)}"
                    alt="${escapeHtml(profile.username)} avatar"
                    loading="lazy"
                    onerror="this.remove()">`
            : initials;

        const searchText = [
            profile.username,
            profile.role,
            profile.country,
            profile.location
        ].join(" ").toLowerCase();

        return `
            <article class="card"
                     data-username="${escapeHtml(profile.username)}"
                     data-search="${escapeHtml(searchText)}">
                <div class="card-top">
                    <div class="avatar">${avatar}</div>
                    <div class="identity">
                        <p class="username">${escapeHtml(profile.username)}</p>
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

    function getMemberNames(data) {
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
                        <div class="loading">Loading profiles...</div>
                    </div>
                </section>
            `;
        }).join("");
    }

    async function loadLeadership() {
        createLeadershipSections();
        updateLoading("Loading leadership profiles", 0);

        const requests = groups.flatMap(group =>
            group.players.map(async username => ({
                profile: await getProfile(username, group.name),
                group
            }))
        );

        const profiles = await Promise.all(
            requests.map(async promise => {
                const result = await promise;

                loadingState.completed++;
                updateLoading(
                    "Loading leadership profiles",
                    loadingState.completed
                );

                return result;
            })
        );

        groups.forEach(group => {
            const groupProfiles = profiles.filter(
                item => item.group.name === group.name
            );

            $(group.name.replace(/\W/g, "")).innerHTML =
                groupProfiles
                    .map(item => card(item.profile))
                    .join("");
        });

        $("profile-count").textContent = leaderTotal;

        finishLeadershipLoading();
    }

    async function loadMembers() {
        const grid = $("members-grid");
        const status = $("members-status");

        try {
            const data = await request(CLUB_URL);
            const usernames = getMemberNames(data);

            loadingState.total = Math.max(
                loadingState.total,
                leaderTotal + usernames.length
            );

            $("member-count").textContent = usernames.length;
            status.textContent = `${usernames.length} members`;

            if (!usernames.length) {
                grid.innerHTML = `
                    <div class="message">
                        The Chess.com API returned no members.
                    </div>
                `;
                return;
            }

            grid.innerHTML = usernames
                .map(username => card(fallback(username)))
                .join("");

            const cards = [...grid.querySelectorAll(".card")];
            const loaded = new Set();

            const enrich = async cardElement => {
                const username = cardElement.dataset.username;

                if (loaded.has(username)) return;
                loaded.add(username);

                const profile = await getProfile(username);
                const avatar = cardElement.querySelector(".avatar");

                if (profile.avatar) {
                    avatar.innerHTML = `
                        <img src="${escapeHtml(profile.avatar)}"
                             alt="${escapeHtml(username)} avatar"
                             loading="lazy">
                    `;
                }

                cardElement.querySelector(".country").textContent =
                    profile.country;

                cardElement.querySelector(".location").textContent =
                    profile.location;

                cardElement.dataset.search = [
                    username,
                    profile.country,
                    profile.location,
                    "club member"
                ].join(" ").toLowerCase();

                $("profile-count").textContent =
                    `${leaderTotal + loaded.size}`;
            };

            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            observer.unobserve(entry.target);
                            enrich(entry.target);
                        }
                    });
                }, { rootMargin: "400px" });

                cards.forEach(cardElement => observer.observe(cardElement));
            } else {
                cards.slice(0, 20).forEach(enrich);
            }
        } catch (error) {
            console.error("Unable to load club members:", error);

            status.textContent = "API unavailable";
            grid.innerHTML = `
                <div class="message">
                    Chess.com did not allow the club member request.
                    Please refresh and try again.
                </div>
            `;
        }
    }

    function enableSearch() {
        $("search").addEventListener("input", event => {
            const query = event.target.value.toLowerCase().trim();
            let visible = 0;

            document.querySelectorAll(".section").forEach(section => {
                const cards = [...section.querySelectorAll(".card")];
                let sectionVisible = 0;

                cards.forEach(cardElement => {
                    const matches =
                        cardElement.dataset.search.includes(query);

                    cardElement.classList.toggle("hidden", !matches);

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

            $("empty").classList.toggle("hidden", visible !== 0);
        });
    }

    addControls();
    enableSearch();

    loadLeadership().catch(error => {
        console.error("Leadership loading failed:", error);
        updateLoading("Leadership loading failed");
    });

    loadMembers().catch(error => {
        console.error("Member loading failed:", error);
    });
})();
