const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setPassword() {
    const emails = ['andrick@gmail.com', 'admin@automatemomentum.com'];
    for (const email of emails) {
        const { data: users, error: findError } = await supabase.auth.admin.listUsers();
        if (findError) {
            console.error('Error fetching users:', findError);
            return;
        }

        const user = users.users.find(u => u.email === email);
        if (!user) {
            console.log(`User ${email} not found.`);
            continue;
        }

        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: 'password123' }
        );
        if (error) {
            console.error(`Failed to update ${email}:`, error);
        } else {
            console.log(`Successfully set password for ${email} to 'password123'`);
        }
    }
}

setPassword();
