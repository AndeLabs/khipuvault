#!/usr/bin/env node

const fs = require('fs');

// Get arguments
const reportFile = process.argv[2];
const allowedLicenses = process.argv[3] ? process.argv[3].split(',').filter(x => x) : [];
const warnLicenses = process.argv[4] ? process.argv[4].split(',').filter(x => x) : [];
const blockedLicenses = process.argv[5] ? process.argv[5].split(',').filter(x => x) : [];

// Read and parse the license report
const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

let total = 0;
let allowed = 0;
let warnings = 0;
let blocked = 0;
let unknown = 0;

const blockedPkgs = [];
const warnPkgs = [];
const unknownPkgs = [];

// Helper function for exact license matching
function matchesLicense(license, pattern) {
    // Split licenses (might be OR/AND combined)
    const licenseParts = license.split(/\s+(?:OR|AND)\s+|\s*\|\|\s*|\s*&&\s*/).map(l => l.trim().replace(/[()]/g, ''));
    return licenseParts.some(part => part === pattern || pattern === license);
}

// Analyze each package
for (const [pkg, info] of Object.entries(data)) {
    total++;
    const license = info.licenses || 'UNKNOWN';

    if (license === 'UNKNOWN' || license === '') {
        unknown++;
        unknownPkgs.push(pkg);
    } else if (blockedLicenses.some(bl => matchesLicense(license, bl))) {
        blocked++;
        blockedPkgs.push(`${pkg} (${license})`);
    } else if (warnLicenses.some(wl => matchesLicense(license, wl))) {
        warnings++;
        warnPkgs.push(`${pkg} (${license})`);
    } else if (allowedLicenses.some(al => matchesLicense(license, al))) {
        allowed++;
    } else {
        unknown++;
        unknownPkgs.push(`${pkg} (${license})`);
    }
}

// Output as bash variables
console.log(`total=${total}`);
console.log(`allowed=${allowed}`);
console.log(`warnings=${warnings}`);
console.log(`blocked=${blocked}`);
console.log(`unknown=${unknown}`);

// Arrays need special handling
console.log(`blocked_packages_data='${blockedPkgs.join('|||')}'`);
console.log(`warn_packages_data='${warnPkgs.join('|||')}'`);
console.log(`unknown_packages_data='${unknownPkgs.join('|||')}'`);
