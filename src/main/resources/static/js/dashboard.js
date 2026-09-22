let me = null;
let clubs = [];
let events = [];
let clubMembers = [];
let eventRegistrations = [];

const $ = (id) => document.getElementById(id);


// ============================================================
// INITIAL LOAD
// ============================================================

async function load() {

    const response = await api("/api/auth/me");

    if (!response.ok) {
        window.location.href = "/login.html";
        return;
    }

    me = response.data;

    updateProfile();

    if (me.role === "ADMIN") {

        $("adminPanel").classList.remove("hidden");

        await loadStats();
        await loadAdminEvents();

        await loadClubMembers();
        await loadEventRegistrations();

    } else {

        $("myRegistrationsSection").classList.remove("hidden");
    }

    await loadClubs();
    await loadEvents();
    await loadMine();
}


// ============================================================
// PROFILE
// ============================================================

function updateProfile() {

    const firstLetter =
        (me.name || "U").charAt(0).toUpperCase();

    $("userName").textContent = me.name;
    $("welcomeName").textContent = me.name;
    $("userRole").textContent = me.role;

    $("profileName").textContent = me.name;
    $("profileEmail").textContent = me.email;

    $("profileStudentId").textContent =
        me.studentId || "Not provided";

    $("profileDepartment").textContent =
        me.department || "Not provided";

    $("profileRole").textContent = me.role;

    $("roleBadge").textContent = me.role;

    $("avatar").textContent = firstLetter;
    $("profileAvatar").textContent = firstLetter;
}


// ============================================================
// ADMIN STATS
// ============================================================

async function loadStats() {

    const response = await api("/api/admin/stats");

    if (!response.ok) {
        showError(
            $("stats"),
            "Unable to load admin statistics."
        );
        return;
    }

    const data = response.data;

    $("stats").innerHTML = `

        <div class="stat-card">
            <div class="stat-icon">👨‍🎓</div>
            <div>
                <span>Students</span>
                <strong>${data.students || 0}</strong>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">🏫</div>
            <div>
                <span>Clubs</span>
                <strong>${data.clubs || 0}</strong>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div>
                <span>Events</span>
                <strong>${data.events || 0}</strong>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div>
                <span>Registrations</span>
                <strong>${data.registrations || 0}</strong>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div>
                <span>Present</span>
                <strong>${data.present || 0}</strong>
            </div>
        </div>

    `;
}


// ============================================================
// LOAD CLUBS
// ============================================================

async function loadClubs() {

    const response = await api("/api/clubs");

    if (!response.ok) {

        $("clubs").innerHTML =
            `<div class="empty-state">
                Unable to load clubs.
             </div>`;

        return;
    }

    clubs = response.data || [];

    if (!clubs.length) {

        $("clubs").innerHTML =
            `<div class="empty-state">
                <div class="empty-icon">🏫</div>
                <h3>No clubs yet</h3>
                <p>There are currently no clubs available.</p>
             </div>`;

    } else {

        $("clubs").innerHTML =
            clubs.map(renderClub).join("");
    }

    populateClubSelect();
}


// ============================================================
// CLUB CARD
// ============================================================

function renderClub(club) {

    const category =
        club.category || "General";

    return `

        <div class="club-card">

            <div class="club-card-top">

                <div class="club-icon">
                    🏫
                </div>

                <span class="category-badge">
                    ${esc(category)}
                </span>

            </div>

            <h3>
                ${esc(club.name)}
            </h3>

            <p>
                ${esc(
                    club.description ||
                    "Campus club for students."
                )}
            </p>

            <div class="club-meta">

                <span>
                    👤
                    ${esc(
                        club.coordinator ||
                        "Coordinator not specified"
                    )}
                </span>

            </div>

            ${
                me.role === "STUDENT"
                    ? `
                        <button
                            class="primary-btn full-btn"
                            onclick="joinClub(${club.id})">
                            Join Club
                        </button>
                      `
                    : ""
            }

        </div>
    `;
}


// ============================================================
// JOIN CLUB
// ============================================================

async function joinClub(id) {

    const response =
        await api(
            `/api/clubs/${id}/join`,
            "POST"
        );

    if (response.ok) {

        showToast(
            response.data.message ||
            "Joined club successfully",
            "success"
        );

        await loadClubs();

    } else {

        showToast(
            response.data.message ||
            "Unable to join club",
            "error"
        );
    }
}


// ============================================================
// LOAD EVENTS
// ============================================================

async function loadEvents() {

    const response = await api("/api/events");

    if (!response.ok) {

        $("events").innerHTML =
            `<div class="empty-state">
                Unable to load events.
             </div>`;

        return;
    }

    events = response.data || [];

    renderEvents();

    populateEventSelect();
}


// ============================================================
// RENDER EVENTS
// ============================================================

