# Quick Upload Commands

Copy and paste these commands in PowerShell (one at a time):

## Step 1: Navigate to Project
```powershell
cd D:\code\github\shortcut-anim
```

## Step 2: Check What Will Be Uploaded
```powershell
git status
```

## Step 3: Add All Changes
```powershell
git add .
```

## Step 4: Commit Changes
```powershell
git commit -m "Release v0.2.0: Add localStorage support and auto OS detection"
```

## Step 5: Push to GitHub
```powershell
git push origin main
```

**When prompted:**
- Username: `JoeyXi` (or your GitHub username)
- Password: **Paste your Personal Access Token** (not your GitHub password)

## Step 6: Create Version Tag
```powershell
git tag -a v0.2.0 -m "Version 0.2.0: localStorage support and auto OS detection"
git push origin v0.2.0
```

## Files Being Uploaded

### New Files:
- ✅ `apps/generator/generator-with-storage.js` - Enhanced generator with localStorage
- ✅ `apps/generator/index-with-storage.html` - Enhanced generator UI
- ✅ `examples/embed-with-storage.html` - Example with new features
- ✅ `GITHUB_UPLOAD_GUIDE.md` - Upload guide
- ✅ `.gitignore` - Git ignore rules

### Updated Files:
- ✅ `README.md` - Updated with v0.2.0 features
- ✅ `package.json` - Version bumped to 0.2.0

### Note:
- Backup files (`.bak`) are excluded via `.gitignore`
- `examples/ed.html` will be included (you can remove it if not needed)

## If You Need to Remove a File Before Committing

```powershell
# Remove from staging (keeps the file)
git restore --staged examples/ed.html

# Or remove the file completely
Remove-Item examples/ed.html
git add .
```

