import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
	try {
		// Use PowerShell to open folder browser dialog on Windows
		const script = `
Add-Type -AssemblyName System.Windows.Forms
$folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
$folderBrowser.Description = "Select a project directory"
$folderBrowser.ShowNewFolderButton = $false
$result = $folderBrowser.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $folderBrowser.SelectedPath
}
		`.trim();

		const { stdout } = await execPromise(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
		
		const path = stdout.trim();
		
		if (!path) {
			return json({ cancelled: true }, { status: 200 });
		}

		return json({ path });
	} catch (error) {
		console.error('Error opening directory browser:', error);
		return json(
			{
				error: 'Failed to open directory browser',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
