#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const KILO_MODELS_API = 'https://api.kilo.ai/api/gateway/models';
const README_PATH = path.join(__dirname, '../../README.md');

function fetchKiloModels() {
  return new Promise((resolve, reject) => {
    https.get(KILO_MODELS_API, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function isFree(pricing) {
  if (!pricing) return false;
  const promptPrice = parseFloat(pricing.prompt || '0');
  const completionPrice = parseFloat(pricing.completion || '0');
  return promptPrice === 0 && completionPrice === 0;
}

function filterFreeModels(models) {
  return models.filter(model => {
    const pricing = model.pricing || {};
    const hasFreePricing = isFree(pricing);
    const name = model.name || model.id || '';
    const hasFreeInName = name.toLowerCase().includes('free');
    return hasFreePricing && hasFreeInName;
  });
}

function formatNumber(num) {
  if (!num) return '-';
  return num >= 1000 ? `${Math.floor(num / 1000)}K` : num.toString();
}

function generateModelTable(freeModels) {
  const tableRows = [
    '| Model | Context | Output | Features |',
    '|-------|---------|--------|----------|'
  ];

  freeModels.forEach(model => {
    const name = model.name || model.id;
    const context = formatNumber(model.context_length);
    const output = formatNumber(model.top_provider?.max_completion_tokens);
    const modalities = model.architecture?.input_modalities || [];
    const features = modalities.includes('image') ? 'Vision support' : 'Text only';

    tableRows.push(`| **${name}** | ${context} | ${output} | ${features} |`);
  });

  return tableRows.join('\n');
}

function updateReadme() {
  console.log('[INFO] Fetching free models from Kilo Gateway...');

  fetchKiloModels()
    .then(models => {
      console.log(`[INFO] Found ${models.length} total models`);

      const freeModels = filterFreeModels(models);
      console.log(`[INFO] Found ${freeModels.length} free models`);

      if (freeModels.length === 0) {
        console.log('[WARNING] No free models found');
        return;
      }

      const readmeContent = fs.readFileSync(README_PATH, 'utf8');

      const tableStartMarker = '| Model | Context | Output | Features |';
      const tableStartIndex = readmeContent.indexOf(tableStartMarker);

      if (tableStartIndex === -1) {
        console.error('[ERROR] Could not find model table in README');
        process.exit(1);
      }

      const tableEndMarker = '\n---\n\n## Updating Models';
      const tableEndIndex = readmeContent.indexOf(tableEndMarker, tableStartIndex);

      if (tableEndIndex === -1) {
        console.error('[ERROR] Could not find end of model table in README');
        process.exit(1);
      }

      const newTable = generateModelTable(freeModels);
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const dateLine = `\n*Last updated: ${today}*`;

      const beforeTable = readmeContent.substring(0, tableStartIndex);
      const afterTable = readmeContent.substring(tableEndIndex);

      const newReadmeContent = beforeTable + newTable + dateLine + afterTable;

      fs.writeFileSync(README_PATH, newReadmeContent);

      console.log('[INFO] Successfully updated README with latest free models');
      console.log('[INFO] Last updated:', today);
    })
    .catch(error => {
      console.error('[ERROR]', error.message);
      process.exit(1);
    });
}

updateReadme();
