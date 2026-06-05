document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginContainer = document.getElementById('loginFormContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const errorMsg = document.getElementById('errorMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const genderFilter = document.getElementById('genderFilter');

    // Simple Admin Credentials
    const ADMIN_USER = 'ashvin';
    const ADMIN_PASS = '4545';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = document.getElementById('username').value.trim().toLowerCase();
        const pass = document.getElementById('password').value.trim();

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            fetchDataLocal();
        } else {
            errorMsg.textContent = 'Invalid credentials. Try ashvin / 4545';
        }
    });

    searchInput.addEventListener('input', fetchDataLocal);
    genderFilter.addEventListener('change', fetchDataLocal);

    logoutBtn.addEventListener('click', () => {
        dashboardContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginForm.reset();
        errorMsg.textContent = '';
        searchInput.value = '';
        genderFilter.value = 'all';
    });
});

let localAdminData = [];

function fetchDataLocal() {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const genderFilter = document.getElementById('genderFilter');
    
    // Read directly from Local Storage
    const savedData = localStorage.getItem('form_data_entries');
    let allData = [];
    if (savedData) {
        allData = JSON.parse(savedData);
    }

    // DEDUPLICATION: Ensure no duplicates are shown or exported (Phone-Based)
    const map = new Map();
    allData.forEach(entry => {
        const phone = (entry.phone || '').trim();
        if (!phone) return;
        
        if (!map.has(phone)) {
            map.set(phone, entry);
        } else {
            const existing = map.get(phone);
            const currentScore = Object.values(entry).filter(v => v && v !== '-').length;
            const existingScore = Object.values(existing).filter(v => v && v !== '-').length;
            if (currentScore >= existingScore) {
                map.set(phone, entry);
            }
        }
    });
    
    const uniqueData = Array.from(map.values());
    
    // Update local storage if we found duplicates
    if (uniqueData.length !== allData.length) {
        localStorage.setItem('form_data_entries', JSON.stringify(uniqueData));
        allData = uniqueData;
    }

    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const filterValue = genderFilter?.value || 'all';

    localAdminData = allData.filter(entry => {
        const matchesSearch = 
            (entry.fullName || '').toLowerCase().includes(searchTerm) || 
            (entry.phone || '').includes(searchTerm);
        
        const matchesFilter = 
            filterValue === 'all' || 
            (entry.gender || '').toLowerCase() === filterValue;

        return matchesSearch && matchesFilter;
    });

    if (localAdminData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">${allData.length === 0 ? 'No submissions found.' : 'No matching results found.'}</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    localAdminData.forEach((entry, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.fullName || '-'}</td>
            <td>${entry.fatherName || '-'}</td>
            <td>${entry.age || '-'}</td>
            <td>${entry.dob || '-'}</td>
            <td>${entry.gender || '-'}</td>
            <td>${entry.phone || '-'}</td>
            <td>${entry.timestamp || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function exportFormDataToExcel() {
    // FORCE RELOAD DATA FROM STORAGE RIGHT BEFORE EXPORT
    const savedData = localStorage.getItem('form_data_entries');
    if (savedData) {
        localAdminData = JSON.parse(savedData);
    }

    if (localAdminData.length === 0) {
        alert("No data found in database to export.");
        return;
    }

    const formatEntry = (entry, index) => ({
        "ID": index + 1,
        "Full Name": entry.fullName || "N/A",
        "Father's Name": entry.fatherName || "N/A",
        "Age": entry.age || "N/A",
        "Date of Birth": entry.dob || "N/A",
        "Gender": entry.gender || "N/A",
        "Phone": entry.phone || "N/A",
        "Submitted At": entry.timestamp || "N/A"
    });

    const isMale = (g) => {
        if (!g) return false;
        const s = String(g).trim().toLowerCase();
        return s === 'male' || s === 'm' || s === 'boy';
    };

    const isFemale = (g) => {
        if (!g) return false;
        const s = String(g).trim().toLowerCase();
        return s === 'female' || s === 'f' || s === 'girl';
    };

    const boysRows = localAdminData.filter(e => isMale(e.gender)).map((e, index) => [
        index + 1, e.fullName || "N/A", e.fatherName || "N/A", e.age || "N/A", e.dob || "N/A", e.gender || "N/A", e.phone || "N/A", e.timestamp || "N/A"
    ]);
    
    const girlsRows = localAdminData.filter(e => isFemale(e.gender)).map((e, index) => [
        index + 1, e.fullName || "N/A", e.fatherName || "N/A", e.age || "N/A", e.dob || "N/A", e.gender || "N/A", e.phone || "N/A", e.timestamp || "N/A"
    ]);

    const headers = ["ID", "Full Name", "Father's Name", "Age", "Date of Birth", "Gender", "Phone", "Submitted At"];
    
    // Combine into one sequence of rows
    const finalData = [
        ["FORM SUBMISSION REPORT - GENDER SPLIT"],
        [],
        ["BOYS / MALE DATA"],
        headers,
        ...boysRows,
        [],
        ["GIRLS / FEMALE DATA"],
        headers,
        ...girlsRows
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    XLSX.utils.book_append_sheet(wb, ws, "Gender Split Data");

    // Auto-fit columns (small improvement)
    ws['!cols'] = [{wch:5}, {wch:25}, {wch:25}, {wch:10}, {wch:15}, {wch:15}, {wch:20}, {wch:25}];

    XLSX.writeFile(wb, "Gender_Split_Report.xlsx");
}
