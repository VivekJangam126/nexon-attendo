// Ensure office exists for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY5MTg1NCwiZXhwIjoyMDg2MjY3ODU0fQ.846KQ7v9nbH5-4COTqEgBGrboFFKrTG7w3AGPP4uIqk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureOfficeExists() {
    try {
        console.log('🏢 Checking if office exists...');
        
        // Check if office exists
        const { data: existingOffice, error: checkError } = await supabase
            .from('offices')
            .select('id, name, is_active')
            .limit(1)
            .single();
        
        if (existingOffice) {
            console.log('✅ Office exists:', existingOffice);
            
            if (!existingOffice.is_active) {
                console.log('🔧 Activating office...');
                const { error: updateError } = await supabase
                    .from('offices')
                    .update({ is_active: true })
                    .eq('id', existingOffice.id);
                
                if (updateError) {
                    console.error('❌ Failed to activate office:', updateError);
                } else {
                    console.log('✅ Office activated');
                }
            }
            return;
        }
        
        console.log('🔧 Creating office...');
        
        // Create office
        const { data: newOffice, error: createError } = await supabase
            .from('offices')
            .insert({
                name: 'SmartMatrix Pvt Ltd',
                address: 'Tech Park',
                city: 'Pune',
                state: 'Maharashtra',
                country: 'India',
                latitude: 18.5976337,
                longitude: 73.8056611,
                radius_in_meters: 100,
                is_active: true
            })
            .select()
            .single();
        
        if (createError) {
            console.error('❌ Failed to create office:', createError);
        } else {
            console.log('✅ Office created:', newOffice);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

ensureOfficeExists();