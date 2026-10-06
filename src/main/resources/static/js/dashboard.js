let me = null;

let clubs = [];
let events = [];

let clubMembers = [];
let eventRegistrations = [];

let notificationPanelOpen = false;

let selectedEditEventId = null;


const $ = (id) => document.getElementById(id);


/*
 * =========================
 * INITIAL LOAD
 * =========================
 */

async function loadDashboard() {

    const response = await api("/api/auth/me");

    if (!response.ok) {
        window.location.href = "/login.html";
        return;
    }

    me = response.data;

    updateProfile();

    if (me.role === "ADMIN") {

        $("adminPanel")?.classList.remove("hidden");
        $("studentArea")?.classList.add("hidden");

        await loadAdminDashboard();

    } else {

        $("adminPanel")?.classList.add("hidden");
        $("studentArea")?.classList.remove("hidden");

        await loadStudentDashboard();
    }

    await loadNotificationCount();
}


/*
 * =========================
 * PROFILE
 * =========================
 */

function updateProfile() {

    const firstLetter =
        (me?.name || "U").charAt(0).toUpperCase();

    if ($("userName")) {
        $("userName").textContent =
            me?.name || "User";
    }

    if ($("welcomeName")) {
        $("welcomeName").textContent =
            me?.name || "User";
    }

    if ($("profileName")) {
        $("profileName").textContent =
            me?.name || "User";
    }

    if ($("profileEmail")) {
        $("profileEmail").textContent =
            me?.email || "";
    }

    if ($("profileStudentId")) {
        $("profileStudentId").textContent =
            me?.studentId || "Not provided";
    }

    if ($("profileDepartment")) {
        $("profileDepartment").textContent =
            me?.department || "Not provided";
    }

    if ($("profileAccountType")) {
        $("profileAccountType").textContent =
            me?.role || "STUDENT";
    }

    if ($("roleBadge")) {
        $("roleBadge").textContent =
            me?.role || "STUDENT";
    }

    if ($("topRole")) {
        $("topRole").textContent =
            me?.role || "STUDENT";
    }

    if ($("topAvatar")) {
        $("topAvatar").textContent =
            firstLetter;
    }

    if ($("profileAvatar")) {
        $("profileAvatar").textContent =
            firstLetter;
    }
}


/*
 * =========================
 * STUDENT DASHBOARD
 * =========================
 */

async function loadStudentDashboard() {

    await loadClubs();

    await loadEvents();

    await loadMyRegistrations();
}


/*
 * =========================
 * ADMIN DASHBOARD
 * =========================
 */

async function loadAdminDashboard() {

    await loadStats();

    await loadClubs();

    await loadAdminEvents();

    populateEditEventSelect();

    populateAttendanceEvents();

    await loadClubMembers();

    await loadEventRegistrations();

    await loadAttendance();
}


/*
 * =========================
 * STATS
 * =========================
 */

async function loadStats() {

    const response =
        await api("/api/admin/stats");

    if (!response.ok) {

        if ($("stats")) {
            $("stats").innerHTML =
                errorCard(
                    "Unable to load admin statistics."
                );
        }

        return;
    }

    const data =
        response.data || {};

    if ($("stats")) {

        $("stats").innerHTML = `

            ${statCard(
                "Students",
                data.students,
                "👨‍🎓",
                "Registered students"
            )}

            ${statCard(
                "Clubs",
                data.clubs,
                "🏫",
                "Campus communities"
            )}

            ${statCard(
                "Events",
                data.events,
                "📅",
                "Campus events"
            )}

            ${statCard(
                "Registrations",
                data.registrations,
                "🎟️",
                "Event registrations"
            )}

            ${statCard(
                "Present",
                data.present,
                "✓",
                "Attendance marked"
            )}

            ${statCard(
                "Absent",
                data.absent,
                "!",
                "Students absent"
            )}

            ${statCard(
                "Not Marked",
                data.notMarked,
                "○",
                "Attendance pending"
            )}

        `;
    }
}


function statCard(
    title,
    value,
    icon,
    subtitle
) {

    return `

        <div class="stat-card">

            <div class="stat-icon">
                ${icon}
            </div>

            <div class="stat-content">

                <span>
                    ${esc(title)}
                </span>

                <strong>
                    ${Number(value || 0)}
                </strong>

                <small>
                    ${esc(subtitle)}
                </small>

            </div>

        </div>

    `;
}


/*
 * =========================
 * CLUBS
 * =========================
 */

