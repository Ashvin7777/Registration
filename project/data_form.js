// 1. Initialize Supabase Client
const SUPABASE_URL = "https://vrjnxbcxmtmascpryykl.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_MkLb7iKW7LLv5zfrQqgRSA_Mj-C1BbH";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM Elements
const form = document.getElementById('dataEntryForm');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');
const successToast = document.getElementById('successMessage');
const duplicateToast = document.getElementById('duplicateMessage');

// 3. Auto-Calculate Age based on Date of Birth
dobInput.addEventListener('change', () => {
    if (!dobInput.value) {
        ageInput.value = '';
        return;
    }
    const birthDate = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    ageInput.value = age >= 0 ? age : '';
});

// Helper function to show toasts
function showToast(toastElement) {
    toastElement.classList.remove('hidden');
    // Hide it after 4 seconds
    setTimeout(() => {
        toastElement.classList.add('hidden');
    }, 4000);
}

// 4. Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get input values
    const fullName = document.getElementById('fullName').value;
    const fatherName = document.getElementById('fatherName').value;
    const phone = document.getElementById('phone').value;
    const dob = document.getElementById('dob').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;

    // Check if phone number already exists in Supabase to prevent duplicates
    const { data: existingUser, error: checkError } = await supabase
        .from('Registration') // Replace with your exact table name in Supabase
        .select('phone_number')
        .eq('phone_number', phone)
        .maybeSingle();

    if (checkError) {
        console.error('Database check error:', checkError);
    }

    if (existingUser) {
        // Show duplicate toast and stop
        showToast(duplicateToast);
        return;
    }

    // Insert new record into Supabase
    const { data, error } = await supabase
        .from('Registration') // Replace with your exact table name in Supabase
        .insert([
            {
                full_name: fullName,
                fathers_name: fatherName,
                phone_number: phone,
                date_of_birth: dob,
                age: parseInt(age),
                gender: gender
            }
        ]);

    if (error) {
        console.error('Error inserting data:', error);
        alert('Something went wrong. Please try again.');
    } else {
        // Show success toast and reset form
        showToast(successToast);
        form.reset();
        ageInput.value = ''; // Clear age read-only field
    }
});