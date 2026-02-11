export const isNoSuratKey = (key: string): boolean => {
    // Matches: No.Surat, no.surat, No. surat, no. Surat, etc.
    // Logic: Case insensitive, literal dot, optional space after dot.
    return /^no\.\s*surat$/i.test(key);
};

export const isNamaKey = (key: string): boolean => {
    // Matches: Nama, nama, NAMA (case-insensitive, exact match)
    return /^nama$/i.test(key);
};

export const processBatchData = (formData: Record<string, string>): Record<string, string>[] => {
    const recipients: Record<string, string>[] = [];
    const keys = Object.keys(formData);

    // Find the max number of items in any field (split by ;)
    let maxCount = 1;
    const splitData: Record<string, string[]> = {};

    keys.forEach(key => {
        // Use the robust check
        if (isNoSuratKey(key)) {
            splitData[key] = [formData[key]];
            return;
        }

        const values = formData[key].split(';').map(v => v.trim());
        if (values.length > maxCount) {
            maxCount = values.length;
        }
        splitData[key] = values;
    });

    // Generate objects
    for (let i = 0; i < maxCount; i++) {
        const item: Record<string, string> = {};
        keys.forEach(key => {
            const values = splitData[key];
            if (!values) {
                // This handles keys kept as-is (like No.surat or constant fields)
                item[key] = formData[key];
            } else if (values.length === 1) {
                item[key] = values[0];
            } else {
                item[key] = values[i] || values[values.length - 1] || "";
            }
        });
        recipients.push(item);
    }

    return recipients;
};