async function loadClubs() {

    const response =
        await api("/api/clubs");

    if (!response.ok) {

        if ($("clubs")) {
            $("clubs").innerHTML =
                errorCard("Unable to load clubs.");
        }

        return;
    }

    clubs =
        Array.isArray(response.data)
            ? response.data
            : [];


    populateClubSelects();


    /*
     * Student club cards
     */

    if ($("clubs")) {

        if (!clubs.length) {

            $("clubs").innerHTML =
                emptyCard(
                    "No clubs available",
                    "Clubs created by administrators will appear here."
                );

        } else {

            $("clubs").innerHTML =
                clubs.map(club => {

                    return `

                        <article class="club-card">

                            <div class="card-top">

                                <div class="club-icon">
                                    🏫
                                </div>

                                <span class="soft-badge">
                                    ${esc(
                                        club.category ||
                                        "General"
                                    )}
                                </span>

                            </div>


                            <h3>
                                ${esc(
                                    club.name ||
                                    "Unnamed Club"
                                )}
                            </h3>


                            <p>
                                ${esc(
                                    club.description ||
                                    "Campus community"
                                )}
                            </p>


                            <div class="card-meta">

                                <span>
                                    👤
                                    ${esc(
                                        club.coordinator ||
                                        "Coordinator not specified"
                                    )}
                                </span>

                            </div>


                            ${
                                me &&
                                me.role === "STUDENT"
                                ? `
                                    <button
                                        class="btn btn-primary btn-full"
                                        onclick="joinClub(${club.id})"
                                    >
                                        Join Club
                                    </button>
                                `
                                : ""
                            }

                        </article>

                    `;
                }).join("");
        }
    }
}


/*
 * =========================
 * POPULATE CLUB SELECTS
 * =========================
 */

function populateClubSelects() {

    const createSelect =
        $("eventClub");

    const editSelect =
        $("editEventClub");


    const createCurrentValue =
        createSelect?.value || "";

    const editCurrentValue =
        editSelect?.value || "";


    if (createSelect) {

        createSelect.innerHTML =
            `<option value="">Select club</option>` +

            clubs.map(club => `
                <option value="${club.id}">
                    ${esc(club.name || "Unnamed Club")}
                </option>
            `).join("");

        if (createCurrentValue) {
            createSelect.value =
                createCurrentValue;
        }
    }


    if (editSelect) {

        editSelect.innerHTML =
            `<option value="">Select club</option>` +

            clubs.map(club => `
                <option value="${club.id}">
                    ${esc(club.name || "Unnamed Club")}
                </option>
            `).join("");

        if (editCurrentValue) {
            editSelect.value =
                editCurrentValue;
        }
    }
}


/*
 * =========================
 * JOIN CLUB
 * =========================
 */

async function joinClub(id) {

    const response =
        await api(
            `/api/clubs/${id}/join`,
            "POST"
        );

    const message =
        response.data?.message ||
        (
            response.ok
                ? "Joined club successfully."
                : "Unable to join club."
        );

    showToast(
        message,
        response.ok ? "success" : "error"
    );
}


/*
 * =========================
 * EVENTS
 * =========================
 */

async function loadEvents() {

    const response =
        await api("/api/events");

    if (!response.ok) {

        if ($("events")) {
            $("events").innerHTML =
                errorCard("Unable to load events.");
        }

        return;
    }

    events =
        Array.isArray(response.data)
            ? response.data
            : [];


    if (!events.length) {

        if ($("events")) {
            $("events").innerHTML =
                emptyCard(
                    "No upcoming events",
                    "New campus events will appear here."
                );
        }

        return;
    }


    if ($("events")) {

        $("events").innerHTML =
            events.map(event => {

                const eventDate =
                    formatDate(event.eventDate);

                const clubName =
                    event.club?.name ||
                    event.clubName ||
                    "Campus Club";


                return `

                    <article class="event-card">

                        <div class="event-date">

                            <strong>
                                ${eventDate.day}
                            </strong>

                            <span>
                                ${eventDate.month}
                            </span>

                        </div>


                        <div class="event-content">

                            <div class="event-club">
                                ${esc(clubName)}
                            </div>

                            <h3>
                                ${esc(
                                    event.title ||
                                    "Untitled Event"
                                )}
                            </h3>

                            <p>
                                ${esc(
                                    event.description ||
                                    ""
                                )}
                            </p>


                            <div class="event-info">

                                <span>
                                    🕐
                                    ${esc(eventDate.full)}
                                </span>

                                <span>
                                    📍
                                    ${esc(
                                        event.venue ||
                                        "Venue not specified"
                                    )}
                                </span>

                            </div>


                            ${
                                me &&
                                me.role === "STUDENT"
                                ? `
                                    <button
                                        class="btn btn-primary"
                                        onclick="registerEvent(${event.id})"
                                    >
                                        Register for Event
                                    </button>
                                `
                                : ""
                            }

                        </div>

                    </article>

                `;
            }).join("");
    }
}


/*
 * =========================
 * REGISTER EVENT
 * =========================
 */

async function registerEvent(id) {

    const response =
        await api(
            `/api/events/${id}/register`,
            "POST"
        );

    const message =
        response.data?.message ||
        (
            response.ok
                ? "Registered successfully."
                : "Unable to register."
        );

    showToast(
        message,
        response.ok ? "success" : "error"
    );


    if (response.ok) {

        await loadMyRegistrations();

        await loadNotificationCount();
    }
}


