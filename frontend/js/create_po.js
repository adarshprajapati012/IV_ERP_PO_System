const API_BASE_URL = window.location.origin.includes('localhost') ? "http://localhost:8000" : "";
let products = [];
let vendors = [];

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadVendors();
    loadProducts();
});

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
    if(!token) {
        window.location.href = "login.html";
        return;
    }
    
    // Display user email on the profile badge
    const payload = parseJwt(token);
    if(payload && payload.sub) {
        const emailDisplay = document.getElementById('userEmailDisplay');
        if (emailDisplay) emailDisplay.textContent = payload.sub;
    }

    // Load profile picture and name from localStorage
    loadUserProfile();
}

function loadUserProfile() {
    const picture = localStorage.getItem("erp_user_picture");
    const name    = localStorage.getItem("erp_user_name");
    const email   = localStorage.getItem("erp_user_email");

    const nameEl = document.getElementById("userNameDisplay");
    if (nameEl && name) nameEl.textContent = name;

    const emailEl = document.getElementById("userEmailDisplay");
    if (emailEl && email) emailEl.textContent = email;

    if (picture) {
        const navImg  = document.getElementById("navProfileImg");
        const navIcon = document.getElementById("navProfileIcon");
        if (navImg && navIcon) {
            navImg.src = picture;
            navImg.style.display = "block";
            navIcon.style.display = "none";
        }

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

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("erp_token");
    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;
    if(options.body) {
        headers["Content-Type"] = "application/json";
    }
    options.headers = headers;

    const response = await fetch(url, options);
    if(response.status === 401) {
        localStorage.removeItem("erp_token");
        window.location.href = "login.html";
    }
    return response;
}

async function loadVendors() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/vendors/`);
        vendors = await res.json();
        const select = document.getElementById("vendorSelect");
        vendors.forEach(v => {
            select.innerHTML += `<option value="${v.id}">${v.name}</option>`;
        });
    } catch(err) {
        console.error("Error loading vendors", err);
    }
}

async function submitNewVendor() {
    const name = document.getElementById("vendorNameInput").value.trim();
    const contact = document.getElementById("vendorContactInput").value.trim();
    const ratingStr = document.getElementById("vendorRatingInput").value;
    const rating = ratingStr ? parseFloat(ratingStr) : 0.0;

    if (!name) {
        alert("Vendor Name is required.");
        return;
    }

    const payload = {
        name: name,
        contact: contact || null,
        rating: rating
    };

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/vendors/`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const newVendor = await res.json();
            
            // Add to dropdown
            const select = document.getElementById("vendorSelect");
            select.innerHTML += `<option value="${newVendor.id}">${newVendor.name}</option>`;
            
            // Auto-select the newly created vendor
            select.value = newVendor.id;
            
            // Add to local vendors array
            vendors.push(newVendor);
            
            // Hide Bootstrap modal
            const modalEl = document.getElementById('addVendorModal');
            const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            bsModal.hide();
            
            // Clear form
            document.getElementById("addVendorForm").reset();
            
            // Optional: alert success or smooth toast
            alert("Vendor added successfully!");
        } else {
            const errData = await res.json();
            alert("Failed to add vendor: " + (errData.detail || "Unknown error"));
        }
    } catch(err) {
        console.error("Error saving vendor", err);
        alert("Network error while saving vendor.");
    }
}

async function loadProducts() {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/products/`);
        products = await res.json();
        // Add first row by default
        addProductRow();
    } catch(err) {
        console.error("Error loading products", err);
    }
}

async function submitNewProduct() {
    const name = document.getElementById("productNameInput").value.trim();
    const sku = document.getElementById("productSkuInput").value.trim();
    const priceStr = document.getElementById("productPriceInput").value;
    const stockStr = document.getElementById("productStockInput").value;
    const desc = document.getElementById("productDescInput").value.trim();
    
    const price = priceStr ? parseFloat(priceStr) : 0.0;
    const stock = stockStr ? parseInt(stockStr) : 0;

    if (!name || !sku || !priceStr) {
        alert("Name, SKU, and Unit Price are required.");
        return;
    }

    const payload = {
        name: name,
        sku: sku,
        unit_price: price,
        stock_level: stock,
        description: desc || null
    };

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/products/`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const newProduct = await res.json();
            
            // Add to local products array
            products.push(newProduct);
            
            // Inject into all existing Product Select dropdowns on the screen
            const selectElements = document.querySelectorAll('.product-select');
            selectElements.forEach(select => {
                select.innerHTML += `<option value="${newProduct.id}" data-price="${newProduct.unit_price}" data-stock="${newProduct.stock_level}">${newProduct.name} - Rs ${newProduct.unit_price} (Stock: ${newProduct.stock_level})</option>`;
            });
            
            // Hide Bootstrap modal
            const modalEl = document.getElementById('addProductModal');
            const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            bsModal.hide();
            
            // Clear form
            document.getElementById("addProductForm").reset();
            
            alert("Product added successfully!");
        } else {
            const errData = await res.json();
            alert("Failed to add product: " + (errData.detail || "Unknown error"));
        }
    } catch(err) {
        console.error("Error saving product", err);
        alert("Network error while saving product.");
    }
}

