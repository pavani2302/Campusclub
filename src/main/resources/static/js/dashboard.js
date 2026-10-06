/* =========================================================
   CampusClub Management System
   dashboard.js
   ========================================================= */

let currentUser = null;
let clubs = [];
let events = [];

let clubMembers = [];
let eventRegistrations = [];
let attendanceRecords = [];


/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function esc(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   API HELPER
   ========================================================= */

async function api(url, method = "GET", body = null) {

    const options = {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    try {

        const response = await fetch(url, options);

        let data = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {

            data = await response.json();

        } else {

            const text = await response.text();

            if (text) {
                data = {
                    message: text
                };
            }
        }

        return {
            ok: response.ok,
            status: response.status,
            data
        };

    } catch (error) {

        console.error("API request failed:", error);

        return {
            ok: false,
            status: 0,
            data: {
                message: "Unable to connect to the server."
            }
        };
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {

    const toast = $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;

    toast.className = "toast";

    if (type === "error") {
        toast.classList.add("error");
    } else if (type === "warning") {
        toast.classList.add("warning");
    } else {
        toast.classList.add("success");
    }

    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}


/* =========================================================
   TEXT HELPER
   ========================================================= */

function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent =
            value === null || value === undefined
                ? ""
                : value;
    }
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatDate(value) {

    if (!value) {

        return {
            full: "N/A",
            date: "N/A",
            time: "N/A"
        };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {

        return {
            full: String(value),
            date: String(value),
            time: ""
        };
    }

    return {
        full: date.toLocaleString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };
}


/* =========================================================
   DATETIME-LOCAL HELPER
   ========================================================= */

function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }

    const stringValue = String(value);

    /*
     * Already:
     * 2026-10-05T18:30
     */

    if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
            .test(stringValue)
    ) {
        return stringValue;
    }


    /*
     * Backend:
     * 2026-10-05T18:30:00
     */

    if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
            .test(stringValue)
    ) {
        return stringValue.substring(0, 16);
    }


    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }


    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const hours =
        String(date.getHours())
            .padStart(2, "0");

    const minutes =
        String(date.getMinutes())
            .padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/* =========================================================
   INITIAL DASHBOARD LOAD
   ========================================================= */

async function loadDashboard() {

    const response =
        await api("/api/auth/me");


    if (!response.ok || !response.data) {

        window.location.href =
            "/login.html";

        return;
    }


    currentUser =
        response.data;


    updateUserProfile();


    if (
        String(currentUser.role)
            .toUpperCase() === "ADMIN"
    ) {

        showAdminDashboard();

        await loadAdminDashboard();

    } else {

        showStudentDashboard();

        await loadStudentDashboard();
    }


    await loadNotificationCount();
}


/* =========================================================
   USER PROFILE
   ========================================================= */

function updateUserProfile() {

    const name =
        currentUser?.name ||
        currentUser?.username ||
        currentUser?.email ||
        "User";

    const email =
        currentUser?.email ||
        "";

    const role =
        currentUser?.role ||
        "STUDENT";


    setText("userName", name);

    setText("welcomeName", name);

    setText("profileName", name);

    setText("profileEmail", email);

    setText(
        "profileStudentId",
        currentUser?.studentId ||
        currentUser?.rollNumber ||
        currentUser?.rollNo ||
        "—"
    );

    setText(
        "profileDepartment",
        currentUser?.department ||
        currentUser?.branch ||
        "—"
    );

    setText(
        "profileAccountType",
        role
    );

    setText(
        "topRole",
        role
    );

    setText(
        "roleBadge",
        role
    );


    /*
     * Avatar
     */

    const firstLetter =
        String(name)
            .trim()
            .charAt(0)
            .toUpperCase() || "U";


    setText(
        "topAvatar",
        firstLetter
    );

    setText(
        "profileAvatar",
        firstLetter
    );
}


/* =========================================================
   ADMIN / STUDENT VISIBILITY
   ========================================================= */

function showAdminDashboard() {

    const adminPanel =
        $("adminPanel");

    const studentArea =
        $("studentArea");


    if (adminPanel) {

        adminPanel.classList.remove(
            "hidden"
        );

        adminPanel.style.display =
            "";
    }


    if (studentArea) {

        studentArea.classList.add(
            "hidden"
        );

        studentArea.style.display =
            "none";
    }
}


