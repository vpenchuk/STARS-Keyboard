// test.js - Simple module test
console.log('🧪 Test module loaded successfully!');

export const testFunction = () => {
    console.log('🎯 Test function called!');
    return true;
};

// Test basic functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Test module DOM ready');
    
    // Test ENTER button click
    const enterBtn = document.getElementById('btn-enter');
    if (enterBtn) {
        console.log('✅ ENTER button found:', enterBtn);
        enterBtn.addEventListener('click', () => {
            console.log('🔴 ENTER button clicked via test module!');
        });
    } else {
        console.log('❌ ENTER button NOT found');
    }
});