function renderEvents() {

    if (!events.length) {

        $("events").innerHTML =
            `<div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>No upcoming events</h3>

                <p>
                    Check back later for new campus events.
                </p>

             </div>`;

        return;
    }

    $("events").innerHTML =
        events.map(renderEvent).join("");
}


function renderEvent(event) {

    const clubName =
        event.club
            ? event.club.name
            : "Campus Club";

    return `

        <div class="event-card">

            <div class="event-date">

                <span>
                    ${getDay(event.eventDate)}
                </span>

                <small>
                    ${getMonth(event.eventDate)}
                </small>

            </div>

            <div class="event-content">

                <span class="event-category">
                    ${esc(clubName)}
                </span>

                <h3>
                    ${esc(event.title)}
                </h3>

                <p>
                    ${esc(event.description)}
                </p>

                <div class="event-meta">

                    <span>
                        🕐
                        ${formatDate(event.eventDate)}
                    </span>

                    <span>
                        📍
                        ${esc(event.venue)}
                    </span>

                </div>

                ${
                    me.role === "STUDENT"
                        ? `
                            <button
                                class="primary-btn"
                                onclick="registerEvent(${event.id})">
                                Register for Event
                            </button>
                          `
                        : ""
                }

            </div>

        </div>

    `;
}


// ============================================================
// REGISTER EVENT
// ============================================================

async function registerEvent(id) {

    const response =
        await api(
            `/api/events/${id}/register`,
            "POST"
        );

    if (response.ok) {

        showToast(
            response.data.message ||
            "Registered successfully",
            "success"
        );

        await loadMine();

    } else {

        showToast(
            response.data.message ||
            "Unable to register",
            "error"
        );
    }
}


// ============================================================
// MY REGISTRATIONS
// ============================================================

async function loadMine() {

    if (me.role !== "STUDENT") {

        $("mine").innerHTML = `
            <div class="admin-note">
                <span>ℹ️</span>
                <div>
                    <strong>Admin account</strong>
                    <p>
                        Use the Attendance Management section above
                        to manage student attendance.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    const response =
        await api("/api/events/mine");

    if (!response.ok) {

        $("mine").innerHTML =
            `<div class="empty-state">
                Unable to load registrations.
             </div>`;

        return;
    }

    const registrations =
        response.data || [];

    if (!registrations.length) {

        $("mine").innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📝
                </div>

                <h3>No registrations yet</h3>

                <p>
                    Register for an upcoming event to see it here.
                </p>

            </div>
        `;

        return;
    }

    $("mine").innerHTML =
        registrations
            .map(renderMyRegistration)
            .join("");
}


function renderMyRegistration(item) {

    const event = item.event;

    const present =
        item.attended === true;

    return `

        <div class="registration-card">

            <div class="registration-icon">
                📅
            </div>

            <div class="registration-info">

                <h3>
                    ${esc(event.title)}
                </h3>

                <p>
                    ${esc(event.venue)}
                    ·
                    ${formatDate(event.eventDate)}
                </p>

            </div>

            <span class="
                status-badge
                ${present ? "status-present" : "status-absent"}
            ">

                ${present ? "Present" : "Absent"}

            </span>

        </div>

    `;
}


// ============================================================
// ADMIN EVENTS
// ============================================================

async function loadAdminEvents() {

    const response =
        await api("/api/events");

    if (!response.ok) {
        return;
    }

    events = response.data || [];

    populateEventSelect();
}


// ============================================================
// POPULATE CLUB SELECT
// ============================================================

function populateClubSelect() {

    const select =
        $("eventClub");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select club
        </option>
    `;

    clubs.forEach(club => {

        select.innerHTML += `
            <option value="${club.id}">
                ${esc(club.name)}
            </option>
        `;
    });
}


// ============================================================
// POPULATE ATTENDANCE EVENT SELECT
// ============================================================

function populateEventSelect() {

    const select =
        $("attendanceEvent");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Event
        </option>
    `;

    events.forEach(event => {

        select.innerHTML += `
            <option value="${event.id}">
                ${esc(event.title)}
            </option>
        `;
    });
}


// ============================================================
// CLUB MEMBERS
// ============================================================

