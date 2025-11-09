# GitHub Upload Guide for Windows 11

This guide will help you upload your project to GitHub on Windows 11.

## Prerequisites

### 1. Install Git for Windows

1. Download Git from: https://git-scm.com/download/win
2. Run the installer and follow the setup wizard (use default settings)
3. Verify installation by opening PowerShell or Command Prompt and running:
   ```bash
   git --version
   ```

### 2. Create a GitHub Account

1. Go to https://github.com
2. Sign up for a free account if you don't have one
3. Verify your email address

### 3. Create a Personal Access Token (PAT)

GitHub no longer accepts passwords for Git operations. You need a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "shortcut-anim-upload")
4. Select expiration (recommend 90 days or custom)
5. Check these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if you plan to use GitHub Actions)
6. Click "Generate token"
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - Save it securely (password manager recommended)

## Upload Steps

### Step 1: Configure Git (First Time Only)

Open PowerShell or Command Prompt and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

git config --global user.name "JoeyXi"
git config --global user.email "xiao1907@163.com"

```

Replace with your actual name and GitHub email.

### Step 2: Navigate to Your Project

```bash
cd D:\code\github\shortcut-anim
```

### Step 3: Initialize Git Repository (if not already initialized)

```bash
git init
```

### Step 4: Check Current Status

```bash
git status
```

This shows which files have been modified.

### Step 5: Add Files to Staging

Add all modified and new files:

```bash
git add .
```

Or add specific files:
```bash
git add README.md package.json apps/generator/generator-with-storage.js apps/generator/index-with-storage.html examples/embed-with-storage.html
```

### Step 6: Commit Changes

```bash
git commit -m "Release v0.2.0: Add localStorage support and auto OS detection"
```

### Step 7: Connect to GitHub Repository

If this is your first time pushing to this repo:

```bash
git remote add origin https://github.com/JoeyXi/shortcut-anim.git
```

If the remote already exists, verify it:
```bash
git remote -v
```

If the URL is wrong, update it:
```bash
git remote set-url origin https://github.com/JoeyXi/shortcut-anim.git
```

### Step 8: Push to GitHub

```bash
git push -u origin main
```

**When prompted for credentials:**
- Username: Your GitHub username
- Password: **Use your Personal Access Token** (not your GitHub password)

### Step 9: Create a Version Tag

Create a tag for v0.2.0:

```bash
git tag -a v0.2.0 -m "Version 0.2.0: localStorage support and auto OS detection"
git push origin v0.2.0
```

## Alternative: Using GitHub Desktop (Easier GUI Method)

If you prefer a graphical interface:

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. Click "File" → "Add Local Repository"
4. Select `D:\code\github\shortcut-anim`
5. Review changes, write commit message, and click "Commit to main"
6. Click "Push origin" to upload
7. To create a tag: Right-click on the commit → "Create tag" → Enter `v0.2.0`

## Troubleshooting

### Authentication Issues

If you get authentication errors:

1. **Use Personal Access Token**: Make sure you're using PAT, not password
2. **Update Git Credentials**: 
   ```bash
   git config --global credential.helper manager-core
   ```
   Then try pushing again - Windows Credential Manager will prompt you.

### Branch Name Issues

If your default branch is `master` instead of `main`:

```bash
git branch -M main
git push -u origin main
```

### Large File Issues

If you have large files, consider using Git LFS or adding them to `.gitignore`.

## Summary of Commands

```bash
# Navigate to project
cd D:\code\github\shortcut-anim

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Release v0.2.0: Add localStorage support and auto OS detection"

# Push to GitHub
git push -u origin main

# Create and push tag
git tag -a v0.2.0 -m "Version 0.2.0: localStorage support and auto OS detection"
git push origin v0.2.0
```

## What You Need

✅ **GitHub Account**: Free account at github.com  
✅ **Personal Access Token**: Created in GitHub Settings  
✅ **Git Installed**: Download from git-scm.com  
✅ **No SSH Keys Required**: HTTPS authentication is sufficient  

## Security Note

- Never commit your Personal Access Token to the repository
- Keep your token secure and don't share it
- Consider using GitHub Desktop or Git Credential Manager for easier authentication