function addProductRow() {
    const tbody = document.getElementById("itemsBody");
    const tr = document.createElement("tr");

    let options = `<option value="" disabled selected>Select Product</option>`;
    products.forEach(p => {
        options += `<option value="${p.id}" data-price="${p.unit_price}" data-stock="${p.stock_level}">${p.name} - Rs ${p.unit_price} (Stock: ${p.stock_level})</option>`;
    });

    tr.innerHTML = `
        <td>
            <select class="form-select product-select" onchange="productChanged(this)">
                ${options}
            </select>
        </td>
        <td><input type="number" class="form-control price-input" value="0.00" readonly></td>
        <td><input type="number" class="form-control qty-input" value="1" min="1" onchange="calculateTotals()"></td>
        <td><input type="text" class="form-control line-total" value="Rs 0.00" readonly></td>
        <td><button class="btn btn-premium-danger btn-sm" onclick="removeRow(this)"><i class="bi bi-trash"></i> Remove</button></td>
    `;
    tbody.appendChild(tr);
    calculateTotals();
}

function removeRow(btn) {
    const row = btn.closest("tr");
    row.remove();
    calculateTotals();
}

function productChanged(selectElem) {
    const selectedOption = selectElem.options[selectElem.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    const stock = selectedOption.getAttribute('data-stock');
    const row = selectElem.closest("tr");
    
    // Auto-fill price
    const priceInput = row.querySelector(".price-input");
    priceInput.value = parseFloat(price || 0).toFixed(2);
    
    // Set max quantity based on stock
    const qtyInput = row.querySelector(".qty-input");
    const stockVal = parseInt(stock || 0);
    qtyInput.max = stockVal;
    
    // If current qty is already more than stock, reset it
    if (parseInt(qtyInput.value) > stockVal) {
        qtyInput.value = stockVal;
        alert(`Quantity capped at maximum available stock (${stockVal}).`);
    }
    
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;
    const rows = document.querySelectorAll("#itemsBody tr");
    
    rows.forEach(row => {
        const price = parseFloat(row.querySelector(".price-input").value) || 0;
        let qtyInput = row.querySelector(".qty-input");
        let qty = parseInt(qtyInput.value) || 0;
        
        // Enforce max stock limit on typing
        const maxStock = parseInt(qtyInput.max);
        if (maxStock !== undefined && !isNaN(maxStock)) {
            if (qty > maxStock) {
                alert(`Cannot exceed available stock of ${maxStock}.`);
                qtyInput.value = maxStock;
                qty = maxStock;
            }
        }
        
        const lineTotal = price * qty;
        row.querySelector(".line-total").value = "Rs " + lineTotal.toFixed(2);
        
        subtotal += lineTotal;
    });
    
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    document.getElementById("subtotalLabel").innerText = "Rs " + subtotal.toFixed(2);
    document.getElementById("taxLabel").innerText = "Rs " + tax.toFixed(2);
    document.getElementById("totalLabel").innerText = "Rs " + total.toFixed(2);
}

async function generateDescription() {
    const name = document.getElementById("aiProductName").value;
    const descBox = document.getElementById("aiDescription");
    if(!name) {
        alert("Please enter a product name first.");
        return;
    }
    
    try {
        descBox.value = "Generating...";
        autoResizeTextarea(descBox);
        
        const res = await fetchWithAuth(`${API_BASE_URL}/products/generate-description`, {
            method: "POST",
            body: JSON.stringify({ product_name: name })
        });
        const data = await res.json();
        
        descBox.value = data.description || "Failed to generate.";
        autoResizeTextarea(descBox);
    } catch(err) {
        console.error(err);
        descBox.value = "Error calling AI service.";
        autoResizeTextarea(descBox);
    }
}

function autoResizeTextarea(elem) {
    elem.style.height = 'auto';
    elem.style.height = (elem.scrollHeight) + 'px';
}

async function submitPO() {
    alert("Submit PO button was clicked! Testing connection.");
    console.log("Submit PO initiated");
    const reference_no = document.getElementById("poRefNo").value;
    const vendor_id = document.getElementById("vendorSelect").value;
    
    if(!reference_no || !vendor_id) {
        alert("Please fill reference number and select a vendor.");
        return;
    }

    const rows = document.querySelectorAll("#itemsBody tr");
    if(rows.length === 0) {
        alert("Please add at least one product.");
        return;
    }

    const items = [];
    let valid = true;
    rows.forEach(row => {
        const product_id = row.querySelector(".product-select").value;
        const qty = parseInt(row.querySelector(".qty-input").value) || 0;
        const price = parseFloat(row.querySelector(".price-input").value) || 0;
        
        if(!product_id || qty <= 0) {
            valid = false;
        }

        items.push({
            product_id: parseInt(product_id),
            quantity: qty,
            unit_price: price
        });
    });

    if(!valid) {
        alert("Please ensure all products are selected and quantities are valid.");
        return;
    }

    const payload = {
        vendor_id: parseInt(vendor_id),
        reference_no: reference_no,
        items: items
    };

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders/`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            alert("PO Created Successfully!");
            window.location.href = "dashboard.html";
        } else {
            const errBase = await res.json();
            alert("Failed to create PO: " + JSON.stringify(errBase));
        }
    } catch (err) {
        console.error(err);
        alert("Network error.");
    }
}
