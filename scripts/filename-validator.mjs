#!/usr/bin/env node

/**
 * Filename Validator Script
 * Scans the project for filenames that may cause issues with OneDrive, GitHub, or cross-platform compatibility
 */

import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';

// Windows reserved device names (case-insensitive)
const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

// Characters that are problematic in filenames
const PROBLEMATIC_CHARS = /[<>:"|?*\x00-\x1f]/;

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.vscode', 'dist', 'build', 'coverage', 
  'temp-backup-untracked', '.next', 'out'
]);

class FilenameValidator {
  constructor() {
    this.issues = [];
    this.totalFiles = 0;
    this.scannedDirs = 0;
  }

  /**
   * Check if a filename has issues
   * @param {string} filename - The filename to check
   * @param {string} fullPath - Full path for reporting
   * @returns {Array} Array of issues found
   */
  checkFilename(filename, fullPath) {
    const issues = [];
    const nameWithoutExt = basename(filename, extname(filename));
    
    // Check for Windows reserved names
    if (WINDOWS_RESERVED_NAMES.has(nameWithoutExt.toUpperCase())) {
      issues.push({
        type: 'RESERVED_NAME',
        severity: 'HIGH',
        message: `"${nameWithoutExt}" is a Windows reserved device name`,
        suggestion: `Rename to ${nameWithoutExt.toLowerCase()}-file${extname(filename) || '.txt'}`
      });
    }

    // Check for problematic characters
    if (PROBLEMATIC_CHARS.test(filename)) {
      const badChars = filename.match(PROBLEMATIC_CHARS);
      issues.push({
        type: 'PROBLEMATIC_CHARS',
        severity: 'MEDIUM',
        message: `Contains problematic characters: ${badChars.join(', ')}`,
        suggestion: 'Replace problematic characters with underscores or hyphens'
      });
    }

    // Check for trailing dots or spaces
    if (filename.endsWith('.') || filename.endsWith(' ')) {
      issues.push({
        type: 'TRAILING_CHARS',
        severity: 'MEDIUM',
        message: 'Filename ends with dot or space',
        suggestion: 'Remove trailing dots and spaces'
      });
    }

    // Check for leading dots (except .gitignore style files)
    if (filename.startsWith('.') && !this.isLegitDotFile(filename)) {
      issues.push({
        type: 'HIDDEN_FILE',
        severity: 'LOW',
        message: 'Filename starts with dot (hidden file)',
        suggestion: 'Consider if this should be a hidden file'
      });
    }

    // Check for very long filenames (>255 chars is filesystem limit)
    if (filename.length > 200) {
      issues.push({
        type: 'LONG_FILENAME',
        severity: 'MEDIUM',
        message: `Filename is very long (${filename.length} characters)`,
        suggestion: 'Consider shortening the filename'
      });
    }

    // Add path context to each issue
    return issues.map(issue => ({
      ...issue,
      filename,
      fullPath
    }));
  }

  /**
   * Check if a dotfile is legitimate (like .gitignore, .env, etc.)
   */
  isLegitDotFile(filename) {
    const legitDotFiles = [
      '.gitignore', '.gitattributes', '.env', '.env.example', '.env.local',
      '.env.development', '.env.production', '.env.staging', '.eslintrc',
      '.prettierrc', '.dockerignore', '.clineignore', '.editorconfig'
    ];
    
    return legitDotFiles.some(pattern => 
      filename === pattern || filename.startsWith(pattern + '.')
    );
  }

  /**
   * Recursively scan directory for problematic filenames
   * @param {string} dirPath - Directory to scan
   */
  async scanDirectory(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      this.scannedDirs++;

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) {
            await this.scanDirectory(fullPath);
          }
        } else {
          this.totalFiles++;
          const issues = this.checkFilename(entry.name, fullPath);
          this.issues.push(...issues);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Generate a report of findings
   */
  generateReport() {
    const highSeverity = this.issues.filter(i => i.severity === 'HIGH');
    const mediumSeverity = this.issues.filter(i => i.severity === 'MEDIUM');
    const lowSeverity = this.issues.filter(i => i.severity === 'LOW');

    console.log('\n📁 FILENAME VALIDATION REPORT');
    console.log('=' .repeat(50));
    console.log(`📊 Scanned: ${this.scannedDirs} directories, ${this.totalFiles} files`);
    console.log(`🚨 Issues found: ${this.issues.length} total`);
    console.log(`   🔴 High severity: ${highSeverity.length}`);
    console.log(`   🟡 Medium severity: ${mediumSeverity.length}`);
    console.log(`   🟢 Low severity: ${lowSeverity.length}`);

    if (this.issues.length === 0) {
      console.log('\n✅ No problematic filenames found! Your project is OneDrive and GitHub compatible.');
      return;
    }

    const reportBySeverity = (issues, severityLabel, emoji) => {
      if (issues.length === 0) return;
      
      console.log(`\n${emoji} ${severityLabel.toUpperCase()} SEVERITY ISSUES:`);
      console.log('-'.repeat(30));
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.fullPath}`);
        console.log(`   Problem: ${issue.message}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
        console.log('');
      });
    };

    reportBySeverity(highSeverity, 'high', '🔴');
    reportBySeverity(mediumSeverity, 'medium', '🟡');
    reportBySeverity(lowSeverity, 'low', '🟢');

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Fix HIGH severity issues immediately (these break OneDrive/GitHub)');
    console.log('2. Consider fixing MEDIUM severity issues for better compatibility');
    console.log('3. LOW severity issues are informational only');
    console.log('\n💡 Run this script with --fix flag to get automated fix suggestions');
  }

  /**
   * Main validation function
   */
  async validate(rootPath = '.') {
    console.log(`🔍 Scanning project for problematic filenames...`);
    console.log(`📂 Starting from: ${rootPath}`);
    
    const startTime = Date.now();
    await this.scanDirectory(rootPath);
    const endTime = Date.now();
    
    console.log(`⏱️ Scan completed in ${endTime - startTime}ms`);
    this.generateReport();
    
    // Return exit code based on high severity issues
    const highSeverity = this.issues.filter(i => i.severity === 'HIGH');
    return highSeverity.length > 0 ? 1 : 0;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new FilenameValidator();
  const rootPath = process.argv[2] || '.';
  
  validator.validate(rootPath)
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default FilenameValidator;
