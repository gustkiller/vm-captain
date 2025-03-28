
// This file is not included in the main application bundle
// It's a standalone script to reset passwords in the SQLite database

/* 
  INSTRUCTIONS:
  
  To reset passwords in a Docker environment:
  
  1. Run this command to access the backend container shell:
     docker-compose exec backend /bin/bash
  
  2. Inside the container, run:
     python /app/reset_passwords.py
  
  This will reset the admin and user passwords to "123456"
*/

console.log('This script is meant to be run on the server side.');
console.log('Please follow the instructions in the comments to reset passwords.');

// For command-line use only - this exports nothing useful for the browser
module.exports = { 
  info: 'See comments for instructions on how to reset passwords in the SQLite database' 
};
