#!/usr/bin/env node

/**
 * OpenCode Kilo Gateway Free Models Patcher
 * 
 * This script fetches free models from Kilo Gateway and patches OpenCode config
 * to use them. Run this from any directory - it will update the global
 * opencode.json file in ~/.config/opencode/
 * 
 * USAGE:
 *   node patch.js
 * 
 * What it does:
 *   1. Fetches latest model list from Kilo Gateway API
 *   2. Filters for free models (pricing = 0)
 *   3. Updates ~/.config/opencode/opencode.json with Kilo Gateway provider
 *   4. Preserves all existing configuration
 * 
 * After running, you can use free models like:
 *   opencode run "prompt" --model=kilogateway/z-ai-glm-5-free
 *   opencode run "prompt" --model=kilogateway/kilo-auto
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
const KILO_MODELS_API = 'https://api.kilo.ai/api/gateway/models';

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
    return isFree(pricing);
  });
}

function modelIdToSlug(id) {
  return id.replace(/[:/]/g, '-').toLowerCase();
}

function updateConfig(config, freeModels) {
  if (!config.provider) {
    config.provider = {};
  }

  if (!config.provider.kilogateway) {
    config.provider.kilogateway = {
      npm: '@ai-sdk/openai-compatible',
      name: 'Kilo Gateway',
      options: {
        baseURL: 'https://api.kilo.ai/api/gateway'
      },
      models: {}
    };
  }

  freeModels.forEach(model => {
    const slug = modelIdToSlug(model.id);
    config.provider.kilogateway.models[slug] = {
      id: model.id,
      name: model.name || model.id
    };

    if (model.context_length) {
      config.provider.kilogateway.models[slug].limit = {
        context: model.context_length,
        output: model.top_provider?.max_completion_tokens || 32000
      };
    }

    if (model.architecture?.input_modalities) {
      config.provider.kilogateway.models[slug].modalities = {
        input: model.architecture.input_modalities,
        output: model.architecture.output_modalities || ['text']
      };
    }
  });

  return config;
}

function main() {
  console.log('[INFO] Fetching free models from Kilo Gateway...');
  
  fetchKiloModels()
    .then(models => {
      console.log(`[INFO] Found ${models.length} total models`);
      
      const freeModels = filterFreeModels(models);
      console.log(`[INFO] Found ${freeModels.length} free models`);
      
      freeModels.forEach(m => {
        console.log(`  - ${m.name}`);
      });

      if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
        console.error(`[ERROR] Config file not found at ${GLOBAL_CONFIG_PATH}`);
        console.error('[INFO] Creating new config file...');
        
        const newConfig = {
          $schema: 'https://opencode.ai/config.json',
          provider: {}
        };
        
        const updatedConfig = updateConfig(newConfig, freeModels);
        
        fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
        console.log(`[SUCCESS] Created new config at ${GLOBAL_CONFIG_PATH}`);
        // perform health checks on added models
        performHealthChecks(updatedConfig, Object.keys(updatedConfig.provider.kilogateway.models || {}));
      } else {
        const config = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8'));
        console.log('[INFO] Updating existing opencode.json...');
        
        const updatedConfig = updateConfig(config, freeModels);
        
        fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
        console.log(`[SUCCESS] Successfully updated ${GLOBAL_CONFIG_PATH}`);
        // perform health checks on added models
        performHealthChecks(updatedConfig, Object.keys(updatedConfig.provider.kilogateway.models || {}));
      }
      
      console.log('');
      console.log('[INFO] Free Kilo Gateway models are now available!');
      console.log('[INFO] Usage examples:');
      console.log(`  opencode run "your prompt" --model=kilogateway/z-ai-glm-5-free`);
      console.log(`  opencode run "your prompt" --model=kilogateway/kilo-auto`);
      console.log(`  opencode run "your prompt" --model=kilogateway/giga-potato`);
      console.log(`  opencode run "your prompt" --model=kilogateway/corethink-free`);
      console.log('');
      console.log('[INFO] Run this script anytime to refresh free models:');
      console.log(`  node ${__filename}`);
    })
    .catch(error => {
      console.error('[ERROR]', error.message);
      process.exit(1);
    });
}

if (require.main === module) {
  main();
}

module.exports = { updateConfig, fetchKiloModels, filterFreeModels };

// Health check helpers
function isOpencodeAvailable() {
  try {
    const which = spawnSync('which', ['opencode']);
    return which.status === 0 && which.stdout && which.stdout.toString().trim().length > 0;
  } catch (e) {
    return false;
  }
}

function performHealthChecks(config, slugs) {
  // Allow skipping health checks with env var
  if (process.env.SKIP_HEALTHCHECK) {
    console.log('[INFO] SKIP_HEALTHCHECK set — skipping model health checks');
    return;
  }

  if (!config || !config.provider || !config.provider.kilogateway) return;

  if (!isOpencodeAvailable()) {
    console.warn('[WARN] `opencode` CLI not found in PATH — skipping runtime health checks');
    console.warn('[WARN] To enable checks install opencode or set SKIP_HEALTHCHECK=1');
    return;
  }

  const failed = [];
  const succeeded = [];

  slugs.forEach(slug => {
    const modelRef = `kilogateway/${slug}`;
    console.log(`[INFO] Checking model ${modelRef} using CLI...`);

    try {
      const args = ['run', 'what is 2+2', `--model=${modelRef}`, '--max-tokens=20'];
      const res = spawnSync('opencode', args, { timeout: 30000, encoding: 'utf8' });

      if (res.status === 0) {
        const stdout = (res.stdout || '').toLowerCase();
        if (stdout.includes('4')) {
          console.log(`  [OK] ${modelRef} responded correctly`);
          succeeded.push(slug);
        } else {
          console.error(`  [FAIL] ${modelRef} returned unexpected answer (expected "4")`);
          console.error(`  [OUTPUT] ${res.stdout}`);
          failed.push(slug);
        }
      } else {
        console.error(`  [FAIL] ${modelRef} failed (exit ${res.status})`);
        if (res.stderr) console.error(res.stderr.toString());
        failed.push(slug);
      }
    } catch (e) {
      console.error(`  [ERROR] Checking ${modelRef} threw: ${e.message}`);
      failed.push(slug);
    }
  });

  // Remove failed models from config and persist
  if (failed.length > 0) {
    failed.forEach(slug => {
      delete config.provider.kilogateway.models[slug];
    });

    fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`[INFO] Removed ${failed.length} failing model(s) from ${GLOBAL_CONFIG_PATH}`);
  }

  if (succeeded.length > 0) {
    // print the exact user-requested success message
    console.log('Inslataltion successfil soemthing update the code');
  }
}