/*
 * =========================
 * MY REGISTRATIONS
 * =========================
 */

async function loadMyRegistrations() {

    if (!me || me.role !== "STUDENT") {
        return;
    }


    const response =
        await api("/api/events/mine");


    if (!response.ok) {

        if ($("mine")) {
            $("mine").innerHTML =
                errorCard(
                    "Unable to load registrations."
                );
        }

        return;
    }


    const registrations =
        Array.isArray(response.data)
            ? response.data
            : [];


    if (!registrations.length) {

        if ($("mine")) {
            $("mine").innerHTML =
                emptyCard(
                    "No event registrations",
                    "Register for an event above and it will appear here."
                );
        }

        return;
    }


    if ($("mine")) {

        $("mine").innerHTML =
            registrations.map(registration => {

                const event =
                    registration.event || {};

                const status =
                    registration.attendanceStatus ||
                    getAttendanceStatus(registration);


                return `

                    <div class="activity-card">

                        <div class="activity-icon">
                            📅
                        </div>


                        <div class="activity-content">

                            <div class="activity-top">

                                <div>

                                    <span class="eyebrow">
                                        EVENT REGISTRATION
                                    </span>

                                    <h3>
                                        ${esc(
                                            event.title ||
                                            registration.eventTitle ||
                                            "Event"
                                        )}
                                    </h3>

                                </div>

                                ${statusBadge(status)}

                            </div>


                            <div class="activity-meta">

                                <span>
                                    📍
                                    ${esc(
                                        event.venue ||
                                        registration.venue ||
                                        "Venue not specified"
                                    )}
                                </span>

                                <span>
                                    🕐
                                    ${esc(
                                        formatDate(
                                            event.eventDate ||
                                            registration.eventDate
                                        ).full
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>

                `;

            }).join("");
    }
}


/*
 * =========================
 * ATTENDANCE STATUS
 * =========================
 */

function getAttendanceStatus(registration) {

    if (
        registration.attendanceStatus
    ) {
        return normalizeAttendanceStatus(
            registration.attendanceStatus
        );
    }


    if (
        registration.attendanceMarked === true ||
        registration.attendanceMarked === "true"
    ) {

        return registration.attended
            ? "PRESENT"
            : "ABSENT";
    }


    if (registration.attended === true) {
        return "PRESENT";
    }


    if (registration.attended === false) {
        return "ABSENT";
    }


    return "NOT_MARKED";
}


function normalizeAttendanceStatus(status) {

    const value =
        String(status || "")
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_");


    if (
        value === "PRESENT" ||
        value === "ABSENT" ||
        value === "NOT_MARKED"
    ) {
        return value;
    }


    if (
        value === "NOTMARKED" ||
        value === "PENDING"
    ) {
        return "NOT_MARKED";
    }


    return "NOT_MARKED";
}


function statusBadge(status) {

    const normalized =
        normalizeAttendanceStatus(status);


    if (normalized === "PRESENT") {

        return `
            <span class="status-badge status-present">
                ✓ Present
            </span>
        `;
    }


    if (normalized === "ABSENT") {

        return `
            <span class="status-badge status-absent">
                ✕ Absent
            </span>
        `;
    }


    return `
        <span class="status-badge status-pending">
            ○ Not Marked
        </span>
    `;
}


/*
 * =========================
 * ADMIN EVENTS
 * =========================
 */

async function loadAdminEvents() {

    const response =
        await api("/api/admin/events");

    if (!response.ok) {
        return;
    }

    events =
        Array.isArray(response.data)
            ? response.data
            : [];
}


/*
 * =========================
 * EDIT EVENT SELECT
 * =========================
 */

function populateEditEventSelect() {

    const select =
        $("editEventSelect");

    if (!select) {
        return;
    }


    const previousValue =
        selectedEditEventId ||
        select.value ||
        "";


    select.innerHTML =
        `<option value="">
            Select Event
        </option>` +

        events.map(event => `
            <option value="${event.id}">
                ${esc(
                    event.title ||
                    "Untitled Event"
                )}
            </option>
        `).join("");


    if (
        previousValue &&
        events.some(
            event =>
                String(event.id) ===
                String(previousValue)
        )
    ) {

        select.value =
            String(previousValue);

        loadEventForEdit(
            select.value
        );
    }
}


/*
 * =========================
 * LOAD EVENT FOR EDIT
 * =========================
 */

