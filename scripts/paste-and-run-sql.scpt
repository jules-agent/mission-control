tell application "Safari"
	activate
	tell front window
		tell current tab
			-- Wait for page to load
			delay 2
			
			-- Execute JavaScript to paste SQL and click RUN
			do JavaScript "
				// Find the SQL editor textarea or Monaco editor
				const editor = document.querySelector('.monaco-editor') || document.querySelector('textarea');
				if (editor) {
					// Try to paste from clipboard
					document.execCommand('paste');
					
					// Wait a bit then click RUN button
					setTimeout(() => {
						const runButton = Array.from(document.querySelectorAll('button'))
							.find(btn => btn.textContent.includes('RUN') || btn.textContent.includes('Run'));
						if (runButton) {
							runButton.click();
						}
					}, 500);
				}
			"
		end tell
	end tell
end tell
