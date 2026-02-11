'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';

function getDriveClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            'Missing Google OAuth credentials in .env.local. ' +
            'Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN'
        );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
}

async function findOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
    const query = [
        `mimeType='application/vnd.google-apps.folder'`,
        `name='${folderName}'`,
        `trashed=false`,
        parentId ? `'${parentId}' in parents` : undefined
    ].filter(Boolean).join(' and ');

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    const folder = res.data.files?.[0];

    if (folder) {
        return folder.id;
    }

    // Create if not exists
    const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
        fileMetadata.parents = [parentId];
    }

    const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return file.data.id;
}

export async function uploadToDrive(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string;

        if (!file) {
            throw new Error('No file provided');
        }

        const drive = getDriveClient();

        // 1. Root Folder
        const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
        let rootFolderId: string;

        if (parentFolderId) {
            rootFolderId = await findOrCreateFolder(drive, 'hasil_surat', parentFolderId);
        } else {
            rootFolderId = await findOrCreateFolder(drive, 'hasil_surat');
        }

        // 2. Month Folder: e.g. "February 2026"
        const date = new Date();
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const monthFolderId = await findOrCreateFolder(drive, monthYear, rootFolderId);

        // 3. Upload File
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata = {
            name: fileName || file.name,
            parents: [monthFolderId],
        };

        const media = {
            mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: stream,
        };

        const res = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        console.log("Drive Upload Success:", res.data);

        return {
            success: true,
            fileId: res.data.id,
            webViewLink: res.data.webViewLink,
            folderId: monthFolderId
        };

    } catch (error: any) {
        console.error('Drive Upload Error:', error.message);
        return { success: false, error: error.message };
    }
}