function showStudentDashboard() {

    const adminPanel =
        $("adminPanel");

    const studentArea =
        $("studentArea");


    if (adminPanel) {

        adminPanel.classList.add(
            "hidden"
        );

        adminPanel.style.display =
            "none";
    }


    if (studentArea) {

        studentArea.classList.remove(
            "hidden"
        );

        studentArea.style.display =
            "";
    }
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

async function loadAdminDashboard() {

    await loadStats();

    await loadClubs();

    await loadAdminEvents();

    await loadClubMembers();

    await loadEventRegistrations();

    /*
     * IMPORTANT:
     * This function must exist.
     */

    populateAttendanceEvents();

    await loadAttendance();
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

async function loadStudentDashboard() {

    await loadClubs();

    await loadEvents();

    await loadMyClubs();

    await loadMyEvents();
}


/* =========================================================
   ADMIN STATS
   ========================================================= */

async function loadStats() {

    const response =
        await api("/api/admin/stats");


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to load dashboard statistics.",
            "error"
        );

        return;
    }


    const stats =
        response.data || {};


    setText(
        "statStudents",
        stats.students ?? 0
    );

    setText(
        "statClubs",
        stats.clubs ?? 0
    );

    setText(
        "statEvents",
        stats.events ?? 0
    );

    setText(
        "statMemberships",
        stats.memberships ?? 0
    );

    setText(
        "statRegistrations",
        stats.registrations ?? 0
    );

    setText(
        "statPresent",
        stats.present ?? 0
    );

    setText(
        "statAbsent",
        stats.absent ?? 0
    );

    setText(
        "statNotMarked",
        stats.notMarked ?? 0
    );
}


/* =========================================================
   LOAD CLUBS
   ========================================================= */

async function loadClubs() {

    const response =
        await api("/api/clubs");


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to load clubs.",
            "error"
        );

        return;
    }


    clubs =
        Array.isArray(response.data)
            ? response.data
            : [];


    populateClubSelects();

    renderClubs();
}


/* =========================================================
   POPULATE CLUB SELECTS
   ========================================================= */

function populateClubSelects() {

    const selects = [
        $("eventClub"),
        $("editEventClub")
    ];


    selects.forEach(select => {

        if (!select) {
            return;
        }


        const currentValue =
            select.value;


        select.innerHTML =
            `<option value="">
                Select club
            </option>` +
            clubs.map(club => `
                <option value="${club.id}">
                    ${esc(club.name)}
                </option>
            `).join("");


        if (currentValue) {

            select.value =
                currentValue;
        }
    });
}


/* =========================================================
   RENDER CLUBS
   ========================================================= */

function renderClubs() {

    const container =
        $("clubsList");


    if (!container) {
        return;
    }


    if (!clubs.length) {

        container.innerHTML = `
            <div class="empty-state">
                No clubs available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        clubs.map(club => `

            <div class="club-card">

                <h3>
                    ${esc(club.name)}
                </h3>

                <p>
                    ${esc(
                        club.description ||
                        "No description available."
                    )}
                </p>

                <button
                    class="btn btn-primary"
                    onclick="joinClub(${club.id})"
                >
                    Join Club
                </button>

            </div>

        `).join("");
}


/* =========================================================
   JOIN CLUB
   ========================================================= */

async function joinClub(clubId) {

    const response =
        await api(
            `/api/clubs/${clubId}/join`,
            "POST"
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to join club.",
            "error"
        );

        return;
    }


    showToast(
        response.data?.message ||
        "Joined club successfully.",
        "success"
    );


    await loadMyClubs();

    await loadStats();
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    const response =
        await api("/api/events");


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to load events.",
            "error"
        );

        return;
    }


    events =
        Array.isArray(response.data)
            ? response.data
            : [];


    renderEvents();
}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents() {

    const container =
        $("eventsList");


    if (!container) {
        return;
    }


    if (!events.length) {

        container.innerHTML = `
            <div class="empty-state">
                No events available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        events.map(event => {

            const date =
                formatDate(
                    event.eventDate
                );


            const clubName =
                event.club?.name ||
                event.clubName ||
                "General";


            return `

                <div class="event-card">

                    <div class="event-card-content">

                        <h3>
                            ${esc(event.title)}
                        </h3>

                        <p>
                            ${esc(
                                event.description ||
                                "No description available."
                            )}
                        </p>

                        <div class="event-meta">

                            <span>
                                📅 ${esc(date.full)}
                            </span>

                            <span>
                                📍 ${esc(
                                    event.venue ||
                                    "N/A"
                                )}
                            </span>

                            <span>
                                🏷️ ${esc(clubName)}
                            </span>

                        </div>

                    </div>


                    <button
                        class="btn btn-primary"
                        onclick="registerForEvent(${event.id})"
                    >
                        Register
                    </button>

                </div>

            `;
        }).join("");
}


/* =========================================================
   LOAD ADMIN EVENTS
   ========================================================= */

async function loadAdminEvents() {

    const response =
        await api(
            "/api/admin/events"
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to load admin events.",
            "error"
        );

        return;
    }


    events =
        Array.isArray(response.data)
            ? response.data
            : [];


    populateEditEventSelect();
}


