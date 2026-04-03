# Scan admin pages for .from() calls without company_id filter
$files = Get-ChildItem "app/admin/(main)" -Include "*.tsx" -Recurse
$problemFiles = @()

# Tables that need company_id filtering
$needCompanyId = @('vehicles', 'tours', 'profiles', 'brands', 'expenses', 'checklists', 'templates', 'guests')

foreach ($file in $files) {
    $c = Get-Content $file.FullName -Raw
    foreach ($table in $needCompanyId) {
        # Check if file queries this table
        if ($c -match "\.from\(['\"]$table['\"]\)") {
            # Check if it has company_id filter
            if ($c -notmatch "\.eq\(['\"]company_id['\"]") {
                $problemFiles += "$table in $($file.FullName.Replace('C:\Users\lifeo\OneDrive\Documents\GitHub\tour-ops-platform\',''))"
            }
        }
    }
}

if ($problemFiles.Count -eq 0) {
    Write-Host "All queries are filtered by company_id"
} else {
    $problemFiles | ForEach-Object { Write-Host $_ }
}
