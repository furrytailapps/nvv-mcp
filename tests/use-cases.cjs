// User scenario tests simulating how an AI agent would use the NVV MCP
// These tests represent real-world workflows for construction/infrastructure companies
const http = require('http');
const https = require('https');

// Allow testing against production via MCP_URL env var
const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp';
const parsedUrl = new URL(MCP_URL);
const isHttps = parsedUrl.protocol === 'https:';
const httpModule = isHttps ? https : http;

function parseSSE(sseText) {
  const lines = sseText.split('\n');
  let data = '';
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      data += line.substring(6);
    }
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

async function testMCP(method, params = {}) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  });

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      Accept: 'application/json, text/event-stream',
    },
  };

  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const parsed = parseSSE(body);
        if (parsed) {
          resolve(parsed);
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ rawBody: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function callTool(name, args) {
  const result = await testMCP('tools/call', { name, arguments: args });
  return JSON.parse(result.result?.content?.[0]?.text || '{}');
}

// ============================================================================
// USE CASE 1: Construction Site Environmental Check
// Scenario: "We're planning a construction project in Uppsala kommun.
//            Check for protected nature areas that might affect our permits."
// ============================================================================
async function useCase1_ConstructionSiteEnvironmentalCheck() {
  console.log('USE CASE 1: Construction Site Environmental Check');
  console.log('Scenario: "Planning construction in Uppsala - check protected areas"\n');

  const results = { passed: 0, failed: 0 };

  // Step 1: Look up kommun code for Uppsala
  console.log('  Step 1: Look up kommun code for Uppsala...');
  const lookupData = await callTool('nvv_lookup', {
    lookupType: 'kommun',
    query: 'Uppsala',
  });

  if (lookupData.results?.length > 0 || lookupData.municipalities?.length > 0) {
    console.log(`    OK Found kommun code`);
    results.passed++;
  } else {
    console.log(`    FAILED: ${lookupData.message || 'Unknown error'}`);
    results.failed++;
  }

  // Step 2: List protected areas in Uppsala
  console.log('\n  Step 2: List protected areas in Uppsala kommun (0380)...');
  const areasData = await callTool('nvv_list_protected_areas', {
    kommun: '0380',
    limit: 10,
  });

  if (areasData.areas !== undefined) {
    console.log(`    OK Found ${areasData.count} protected areas`);
    if (areasData.areas.length > 0) {
      console.log(`       Example: ${areasData.areas[0].name} (${areasData.areas[0].type})`);
    }
    results.passed++;
  } else {
    console.log(`    FAILED: ${areasData.message || 'Unknown error'}`);
    results.failed++;
  }

  // Step 3: Search for Natura 2000 areas (EU protected)
  console.log('\n  Step 3: Search for Natura 2000 areas in Uppsala...');
  const n2000Data = await callTool('nvv_n2000_search', {
    kommun: '0380',
    limit: 5,
  });

  if (n2000Data.areas !== undefined) {
    console.log(`    OK Found ${n2000Data.count} Natura 2000 areas`);
    results.passed++;
  } else {
    console.log(`    FAILED: ${n2000Data.message || 'Unknown error'}`);
    results.failed++;
  }

  const total = results.passed + results.failed;
  console.log(`\n  Result: ${results.passed}/${total} steps passed\n`);
  return results;
}

// ============================================================================
// USE CASE 2: Species Impact Assessment
// Scenario: "We need to check if there are areas with protected bird species
//            near our planned wind farm site."
// ============================================================================
async function useCase2_SpeciesImpactAssessment() {
  console.log('USE CASE 2: Species Impact Assessment');
  console.log('Scenario: "Check for protected bird species in Gotland län"\n');

  const results = { passed: 0, failed: 0 };

  // Step 1: Search Natura 2000 areas with bird filter
  console.log('  Step 1: Search N2000 areas with bird species in Gotland (län=I)...');
  const n2000Data = await callTool('nvv_n2000_search', {
    lan: 'I',
    limit: 10,
  });

  if (n2000Data.areas !== undefined) {
    console.log(`    OK Found ${n2000Data.count} Natura 2000 areas`);
    results.passed++;
  } else {
    console.log(`    FAILED: ${n2000Data.message || 'Unknown error'}`);
    results.failed++;
  }

  // Step 2: Get details for first N2000 area (if found)
  if (n2000Data.areas?.length > 0) {
    const areaCode = n2000Data.areas[0].kod || n2000Data.areas[0].code;
    console.log(`\n  Step 2: Get species details for ${areaCode}...`);
    const detailData = await callTool('nvv_n2000_detail', {
      kod: areaCode,
    });

    if (detailData.area || detailData.species) {
      console.log(`    OK Retrieved area details`);
      if (detailData.species?.length > 0) {
        console.log(`       Found ${detailData.species.length} species listed`);
      }
      results.passed++;
    } else {
      console.log(`    FAILED: ${detailData.message || 'Unknown error'}`);
      results.failed++;
    }
  } else {
    console.log('\n  Step 2: Skipped (no areas found in step 1)');
  }

  const total = results.passed + results.failed;
  console.log(`\n  Result: ${results.passed}/${total} steps passed\n`);
  return results;
}

// ============================================================================
// USE CASE 3: Wetland Protection Check (Ramsar Sites)
// Scenario: "Checking if our drainage project affects any Ramsar wetland sites."
// ============================================================================
async function useCase3_WetlandProtectionCheck() {
  console.log('USE CASE 3: Wetland Protection Check (Ramsar)');
  console.log('Scenario: "Check Ramsar wetland sites in Skåne län"\n');

  const results = { passed: 0, failed: 0 };

  // Step 1: Search for Ramsar sites in Skåne
  console.log('  Step 1: Search Ramsar wetland sites in Skåne (län=M)...');
  const ramsarData = await callTool('nvv_ramsar_search', {
    lan: 'M',
    limit: 10,
  });

  if (ramsarData.areas !== undefined) {
    console.log(`    OK Found ${ramsarData.count} Ramsar sites`);
    if (ramsarData.areas.length > 0) {
      console.log(`       Example: ${ramsarData.areas[0].name}`);
    }
    results.passed++;
  } else {
    console.log(`    FAILED: ${ramsarData.message || 'Unknown error'}`);
    results.failed++;
  }

  const total = results.passed + results.failed;
  console.log(`\n  Result: ${results.passed}/${total} steps passed\n`);
  return results;
}

// ============================================================================
// USE CASE 4: Multi-Area Planning Analysis
// Scenario: "We have a list of potential sites across Stockholm län.
//            Get the combined extent for overview mapping."
// ============================================================================
async function useCase4_MultiAreaPlanningAnalysis() {
  console.log('USE CASE 4: Multi-Area Planning Analysis');
  console.log('Scenario: "Get extent of protected areas in Stockholm for mapping"\n');

  const results = { passed: 0, failed: 0 };

  // Step 1: List protected areas in Stockholm
  console.log('  Step 1: List protected areas in Stockholm kommun (0180)...');
  const areasData = await callTool('nvv_list_protected_areas', {
    kommun: '0180',
    limit: 5,
  });

  if (areasData.areas?.length > 0) {
    console.log(`    OK Found ${areasData.count} protected areas`);
    results.passed++;

    // Step 2: Get combined extent of the areas
    const areaIds = areasData.areas.slice(0, 3).map((a) => a.id);
    console.log(`\n  Step 2: Get combined extent for ${areaIds.length} areas...`);
    const extentData = await callTool('nvv_get_areas_extent', {
      areaIds: areaIds,
    });

    if (extentData.bbox || extentData.extent) {
      console.log(`    OK Got combined bounding box`);
      results.passed++;
    } else {
      console.log(`    FAILED: ${extentData.message || 'Unknown error'}`);
      results.failed++;
    }
  } else {
    console.log(`    FAILED: ${areasData.message || 'No areas found'}`);
    results.failed++;
    console.log('\n  Step 2: Skipped (no areas found in step 1)');
  }

  const total = results.passed + results.failed;
  console.log(`\n  Result: ${results.passed}/${total} steps passed\n`);
  return results;
}

// ============================================================================
// USE CASE 5: Detailed Area Analysis for Permit Application
// Scenario: "Get full details of a nature reserve for our permit application."
// ============================================================================
async function useCase5_DetailedAreaAnalysis() {
  console.log('USE CASE 5: Detailed Area Analysis for Permit Application');
  console.log('Scenario: "Get full details of a protected area for permit filing"\n');

  const results = { passed: 0, failed: 0 };

  // Step 1: Find areas by name
  console.log('  Step 1: Search for "Nacka" nature reserves...');
  const searchData = await callTool('nvv_list_protected_areas', {
    namn: 'Nacka',
    limit: 5,
  });

  if (searchData.areas?.length > 0) {
    console.log(`    OK Found ${searchData.count} areas matching "Nacka"`);
    results.passed++;

    // Step 2: Get full details for the first area
    const areaId = searchData.areas[0].id;
    console.log(`\n  Step 2: Get full details for area ID ${areaId}...`);
    const detailData = await callTool('nvv_get_area_detail', {
      areaId: areaId,
      includeGeometry: true,
    });

    if (detailData.area || detailData.name) {
      console.log(`    OK Retrieved area details`);
      if (detailData.purposes?.length > 0) {
        console.log(`       Purposes: ${detailData.purposes.length} listed`);
      }
      if (detailData.regulations?.length > 0) {
        console.log(`       Regulations: ${detailData.regulations.length} rules`);
      }
      results.passed++;
    } else {
      console.log(`    FAILED: ${detailData.message || 'Unknown error'}`);
      results.failed++;
    }
  } else {
    console.log(`    FAILED: ${searchData.message || 'No areas found'}`);
    results.failed++;
    console.log('\n  Step 2: Skipped (no areas found in step 1)');
  }

  const total = results.passed + results.failed;
  console.log(`\n  Result: ${results.passed}/${total} steps passed\n`);
  return results;
}

// ============================================================================
// Main test runner
// ============================================================================
async function main() {
  console.log('='.repeat(70));
  console.log('NVV MCP - USER SCENARIO TESTS');
  console.log('Simulating AI agent workflows for construction/infrastructure companies');
  console.log(`URL: ${MCP_URL}`);
  console.log('='.repeat(70) + '\n');

  // Initialize MCP
  await testMCP('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'use-case-test', version: '1.0.0' },
  });

  const allResults = [];

  // Run all use cases
  console.log('-'.repeat(70) + '\n');
  allResults.push(await useCase1_ConstructionSiteEnvironmentalCheck());

  console.log('-'.repeat(70) + '\n');
  allResults.push(await useCase2_SpeciesImpactAssessment());

  console.log('-'.repeat(70) + '\n');
  allResults.push(await useCase3_WetlandProtectionCheck());

  console.log('-'.repeat(70) + '\n');
  allResults.push(await useCase4_MultiAreaPlanningAnalysis());

  console.log('-'.repeat(70) + '\n');
  allResults.push(await useCase5_DetailedAreaAnalysis());

  // Print summary
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);

  console.log('='.repeat(70));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Steps: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70) + '\n');

  // Exit with error code if any tests failed
  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