/* =========================================================
   ATTENDANCE EVENT SELECT
   ========================================================= */

function populateAttendanceEvents() {

    const select =
        $("attendanceEvent");


    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    select.innerHTML =
        `<option value="">
            Select Event
        </option>` +
        events.map(event => `
            <option value="${event.id}">
                ${esc(event.title)}
            </option>
        `).join("");


    /*
     * Preserve selected event if possible.
     */

    if (
        currentValue &&
        events.some(
            event =>
                String(event.id) ===
                String(currentValue)
        )
    ) {

        select.value =
            currentValue;

    } else if (events.length) {

        select.value =
            String(events[0].id);
    }
}


/* =========================================================
   UPDATE EVENT SELECT
   ========================================================= */

function populateEditEventSelect() {

    const select =
        $("editEventSelect");


    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    select.innerHTML =
        `<option value="">
            Select Event
        </option>` +
        events.map(event => {

            const date =
                formatDate(
                    event.eventDate
                );


            return `
                <option value="${event.id}">
                    ${esc(event.title)}
                    — ${esc(date.full)}
                </option>
            `;

        }).join("");


    /*
     * Keep the current selection if it still exists.
     */

    if (
        currentValue &&
        events.some(
            event =>
                String(event.id) ===
                String(currentValue)
        )
    ) {

        select.value =
            currentValue;
    }
}


/* =========================================================
   LOAD EVENT INTO UPDATE FORM
   ========================================================= */

function loadEventForEdit(eventId) {

    if (!eventId) {

        clearEditEventForm(false);

        return;
    }


    const id =
        Number(eventId);


    const event =
        events.find(
            item =>
                Number(item.id) === id
        );


    if (!event) {

        showToast(
            "Event details could not be found.",
            "error"
        );

        return;
    }


    if ($("editEventTitle")) {

        $("editEventTitle").value =
            event.title || "";
    }


    if ($("editEventDescription")) {

        $("editEventDescription").value =
            event.description || "";
    }


    if ($("editEventDate")) {

        $("editEventDate").value =
            toDateTimeLocal(
                event.eventDate
            );
    }


    if ($("editEventVenue")) {

        $("editEventVenue").value =
            event.venue || "";
    }


    if ($("editEventClub")) {

        const clubId =
            event.club?.id ||
            event.clubId ||
            "";


        $("editEventClub").value =
            String(clubId);
    }


    /*
     * Default notification setting.
     */

    if ($("notifyStudents")) {

        $("notifyStudents").checked =
            true;
    }


    /*
     * Email is optional.
     * Keep it OFF by default.
     */

    if ($("sendEmail")) {

        $("sendEmail").checked =
            false;
    }
}


/* =========================================================
   CLEAR UPDATE EVENT FORM
   ========================================================= */

function clearEditEventForm(
    clearSelect = true
) {

    if (
        clearSelect &&
        $("editEventSelect")
    ) {

        $("editEventSelect").value =
            "";
    }


    if ($("editEventTitle")) {

        $("editEventTitle").value =
            "";
    }


    if ($("editEventDescription")) {

        $("editEventDescription").value =
            "";
    }


    if ($("editEventDate")) {

        $("editEventDate").value =
            "";
    }


    if ($("editEventVenue")) {

        $("editEventVenue").value =
            "";
    }


    if ($("editEventClub")) {

        $("editEventClub").value =
            "";
    }


    if ($("notifyStudents")) {

        $("notifyStudents").checked =
            false;
    }


    if ($("sendEmail")) {

        $("sendEmail").checked =
            false;
    }
}


/* =========================================================
   UPDATE EVENT
   ========================================================= */