async function loadEventForEdit(eventId) {

    const id =
        String(eventId || "").trim();


    if (!id) {

        clearEditEventForm();

        return;
    }


    const event =
        events.find(
            item =>
                String(item.id) === id
        );


    if (!event) {

        showToast(
            "Event details could not be found.",
            "error"
        );

        return;
    }


    selectedEditEventId =
        id;


    if ($("editEventTitle")) {

        $("editEventTitle").value =
            event.title || "";
    }


    if ($("editEventDate")) {

        $("editEventDate").value =
            toDateTimeLocalValue(
                event.eventDate
            );
    }


    if ($("editEventVenue")) {

        $("editEventVenue").value =
            event.venue || "";
    }


    if ($("editEventDescription")) {

        $("editEventDescription").value =
            event.description || "";
    }


    if ($("editEventClub")) {

        const clubId =
            getEventClubId(event);

        $("editEventClub").value =
            clubId
                ? String(clubId)
                : "";
    }


    if ($("notifyStudents")) {
        $("notifyStudents").checked = true;
    }

    if ($("sendEmail")) {
        $("sendEmail").checked = true;
    }
}


/*
 * =========================
 * CLEAR EDIT EVENT
 * =========================
 */

function clearEditEventForm() {

    selectedEditEventId = null;


    if ($("editEventSelect")) {
        $("editEventSelect").value = "";
    }


    if ($("editEventTitle")) {
        $("editEventTitle").value = "";
    }


    if ($("editEventDate")) {
        $("editEventDate").value = "";
    }


    if ($("editEventVenue")) {
        $("editEventVenue").value = "";
    }


    if ($("editEventClub")) {
        $("editEventClub").value = "";
    }


    if ($("editEventDescription")) {
        $("editEventDescription").value = "";
    }


    if ($("notifyStudents")) {
        $("notifyStudents").checked = true;
    }


    if ($("sendEmail")) {
        $("sendEmail").checked = true;
    }
}


/*
 * =========================
 * UPDATE EVENT
 * =========================
 */

async function updateEvent(eventId) {

    const id =
        String(eventId || "").trim();


    if (!id) {

        showToast(
            "Please select an event first.",
            "error"
        );

        return;
    }


    const title =
        $("editEventTitle")?.value.trim() || "";

    const description =
        $("editEventDescription")?.value.trim() || "";

    const eventDate =
        $("editEventDate")?.value || "";

    const venue =
        $("editEventVenue")?.value.trim() || "";

    const clubId =
        Number(
            $("editEventClub")?.value || 0
        );

    const notifyStudents =
        $("notifyStudents")
            ? $("notifyStudents").checked
            : false;

    const sendEmail =
        $("sendEmail")
            ? $("sendEmail").checked
            : false;


    if (!title) {

        showToast(
            "Event title is required.",
            "error"
        );

        return;
    }


    if (!eventDate) {

        showToast(
            "Event date is required.",
            "error"
        );

        return;
    }


    if (!venue) {

        showToast(
            "Event venue is required.",
            "error"
        );

        return;
    }


    if (!clubId) {

        showToast(
            "Please select a club.",
            "error"
        );

        return;
    }


    const payload = {

        title: title,

        description: description,

        eventDate: eventDate,

        venue: venue,

        clubId: clubId,

        notifyStudents: notifyStudents,

        sendEmail: sendEmail
    };


    const response =
        await api(
            `/api/events/${id}`,
            "PUT",
            payload
        );


    const message =
        response.data?.message ||
        (
            response.ok
                ? "Event updated successfully."
                : "Failed to update event."
        );


    if (!response.ok) {

        showToast(
            message,
            "error"
        );

        return;
    }


    const notifiedStudents =
        Number(
            response.data?.notifiedStudents || 0
        );


    let toastMessage =
        message;


    if (notifyStudents) {

        toastMessage +=
            ` ${notifiedStudents} registered student(s) notified.`;

    } else {

        toastMessage +=
            " No student notifications were sent.";
    }


    showToast(
        toastMessage,
        "success"
    );


    /*
     * Refresh events from backend.
     */

    await loadAdminEvents();


    /*
     * Refresh both event selectors.
     */

    populateEditEventSelect();

    populateAttendanceEvents();


    /*
     * Reload public/student event cards.
     */

    await loadEvents();


    /*
     * Reload admin registrations because
     * event information may have changed.
     */

    await loadEventRegistrations();


    /*
     * Reload attendance for the selected event.
     */

    if ($("attendanceEvent")?.value) {
        await loadAttendance();
    }


    /*
     * Reload statistics.
     */

    await loadStats();
}


/*
 * =========================
 * ATTENDANCE EVENT SELECT
 * =========================
 */

function populateAttendanceEvents() {

    const select =
        $("attendanceEvent");

    if (!select) {
        return;
    }


    const previousValue =
        select.value || "";


    select.innerHTML =
        `<option value="">
            Select Event
        </option>` +

        events.map(event => `
            <option value="${event.id}">
                ${esc(
                    event.title ||
                    "Untitled Event"
                )}
            </option>
        `).join("");


    if (
        previousValue &&
        events.some(
            event =>
                String(event.id) ===
                String(previousValue)
        )
    ) {

        select.value =
            previousValue;

    } else if (events.length) {

        select.value =
            String(events[0].id);
    }
}


