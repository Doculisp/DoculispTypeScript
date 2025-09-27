# Get the current directory
$rootDir = Get-Location

# Include the root directory and all subdirectories
$allDirs = Get-ChildItem -Path $rootDir -Recurse -Directory
$allDirs += $rootDir.Path  # Add root manually since -Recurse skips it

foreach ($dir in $allDirs) {
    try {
        # Get all *.received.* files in this directory
        $files = Get-ChildItem -Path $dir -Filter "*.received.*" -File -ErrorAction SilentlyContinue

        foreach ($file in $files) {
            try {
                # Replace 'received' with 'approved' in the filename
                $newName = $file.Name -replace '\.received\.', '.approved.'

                # Build the full path for the destination file
                $destPath = Join-Path -Path $dir -ChildPath $newName

                # Copy and overwrite if the file exists
                Copy-Item -Path $file.FullName -Destination $destPath -Force -ErrorAction SilentlyContinue
            } catch {
                # Swallow file-level errors silently
                continue
            }
        }
    } catch {
        # Swallow directory-level errors silently
        continue
    }
}