let me = null;

let clubs = [];
let events = [];

let allRegistrations = [];
let allMembers = [];
let allStudents = [];


// =====================================================
// HELPERS
// =====================================================

function el(id) {
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

function initials(name) {

    if (!name) {
        return "U";
    }

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}


// =====================================================
// MAIN LOAD
// =====================================================

async function load() {

    const result =
        await api("/api/auth/me");

    if (!result.ok) {

        window.location.href =
            "/login.html";

        return;
    }

    me = result.data;

    el("userName").textContent =
        me.name;

    el("welcomeName").textContent =
        me.name;

    el("roleBadge").textContent =
        me.role;

    el("avatarLetter").textContent =
        initials(me.name);

    // -------------------------------------------------
    // ADMIN
    // -------------------------------------------------

    if (me.role === "ADMIN") {

        el("adminPanel")
            .classList.remove("hidden");

        el("studentPanel")
            .classList.add("hidden");

        await loadAdminDashboard();

    } else {

        el("adminPanel")
            .classList.add("hidden");

        el("studentPanel")
            .classList.remove("hidden");

        await loadStudentDashboard();
    }
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================

async function loadAdminDashboard() {

    await loadAdminStats();

    await loadAdminEvents();

    await loadAdminRegistrations();

    await loadClubMembers();

    await loadStudents();

    setupAdminTabs();

    setupAdminFilters();
}


// =====================================================
// ADMIN STATS
// =====================================================

async function loadAdminStats() {

    const result =
        await api("/api/admin/stats");

    if (!result.ok) {
        console.error(result.data);
        return;
    }

    const data =
        result.data;

    const stats = [

        {
            icon: "👨‍🎓",
            value: data.students,
            label: "Students"
        },

        {
            icon: "🏫",
            value: data.clubs,
            label: "Clubs"
        },

        {
            icon: "📅",
            value: data.events,
            label: "Events"
        },

        {
            icon: "👥",
            value: data.memberships,
            label: "Club Members"
        },

        {
            icon: "🎟️",
            value: data.registrations,
            label: "Registrations"
        },

        {
            icon: "✅",
            value: data.present,
            label: "Present"
        },

        {
            icon: "❌",
            value: data.absent,
            label: "Absent"
        }

    ];

    el("stats").innerHTML =
        stats
            .map(stat => `

                <div class="stat-card">

                    <div class="stat-icon">
                        ${stat.icon}
                    </div>

                    <strong>
                        ${esc(stat.value)}
                    </strong>

                    <span>
                        ${esc(stat.label)}
                    </span>

                </div>

            `)
            .join("");
}


// =====================================================
// ADMIN EVENTS
// =====================================================

async function loadAdminEvents() {

    const result =
        await api("/api/events");

    if (!result.ok) {
        console.error(result.data);
        return;
    }

    events =
        Array.isArray(result.data)
            ? result.data
            : [];

    const filter =
        el("eventFilter");

    const createEventClub =
        el("eventClub");

    if (filter) {

        filter.innerHTML =
            `
                <option value="all">
                    All Events
                </option>
            ` +
            events
                .map(event => `
                    <option value="${event.id}">
                        ${esc(event.title)}
                    </option>
                `)
                .join("");
    }

    if (createEventClub) {

        createEventClub.innerHTML =
            clubs
                .map(club => `
                    <option value="${club.id}">
                        ${esc(club.name)}
                    </option>
                `)
                .join("");
    }
}


// =====================================================
// ADMIN REGISTRATIONS
// =====================================================

async function loadAdminRegistrations() {

    const result =
        await api(
            "/api/admin/event-registrations"
        );

    if (!result.ok) {

        el("eventRegistrations").innerHTML =
            `
                <div class="empty-state">
                    Unable to load registrations.
                </div>
            `;

        return;
    }

    allRegistrations =
        Array.isArray(result.data)
            ? result.data
            : [];

    renderRegistrations();
}


// =====================================================
// RENDER REGISTRATIONS
// =====================================================

function renderRegistrations() {

    const container =
        el("eventRegistrations");

    if (!allRegistrations.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    <div style="font-size:40px">
                        🎟️
                    </div>

                    <h3>
                        No event registrations yet
                    </h3>

                    <p>
                        When students register for
                        events, their details will
                        appear here.
                    </p>
                </div>
            `;

        return;
    }

    const filter =
        el("eventFilter").value;

    let data =
        allRegistrations;

    if (filter !== "all") {

        data =
            data.filter(
                item =>
                    String(item.eventId) ===
                    String(filter)
            );
    }

    if (!data.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    No registrations for
                    this event.
                </div>
            `;

        return;
    }

    container.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Student</th>

                    <th>Student ID</th>

                    <th>Department</th>

                    <th>Event</th>

                    <th>Club</th>

                    <th>Status</th>

                    <th>Attendance</th>

                </tr>

            </thead>

            <tbody>

                ${data.map(registration => `

                    <tr>

                        <td>

                            <div class="student-cell">

                                <div class="student-avatar">
                                    ${esc(
                                        initials(
                                            registration.studentName
                                        )
                                    )}
                                </div>

                                <div>

                                    <div class="student-name">
                                        ${esc(
                                            registration.studentName
                                        )}
                                    </div>

                                    <div class="student-email">
                                        ${esc(
                                            registration.email
                                        )}
                                    </div>

                                </div>

                            </div>

                        </td>

                        <td>
                            ${esc(
                                registration.studentId ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${esc(
                                registration.department ||
                                "-"
                            )}
                        </td>

                        <td>
                            <strong>
                                ${esc(
                                    registration.eventTitle
                                )}
                            </strong>

                            <br>

                            <small>
                                ${esc(
                                    registration.eventDate
                                )}
                            </small>
                        </td>

                        <td>
                            ${esc(
                                registration.clubName
                            )}
                        </td>

                        <td>

                            ${
                                registration.attended

                                ? `
                                    <span
                                        class="status-badge status-present"
                                    >
                                        PRESENT
                                    </span>
                                  `

                                : `
                                    <span
                                        class="status-badge status-absent"
                                    >
                                        ABSENT
                                    </span>
                                  `
                            }

                        </td>

                        <td>

                            <div
                                class="attendance-actions"
                            >

                                <button
                                    class="
                                        attendance-btn
                                        present-btn
                                        ${
                                            registration.attended
                                                ? "selected"
                                                : ""
                                        }
                                    "
                                    onclick="
                                        markAttendance(
                                            ${registration.registrationId},
                                            true
                                        )
                                    "
                                >
                                    ✓ Present
                                </button>

                                <button
                                    class="
                                        attendance-btn
                                        absent-btn
                                        ${
                                            !registration.attended
                                                ? "selected"
                                                : ""
                                        }
                                    "
                                    onclick="
                                        markAttendance(
                                            ${registration.registrationId},
                                            false
                                        )
                                    "
                                >
                                    ✕ Absent
                                </button>

                            </div>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;
}


// =====================================================
// MARK ATTENDANCE
// =====================================================

async function markAttendance(
    registrationId,
    attended
) {

    const result =
        await api(
            `/api/admin/attendance/${registrationId}`,
            "PUT",
            {
                attended: attended
            }
        );

    if (!result.ok) {

        alert(
            result.data.message ||
            "Unable to update attendance"
        );

        return;
    }

    // Update local data immediately.

    const registration =
        allRegistrations.find(
            item =>
                item.registrationId ===
                registrationId
        );

    if (registration) {
        registration.attended =
            attended;
    }

    renderRegistrations();

    await loadAdminStats();
}


// =====================================================
// CLUB MEMBERS
// =====================================================

async function loadClubMembers() {

    const result =
        await api("/api/admin/club-members");

    if (!result.ok) {

        el("clubMembers").innerHTML =
            `
                <div class="empty-state">
                    Unable to load club members.
                </div>
            `;

        return;
    }

    allMembers =
        Array.isArray(result.data)
            ? result.data
            : [];

    const filter =
        el("clubFilter");

    const clubNames =
        [
            ...new Map(
                allMembers.map(member => [
                    member.clubId,
                    member.clubName
                ])
            ).entries()
        ];

    if (filter) {

        filter.innerHTML =
            `
                <option value="all">
                    All Clubs
                </option>
            ` +
            clubNames
                .map(
                    ([id, name]) => `
                        <option value="${id}">
                            ${esc(name)}
                        </option>
                    `
                )
                .join("");
    }

    renderClubMembers();
}


// =====================================================
// RENDER CLUB MEMBERS
// =====================================================

function renderClubMembers() {

    const container =
        el("clubMembers");

    const filter =
        el("clubFilter").value;

    let data =
        allMembers;

    if (filter !== "all") {

        data =
            data.filter(
                member =>
                    String(member.clubId) ===
                    String(filter)
            );
    }

    if (!data.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    No club members found.
                </div>
            `;

        return;
    }

    container.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Student</th>

                    <th>Student ID</th>

                    <th>Department</th>

                    <th>Club</th>

                    <th>Category</th>

                    <th>Joined</th>

                </tr>

            </thead>

            <tbody>

                ${data.map(member => `

                    <tr>

                        <td>

                            <div class="student-cell">

                                <div class="student-avatar">
                                    ${esc(
                                        initials(
                                            member.studentName
                                        )
                                    )}
                                </div>

                                <div>

                                    <div class="student-name">
                                        ${esc(
                                            member.studentName
                                        )}
                                    </div>

                                    <div class="student-email">
                                        ${esc(
                                            member.email
                                        )}
                                    </div>

                                </div>

                            </div>

                        </td>

                        <td>
                            ${esc(
                                member.studentId ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${esc(
                                member.department ||
                                "-"
                            )}
                        </td>

                        <td>
                            <strong>
                                ${esc(
                                    member.clubName
                                )}
                            </strong>
                        </td>

                        <td>
                            ${esc(
                                member.category ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${esc(
                                member.joinedAt ||
                                "-"
                            )}
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;
}


// =====================================================
// STUDENTS
// =====================================================

async function loadStudents() {

    const result =
        await api("/api/admin/users");

    if (!result.ok) {

        el("studentsTable").innerHTML =
            `
                <div class="empty-state">
                    Unable to load students.
                </div>
            `;

        return;
    }

    allStudents =
        Array.isArray(result.data)
            ? result.data.filter(
                user =>
                    user.role === "STUDENT"
            )
            : [];

    renderStudents();
}


// =====================================================
// RENDER STUDENTS
// =====================================================

function renderStudents() {

    const container =
        el("studentsTable");

    const search =
        (
            el("studentSearch").value ||
            ""
        )
        .trim()
        .toLowerCase();

    let data =
        allStudents;

    if (search) {

        data =
            data.filter(
                student =>

                    String(
                        student.name
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        student.email
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        student.studentId
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        student.department
                    )
                    .toLowerCase()
                    .includes(search)
            );
    }

    if (!data.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    No students found.
                </div>
            `;

        return;
    }

    container.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Student</th>

                    <th>Student ID</th>

                    <th>Department</th>

                    <th>Email</th>

                </tr>

            </thead>

            <tbody>

                ${data.map(student => `

                    <tr>

                        <td>

                            <div class="student-cell">

                                <div class="student-avatar">
                                    ${esc(
                                        initials(
                                            student.name
                                        )
                                    )}
                                </div>

                                <div>

                                    <div class="student-name">
                                        ${esc(
                                            student.name
                                        )}
                                    </div>

                                </div>

                            </div>

                        </td>

                        <td>
                            ${esc(
                                student.studentId ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${esc(
                                student.department ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${esc(
                                student.email
                            )}
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;
}


// =====================================================
// STUDENT DASHBOARD
// =====================================================

async function loadStudentDashboard() {

    await loadStudentClubs();

    await loadStudentEvents();

    await loadStudentRegistrations();
}


// =====================================================
// STUDENT CLUBS
// =====================================================

async function loadStudentClubs() {

    const result =
        await api("/api/clubs");

    if (!result.ok) {

        el("clubs").innerHTML =
            `
                <div class="empty-state">
                    Unable to load clubs.
                </div>
            `;

        return;
    }

    clubs =
        Array.isArray(result.data)
            ? result.data
            : [];

    el("myClubCount").textContent =
        clubs.length;

    el("clubs").innerHTML =
        clubs.map(club => `

            <div class="modern-card">

                <div class="card-top">

                    <div class="card-icon">
                        💻
                    </div>

                    <span class="card-category">
                        ${esc(
                            club.category ||
                            "General"
                        )}
                    </span>

                </div>

                <h3 class="card-title">
                    ${esc(club.name)}
                </h3>

                <p class="card-description">
                    ${esc(
                        club.description ||
                        "Campus student club"
                    )}
                </p>

                <div class="meta">
                    👤 Coordinator:
                    ${esc(
                        club.coordinator ||
                        "Not specified"
                    )}
                </div>

                <button
                    class="card-action"
                    onclick="
                        joinClub(${club.id})
                    "
                >
                    Join Club
                </button>

            </div>

        `).join("");
}


// =====================================================
// JOIN CLUB
// =====================================================

async function joinClub(id) {

    const result =
        await api(
            `/api/clubs/${id}/join`,
            "POST"
        );

    const message =
        el("clubMsg");

    if (message) {

        message.textContent =
            result.data.message ||
            (
                result.ok
                    ? "Club joined successfully"
                    : "Unable to join club"
            );

        message.className =
            result.ok
                ? "success"
                : "error";
    }

    if (result.ok) {
        await loadStudentClubs();
    }
}


// =====================================================
// STUDENT EVENTS
// =====================================================

async function loadStudentEvents() {

    const result =
        await api("/api/events");

    if (!result.ok) {

        el("events").innerHTML =
            `
                <div class="empty-state">
                    Unable to load events.
                </div>
            `;

        return;
    }

    events =
        Array.isArray(result.data)
            ? result.data
            : [];

    el("eventCount").textContent =
        events.length;

    el("events").innerHTML =
        events.map(event => `

            <div class="modern-card">

                <div class="card-top">

                    <div class="card-icon">
                        📅
                    </div>

                    <span class="card-category">
                        EVENT
                    </span>

                </div>

                <h3 class="card-title">
                    ${esc(event.title)}
                </h3>

                <p class="card-description">
                    ${esc(event.description)}
                </p>

                <div class="meta">
                    📅 ${esc(event.eventDate)}
                </div>

                <div class="meta">
                    📍 ${esc(event.venue)}
                </div>

                <div class="meta">
                    🏫
                    ${esc(
                        event.club?.name ||
                        "Campus Club"
                    )}
                </div>

                <button
                    class="card-action"
                    onclick="
                        registerEvent(${event.id})
                    "
                >
                    Register for Event
                </button>

            </div>

        `).join("");
}


// =====================================================
// EVENT REGISTRATION
// =====================================================

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
                ? "Registered successfully"
                : "Unable to register"
        )
    );

    if (result.ok) {

        await loadStudentRegistrations();
    }
}


// =====================================================
// MY REGISTRATIONS
// =====================================================

async function loadStudentRegistrations() {

    const result =
        await api(
            "/api/events/mine"
        );

    if (!result.ok) {

        el("mine").innerHTML =
            `
                <div class="empty-state">
                    Unable to load registrations.
                </div>
            `;

        return;
    }

    const registrations =
        Array.isArray(result.data)
            ? result.data
            : [];

    el("registrationCount").textContent =
        registrations.length;

    if (!registrations.length) {

        el("mine").innerHTML =
            `
                <div class="empty-state">

                    <div style="font-size:40px">
                        🎟️
                    </div>

                    <h3>
                        No registrations yet
                    </h3>

                    <p>
                        Register for an event above
                        to see it here.
                    </p>

                </div>
            `;

        return;
    }

    el("mine").innerHTML =
        registrations
            .map(registration => {

                const event =
                    registration.event;

                const attended =
                    registration.attended;

                return `

                    <div class="registration-card">

                        <h4>
                            ${esc(
                                event?.title ||
                                "Event"
                            )}
                        </h4>

                        <div class="registration-meta">

                            📅
                            ${esc(
                                event?.eventDate ||
                                ""
                            )}

                            <br>

                            📍
                            ${esc(
                                event?.venue ||
                                ""
                            )}

                            <br>

                            🏫
                            ${esc(
                                event?.club?.name ||
                                ""
                            )}

                        </div>

                        <span
                            class="
                                attendance-label
                                ${
                                    attended
                                        ? "status-present"
                                        : "status-absent"
                                }
                            "
                        >

                            ${
                                attended
                                    ? "✓ PRESENT"
                                    : "✕ ABSENT"
                            }

                        </span>

                    </div>

                `;
            })
            .join("");
}


// =====================================================
// ADMIN TABS
// =====================================================

function setupAdminTabs() {

    document
        .querySelectorAll(".admin-tab")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".admin-tab"
                        )
                        .forEach(tab =>
                            tab.classList.remove(
                                "active"
                            )
                        );

                    document
                        .querySelectorAll(
                            ".admin-tab-content"
                        )
                        .forEach(content =>
                            content.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    const target =
                        el(
                            button.dataset.tab
                        );

                    if (target) {
                        target.classList.add(
                            "active"
                        );
                    }
                }
            );
        });
}


// =====================================================
// FILTERS
// =====================================================

function setupAdminFilters() {

    el("eventFilter")
        ?.addEventListener(
            "change",
            renderRegistrations
        );

    el("clubFilter")
        ?.addEventListener(
            "change",
            renderClubMembers
        );

    el("studentSearch")
        ?.addEventListener(
            "input",
            renderStudents
        );
}


// =====================================================
// CREATE CLUB
// =====================================================

el("clubForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const result =
                await api(
                    "/api/clubs",
                    "POST",
                    {
                        name:
                            el("clubName")
                                .value
                                .trim(),

                        category:
                            el("clubCategory")
                                .value
                                .trim(),

                        coordinator:
                            el("clubCoordinator")
                                .value
                                .trim(),

                        description:
                            el("clubDescription")
                                .value
                                .trim()
                    }
                );

            alert(
                result.data.message ||
                (
                    result.ok
                        ? "Club created successfully"
                        : "Failed to create club"
                )
            );

            if (result.ok) {

                event.target.reset();

                await loadStudentClubs();

                await loadAdminDashboard();
            }
        }
    );


// =====================================================
// CREATE EVENT
// =====================================================

el("eventForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const result =
                await api(
                    "/api/events",
                    "POST",
                    {
                        title:
                            el("eventTitle")
                                .value
                                .trim(),

                        description:
                            el("eventDescription")
                                .value
                                .trim(),

                        eventDate:
                            el("eventDate")
                                .value
                                .trim(),

                        venue:
                            el("eventVenue")
                                .value
                                .trim(),

                        clubId:
                            Number(
                                el("eventClub")
                                    .value
                            )
                    }
                );

            alert(
                result.data.message ||
                (
                    result.ok
                        ? "Event created successfully"
                        : "Failed to create event"
                )
            );

            if (result.ok) {

                event.target.reset();

                await loadAdminDashboard();
            }
        }
    );


// =====================================================
// LOGOUT
// =====================================================

el("logout")
    ?.addEventListener(
        "click",
        async function () {

            await api(
                "/api/auth/logout",
                "POST"
            );

            window.location.href = "/";
        }
    );


// =====================================================
// START
// =====================================================

load();