/*
 * =========================
 * CLUB MEMBERS TABLE
 * =========================
 */

async function loadClubMembers() {

    const response =
        await api("/api/admin/club-members");

    if (!response.ok) {

        if ($("clubMembersTable")) {
            $("clubMembersTable").innerHTML =
                tableMessage(
                    5,
                    "Unable to load club members."
                );
        }

        return;
    }

    clubMembers =
        Array.isArray(response.data)
            ? response.data
            : [];

    renderClubMembers();
}


function renderClubMembers() {

    const search =
        ($("clubSearch")?.value || "")
            .toLowerCase()
            .trim();


    const filtered =
        clubMembers.filter(member => {

            const text = [

                member.studentName,

                member.name,

                member.email,

                member.collegeStudentId,

                member.studentId,

                member.department,

                member.clubName,

                member.club?.name

            ].join(" ").toLowerCase();


            return text.includes(search);
        });


    if (!filtered.length) {

        if ($("clubMembersTable")) {

            $("clubMembersTable").innerHTML =
                tableMessage(
                    5,
                    search
                        ? "No matching club members."
                        : "No students have joined a club yet."
                );
        }

        return;
    }


    if ($("clubMembersTable")) {

        $("clubMembersTable").innerHTML =
            filtered.map(member => {

                const studentName =
                    getStudentName(member);

                const studentId =
                    member.collegeStudentId ||
                    member.studentId ||
                    member.rollNumber ||
                    "—";

                const department =
                    member.department ||
                    member.branch ||
                    "—";

                const clubName =
                    member.clubName ||
                    member.club?.name ||
                    "—";

                const email =
                    member.email ||
                    member.studentEmail ||
                    member.user?.email ||
                    "";


                return `

                    <tr>

                        <td>

                            <div class="table-person">

                                <div class="mini-avatar">
                                    ${initials(studentName)}
                                </div>

                                <div>

                                    <strong>
                                        ${esc(studentName)}
                                    </strong>

                                    ${
                                        email
                                        ? `
                                            <small>
                                                ${esc(email)}
                                            </small>
                                        `
                                        : ""
                                    }

                                </div>

                            </div>

                        </td>


                        <td>
                            ${esc(studentId)}
                        </td>


                        <td>
                            ${esc(department)}
                        </td>


                        <td>

                            <span class="club-pill">
                                ${esc(clubName)}
                            </span>

                        </td>


                        <td>
                            ${esc(
                                member.joinedAt ||
                                member.joinDate ||
                                "—"
                            )}
                        </td>

                    </tr>

                `;

            }).join("");
    }
}


/*
 * =========================
 * EVENT REGISTRATION TABLE
 * =========================
 */

async function loadEventRegistrations() {

    const response =
        await api("/api/admin/event-registrations");

    if (!response.ok) {

        if ($("eventRegistrationsTable")) {
            $("eventRegistrationsTable").innerHTML =
                tableMessage(
                    6,
                    "Unable to load event registrations."
                );
        }

        return;
    }

    eventRegistrations =
        Array.isArray(response.data)
            ? response.data
            : [];

    renderEventRegistrations();
}


function renderEventRegistrations() {

    const search =
        ($("registrationSearch")?.value || "")
            .toLowerCase()
            .trim();


    const filtered =
        eventRegistrations.filter(reg => {

            const text = [

                reg.studentName,

                reg.name,

                reg.email,

                reg.collegeStudentId,

                reg.studentId,

                reg.department,

                reg.eventTitle,

                reg.event?.title,

                reg.clubName,

                reg.event?.club?.name

            ].join(" ").toLowerCase();


            return text.includes(search);
        });


    if (!filtered.length) {

        if ($("eventRegistrationsTable")) {

            $("eventRegistrationsTable").innerHTML =
                tableMessage(
                    6,
                    search
                        ? "No matching registrations."
                        : "No students have registered for events yet."
                );
        }

        return;
    }


    if ($("eventRegistrationsTable")) {

        $("eventRegistrationsTable").innerHTML =
            filtered.map(reg => {

                const studentName =
                    getStudentName(reg);

                const studentId =
                    reg.collegeStudentId ||
                    reg.studentId ||
                    reg.rollNumber ||
                    "—";

                const department =
                    reg.department ||
                    reg.branch ||
                    "—";

                const eventTitle =
                    reg.eventTitle ||
                    reg.event?.title ||
                    "—";

                const clubName =
                    reg.clubName ||
                    reg.event?.club?.name ||
                    "—";

                const email =
                    reg.email ||
                    reg.studentEmail ||
                    reg.user?.email ||
                    "";

                const eventDate =
                    reg.eventDate ||
                    reg.event?.eventDate;


                const attendanceStatus =
                    reg.attendanceStatus ||
                    getAttendanceStatus(reg);


                return `

                    <tr>

                        <td>

                            <div class="table-person">

                                <div class="mini-avatar">
                                    ${initials(studentName)}
                                </div>

                                <div>

                                    <strong>
                                        ${esc(studentName)}
                                    </strong>

                                    ${
                                        email
                                        ? `
                                            <small>
                                                ${esc(email)}
                                            </small>
                                        `
                                        : ""
                                    }

                                </div>

                            </div>

                        </td>


                        <td>
                            ${esc(studentId)}
                        </td>


                        <td>
                            ${esc(department)}
                        </td>


                        <td>

                            <strong>
                                ${esc(eventTitle)}
                            </strong>

                            ${
                                eventDate
                                ? `
                                    <small class="table-sub">
                                        ${esc(
                                            formatDate(
                                                eventDate
                                            ).full
                                        )}
                                    </small>
                                `
                                : ""
                            }

                        </td>


                        <td>
                            ${esc(clubName)}
                        </td>


                        <td>
                            ${statusBadge(
                                attendanceStatus
                            )}
                        </td>

                    </tr>

                `;

            }).join("");
    }
}


