// 1. Initialize Supabase Client
const SUPABASE_URL = "https://vrjnxbcxmtmascpryykl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MkLb7iKW7LLv5zfrQqgRSA_Mj-C1BbH";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Credentials for Admin Portal
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// 2. DOM Elements
const loginFormContainer = document.getElementById('loginFormContainer');
const adminLoginForm = document.getElementById('adminLoginForm');
const dashboardContainer = document.getElementById('dashboardContainer');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const genderFilter = document.getElementById('genderFilter');

// Global array to hold fetched registrations for search/filter operations
let allRegistrations = [];

// 3. Handle Admin Session (keeps you logged in if you refresh)
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
    }
});

// 4. Handle Login
adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        errorMessage.textContent = '';
        showDashboard();
    } else {
        errorMessage.textContent = 'Invalid username or password.';
    }
});

// 5. Show Dashboard & Fetch Data
async function showDashboard() {
    loginFormContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    await fetchRegistrations();
}

// 6. Fetch Data from Supabase
async function fetchRegistrations() {
    const { data, error } = await supabaseClient
        .from('Registration')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching registrations:', error);
        alert('Failed to load registrations.');
        return;
    }

    allRegistrations = data;
    renderTable(allRegistrations);
}

// 7. Render Data into HTML Table
function renderTable(dataList) {
    tableBody.innerHTML = '';
    
    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No records found.</td></tr>`;
        return;
    }

    dataList.forEach((row, index) => {
        const submissionDate = row.created_at 
            ? new Date(row.created_at).toLocaleString() 
            : 'N/A';

        const tableRow = `
            <tr>
                <td>${index + 1}</td>
                <td>${row.full_name}</td>
                <td>${row.fathers_name}</td>
                <td>${row.age}</td>
                <td>${row.date_of_birth}</td>
                <td class="capitalize">${row.gender}</td>
                <td>${row.phone_number}</td>
                <td>${submissionDate}</td>
            </tr>
        `;
        tableBody.innerHTML += tableRow;
    });
}

// 8. Search and Filter Functionality
function filterAndSearchData() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedGender = genderFilter.value;

    const filtered = allRegistrations.filter(row => {
        const matchesSearch = 
            row.full_name.toLowerCase().includes(searchQuery) || 
            row.phone_number.includes(searchQuery);

        const matchesGender = 
            selectedGender === 'all' || 
            row.gender.toLowerCase() === selectedGender.toLowerCase();

        return matchesSearch && matchesGender;
    });

    renderTable(filtered);
}

searchInput.addEventListener('input', filterAndSearchData);
genderFilter.addEventListener('change', filterAndSearchData);

// 9. Export to Excel using SheetJS
window.exportFormDataToExcel = function() {
    if (allRegistrations.length === 0) {
        alert("No data available to export.");
        return;
    }

    const excelData = allRegistrations.map((row, index) => ({
        "Serial No.": index + 1,
        "Full Name": row.full_name,
        "Father's Name": row.fathers_name,
        "Age": row.age,
        "Date of Birth": row.date_of_birth,
        "Gender": row.gender,
        "Phone Number": row.phone_number,
        "Submitted At": row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    XLSX.writeFile(workbook, "Registration_Details.xlsx");
};

// 10. Handle Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    dashboardContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    adminLoginForm.reset();
});
