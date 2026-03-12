const API_BASE_URL = window.location.origin.includes('localhost') ? "http://localhost:8000" : "";

// ─── State ────────────────────────────────────────────────────────────────────
let allVendors = [];
let filterPanelOpen = false;
let currentFilters = {};

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadVendors().then(() => loadPurchaseOrders());

    // Start with filter panel collapsed
    document.getElementById("filterBody").style.display = "none";
    document.getElementById("filterToggleIcon").className = "bi bi-chevron-down";

    // Allow pressing Enter in the search box to apply filters
    document.getElementById("filterSearch").addEventListener("keydown", (e) => {
        if (e.key === "Enter") applyFilters();
    });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

function checkAuth() {
    const token = localStorage.getItem("erp_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Load user email from JWT token
    const payload = parseJwt(token);
    if (payload && payload.sub) {
        const emailDisplay = document.getElementById('userEmailDisplay');
        if (emailDisplay) emailDisplay.textContent = payload.sub;
    }

    // Load profile info from localStorage (set during Google Sign-In)
    loadUserProfile();
}

function loadUserProfile() {
    const picture = localStorage.getItem("erp_user_picture");
    const name    = localStorage.getItem("erp_user_name");
    const email   = localStorage.getItem("erp_user_email");

    // Update name display
    const nameEl = document.getElementById("userNameDisplay");
    if (nameEl && name) nameEl.textContent = name;

    // Update email display
    const emailEl = document.getElementById("userEmailDisplay");
    if (emailEl && email) emailEl.textContent = email;

    // Update profile picture in navbar button
    if (picture) {
        const navImg  = document.getElementById("navProfileImg");
        const navIcon = document.getElementById("navProfileIcon");
        if (navImg && navIcon) {
            navImg.src = picture;
            navImg.style.display = "block";
            navIcon.style.display = "none";
        }

        // Update profile picture in dropdown
        const dropImg  = document.getElementById("dropdownProfileImg");
        const dropIcon = document.getElementById("dropdownProfileIcon");
        if (dropImg && dropIcon) {
            dropImg.src = picture;
            dropImg.style.display = "block";
            dropIcon.style.display = "none";
        }
    }
}

function logout() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user_picture");
    localStorage.removeItem("erp_user_name");
    localStorage.removeItem("erp_user_email");
    window.location.href = "login.html";
}