async function updateEvent(eventId) {

    const id =
        eventId ||
        $("editEventSelect")?.value;


    if (!id) {

        showToast(
            "Please select an event to update.",
            "error"
        );

        return;
    }


    const title =
        $("editEventTitle")
            ?.value
            .trim() || "";


    const description =
        $("editEventDescription")
            ?.value
            .trim() || "";


    const eventDate =
        $("editEventDate")
            ?.value || "";


    const venue =
        $("editEventVenue")
            ?.value
            .trim() || "";


    const clubId =
        Number(
            $("editEventClub")
                ?.value || 0
        );


    const notifyStudents =
        $("notifyStudents")
            ?.checked || false;


    const sendEmail =
        $("sendEmail")
            ?.checked || false;


    /*
     * VALIDATION
     */

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


    /*
     * REQUEST BODY
     */

    const payload = {

        title,

        description,

        eventDate,

        venue,

        clubId,

        notifyStudents,

        sendEmail
    };


    const form =
        $("editEventForm");


    const submitButton =
        form?.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Updating...";
    }


    try {

        console.log(
            "Updating event:",
            id
        );

        console.log(
            "Update payload:",
            payload
        );


        const response =
            await api(
                `/api/events/${id}`,
                "PUT",
                payload
            );


        console.log(
            "Update event response:",
            response
        );


        if (!response.ok) {

            showToast(
                response.data?.message ||
                `Failed to update event. HTTP ${response.status}`,
                "error"
            );

            return;
        }


        const message =
            response.data?.message ||
            "Event updated successfully.";


        const notifiedStudents =
            Number(
                response.data?.notifiedStudents ||
                0
            );


        let successMessage =
            message;


        if (notifyStudents) {

            successMessage +=
                ` ${notifiedStudents} registered student(s) notified.`;

        } else {

            successMessage +=
                " No student notifications were sent.";
        }


        showToast(
            successMessage,
            "success"
        );


        /*
         * Reload event data.
         */

        await loadAdminEvents();


        populateAttendanceEvents();


        await loadEvents();


        await loadStats();


        await loadEventRegistrations();


        /*
         * Keep updated event selected.
         */

        if ($("editEventSelect")) {

            $("editEventSelect").value =
                String(id);

            loadEventForEdit(id);
        }


    } catch (error) {

        console.error(
            "Update event error:",
            error
        );


        showToast(
            "Unable to update event.",
            "error"
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Update Event";
        }
    }
}


/* =========================================================
   CREATE CLUB
   ========================================================= */

async function createClub() {

    const name =
        $("clubName")
            ?.value
            .trim() || "";


    const description =
        $("clubDescription")
            ?.value
            .trim() || "";


    if (!name) {

        showToast(
            "Club name is required.",
            "error"
        );

        return;
    }


    if (!description) {

        showToast(
            "Club description is required.",
            "error"
        );

        return;
    }


    /*
     * Your current backend Club entity supports
     * name + description.
     *
     * Category and coordinator are retained in
     * the UI but are not sent because the backend
     * model currently does not require them.
     */

    const payload = {

        name,

        description
    };


    const response =
        await api(
            "/api/clubs",
            "POST",
            payload
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to create club.",
            "error"
        );

        return;
    }


    showToast(
        "Club created successfully.",
        "success"
    );


    $("createClubForm")?.reset();


    await loadClubs();

    await loadStats();
}


/* =========================================================
   CREATE EVENT
   ========================================================= */

async function createEvent() {

    const title =
        $("eventTitle")
            ?.value
            .trim() || "";


    const eventDate =
        $("eventDate")
            ?.value || "";


    const venue =
        $("eventVenue")
            ?.value
            .trim() || "";


    const clubId =
        Number(
            $("eventClub")
                ?.value || 0
        );


    const description =
        $("eventDescription")
            ?.value
            .trim() || "";


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


    if (!description) {

        showToast(
            "Event description is required.",
            "error"
        );

        return;
    }


    const payload = {

        title,

        description,

        eventDate,

        venue,

        clubId
    };


    const response =
        await api(
            "/api/events",
            "POST",
            payload
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to create event.",
            "error"
        );

        return;
    }


    showToast(
        "Event created successfully.",
        "success"
    );


    $("createEventForm")?.reset();


    await loadAdminEvents();

    populateAttendanceEvents();

    await loadEvents();

    await loadStats();

    await loadEventRegistrations();
}


/* =========================================================
   REGISTER FOR EVENT
   ========================================================= */

async function registerForEvent(eventId) {

    const response =
        await api(
            `/api/events/${eventId}/register`,
            "POST"
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to register for event.",
            "error"
        );

        return;
    }


    showToast(
        response.data?.message ||
        "Registered for event successfully.",
        "success"
    );


    await loadMyEvents();

    await loadNotificationCount();
}


/* =========================================================
   MY CLUBS
   ========================================================= */