/*
 * =========================
 * ATTENDANCE
 * =========================
 */

async function loadAttendance() {

    const select =
        $("attendanceEvent");


    if (!select || !select.value) {

        if ($("attendanceSummary")) {
            $("attendanceSummary").innerHTML = "";
        }

        if ($("attendanceTable")) {
            $("attendanceTable").innerHTML =
                tableMessage(
                    6,
                    "Select an event to manage attendance."
                );
        }

        return;
    }


    const eventId =
        select.value;


    const response =
        await api(
            `/api/admin/events/${eventId}/attendance`
        );


    if (!response.ok) {

        if ($("attendanceSummary")) {
            $("attendanceSummary").innerHTML = "";
        }

        if ($("attendanceTable")) {
            $("attendanceTable").innerHTML =
                tableMessage(
                    6,
                    "Unable to load attendance."
                );
        }

        return;
    }


    const data =
        response.data || {};


    /*
     * Keep backend summary values exactly
     * as returned by the existing API.
     */

    const total =
        Number(
            data.total ??
            data.totalRegistered ??
            0
        );

    const present =
        Number(
            data.present ??
            0
        );

    const absent =
        Number(
            data.absent ??
            0
        );

    const notMarked =
        Number(
            data.notMarked ??
            Math.max(
                total - present - absent,
                0
            )
        );


    if ($("attendanceSummary")) {

        $("attendanceSummary").innerHTML = `

            ${attendanceSummaryCard(
                "Total Registered",
                total,
                "total"
            )}

            ${attendanceSummaryCard(
                "Present",
                present,
                "present"
            )}

            ${attendanceSummaryCard(
                "Absent",
                absent,
                "absent"
            )}

            ${attendanceSummaryCard(
                "Not Marked",
                notMarked,
                "pending"
            )}

        `;
    }


    /*
     * Existing backend format:
     *
     * {
     *   total,
     *   present,
     *   absent,
     *   notMarked,
     *   students: [...]
     * }
     *
     * Also support registrations if needed.
     */

    const students =
        Array.isArray(data.students)
            ? data.students
            : (
                Array.isArray(data.registrations)
                    ? data.registrations
                    : []
            );


    if (!students.length) {

        if ($("attendanceTable")) {

            $("attendanceTable").innerHTML =
                tableMessage(
                    6,
                    total > 0
                        ? "Attendance records could not be loaded for this event."
                        : "No students are registered for this event yet."
                );
        }

        return;
    }


    if ($("attendanceTable")) {

        $("attendanceTable").innerHTML =
            students.map(student => {

                const studentName =
                    getStudentName(student);

                const email =
                    student.email ||
                    student.studentEmail ||
                    student.user?.email ||
                    "—";

                const studentId =
                    student.studentId ||
                    student.collegeStudentId ||
                    student.rollNumber ||
                    "—";

                const department =
                    student.department ||
                    student.branch ||
                    "—";

                const registrationId =
                    student.registrationId ||
                    student.id;


                const attendanceStatus =
                    student.attendanceStatus ||
                    getAttendanceStatus(student);


                return `

                    <tr>

                        <td>

                            <div class="table-person">

                                <div class="mini-avatar">
                                    ${initials(studentName)}
                                </div>

                                <div>

                                    <strong>
                                        ${esc(studentName)}
                                    </strong>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${esc(email)}
                        </td>


                        <td>
                            ${esc(studentId)}
                        </td>


                        <td>
                            ${esc(department)}
                        </td>


                        <td>
                            ${statusBadge(
                                attendanceStatus
                            )}
                        </td>


                        <td>

                            <div class="attendance-actions">

                                <button
                                    class="attendance-btn present"
                                    onclick="markAttendance(
                                        ${Number(registrationId)},
                                        true
                                    )"
                                    type="button"
                                >
                                    ✓ Present
                                </button>


                                <button
                                    class="attendance-btn absent"
                                    onclick="markAttendance(
                                        ${Number(registrationId)},
                                        false
                                    )"
                                    type="button"
                                >
                                    ✕ Absent
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }).join("");
    }
}


/*
 * =========================
 * MARK ATTENDANCE
 * =========================
 */

async function markAttendance(
    registrationId,
    attended
) {

    if (!registrationId) {

        showToast(
            "Invalid registration.",
            "error"
        );

        return;
    }


    const response =
        await api(
            `/api/admin/attendance/${registrationId}`,
            "PUT",
            {
                attended: attended
            }
        );


    const message =
        response.data?.message ||
        (
            response.ok
                ? "Attendance updated successfully."
                : "Unable to update attendance."
        );


    showToast(
        message,
        response.ok ? "success" : "error"
    );


    if (response.ok) {

        await loadAttendance();

        await loadStats();

        await loadEventRegistrations();
    }
}


/*
 * =========================
 * CREATE CLUB
 * =========================
 */

$("clubForm")?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const response =
            await api(
                "/api/clubs",
                "POST",
                {
                    name:
                        $("clubName").value.trim(),

                    category:
                        $("clubCategory").value.trim(),

                    coordinator:
                        $("clubCoordinator").value.trim(),

                    description:
                        $("clubDescription").value.trim()
                }
            );


        showToast(
            response.data?.message ||
            (
                response.ok
                    ? "Club created successfully."
                    : "Unable to create club."
            ),
            response.ok ? "success" : "error"
        );


        if (response.ok) {

            this.reset();

            await loadClubs();

            await loadStats();
        }

    }
);


/*
 * =========================
 * CREATE EVENT
 * =========================
 */

$("eventForm")?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const clubId =
            Number(
                $("eventClub").value
            );


        const response =
            await api(
                "/api/events",
                "POST",
                {
                    title:
                        $("eventTitle").value.trim(),

                    description:
                        $("eventDescription").value.trim(),

                    eventDate:
                        $("eventDate").value,

                    venue:
                        $("eventVenue").value.trim(),

                    clubId:
                        clubId
                }
            );


        showToast(
            response.data?.message ||
            (
                response.ok
                    ? "Event created successfully."
                    : "Unable to create event."
            ),
            response.ok ? "success" : "error"
        );


        if (response.ok) {

            this.reset();

            await loadAdminEvents();

            populateEditEventSelect();

            populateAttendanceEvents();

            await loadEvents();

            await loadStats();

            /*
             * Clear the update form after creating
             * a new event.
             */

            clearEditEventForm();
        }

    }
);


/*
 * =========================
 * UPDATE EVENT FORM
 * =========================
 */

$("editEventForm")?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const eventId =
            $("editEventSelect")?.value ||
            selectedEditEventId;


        if (!eventId) {

            showToast(
                "Please select an event to update.",
                "error"
            );

            return;
        }


        const submitButton =
            this.querySelector(
                'button[type="submit"]'
            );


        if (submitButton) {
            submitButton.disabled = true;
        }


        try {

            await updateEvent(eventId);

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }
        }

    }
);


/*
 * =========================
 * EDIT EVENT SELECT
 * =========================
 */

$("editEventSelect")?.addEventListener(
    "change",
    function () {

        if (!this.value) {

            clearEditEventForm();

            return;
        }


        loadEventForEdit(
            this.value
        );
    }
);


/*
 * =========================
 * SEARCH
 * =========================
 */

$("clubSearch")?.addEventListener(
    "input",
    renderClubMembers
);


$("registrationSearch")?.addEventListener(
    "input",
    renderEventRegistrations
);


/*
 * =========================
 * ATTENDANCE EVENT SELECT
 * =========================
 */

$("attendanceEvent")?.addEventListener(
    "change",
    loadAttendance
);


/*
 * =========================
 * REFRESH ADMIN
 * =========================
 */

$("refreshAdmin")?.addEventListener(
    "click",
    async function () {

        this.disabled = true;

        try {

            await loadAdminDashboard();

            showToast(
                "Dashboard refreshed.",
                "success"
            );

        } finally {

            this.disabled = false;
        }
    }
);


/*
 * =========================
 * LOGOUT
 * =========================
 */

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


/*
 * =========================
 * NOTIFICATIONS
 * =========================
 */

async function loadNotificationCount() {

    try {

        const response =
            await fetch(
                "/api/notifications/unread-count"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const badge =
            $("notificationBadge");

        if (!badge) {
            return;
        }

        if (data.count > 0) {

            badge.textContent =
                data.count;

            badge.style.display =
                "inline-flex";

        } else {

            badge.style.display =
                "none";
        }

    } catch (error) {

        console.error(
            "Notification count error:",
            error
        );
    }
}


async function loadNotifications() {

    const list =
        $("notificationList");

    if (!list) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/notifications"
            );


        if (!response.ok) {

            list.innerHTML =
                "<p>Unable to load notifications.</p>";

            return;
        }


        const notifications =
            await response.json();


        if (!Array.isArray(notifications) ||
            !notifications.length) {

            list.innerHTML =
                `
                    <div class="no-notifications">
                        No notifications
                    </div>
                `;

            return;
        }


        list.innerHTML =
            notifications.map(
                notification => {

                    const unreadClass =
                        notification.read
                            ? ""
                            : "unread";


                    return `
                        <div
                            class="notification-item ${unreadClass}"
                            onclick="markNotificationRead(
                                ${notification.id}
                            )"
                        >

                            <div
                                class="notification-title"
                            >
                                ${escapeNotificationText(
                                    notification.title
                                )}
                            </div>


                            <div
                                class="notification-message"
                            >
                                ${escapeNotificationText(
                                    notification.message
                                )}
                            </div>


                            <div
                                class="notification-date"
                            >
                                ${formatNotificationDate(
                                    notification.createdAt
                                )}
                            </div>

                        </div>
                    `;

                }
            ).join("");

    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );
    }
}


async function markNotificationRead(id) {

    try {

        const response =
            await fetch(
                `/api/notifications/${id}/read`,
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {
            return;
        }


        await loadNotifications();

        await loadNotificationCount();

    } catch (error) {

        console.error(
            "Mark notification error:",
            error
        );
    }
}


async function markAllNotificationsRead() {

    try {

        const response =
            await fetch(
                "/api/notifications/read-all",
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {
            return;
        }


        await loadNotifications();

        await loadNotificationCount();

    } catch (error) {

        console.error(
            "Mark all notifications error:",
            error
        );
    }
}


async function toggleNotifications() {

    const panel =
        $("notificationPanel");

    if (!panel) {
        return;
    }


    notificationPanelOpen =
        !notificationPanelOpen;


    if (notificationPanelOpen) {

        panel.style.display =
            "block";

        await loadNotifications();

        await loadNotificationCount();

    } else {

        panel.style.display =
            "none";
    }
}


function formatNotificationDate(value) {

    if (!value) {
        return "";
    }


    try {

        return new Date(value)
            .toLocaleString();

    } catch {

        return value;
    }
}


function escapeNotificationText(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/*
 * =========================
 * HELPERS
 * =========================
 */


/*
 * Get student name without changing
 * the existing backend contract.
 */

function getStudentName(data) {

    if (!data) {
        return "N/A";
    }


    return (
        data.studentName ||
        data.name ||
        data.fullName ||
        data.student?.name ||
        data.user?.name ||
        data.userName ||
        "N/A"
    );
}


/*
 * Get club ID from either:
 *
 * event.clubId
 * event.club.id
 */

function getEventClubId(event) {

    if (!event) {
        return "";
    }


    return (
        event.clubId ||
        event.club?.id ||
        ""
    );
}


/*
 * Convert backend date/time into the
 * value expected by datetime-local.
 */

function toDateTimeLocalValue(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 16);
    }


    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function formatDate(value) {

    if (!value) {

        return {
            day: "--",
            month: "---",
            full: "Date not specified"
        };
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return {
            day: "--",
            month: "---",
            full: String(value)
        };
    }


    return {

        day:
            String(
                date.getDate()
            ).padStart(2, "0"),

        month:
            date.toLocaleString(
                "en-US",
                {
                    month: "short"
                }
            ).toUpperCase(),

        full:
            date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
    };
}


function initials(name) {

    if (!name || name === "N/A") {
        return "U";
    }


    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word =>
            word.charAt(0)
        )
        .join("")
        .toUpperCase() || "U";
}


function esc(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>'"]/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        })[character]
    );
}


function tableMessage(
    columns,
    message
) {

    return `
        <tr>
            <td
                colspan="${columns}"
                class="table-empty"
            >
                ${esc(message)}
            </td>
        </tr>
    `;
}


function emptyCard(
    title,
    description
) {

    return `

        <div class="empty-card">

            <div class="empty-icon">
                ✦
            </div>

            <h3>
                ${esc(title)}
            </h3>

            <p>
                ${esc(description)}
            </p>

        </div>

    `;
}


function errorCard(message) {

    return `

        <div class="empty-card">

            <div class="empty-icon">
                !
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${esc(message)}
            </p>

        </div>

    `;
}


function attendanceSummaryCard(
    title,
    value,
    type
) {

    return `

        <div class="attendance-stat ${type}">

            <span>
                ${esc(title)}
            </span>

            <strong>
                ${Number(value || 0)}
            </strong>

        </div>

    `;
}


function showToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id = "toast";

        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;

    toast.className =
        `toast ${type} show`;


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3000);
}


/*
 * =========================
 * NOTIFICATION COUNT
 * =========================
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadNotificationCount();

        setInterval(
            loadNotificationCount,
            30000
        );
    }
);


/*
 * =========================
 * START APPLICATION
 * =========================
 */

loadDashboard();