const SUPABASE_URL = "https://vrjnxbcxmtmascpryykl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MkLb7iKW7LLv5zfrQqgRSA_Mj-C1BbH";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('dataEntryForm');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');
const successToast = document.getElementById('successMessage');
const duplicateToast = document.getElementById('duplicateMessage');

dobInput.addEventListener('change', () => {
    if (!dobInput.value) {
        ageInput.value = '';
        return;
    }
    const birthDate = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    ageInput.value = age >= 0 ? age : '';
});

function showToast(toastElement) {
    toastElement.classList.remove('hidden');
    setTimeout(() => { toastElement.classList.add('hidden'); }, 4000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const fatherName = document.getElementById('fatherName').value;
    const phone = document.getElementById('phone').value;
    const dob = document.getElementById('dob').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;

    const { data: existingUser, error: checkError } = await supabaseClient
        .from('Registration')
        .select('Phone Number')
        .eq('Phone Number', phone)
        .maybeSingle();

    if (existingUser) {
        showToast(duplicateToast);
        return;
    }

    const { data, error } = await supabaseClient
        .from('Registration')
        .insert([
            {
                "Full Name": fullName,
                "Father's Name": fatherName,
                "Phone Number": phone,
                "Date of Birth": dob,
                "Age": parseInt(age),
                "Gender": gender
            }
        ]);

    if (error) {
        console.error('Error inserting data:', error);
        alert('Something went wrong. Please try again.');
    } else {
        showToast(successToast);
        form.reset();
        ageInput.value = '';
    }
});