async function loadMyClubs() {

    const response =
        await api(
            "/api/clubs/mine"
        );


    if (!response.ok) {
        return;
    }


    const myClubs =
        Array.isArray(response.data)
            ? response.data
            : [];


    const container =
        $("myClubsList");


    if (!container) {
        return;
    }


    if (!myClubs.length) {

        container.innerHTML = `
            <div class="empty-state">
                You have not joined any clubs yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        myClubs.map(club => `

            <div class="club-card">

                <h3>
                    ${esc(club.name)}
                </h3>

                <p>
                    ${esc(
                        club.description ||
                        "No description available."
                    )}
                </p>

            </div>

        `).join("");
}


/* =========================================================
   MY EVENTS
   ========================================================= */

async function loadMyEvents() {

    const response =
        await api(
            "/api/events/mine"
        );


    if (!response.ok) {
        return;
    }


    const myEvents =
        Array.isArray(response.data)
            ? response.data
            : [];


    const container =
        $("myEventsList");


    if (!container) {
        return;
    }


    if (!myEvents.length) {

        container.innerHTML = `
            <div class="empty-state">
                You have not registered for any events.
            </div>
        `;

        return;
    }


    container.innerHTML =
        myEvents.map(registration => {

            const event =
                registration.event ||
                registration;


            const date =
                formatDate(
                    event.eventDate
                );


            let attendance =
                "Not Marked";


            if (
                registration.attended === true
            ) {

                attendance =
                    "Present";

            } else if (
                registration.attended === false
            ) {

                attendance =
                    "Absent";
            }


            return `

                <div class="event-card">

                    <h3>
                        ${esc(event.title)}
                    </h3>

                    <p>
                        ${esc(
                            event.description ||
                            ""
                        )}
                    </p>

                    <div class="event-meta">

                        <span>
                            📅 ${esc(date.full)}
                        </span>

                        <span>
                            📍 ${esc(
                                event.venue ||
                                "N/A"
                            )}
                        </span>

                        <span>
                            Attendance:
                            ${esc(attendance)}
                        </span>

                    </div>

                </div>

            `;

        }).join("");
}


/* =========================================================
   CLUB MEMBERS
   ========================================================= */

async function loadClubMembers() {

    const response =
        await api(
            "/api/admin/club-members"
        );


    if (!response.ok) {

        console.warn(
            "Unable to load club members:",
            response
        );

        return;
    }


    clubMembers =
        Array.isArray(response.data)
            ? response.data
            : [];


    renderClubMembers();
}


/* =========================================================
   RENDER CLUB MEMBERS
   ========================================================= */

function renderClubMembers() {

    const tbody =
        $("clubMembersTableBody");


    if (!tbody) {
        return;
    }


    if (!clubMembers.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No club members found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        clubMembers.map(member => {

            const user =
                member.user || {};


            const club =
                member.club || {};


            return `

                <tr>

                    <td>
                        ${esc(
                            user.name ||
                            member.userName ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            user.studentId ||
                            user.rollNumber ||
                            member.studentId ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            user.department ||
                            user.branch ||
                            member.department ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            club.name ||
                            member.clubName ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            member.joinedAt ||
                            "N/A"
                        )}
                    </td>

                </tr>

            `;

        }).join("");
}


/* =========================================================
   CLUB MEMBER SEARCH
   ========================================================= */

function filterClubMembers() {

    const input =
        $("clubSearch");


    if (!input) {
        return;
    }


    const search =
        input.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderClubMembers();

        return;
    }


    const filtered =
        clubMembers.filter(member => {

            const user =
                member.user || {};


            const club =
                member.club || {};


            const text = [

                user.name,

                user.email,

                user.studentId,

                user.rollNumber,

                user.department,

                user.branch,

                member.userName,

                member.studentId,

                member.department,

                member.clubName,

                club.name

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return text.includes(search);
        });


    const original =
        clubMembers;


    clubMembers =
        filtered;

    renderClubMembers();

    clubMembers =
        original;
}


/* =========================================================
   EVENT REGISTRATIONS
   ========================================================= */

async function loadEventRegistrations() {

    const response =
        await api(
            "/api/admin/event-registrations"
        );


    if (!response.ok) {

        console.warn(
            "Unable to load event registrations:",
            response
        );

        return;
    }


    eventRegistrations =
        Array.isArray(response.data)
            ? response.data
            : [];


    renderEventRegistrations();
}


/* =========================================================
   RENDER EVENT REGISTRATIONS
   ========================================================= */

function renderEventRegistrations() {

    const tbody =
        $("eventRegistrationsTableBody");


    if (!tbody) {
        return;
    }


    if (!eventRegistrations.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No event registrations found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        eventRegistrations.map(
            registration => {

                const user =
                    registration.user || {};


                const event =
                    registration.event || {};


                const club =
                    event.club || {};


                let attendance =
                    "Not Marked";


                if (
                    registration.attended === true
                ) {

                    attendance =
                        "Present";

                } else if (
                    registration.attended === false
                ) {

                    attendance =
                        "Absent";
                }


                return `

                    <tr>

                        <td>
                            ${esc(
                                user.name ||
                                registration.userName ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${esc(
                                user.studentId ||
                                user.rollNumber ||
                                registration.studentId ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${esc(
                                user.department ||
                                user.branch ||
                                registration.department ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${esc(
                                event.title ||
                                registration.eventTitle ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${esc(
                                club.name ||
                                registration.clubName ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${esc(attendance)}
                        </td>

                    </tr>

                `;

            }
        ).join("");
}


/* =========================================================
   EVENT REGISTRATION SEARCH
   ========================================================= */

function filterEventRegistrations() {

    const input =
        $("registrationSearch");


    if (!input) {
        return;
    }


    const search =
        input.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderEventRegistrations();

        return;
    }


    const filtered =
        eventRegistrations.filter(
            registration => {

                const user =
                    registration.user || {};


                const event =
                    registration.event || {};


                const club =
                    event.club || {};


                const text = [

                    user.name,

                    user.email,

                    user.studentId,

                    user.rollNumber,

                    user.department,

                    user.branch,

                    registration.userName,

                    registration.eventTitle,

                    registration.clubName,

                    event.title,

                    club.name

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return text.includes(search);
            }
        );


    const original =
        eventRegistrations;


    eventRegistrations =
        filtered;

    renderEventRegistrations();

    eventRegistrations =
        original;
}


/* =========================================================
   LOAD ATTENDANCE
   ========================================================= */

async function loadAttendance() {

    const eventSelect =
        $("attendanceEvent");


    if (!eventSelect) {
        return;
    }


    const eventId =
        eventSelect.value;


    if (!eventId) {

        attendanceRecords =
            [];

        renderAttendance();

        return;
    }


    const response =
        await api(
            `/api/admin/events/${eventId}/attendance`
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to load attendance.",
            "error"
        );

        return;
    }


    attendanceRecords =
        Array.isArray(response.data)
            ? response.data
            : [];


    renderAttendance();
}


/* =========================================================
   RENDER ATTENDANCE
   ========================================================= */

function renderAttendance() {

    const tbody =
        $("attendanceTableBody");


    if (!tbody) {
        return;
    }


    updateAttendanceSummary();


    if (!attendanceRecords.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No registrations found for this event.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        attendanceRecords.map(item => {

            const user =
                item.user || {};


            let status =
                "Not Marked";


            let statusClass =
                "";


            if (
                item.attended === true
            ) {

                status =
                    "Present";

                statusClass =
                    "status-present";

            } else if (
                item.attended === false
            ) {

                status =
                    "Absent";

                statusClass =
                    "status-absent";
            }


            return `

                <tr>

                    <td>
                        ${esc(
                            user.name ||
                            item.userName ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            user.email ||
                            item.userEmail ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            user.studentId ||
                            user.rollNumber ||
                            item.studentId ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${esc(
                            user.department ||
                            user.branch ||
                            item.department ||
                            "N/A"
                        )}
                    </td>

                    <td>

                        <span
                            class="${statusClass}"
                        >
                            ${esc(status)}
                        </span>

                    </td>

                    <td>

                        <button
                            class="btn btn-success btn-sm"
                            onclick="setAttendance(
                                ${item.id},
                                true
                            )"
                        >
                            Present
                        </button>


                        <button
                            class="btn btn-danger btn-sm"
                            onclick="setAttendance(
                                ${item.id},
                                false
                            )"
                        >
                            Absent
                        </button>


                        <button
                            class="btn btn-outline btn-sm"
                            onclick="setAttendance(
                                ${item.id},
                                null
                            )"
                        >
                            Clear
                        </button>

                    </td>

                </tr>

            `;

        }).join("");
}


/* =========================================================
   ATTENDANCE SUMMARY
   ========================================================= */

function updateAttendanceSummary() {

    const container =
        $("attendanceSummary");


    if (!container) {
        return;
    }


    let present = 0;

    let absent = 0;

    let notMarked = 0;


    attendanceRecords.forEach(item => {

        if (
            item.attended === true
        ) {

            present++;

        } else if (
            item.attended === false
        ) {

            absent++;

        } else {

            notMarked++;
        }
    });


    const total =
        attendanceRecords.length;


    container.innerHTML = `

        <div class="attendance-summary-item">

            <span>
                Total
            </span>

            <strong>
                ${total}
            </strong>

        </div>


        <div class="attendance-summary-item">

            <span>
                Present
            </span>

            <strong>
                ${present}
            </strong>

        </div>


        <div class="attendance-summary-item">

            <span>
                Absent
            </span>

            <strong>
                ${absent}
            </strong>

        </div>


        <div class="attendance-summary-item">

            <span>
                Not Marked
            </span>

            <strong>
                ${notMarked}
            </strong>

        </div>

    `;
}


/* =========================================================
   ATTENDANCE EVENT CHANGE
   ========================================================= */

if ($("attendanceEvent")) {

    $("attendanceEvent").addEventListener(
        "change",
        async function () {

            await loadAttendance();
        }
    );
}


/* =========================================================
   SET ATTENDANCE
   ========================================================= */

async function setAttendance(
    registrationId,
    attended
) {

    const response =
        await api(
            `/api/admin/attendance/${registrationId}`,
            "PUT",
            {
                attended
            }
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to update attendance.",
            "error"
        );

        return;
    }


    showToast(
        "Attendance updated successfully.",
        "success"
    );


    await loadAttendance();

    await loadEventRegistrations();

    await loadStats();
}


/* =========================================================
   NOTIFICATION COUNT
   ========================================================= */

async function loadNotificationCount() {

    const response =
        await api(
            "/api/notifications/count"
        );


    if (!response.ok) {
        return;
    }


    const count =
        Number(
            response.data?.count || 0
        );


    const badge =
        $("notificationBadge");


    if (!badge) {
        return;
    }


    if (count > 0) {

        badge.textContent =
            count > 99
                ? "99+"
                : String(count);

        badge.style.display =
            "inline-flex";

    } else {

        badge.textContent =
            "0";

        badge.style.display =
            "none";
    }
}


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {

    const response =
        await api(
            "/api/notifications"
        );


    if (!response.ok) {

        const container =
            $("notificationList");


        if (container) {

            container.innerHTML = `
                <div class="notification-empty">
                    Unable to load notifications.
                </div>
            `;
        }

        return;
    }


    const notifications =
        Array.isArray(response.data)
            ? response.data
            : [];


    const container =
        $("notificationList");


    if (!container) {
        return;
    }


    if (!notifications.length) {

        container.innerHTML = `
            <div class="notification-empty">
                No notifications.
            </div>
        `;

        return;
    }


    container.innerHTML =
        notifications.map(notification => {

            const readClass =
                notification.read
                    ? "read"
                    : "unread";


            return `

                <div
                    class="notification-item ${readClass}"
                    data-id="${notification.id}"
                    onclick="markNotificationRead(
                        ${notification.id}
                    )"
                >

                    <div class="notification-title">

                        ${esc(
                            notification.title ||
                            "Notification"
                        )}

                    </div>


                    <div class="notification-message">

                        ${esc(
                            notification.message ||
                            ""
                        )}

                    </div>


                    <div class="notification-date">

                        ${esc(
                            formatDate(
                                notification.createdAt
                            ).full
                        )}

                    </div>

                </div>

            `;

        }).join("");
}


/* =========================================================
   NOTIFICATION TOGGLE
   ========================================================= */

async function toggleNotifications() {

    const panel =
        $("notificationPanel");


    if (!panel) {
        return;
    }


    const isOpen =
        panel.classList.contains("show");


    if (isOpen) {

        panel.classList.remove(
            "show"
        );

        panel.style.display =
            "none";

        return;
    }


    await loadNotifications();


    panel.classList.add(
        "show"
    );

    panel.style.display =
        "block";
}


/* =========================================================
   MARK NOTIFICATION READ
   ========================================================= */

async function markNotificationRead(
    notificationId
) {

    const response =
        await api(
            `/api/notifications/${notificationId}/read`,
            "PUT"
        );


    if (!response.ok) {
        return;
    }


    await loadNotifications();

    await loadNotificationCount();
}


/* =========================================================
   MARK ALL NOTIFICATIONS READ
   ========================================================= */

async function markAllNotificationsRead() {

    const response =
        await api(
            "/api/notifications/read-all",
            "PUT"
        );


    if (!response.ok) {

        showToast(
            response.data?.message ||
            "Unable to mark notifications as read.",
            "error"
        );

        return;
    }


    await loadNotifications();

    await loadNotificationCount();
}


/* =========================================================
   CLOSE NOTIFICATION PANEL
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const panel =
            $("notificationPanel");

        const button =
            $("notificationBtn");


        if (!panel || !button) {
            return;
        }


        if (
            !panel.contains(event.target) &&
            !button.contains(event.target)
        ) {

            panel.classList.remove(
                "show"
            );

            panel.style.display =
                "none";
        }
    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        await api(
            "/api/auth/logout",
            "POST"
        );

    } catch (error) {

        console.warn(
            "Logout request failed:",
            error
        );
    }


    window.location.href =
        "/login.html";
}


/* =========================================================
   REFRESH ADMIN
   ========================================================= */

async function refreshAdminDashboard() {

    if (
        !currentUser ||
        String(currentUser.role)
            .toUpperCase() !== "ADMIN"
    ) {
        return;
    }


    showToast(
        "Refreshing dashboard...",
        "success"
    );


    await loadAdminDashboard();


    showToast(
        "Dashboard refreshed.",
        "success"
    );
}


/* =========================================================
   EVENT FORM LISTENERS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* ================================================
           CREATE CLUB
           ================================================ */

        const createClubForm =
            $("createClubForm");


        if (createClubForm) {

            createClubForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    await createClub();
                }
            );
        }



        /* ================================================
           CREATE EVENT
           ================================================ */

        const createEventForm =
            $("createEventForm");


        if (createEventForm) {

            createEventForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    await createEvent();
                }
            );
        }



        /* ================================================
           UPDATE EVENT
           ================================================ */

        const editEventForm =
            $("editEventForm");


        if (editEventForm) {

            editEventForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const eventId =
                        $("editEventSelect")
                            ?.value;


                    if (!eventId) {

                        showToast(
                            "Please select an event to update.",
                            "error"
                        );

                        return;
                    }


                    await updateEvent(
                        eventId
                    );
                }
            );
        }



        /* ================================================
           EVENT SELECT
           ================================================ */

        const editEventSelect =
            $("editEventSelect");


        if (editEventSelect) {

            editEventSelect.addEventListener(
                "change",
                function () {

                    loadEventForEdit(
                        this.value
                    );
                }
            );
        }



        /* ================================================
           CLEAR UPDATE FORM
           ================================================ */

        const clearEditEvent =
            $("clearEditEvent");


        if (clearEditEvent) {

            clearEditEvent.addEventListener(
                "click",
                function () {

                    clearEditEventForm();
                }
            );
        }



        /* ================================================
           REFRESH ADMIN
           ================================================ */

        const refreshAdmin =
            $("refreshAdmin");


        if (refreshAdmin) {

            refreshAdmin.addEventListener(
                "click",
                async function () {

                    await refreshAdminDashboard();
                }
            );
        }



        /* ================================================
           LOGOUT
           ================================================ */

        const logoutBtn =
            $("logoutBtn");


        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                async function () {

                    await logout();
                }
            );
        }



        /* ================================================
           NOTIFICATIONS
           ================================================ */

        const notificationBtn =
            $("notificationBtn");


        if (notificationBtn) {

            notificationBtn.addEventListener(
                "click",
                async function (event) {

                    event.stopPropagation();

                    await toggleNotifications();
                }
            );
        }



        /* ================================================
           MARK ALL NOTIFICATIONS READ
           ================================================ */

        const markAll =
            $("markAllNotificationsRead");


        if (markAll) {

            markAll.addEventListener(
                "click",
                async function (event) {

                    event.stopPropagation();

                    await markAllNotificationsRead();
                }
            );
        }



        /* ================================================
           CLUB SEARCH
           ================================================ */

        const clubSearch =
            $("clubSearch");


        if (clubSearch) {

            clubSearch.addEventListener(
                "input",
                filterClubMembers
            );
        }



        /* ================================================
           REGISTRATION SEARCH
           ================================================ */

        const registrationSearch =
            $("registrationSearch");


        if (registrationSearch) {

            registrationSearch.addEventListener(
                "input",
                filterEventRegistrations
            );
        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            await loadDashboard();

        } catch (error) {

            console.error(
                "Dashboard initialization error:",
                error
            );


            showToast(
                "Unable to load dashboard.",
                "error"
            );
        }
    }
);