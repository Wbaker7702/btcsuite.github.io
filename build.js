#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const sourceDir = __dirname;

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['javascripts', 'stylesheets', 'images'];
subdirs.forEach(dir => {
  const dirPath = path.join(distDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

console.log('Building artifacts...\n');

// Simple CSS minifier (basic implementation)
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/;\s*}/g, '}')            // Remove semicolon before closing brace
    .replace(/\s*{\s*/g, '{')          // Remove spaces around {
    .replace(/;\s*/g, ';')             // Remove spaces after semicolons
    .replace(/:\s*/g, ':')             // Remove spaces after colons
    .replace(/,\s*/g, ',')             // Remove spaces after commas
    .trim();
}

// Simple JS minifier (basic implementation)
function minifyJS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '')          // Remove line comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/;\s*}/g, '}')            // Remove semicolon before closing brace
    .replace(/\s*{\s*/g, '{')          // Remove spaces around {
    .replace(/}\s*/g, '}')             // Remove spaces after }
    .replace(/;\s*/g, ';')             // Remove spaces after semicolons
    .replace(/,\s*/g, ',')             // Remove spaces after commas
    .trim();
}

// Simple HTML minifier
function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')   // Remove HTML comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/>\s+</g, '><')           // Remove spaces between tags
    .trim();
}

// Minify JavaScript
function processJS() {
  console.log('Minifying JavaScript...');
  const jsFiles = ['javascripts/main.js'];
  
  jsFiles.forEach(file => {
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(distDir, file);
    const code = fs.readFileSync(inputPath, 'utf8');
    
    const minified = minifyJS(code);
    fs.writeFileSync(outputPath, minified);
    
    const originalSize = fs.statSync(inputPath).size;
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    console.log(`  ✓ ${file}: ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`);
  });
}

// Minify CSS
function processCSS() {
  console.log('\nMinifying CSS...');
  const cssFiles = [
    'stylesheets/stylesheet.css',
    'stylesheets/pygment_trac.css',
    'stylesheets/print.css'
  ];
  
  cssFiles.forEach(file => {
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(distDir, file);
    const css = fs.readFileSync(inputPath, 'utf8');
    
    const minified = minifyCSS(css);
    fs.writeFileSync(outputPath, minified);
    
    const originalSize = fs.statSync(inputPath).size;
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    console.log(`  ✓ ${file}: ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`);
  });
}

// Minify HTML
function processHTML() {
  console.log('\nMinifying HTML...');
  const inputPath = path.join(sourceDir, 'index.html');
  const outputPath = path.join(distDir, 'index.html');
  const html = fs.readFileSync(inputPath, 'utf8');
  
  const minified = minifyHTML(html);
  fs.writeFileSync(outputPath, minified);
  
  const originalSize = fs.statSync(inputPath).size;
  const minifiedSize = Buffer.byteLength(minified, 'utf8');
  const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  console.log(`  ✓ index.html: ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`);
}

// Copy images
function copyImages() {
  console.log('\nCopying images...');
  const imagesDir = path.join(sourceDir, 'images');
  const distImagesDir = path.join(distDir, 'images');
  const images = fs.readdirSync(imagesDir);
  
  images.forEach(image => {
    const srcPath = path.join(imagesDir, image);
    const destPath = path.join(distImagesDir, image);
    fs.copyFileSync(srcPath, destPath);
    const size = fs.statSync(srcPath).size;
    console.log(`  ✓ ${image}: ${size} bytes`);
  });
}

// Copy other files
function copyOtherFiles() {
  console.log('\nCopying other files...');
  const otherFiles = ['LICENSE', 'README.md'];
  
  otherFiles.forEach(file => {
    const srcPath = path.join(sourceDir, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(distDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file}`);
    }
  });
}

// Build summary
function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('Build Summary');
  console.log('='.repeat(50));
  
  function getDirSize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    });
    
    return size;
  }
  
  const sourceSize = getDirSize(sourceDir);
  const distSize = getDirSize(distDir);
  const savings = ((1 - distSize / sourceSize) * 100).toFixed(1);
  
  console.log(`Source size: ${(sourceSize / 1024).toFixed(2)} KB`);
  console.log(`Dist size:   ${(distSize / 1024).toFixed(2)} KB`);
  console.log(`Reduction:   ${savings}%`);
  console.log('\n✓ Build complete! Artifacts in ./dist/');
}

// Run build
function build() {
  try {
    processJS();
    processCSS();
    processHTML();
    copyImages();
    copyOtherFiles();
    printSummary();
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
