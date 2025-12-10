const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase/config.json', 'utf8'));

const supabase = createClient(
  config.api_url,
  config.service_role_key
);

async function checkPlans() {
  console.log('Checking workout plans in database...');

  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data.length} plans:`);
    data.forEach(plan => {
      console.log(`- ${plan.name} (ID: ${plan.id})`);
    });

    // Check seed data IDs
    const seedIds = [
      '10000000-0000-0000-0000-000000000001', // Push Pull Legs
      '10000000-0000-0000-0000-000000000002'  // Full Body General
    ];

    console.log('\nChecking seed data plans:');
    seedIds.forEach(id => {
      const plan = data.find(p => p.id === id);
      if (plan) {
        console.log(`✅ ${plan.name} exists`);
      } else {
        console.log(`❌ Plan with ID ${id} not found`);
      }
    });

  } catch (error) {
    console.error('Failed to check plans:', error);
  }
}

checkPlans();
