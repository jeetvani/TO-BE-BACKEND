const XLSX = require('xlsx');
const fs = require('fs');

function generateExcelWithPhoneNumbers() {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Generate phone numbers
    const phoneNumbers = generatePhoneNumbers(10);
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(phoneNumbers);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "PhoneNumbers");

    // Write the workbook to a file
    const filePath = 'phone_numbers.xlsx';
    XLSX.writeFile(workbook, filePath);

    console.log(`Excel file with 100 phone numbers generated successfully at: ${filePath}`);
}

function generatePhoneNumbers(count) {
    const phoneNumbers = [];
    for (let i = 0; i < count; i++) {
        const phoneNumber = generateRandomPhoneNumber();
        phoneNumbers.push({ "PhoneNumbers": phoneNumber });
    }
    return phoneNumbers;
}

function generateRandomPhoneNumber() {
    const phoneNumber = '+1' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1$2$3');
}

generateExcelWithPhoneNumbers();