// ─── Vendor Loader ────────────────────────────────────────────────────────────
async function loadVendors() {
    const token = localStorage.getItem("erp_token");
    try {
        const response = await fetch(`${API_BASE_URL}/vendors/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        allVendors = await response.json();
        const sel = document.getElementById("filterVendor");
        allVendors.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.id;
            opt.textContent = v.name;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn("Could not load vendors:", e);
    }
}

// ─── Filter Logic ─────────────────────────────────────────────────────────────
function applyFilters() {
    const filters = {};
    const search    = document.getElementById("filterSearch").value.trim();
    const status    = document.getElementById("filterStatus").value;
    const vendorId  = document.getElementById("filterVendor").value;
    const dateFrom  = document.getElementById("filterDateFrom").value;
    const dateTo    = document.getElementById("filterDateTo").value;
    const minAmt    = document.getElementById("filterMinAmount").value;
    const maxAmt    = document.getElementById("filterMaxAmount").value;

    if (search)   filters.search    = search;
    if (status)   filters.status    = status;
    if (vendorId) filters.vendor_id = vendorId;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo)   filters.date_to   = dateTo;
    if (minAmt)   filters.min_amount = minAmt;
    if (maxAmt)   filters.max_amount = maxAmt;

    currentFilters = filters;
    loadPurchaseOrders(filters);
    renderFilterChips(filters);
    updateClearBtn(filters);
}

function clearFilters() {
    document.getElementById("filterSearch").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterVendor").value = "";
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterMinAmount").value = "";
    document.getElementById("filterMaxAmount").value = "";

    currentFilters = {};
    loadPurchaseOrders({});
    renderFilterChips({});
    updateClearBtn({});
}

function updateClearBtn(filters) {
    const btn = document.getElementById("clearFiltersBtn");
    btn.style.display = Object.keys(filters).length > 0 ? "inline-flex" : "none";
}

// ─── Active Filter Chips ──────────────────────────────────────────────────────
function renderFilterChips(filters) {
    const container = document.getElementById("activeFilterChips");
    container.innerHTML = "";

    const labels = {
        search:     { icon: "bi-search",            label: "Ref" },
        status:     { icon: "bi-tag",               label: "Status" },
        vendor_id:  { icon: "bi-building",          label: "Vendor" },
        date_from:  { icon: "bi-calendar-event",    label: "From" },
        date_to:    { icon: "bi-calendar-check",    label: "To" },
        min_amount: { icon: "bi-currency-rupee",    label: "Min" },
        max_amount: { icon: "bi-currency-rupee",    label: "Max" },
    };

    Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;
        const meta = labels[key] || { icon: "bi-filter", label: key };

        let displayVal = value;
        if (key === "vendor_id") {
            const v = allVendors.find(x => String(x.id) === String(value));
            displayVal = v ? v.name : value;
        }

        const chip = document.createElement("span");
        chip.className = "filter-chip";
        chip.innerHTML = `
            <i class="bi ${meta.icon} me-1"></i>
            <strong>${meta.label}:</strong>&nbsp;${displayVal}
            <button class="chip-remove" onclick="removeFilter('${key}')" title="Remove filter">
                <i class="bi bi-x"></i>
            </button>
        `;
        container.appendChild(chip);
    });
}

function removeFilter(key) {
    // Reset the corresponding input
    const inputMap = {
        search:     "filterSearch",
        status:     "filterStatus",
        vendor_id:  "filterVendor",
        date_from:  "filterDateFrom",
        date_to:    "filterDateTo",
        min_amount: "filterMinAmount",
        max_amount: "filterMaxAmount",
    };
    const el = document.getElementById(inputMap[key]);
    if (el) el.value = "";

    delete currentFilters[key];
    loadPurchaseOrders(currentFilters);
    renderFilterChips(currentFilters);
    updateClearBtn(currentFilters);
}

// ─── Toggle Filter Panel ──────────────────────────────────────────────────────
function toggleFilterPanel() {
    const body = document.getElementById("filterBody");
    const icon = document.getElementById("filterToggleIcon");
    filterPanelOpen = !filterPanelOpen;

    if (filterPanelOpen) {
        body.style.display = "";
        icon.className = "bi bi-chevron-up";
    } else {
        body.style.display = "none";
        icon.className = "bi bi-chevron-down";
    }
}

// ─── PO Loader ────────────────────────────────────────────────────────────────
async function loadPurchaseOrders(filters = {}) {
    const token = localStorage.getItem("erp_token");
    const tbody = document.getElementById("po-table-body");

    // Show loading
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted py-5">
                <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                Loading purchase orders...
            </td>
        </tr>
    `;

    // Build query string
    const params = new URLSearchParams();
    if (filters.search)     params.set("search",     filters.search);
    if (filters.status)     params.set("status",     filters.status);
    if (filters.vendor_id)  params.set("vendor_id",  filters.vendor_id);
    if (filters.date_from)  params.set("date_from",  filters.date_from);
    if (filters.date_to)    params.set("date_to",    filters.date_to);
    if (filters.min_amount) params.set("min_amount", filters.min_amount);
    if (filters.max_amount) params.set("max_amount", filters.max_amount);

    const queryStr = params.toString() ? `?${params.toString()}` : "";

    try {
        const response = await fetch(`${API_BASE_URL}/purchase-orders/${queryStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
            } else {
                throw new Error("Failed to load POs");
            }
        }

        const data = await response.json();
        tbody.innerHTML = "";

        const countEl = document.getElementById("tableResultsCount");
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <div class="empty-state">
                            <div class="empty-state-icon"><i class="bi bi-inbox"></i></div>
                            <p class="empty-state-text">No purchase orders match your filters.</p>
                            ${Object.keys(filters).length > 0
                                ? `<button class="btn btn-sm btn-premium-outline mt-2" onclick="clearFilters()">
                                       <i class="bi bi-x-circle me-1"></i>Clear Filters
                                   </button>`
                                : ""}
                        </div>
                    </td>
                </tr>
            `;
            if (countEl) countEl.textContent = "No results found";
            return;
        }

        if (countEl) {
            const hasFilters = Object.keys(filters).length > 0;
            countEl.textContent = hasFilters
                ? `${data.length} result${data.length !== 1 ? "s" : ""} found`
                : `${data.length} purchase order${data.length !== 1 ? "s" : ""} total`;
        }

        data.forEach(po => {
            const row = document.createElement("tr");
            const vendorName = po.vendor ? po.vendor.name : ("Vendor #" + po.vendor_id);
            const dateStr = new Date(po.created_at).toLocaleDateString("en-IN", {
                year: "numeric", month: "short", day: "numeric"
            });
            row.innerHTML = `
                <td><strong>${po.reference_no}</strong></td>
                <td>
                    <span class="d-flex align-items-center gap-2">
                        <span class="vendor-avatar">${vendorName.charAt(0).toUpperCase()}</span>
                        ${vendorName}
                    </span>
                </td>
                <td><span class="amount-cell">Rs ${parseFloat(po.total_amount).toFixed(2)}</span></td>
                <td><span class="badge ${getStatusClass(po.status)}">${po.status}</span></td>
                <td class="text-muted">${dateStr}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error loading data. Please try again.
                </td>
            </tr>
        `;
    }
}

function getStatusClass(status) {
    if (status === 'Pending')  return 'badge-premium badge-pending';
    if (status === 'Approved') return 'badge-premium badge-approved';
    if (status === 'Rejected') return 'badge-premium badge-rejected';
    return 'badge-premium bg-secondary text-white';
}
