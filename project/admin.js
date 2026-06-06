const SUPABASE_URL = "https://vrjnxbcxmtmascpryykl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MkLb7iKW7LLv5zfrQqgRSA_Mj-C1BbH";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const loginFormContainer = document.getElementById('loginFormContainer');
const adminLoginForm = document.getElementById('adminLoginForm');
const dashboardContainer = document.getElementById('dashboardContainer');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const genderFilter = document.getElementById('genderFilter');

let allRegistrations = [];

window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') { showDashboard(); }
});

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

async function showDashboard() {
    loginFormContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    await fetchRegistrations();
}

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

function renderTable(dataList) {
    tableBody.innerHTML = '';
    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No records found.</td></tr>`;
        return;
    }
    dataList.forEach((row, index) => {
        const submissionDate = row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A';
        const tableRow = `
            <tr>
                <td>${index + 1}</td>
                <td>${row['Full Name'] || 'N/A'}</td>
                <td>${row["Father's Name"] || 'N/A'}</td>
                <td>${row['Age'] || 'N/A'}</td>
                <td>${row['Date of Birth'] || 'N/A'}</td>
                <td class="capitalize">${row['Gender'] || 'N/A'}</td>
                <td>${row['Phone Number'] || 'N/A'}</td>
                <td>${submissionDate}</td>
            </tr>
        `;
        tableBody.innerHTML += tableRow;
    });
}

function filterAndSearchData() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedGender = genderFilter.value;
    const filtered = allRegistrations.filter(row => {
        const fullNameVal = (row['Full Name'] || '').toLowerCase();
        const phoneVal = (row['Phone Number'] || '');
        const genderVal = (row['Gender'] || '').toLowerCase();
        const matchesSearch = fullNameVal.includes(searchQuery) || phoneVal.includes(searchQuery);
        const matchesGender = selectedGender === 'all' || genderVal === selectedGender.toLowerCase();
        return matchesSearch && matchesGender;
    });
    renderTable(filtered);
}

searchInput.addEventListener('input', filterAndSearchData);
genderFilter.addEventListener('change', filterAndSearchData);

window.exportFormDataToExcel = function() {
    if (allRegistrations.length === 0) {
        alert("No data available to export.");
        return;
    }
    const excelData = allRegistrations.map((row, index) => ({
        "Serial No.": index + 1,
        "Full Name": row['Full Name'] || 'N/A',
        "Father's Name": row["Father's Name"] || 'N/A',
        "Age": row['Age'] || 'N/A',
        "Date of Birth": row['Date of Birth'] || 'N/A',
        "Gender": row['Gender'] || 'N/A',
        "Phone Number": row['Phone Number'] || 'N/A',
        "Submitted At": row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    XLSX.writeFile(workbook, "Registration_Details.xlsx");
};

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    dashboardContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    adminLoginForm.reset();
});
