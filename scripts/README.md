# Auto-Index System

The `/posts` directory now auto-generates `index.json`!

## How It Works

### Automatic (GitHub Actions)
When you push a new post JSON file to `/posts/`, GitHub Actions automatically:
1. Scans all `.json` files in `/posts/` (except `index.json`)
2. Generates updated `index.json` with metadata
3. Commits and pushes the updated index

### Manual (Local)
Run this command after adding/editing posts:
```bash
npm run generate-index
```

Or directly:
```bash
node scripts/generate-index.js
```

## Workflow

### Adding a New Post
1. Create your post: `posts/my-new-post.json`
2. Commit and push to GitHub
3. GitHub Actions auto-updates `index.json` ✨
4. Your post appears on the site!

### Local Testing
1. Add post to `posts/`
2. Run `npm run generate-index`
3. Test locally
4. Commit everything (including auto-generated `index.json`)

## Files

- `/scripts/generate-index.js` - Generation script
- `/.github/workflows/generate-posts-index.yml` - Auto-trigger on push
- `/posts/index.json` - **Auto-generated** (don't edit manually)

## Benefits

✅ No manual index updates  
✅ Posts sorted by date automatically  
✅ Works with editor's download feature  
✅ Validates all post files exist  
✅ Extracts only needed metadata (id, title, date, tags)

## Note

The `index.json` file is still needed (browsers can't list directory contents), but now it's **automatically maintained**!
