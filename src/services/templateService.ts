import { supabase } from '../lib/supabaseClient';
import { extractPlaceholders } from '../utils/placeholderParser';

export const getTemplateDetails = async (bucket: string, path: string) => {
    try {
        console.log(`Attempting to download template: ${bucket}/${path}`);

        // Attempt 1: Standard download
        const { data, error } = await supabase.storage.from(bucket).download(path);

        if (error) {
            console.warn('Standard download failed, attempting public URL fallback...', error);

            // Attempt 2: Public URL Fetch
            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error(`Could not get public URL for fallback.`);
            }

            console.log(`Fetching from Public URL: ${publicUrlData.publicUrl}`);
            const response = await fetch(publicUrlData.publicUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch from Public URL (${response.status} ${response.statusText}). Is the bucket 'templates' set to Public?`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const placeholders = extractPlaceholders(arrayBuffer);

            return {
                file: arrayBuffer,
                placeholders,
            };
        }

        if (!data) {
            throw new Error('Template not found (Data is null)');
        }

        const arrayBuffer = await data.arrayBuffer();
        const placeholders = extractPlaceholders(arrayBuffer);

        return {
            file: arrayBuffer,
            placeholders,
        };
    } catch (error: any) {
        console.error('Final Error in getTemplateDetails:', error);
        throw error;
    }
};

export interface TemplateRecord {
    id: string; // Changed to string because Storage uses UUIDs or strings
    name: string;
    path: string; // path in bucket
}

export const getTemplates = async (): Promise<TemplateRecord[]> => {
    try {
        // List all files in 'templates' bucket
        const { data, error } = await supabase
            .storage
            .from('templates')
            .list();

        if (error) {
            console.error('Error listing templates from storage:', error);
            throw error;
        }

        if (!data) return [];

        // Map storage objects to TemplateRecord
        // Filter out folders or non-docx if necessary
        return data
            .filter(item => item.name.endsWith('.docx'))
            .map(item => ({
                id: item.id || item.name, // Use item.id if available, else name
                name: item.name,
                path: item.name // In root of bucket, path is just name
            }));

    } catch (error) {
        console.error('Error in getTemplates:', error);
        return [];
    }
};
