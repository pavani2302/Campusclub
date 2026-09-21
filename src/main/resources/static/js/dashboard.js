```javascript
let me = null;
let clubs = [];
let events = [];

// =========================================================
// HELPERS
// =========================================================

function element(id) {
    return document.getElementById(id);
}

function esc(value) {

    return String(value ?? "").replace(
        /[&<>'"]/g,
        function (character) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            }[character];
        }
    );
}

// =========================================================
// LOAD DASHBOARD
// =========================================================

async function load() {

    const result =
        await api("/api/auth/me");

    if (!result.ok) {

        window.location.href =
            "/login.html";

        return;
    }

    me = result.data;

    const userName =
        element("userName");

    const welcomeName =
        element("welcomeName");

    const roleBadge =
        element("roleBadge");

    if (userName) {
        userName.textContent =
            me.name;
    }

    if (welcomeName) {
        welcomeName.textContent =
            me.name;
    }

    if (roleBadge) {
        roleBadge.textContent =
            me.role;
    }

    // -----------------------------------------------------
    // ADMIN
    // -----------------------------------------------------

    if (me.role === "ADMIN") {

        const adminPanel =
            element("adminPanel");

        if (adminPanel) {
            adminPanel.classList.remove("hidden");
        }

        await loadStats();
    }

    await loadClubs();

    await loadEvents();

    await loadMine();
}

// =========================================================
// ADMIN STATS
// =========================================================

async function loadStats() {

    const result =
        await api("/api/admin/stats");

    if (!result.ok) {

        console.error(
            "Unable to load admin statistics",
            result.data
        );

        return;
    }

    const statsElement =
        element("stats");

    if (!statsElement) {
        return;
    }

    statsElement.innerHTML =
        Object.entries(result.data)
            .map(function ([key, value]) {

                return `
                    <div class="stat">
                        <b>${esc(value)}</b>
                        ${esc(key)}
                    </div>
                `;

            })
            .join("");
}

// =========================================================
// LOAD CLUBS
// =========================================================

async function loadClubs() {

    const result =
        await api("/api/clubs");

    if (!result.ok) {

        console.error(
            "Unable to load clubs",
            result.data
        );

        return;
    }

    clubs = Array.isArray(result.data)
        ? result.data
        : [];

    const clubsElement =
        element("clubs");

    if (clubsElement) {

        clubsElement.innerHTML =
            clubs
                .map(function (club) {

                    return `
                        <div class="card">

                            <h3>
                                ${esc(club.name)}
                            </h3>

                            <small>
                                ${esc(
                                    club.category ||
                                    "General"
                                )}
                            </small>

                            <p>
                                ${esc(
                                    club.description ||
                                    ""
                                )}
                            </p>

                            <p>
                                <b>Coordinator:</b>
                                ${esc(
                                    club.coordinator ||
                                    "Not specified"
                                )}
                            </p>

                            ${
                                me.role === "STUDENT"
                                    ? `
                                        <button
                                            class="btn"
                                            onclick="joinClub(${club.id})"
                                        >
                                            Join Club
                                        </button>
                                      `
                                    : ""
                            }

                        </div>
                    `;

                })
                .join("");
    }

    const eventClub =
        element("eventClub");

    if (eventClub) {

        eventClub.innerHTML =
            clubs
                .map(function (club) {

                    return `
                        <option value="${club.id}">
                            ${esc(club.name)}
                        </option>
                    `;

                })
                .join("");
    }
}

// =========================================================
// JOIN CLUB
// =========================================================

async function joinClub(id) {

    const result =
        await api(
            `/api/clubs/${id}/join`,
            "POST"
        );

    const clubMessage =
        element("clubMsg");

    if (clubMessage) {

        clubMessage.textContent =
            result.data.message ||
            (
                result.ok
                    ? "Club joined successfully"
                    : "Unable to join club"
            );

        clubMessage.className =
            result.ok
                ? "success"
                : "error";
    }
}

// =========================================================
// LOAD EVENTS
// =========================================================

async function loadEvents() {

    const result =
        await api("/api/events");

    if (!result.ok) {

        console.error(
            "Unable to load events",
            result.data
        );

        return;
    }

    events = Array.isArray(result.data)
        ? result.data
        : [];

    const eventsElement =
        element("events");

    if (!eventsElement) {
        return;
    }

    eventsElement.innerHTML =
        events
            .map(function (event) {

                return `
                    <div class="card">

                        <h3>
                            ${esc(event.title)}
                        </h3>

                        <small>
                            ${esc(event.eventDate)}
                            •
                            ${esc(event.venue)}
                        </small>

                        <p>
                            ${esc(event.description)}
                        </p>

                        <p>
                            <b>Club:</b>
                            ${esc(
                                event.club?.name ||
                                "Unknown"
                            )}
                        </p>

                        ${
                            me.role === "STUDENT"
                                ? `
                                    <button
                                        class="btn"
                                        onclick="registerEvent(${event.id})"
                                    >
                                        Register
                                    </button>
                                  `
                                : ""
                        }

                    </div>
                `;

            })
            .join("");
}

// =========================================================
// REGISTER FOR EVENT
// =========================================================

async function registerEvent(id) {

    const result =
        await api(
            `/api/events/${id}/register`,
            "POST"
        );

    alert(
        result.data.message ||
        (
            result.ok
                ? "Event registration successful"
                : "Unable to register"
        )
    );

    if (result.ok) {
        await loadMine();
    }
}

// =========================================================
// MY EVENT REGISTRATIONS
// =========================================================

async function loadMine() {

    const mine =
        element("mine");

    if (!mine) {
        return;
    }

    if (me.role !== "STUDENT") {

        mine.innerHTML =
            `
                <p class="muted">
                    Admin accounts manage
                    registrations and attendance.
                </p>
            `;

        return;
    }

    const result =
        await api("/api/events/mine");

    if (!result.ok) {

        mine.innerHTML =
            `
                <p class="error">
                    Unable to load your registrations.
                </p>
            `;

        return;
    }

    const registrations =
        Array.isArray(result.data)
            ? result.data
            : [];

    if (registrations.length === 0) {

        mine.innerHTML =
            "<p>No event registrations yet.</p>";

        return;
    }

    mine.innerHTML =
        registrations
            .map(function (registration) {

                return `
                    <div class="card">

                        <b>
                            ${esc(
                                registration.event?.title ||
                                "Event"
                            )}
                        </b>

                        <br>

                        ${esc(
                            registration.event?.eventDate ||
                            ""
                        )}

                        •
                        ${esc(
                            registration.event?.venue ||
                            ""
                        )}

                        <br>

                        Attendance:
                        ${
                            registration.attended
                                ? "Present"
                                : "Not marked"
                        }

                    </div>
                `;

            })
            .join("");
}

// =========================================================
// ADMIN - CREATE CLUB
// =========================================================

const clubForm =
    element("clubForm");

if (clubForm) {

    clubForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const result =
                await api(
                    "/api/clubs",
                    "POST",
                    {
                        name:
                            element("clubName")?.value
                            ?.trim(),

                        category:
                            element("clubCategory")?.value
                            ?.trim(),

                        coordinator:
                            element("clubCoordinator")?.value
                            ?.trim(),

                        description:
                            element("clubDescription")?.value
                            ?.trim()
                    }
                );

            alert(
                result.ok
                    ? "Club created successfully"
                    : (
                        result.data.message ||
                        "Failed to create club"
                    )
            );

            if (result.ok) {

                event.target.reset();

                await loadClubs();
            }
        }
    );
}

// =========================================================
// ADMIN - CREATE EVENT
// =========================================================

const eventForm =
    element("eventForm");

if (eventForm) {

    eventForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const clubElement =
                element("eventClub");

            const result =
                await api(
                    "/api/events",
                    "POST",
                    {
                        title:
                            element("eventTitle")?.value
                            ?.trim(),

                        description:
                            element("eventDescription")?.value
                            ?.trim(),

                        eventDate:
                            element("eventDate")?.value,

                        venue:
                            element("eventVenue")?.value
                            ?.trim(),

                        clubId:
                            Number(
                                clubElement?.value
                            )
                    }
                );

            alert(
                result.ok
                    ? "Event created successfully"
                    : (
                        result.data.message ||
                        "Failed to create event"
                    )
            );

            if (result.ok) {

                event.target.reset();

                await loadEvents();
            }
        }
    );
}

// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    element("logout");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            await api(
                "/api/auth/logout",
                "POST"
            );

            window.location.href = "/";
        }
    );
}

// =========================================================
// START
// =========================================================

load();
```
