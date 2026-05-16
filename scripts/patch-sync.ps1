$file = "app\routes\app._index.jsx"
$content = [System.IO.File]::ReadAllText($file)

# 1. Add import after trial.server line
$old1 = 'import { getTrialStatus } from "../lib/trial.server";'
$new1 = 'import { getTrialStatus } from "../lib/trial.server";' + "`r`n" +
        'import {' + "`r`n" +
        '  syncExistingReviews,' + "`r`n" +
        '  hasRunInitialSync,' + "`r`n" +
        '  markInitialSyncDone,' + "`r`n" +
        '} from "../lib/review-sync.server";'
$content = $content.Replace($old1, $new1)

# 2. Change session destructure to also get admin
$old2 = '  const { session } = await authenticate.admin(request);'
$new2 = '  const { session, admin } = await authenticate.admin(request);'
$content = $content.Replace($old2, $new2)

# 3. Insert sync block before "// Ensure shop record exists"
$old3 = '  // Ensure shop record exists and get trial status'
$new3 = @"
  // Auto-sync existing reviews on first install (fire-and-forget, runs once)
  try {
    const alreadySynced = await hasRunInitialSync(shop);
    if (!alreadySynced) {
      syncExistingReviews(admin, shop)
        .then(() => markInitialSyncDone(shop))
        .catch((err) => console.error("[review-sync] error:", err));
    }
  } catch (syncErr) {
    console.error("[review-sync] check failed:", syncErr);
  }

  // Ensure shop record exists and get trial status
"@
$content = $content.Replace($old3, $new3)

[System.IO.File]::WriteAllText($file, $content)
Write-Host "Patch applied successfully."
