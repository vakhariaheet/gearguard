// Simple test script to verify equipment functionality
const API_BASE = 'https://api-dev-dhruv.hac.heetvakharia.in';

// Test functions
async function testCreateSampleData() {
  console.log('🧪 Testing sample data creation...');

  try {
    const response = await fetch(`${API_BASE}/api/equipment/sample`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sample data created:', data.message);
      return true;
    } else {
      console.log('❌ Sample data creation failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error creating sample data:', error.message);
    return false;
  }
}

async function testSearch() {
  console.log('🔍 Testing search functionality...');

  try {
    const response = await fetch(`${API_BASE}/api/equipment?search=printer`, {
      headers: {
        Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search successful:', data.equipment.length, 'items found');
      return true;
    } else {
      console.log('❌ Search failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error during search:', error.message);
    return false;
  }
}

async function testListEquipment() {
  console.log('📋 Testing equipment listing...');

  try {
    const response = await fetch(`${API_BASE}/api/equipment`, {
      headers: {
        Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Equipment listing successful:', data.equipment.length, 'items found');
      return data.equipment;
    } else {
      console.log('❌ Equipment listing failed:', response.status);
      return [];
    }
  } catch (error) {
    console.log('❌ Error listing equipment:', error.message);
    return [];
  }
}

// Instructions for manual testing
console.log(`
🔧 Equipment Management Testing Guide

To test the fixes:

1. **Backend Search Fix**: ✅ DEPLOYED
   - The search error (toLowerCase on undefined) has been fixed
   - Search now safely handles null/undefined values
   - Enhanced search includes location and department fields

2. **Frontend Edit Form Fix**: ✅ UPDATED
   - Select components now properly handle empty/null values
   - Form data is populated correctly when editing equipment
   - All Select fields (category, department, assignedTeam, status) work properly
   - Added unique keys to force re-rendering when switching between equipment
   - Improved value handling with proper undefined fallbacks

3. **Sample Data Creation**:
   - New endpoint: POST ${API_BASE}/api/equipment/sample
   - Creates 3 sample equipment items for testing

4. **Manual Testing Steps**:
   a) Open the frontend application
   b) Create sample data using the sample endpoint (or manually create equipment)
   c) Try searching for equipment (should not show 500 error)
   d) Create new equipment and verify all fields work
   e) **IMPORTANT**: Edit existing equipment and verify Select fields show current values:
      - Category should show the selected category (Machine, Vehicle, Computer, etc.)
      - Department should show the selected department (Production, IT, etc.)
      - Assigned Team should show the selected team (Team A, Team B, etc.)
      - Status should show the current status (Active, Under Maintenance, etc.)
   f) Test filtering by department, category, status

5. **Key Improvements Made**:
   ✅ Added unique keys to Select components based on equipment ID
   ✅ Enhanced form reset logic for create vs edit modes
   ✅ Improved value handling with proper undefined fallbacks
   ✅ Fixed form data population timing issues
   ✅ Enhanced error clearing when switching between modes

6. **API Testing** (with proper authentication):
   - Replace 'YOUR_TOKEN_HERE' with actual Clerk JWT token
   - Run: node test-equipment.js

The fixes address:
✅ Search toLowerCase error on undefined values
✅ Edit form Select components showing blank values (MAIN FIX)
✅ Sample data endpoint for testing
✅ Enhanced search functionality
✅ Proper form state management between create/edit modes
`);

// Uncomment to run tests (need proper auth token)
// testListEquipment().then(() => testSearch());
