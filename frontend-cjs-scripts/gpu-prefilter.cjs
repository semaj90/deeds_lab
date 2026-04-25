#!/usr/bin/env node
/**
 * GPU-ACCELERATED ERROR FILTERING
 * 
 * Uses embedding similarity to pre-filter files for Phase 30v2/v3
 * Reduces processing time by focusing on high-probability error files
 * 
 * Pipeline:
 * 1. Extract code snippets from all files
 * 2. Generate embeddings via Gemma3 (embeddinggemma:latest)
 * 3. Compare to known TS1005 error patterns
 * 4. Output filtered file list for phase30v2/v3
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Ensure correct directory
const targetDir = path.resolve(__dirname);
if (path.basename(targetDir) === 'scripts') {
  process.chdir(path.resolve(__dirname, '..'));
}

// Setup logging
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logPath = path.join(logsDir, 'gpu-prefilter.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
function log(msg) {
  logStream.write(msg + '\n');
  console.log(msg);
}

log('\n' + '='.repeat(70));
log(`⚡ GPU-Accelerated Error Pre-Filter`);
log(`   Started: ${new Date().toISOString()}`);
log('='.repeat(70));

/**
 * Ollama embedding service (GPU-accelerated)
 */
async function getEmbedding(text) {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'embeddinggemma:latest',
        prompt: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    // Fallback: simple token count heuristic
    const suspiciousPatterns = [
      /\w+\s+(string|number|boolean|any)/,
      /<\w+\s+\w+>/,
      /interface\s+\w+\s*{[^}]*:\s*\w+\s+\w+:/,
      /\(\w+\s+\w+,/
    ];
    
    const score = suspiciousPatterns.reduce((acc, pattern) => {
      return acc + (pattern.test(text) ? 1 : 0);
    }, 0);
    
    return { fallback: true, score };
  }
}

/**
 * Calculate cosine similarity (GPU would do this, we'll simulate)
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.fallback || vec2.fallback) {
    // Fallback: return score-based similarity
    const score1 = vec1.score || 0;
    const score2 = vec2.score || 0;
    return Math.min(score1, score2) / Math.max(score1, score2, 1);
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Known TS1005 error patterns
 */
const knownErrorPatterns = [
  'interface User { name string age number }',
  'function test(name string): void {}',
  'const map = new Map<string number>();',
  'const arr: Array<string number> = [];'
];

async function main() {
  log('🧠 Generating embeddings for known error patterns...\n');
  
  // Get embeddings for known patterns
  const patternEmbeddings = [];
  for (const pattern of knownErrorPatterns) {
    const embedding = await getEmbedding(pattern);
    patternEmbeddings.push(embedding);
    log(`  ✓ Pattern: ${pattern.substring(0, 50)}...`);
  }
  
  log('\n📁 Scanning source files...\n');
  
  // Get all files
  const files = glob.sync('src/**/*.{ts,tsx,svelte}', {
    ignore: ['node_modules/**', '.svelte-kit/**', 'build/**']
  });
  
  const results = [];
  let processed = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Sample first 500 chars for speed
      const sample = content.substring(0, 500);
      
      const fileEmbedding = await getEmbedding(sample);
      
      // Compare to known patterns
      let maxSimilarity = 0;
      for (const patternEmbed of patternEmbeddings) {
        const similarity = cosineSimilarity(fileEmbedding, patternEmbed);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      
      results.push({
        file,
        similarity: maxSimilarity,
        likely: maxSimilarity > 0.5
      });
      
      processed++;
      if (processed % 100 === 0) {
        log(`  Processed ${processed}/${files.length} files...`);
      }
      
    } catch (error) {
      // Skip problematic files
    }
  }
  
  // Sort by similarity
  results.sort((a, b) => b.similarity - a.similarity);
  
  // Filter high-probability files
  const highProbability = results.filter(r => r.likely);
  
  log(`\n📊 Results:`);
  log(`  Total files scanned: ${files.length}`);
  log(`  High-probability errors: ${highProbability.length}`);
  log(`  Reduction: ${((1 - highProbability.length / files.length) * 100).toFixed(1)}%`);
  
  // Write filtered file list
  const outputPath = path.join(logsDir, 'gpu-filtered-files.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generated: new Date().toISOString(),
    totalFiles: files.length,
    filteredFiles: highProbability.length,
    files: highProbability.map(r => r.file)
  }, null, 2));
  
  log(`\n📝 Filtered file list saved to: ${outputPath}`);
  log('\n💡 Usage with Phase 30v2/v3:');
  log(`   node phase30v2-import-safe.cjs --from-json ${outputPath}`);
  log(`   node phase30v3-ast-fixer.cjs --from-json ${outputPath}`);
  
  log(`\n   Completed: ${new Date().toISOString()}`);
  log('='.repeat(70) + '\n');
  
  logStream.end();
}

// Run if Ollama is available, otherwise just log fallback info
fetch(process.env.OLLAMA_URL || 'http://localhost:11434')
  .then(() => {
    log('✅ Ollama service detected - using GPU embeddings\n');
    return main();
  })
  .catch(() => {
    log('⚠️  Ollama not available - using fallback heuristics\n');
    return main();
  });
