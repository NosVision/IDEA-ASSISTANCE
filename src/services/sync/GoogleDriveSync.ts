
export interface BackupData {
    version: string;
    lastSync: string;
    data: {
        notes: any[];
        tasks: any[];
        categories: any[];
        chatSessions: any[];
    };
}

export class GoogleDriveSync {
    private accessToken: string;
    private readonly FOLDER_NAME = 'appDataFolder'; // Use appDataFolder to hide from user, or 'root' to show
    private readonly FILE_NAME = 'idea-assistance-backup.json';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    async syncToGoogleDrive(data: BackupData['data']): Promise<void> {
        const fileContent = JSON.stringify({
            version: '1.0.0',
            lastSync: new Date().toISOString(),
            data
        }, null, 2);

        const existingFile = await this.findFile(this.FILE_NAME);

        if (existingFile) {
            await this.updateFile(existingFile.id, fileContent);
        } else {
            await this.createFile(this.FILE_NAME, fileContent);
        }
    }

    async syncFromGoogleDrive(): Promise<BackupData | null> {
        const existingFile = await this.findFile(this.FILE_NAME);

        if (!existingFile) {
            return null;
        }

        const content = await this.downloadFile(existingFile.id);
        try {
            return JSON.parse(content) as BackupData;
        } catch (e) {
            console.error('Failed to parse backup file', e);
            return null;
        }
    }

    private async findFile(name: string): Promise<{ id: string } | null> {
        const query = `name='${name}' and '${this.FOLDER_NAME}' in parents and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=${this.FOLDER_NAME}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to search file: ${response.statusText}`);
        }

        const data = await response.json();
        return data.files?.[0] || null;
    }

    private async createFile(name: string, content: string): Promise<any> {
        const metadata = {
            name,
            mimeType: 'application/json',
            parents: [this.FOLDER_NAME]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to create file: ${response.statusText}`);
        }

        return response.json();
    }

    private async updateFile(fileId: string, content: string): Promise<any> {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: content
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update file: ${response.statusText}`);
        }

        return response.json();
    }

    private async downloadFile(fileId: string): Promise<string> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        return response.text();
    }
}
