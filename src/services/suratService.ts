import { supabase } from '../lib/supabaseClient';

export const getNextLetterNumber = async (): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('nomor_counter')
            .select('last_number')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching letter number:', error);
            return '001'; // Fallback
        }

        const nextNumber = (data?.last_number || 0) + 1;
        return nextNumber.toString().padStart(3, '0');
    } catch (error) {
        console.error('Error in getNextLetterNumber:', error);
        return '001';
    }
};

export const getLastLetterNumber = async (): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('nomor_counter')
            .select('last_number')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching last letter number:', error);
            return '000'; // Default if none
        }

        const lastNumber = data?.last_number || 0;
        return lastNumber.toString().padStart(3, '0');
    } catch (error) {
        console.error('Error in getLastLetterNumber:', error);
        return '000';
    }
};

export const incrementLetterNumber = async (): Promise<string> => {
    try {
        // Atomic increment using update
        // 1. Get current
        const { data: currentData, error: fetchError } = await supabase
            .from('nomor_counter')
            .select('last_number')
            .eq('id', 1)
            .single();

        if (fetchError) throw fetchError;

        const nextVal = (currentData?.last_number || 0) + 1;

        // 2. Update
        const { data: updatedData, error: updateError } = await supabase
            .from('nomor_counter')
            .update({ last_number: nextVal })
            .eq('id', 1)
            .select()
            .single();

        if (updateError) throw updateError;

        return updatedData.last_number.toString().padStart(3, '0');
    } catch (error) {
        console.error('Error incrementing letter number:', error);
        throw error;
    }
};

export const setLastLetterNumber = async (val: number): Promise<void> => {
    try {
        const { error } = await supabase
            .from('nomor_counter')
            .update({ last_number: val })
            .eq('id', 1);

        if (error) throw error;
    } catch (error) {
        console.error('Error setting last letter number:', error);
        throw error;
    }
};

// Database logging interfaces
export interface LetterRecord {
    id?: number;
    no_surat: string;
    template_name: string; // 'Manual' or template name
    jenis_surat?: string; // e.g. Undangan, Sponsorship
    recipient: string;
    created_at?: string;
    created_by?: string; // nickname or uuid
    drive_link?: string;
}

export const logLetter = async (record: LetterRecord) => {
    try {
        const { error } = await supabase
            .from('surat_log') // Ensure this table exists in Supabase
            .insert([record]);

        if (error) {
            console.warn("Failed to log letter to database:", error);
            // Non-blocking error
        }
    } catch (err) {
        console.error("Error logging letter:", err);
    }
}

export const getLetters = async (): Promise<LetterRecord[]> => {
    try {
        // Using sura_log for now. 
        // If 'profiles' join is needed for nickname, we'd do:
        // .select('*, profiles(nickname)')
        // But for now let's just fetch raw data and assume created_by might be stored directly or we add join later.
        const { data, error } = await supabase
            .from('surat_log')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching letters:", JSON.stringify(error, null, 2));
        return [];
    }
}