async function loadClubMembers() {

    const response =
        await api("/api/admin/club-members");

    if (!response.ok) {

        $("clubMembersTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Unable to load club members.
                </td>
            </tr>
        `;

        return;
    }

    clubMembers =
        response.data || [];

    renderClubMembers();
}


function renderClubMembers() {

    const search =
        ($("clubSearch").value || "")
            .toLowerCase()
            .trim();

    const filtered =
        clubMembers.filter(item => {

            const text = [

                item.user?.name,
                item.user?.email,
                item.user?.studentId,
                item.user?.department,
                item.club?.name

            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });


    if (!filtered.length) {

        $("clubMembersTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No club memberships found.
                </td>
            </tr>
        `;

        return;
    }


    $("clubMembersTable").innerHTML =
        filtered.map(item => `

            <tr>

                <td>
                    <div class="table-user">

                        <div class="table-avatar">
                            ${firstLetter(item.user?.name)}
                        </div>

                        <div>
                            <strong>
                                ${esc(item.user?.name)}
                            </strong>

                            <small>
                                ${esc(item.user?.role || "STUDENT")}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    ${esc(item.user?.email)}
                </td>

                <td>
                    ${esc(
                        item.user?.studentId ||
                        "-"
                    )}
                </td>

                <td>
                    ${esc(
                        item.user?.department ||
                        "-"
                    )}
                </td>

                <td>
                    <span class="table-tag">
                        ${esc(item.club?.name)}
                    </span>
                </td>

                <td>
                    ${formatSimpleDate(item.joinedAt)}
                </td>

            </tr>

        `).join("");
}


// ============================================================
// EVENT REGISTRATIONS
// ============================================================

async function loadEventRegistrations() {

    const response =
        await api("/api/admin/event-registrations");

    if (!response.ok) {

        $("eventRegistrationsTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Unable to load registrations.
                </td>
            </tr>
        `;

        return;
    }

    eventRegistrations =
        response.data || [];

    renderEventRegistrations();
}


function renderEventRegistrations() {

    const search =
        ($("registrationSearch").value || "")
            .toLowerCase()
            .trim();

    const filtered =
        eventRegistrations.filter(item => {

            const text = [

                item.user?.name,
                item.user?.email,
                item.user?.studentId,
                item.user?.department,
                item.event?.title,
                item.club?.name

            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });


    if (!filtered.length) {

        $("eventRegistrationsTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No event registrations found.
                </td>
            </tr>
        `;

        return;
    }


    $("eventRegistrationsTable").innerHTML =
        filtered.map(item => `

            <tr>

                <td>

                    <div class="table-user">

                        <div class="table-avatar">
                            ${firstLetter(item.user?.name)}
                        </div>

                        <div>
                            <strong>
                                ${esc(item.user?.name)}
                            </strong>

                            <small>
                                ${esc(
                                    item.user?.department ||
                                    "Student"
                                )}
                            </small>
                        </div>

                    </div>

                </td>

                <td>
                    ${esc(item.user?.email)}
                </td>

                <td>
                    ${esc(
                        item.user?.studentId ||
                        "-"
                    )}
                </td>

                <td>

                    <strong>
                        ${esc(item.event?.title)}
                    </strong>

                    <small class="table-sub">
                        ${formatDate(item.event?.eventDate)}
                    </small>

                </td>

                <td>
                    ${esc(item.club?.name || "-")}
                </td>

                <td>

                    <span class="
                        status-badge
                        ${
                            item.attended
                                ? "status-present"
                                : "status-absent"
                        }
                    ">

                        ${
                            item.attended
                                ? "Present"
                                : "Absent"
                        }

                    </span>

                </td>

            </tr>

        `).join("");
}


// ============================================================
// ATTENDANCE
// ============================================================

async function loadAttendance() {

    const eventId =
        $("attendanceEvent").value;

    if (!eventId) {

        $("attendanceTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Select an event to manage attendance.
                </td>
            </tr>
        `;

        updateAttendanceSummary([]);

        return;
    }

    const response =
        await api(
            `/api/admin/events/${eventId}/attendance`
        );

    if (!response.ok) {

        $("attendanceTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Unable to load attendance.
                </td>
            </tr>
        `;

        return;
    }

    const records =
        response.data || [];

    updateAttendanceSummary(records);

    renderAttendance(records);
}


function updateAttendanceSummary(records) {

    const total =
        records.length;

    const present =
        records.filter(
            item => item.attended === true
        ).length;

    const absent =
        total - present;

    $("attendanceTotal").textContent =
        total;

    $("attendancePresent").textContent =
        present;

    $("attendanceAbsent").textContent =
        absent;
}


function renderAttendance(records) {

    if (!records.length) {

        $("attendanceTable").innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No students registered for this event.
                </td>
            </tr>
        `;

        return;
    }


    $("attendanceTable").innerHTML =
        records.map(item => `

            <tr>

                <td>

                    <div class="table-user">

                        <div class="table-avatar">
                            ${firstLetter(item.user?.name)}
                        </div>

                        <div>
                            <strong>
                                ${esc(item.user?.name)}
                            </strong>
                        </div>

                    </div>

                </td>

                <td>
                    ${esc(item.user?.email)}
                </td>

                <td>
                    ${esc(
                        item.user?.studentId ||
                        "-"
                    )}
                </td>

                <td>
                    ${esc(
                        item.user?.department ||
                        "-"
                    )}
                </td>

                <td>

                    <span class="
                        status-badge
                        ${
                            item.attended
                                ? "status-present"
                                : "status-absent"
                        }
                    ">

                        ${
                            item.attended
                                ? "Present"
                                : "Absent"
                        }

                    </span>

                </td>

                <td>

                    <div class="attendance-actions">

                        <button
                            class="
                                attendance-btn
                                present-btn
                                ${
                                    item.attended
                                        ? "active"
                                        : ""
                                }
                            "
                            onclick="
                                markAttendance(
                                    ${item.registrationId},
                                    true
                                )
                            ">

                            ✓ Present

                        </button>

                        <button
                            class="
                                attendance-btn
                                absent-btn
                                ${
                                    !item.attended
                                        ? "active"
                                        : ""
                                }
                            "
                            onclick="
                                markAttendance(
                                    ${item.registrationId},
                                    false
                                )
                            ">

                            ✕ Absent

                        </button>

                    </div>

                </td>

            </tr>

        `).join("");
}


// ============================================================
// MARK ATTENDANCE
// ============================================================

async function markAttendance(
    registrationId,
    attended
) {

    const response =
        await api(
            `/api/events/registrations/${registrationId}/attendance?attended=${attended}`,
            "PUT"
        );

    if (!response.ok) {

        showToast(
            response.data.message ||
            "Unable to update attendance",
            "error"
        );

        return;
    }

    showToast(
        attended
            ? "Student marked Present"
            : "Student marked Absent",
        "success"
    );

    await loadAttendance();
    await loadEventRegistrations();
    await loadStats();
}


// ============================================================
// CREATE CLUB
// ============================================================

$("clubForm")?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const payload = {

            name: $("clubName").value.trim(),

            category:
                $("clubCategory").value.trim(),

            coordinator:
                $("clubCoordinator").value.trim(),

            description:
                $("clubDescription").value.trim()
        };


        const response =
            await api(
                "/api/clubs",
                "POST",
                payload
            );


        if (!response.ok) {

            showToast(
                response.data.message ||
                "Unable to create club",
                "error"
            );

            return;
        }


        showToast(
            "Club created successfully",
            "success"
        );

        event.target.reset();

        await loadClubs();
        await loadStats();
        await loadClubMembers();
    }
);


// ============================================================
// CREATE EVENT
// ============================================================

$("eventForm")?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const payload = {

            title:
                $("eventTitle").value.trim(),

            description:
                $("eventDescription").value.trim(),

            eventDate:
                $("eventDate").value,

            venue:
                $("eventVenue").value.trim(),

            clubId:
                Number($("eventClub").value)
        };


        const response =
            await api(
                "/api/events",
                "POST",
                payload
            );


        if (!response.ok) {

            showToast(
                response.data.message ||
                "Unable to create event",
                "error"
            );

            return;
        }


        showToast(
            "Event created successfully",
            "success"
        );

        event.target.reset();

        await loadEvents();
        await loadAdminEvents();
        await loadStats();
    }
);


// ============================================================
// SEARCH
// ============================================================

$("clubSearch")?.addEventListener(
    "input",
    renderClubMembers
);

$("registrationSearch")?.addEventListener(
    "input",
    renderEventRegistrations
);

$("attendanceEvent")?.addEventListener(
    "change",
    loadAttendance
);


// ============================================================
// REFRESH ADMIN
// ============================================================

$("refreshAdmin")?.addEventListener(
    "click",
    async function () {

        await loadStats();
        await loadClubs();
        await loadEvents();
        await loadClubMembers();
        await loadEventRegistrations();
        await loadAttendance();

        showToast(
            "Dashboard refreshed",
            "success"
        );
    }
);


// ============================================================
// LOGOUT
// ============================================================

$("logout")?.addEventListener(
    "click",
    async function () {

        await api(
            "/api/auth/logout",
            "POST"
        );

        window.location.href = "/";
    }
);


// ============================================================
// HELPERS
// ============================================================

function firstLetter(value) {

    return String(value || "U")
        .charAt(0)
        .toUpperCase();
}


function esc(value) {

    return String(value ?? "")
        .replace(/[&<>'"]/g, character => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"

        }[character]));
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


function formatSimpleDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString();
}


function getDay(value) {

    if (!value) {
        return "--";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return String(
        date.getDate()
    ).padStart(2, "0");
}


function getMonth(value) {

    if (!value) {
        return "---";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "---";
    }

    return date
        .toLocaleString(
            undefined,
            { month: "short" }
        )
        .toUpperCase();
}


function showError(element, message) {

    element.innerHTML = `
        <div class="empty-state">
            ${esc(message)}
        </div>
    `;
}


function showToast(message, type = "success") {

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("show");

    }, 10);

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 2800);
}


// ============================================================
// START
// ============================================================

load();