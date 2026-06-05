// Completely rewritten to use LocalStorage Architecture (Offline Support)
let formEntries = JSON.parse(localStorage.getItem('form_data_entries')) || [];

// 1. DATA CLEANUP - Remove any existing duplicates from storage on load (Phone-Based)
const cleanExistingData = () => {
    const map = new Map();
    formEntries.forEach(entry => {
        const phone = String(entry.phone || '').trim();
        if (!phone) return;
        
        if (!map.has(phone)) {
            map.set(phone, entry);
        } else {
            // Keep the one with more information (non-empty fields)
            const existing = map.get(phone);
            const currentScore = Object.values(entry).filter(v => v && v !== '-').length;
            const existingScore = Object.values(existing).filter(v => v && v !== '-').length;
            
            if (currentScore >= existingScore) {
                map.set(phone, entry);
            }
        }
    });
    
    const unique = Array.from(map.values());
    if (unique.length !== formEntries.length) {
        formEntries = unique;
        localStorage.setItem('form_data_entries', JSON.stringify(formEntries));
        console.log(`Cleaned up duplicates. Unique records: ${formEntries.length}`);
    }
};
cleanExistingData();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dataEntryForm');
    const toast = document.getElementById('successMessage');
    const duplicateToast = document.getElementById('duplicateMessage');
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    const phoneInput = document.getElementById('phone');

    // Phone Number Input Guard (Limit to 10 digits only)
    phoneInput.addEventListener('input', (e) => {
        // Remove non-digit characters
        let val = e.target.value.replace(/\D/g, '');
        
        // Limit to 10 digits
        if (val.length > 10) {
            val = val.substring(0, 10);
        }
        
        e.target.value = val;
    });

    // Automatic Age Calculation
    dobInput.addEventListener('change', () => {
        if (!dobInput.value) return;
        
        const birthDate = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age >= 0) {
            ageInput.value = age;
        } else {
            ageInput.value = '';
        }
    });

    form.addEventListener('submit', (e) => {
        // Prevent default form submission via HTTP
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = {
            fullName: formData.get('fullName'),
            fatherName: formData.get('fatherName'),
            age: formData.get('age'),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            phone: formData.get('phone'),
            timestamp: new Date().toLocaleString()
        };

        // 2. DUPLICATE PREVENTION - Check if Phone already exists
        const isDuplicate = formEntries.some(entry => 
            String(entry.phone || '').trim() === String(data.phone || '').trim()
        );

        if (isDuplicate) {
            // Show duplicate message
            duplicateToast.classList.remove('hidden');
            void duplicateToast.offsetWidth; // Force Reflow
            duplicateToast.classList.add('show');
            
            setTimeout(() => {
                duplicateToast.classList.remove('show');
                setTimeout(() => { duplicateToast.classList.add('hidden'); }, 400);
            }, 4000);
            return;
        }

        const btn = form.querySelector('.submit-btn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span>Processing...</span>';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        // Save locally
        formEntries.push(data);
        localStorage.setItem('form_data_entries', JSON.stringify(formEntries));
        console.log("Form Saved to Browser LocalStorage Successfully:", data);

        // Restore button smoothly
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;
            
            // Show toast message
            toast.classList.remove('hidden');
            void toast.offsetWidth; // Force Reflow
            toast.classList.add('show');

            // Reset form
            form.reset();

            // Hide toast after 4 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 400); 
            }, 4000);
        }, 600);
    });
});
