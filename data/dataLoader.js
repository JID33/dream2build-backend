// C:\Users\ASUS\dream2build-backend\data\dataLoader.js

function loadAllData() {
    // Your actual data loading logic goes here.
    // This could involve connecting to a database, reading files, etc.
    return new Promise((resolve, reject) => {
        console.log('Initiating data load...');
        // Simulate an asynchronous data loading process
        setTimeout(() => {
            console.log('All data loaded successfully! 🚀');
            resolve(); // Resolve the promise when data is loaded
        }, 3000); // Wait for 3 seconds
    });
}

// Export the function using CommonJS syntax (default for Node.js)
module.exports = {
    loadAllData
};

// If you're using ES Modules (i.e., you have "type": "module" in your package.json),
// you would use:
// export { loadAllData };