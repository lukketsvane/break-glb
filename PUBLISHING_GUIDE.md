# 📦 Publishing Guide for break-glb

## Pre-Publishing Checklist

- ✅ Package builds successfully
- ✅ TypeScript types exported
- ✅ README.md complete
- ✅ CHANGELOG.md updated
- ✅ LICENSE file present
- ✅ All features tested
- ✅ Examples documented
- ✅ Peer dependencies specified

## Publishing Steps

### 1. Create NPM Account

If you haven't already:
```bash
npm adduser
```

Follow the prompts to create your account.

### 2. Login to NPM

```bash
npm login
```

Enter your credentials.

### 3. Build the Package

```bash
cd src
npm run build
```

This creates the `dist/` folder with your compiled code.

### 4. Test Package Locally (Optional)

```bash
npm pack
```

This creates a `.tgz` file you can test in another project:
```bash
cd /path/to/test/project
npm install /path/to/break-glb/src/break-glb-1.0.0.tgz
```

### 5. Publish to NPM

```bash
cd src
npm publish
```

If this is your first publish, it will be public by default.

### 6. Verify Publication

Visit: https://www.npmjs.com/package/break-glb

## Updating the Package

### Patch Release (1.0.0 → 1.0.1)

For bug fixes:
```bash
cd src
npm version patch
npm publish
```

### Minor Release (1.0.0 → 1.1.0)

For new features (backwards compatible):
```bash
cd src
npm version minor
npm publish
```

### Major Release (1.0.0 → 2.0.0)

For breaking changes:
```bash
cd src
npm version major
npm publish
```

## Post-Publishing

1. **Create Git Tag**
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **Update Demo Site**

Ensure the demo at your Vercel deployment uses the published package.

3. **Announce**
- Tweet about it
- Post on Reddit (r/reactjs, r/threejs)
- Share on your blog
- Update your portfolio

## Package URLs

After publishing, your package will be available at:
- NPM: https://www.npmjs.com/package/break-glb
- Unpkg CDN: https://unpkg.com/break-glb
- jsDelivr CDN: https://cdn.jsdelivr.net/npm/break-glb

## Installation for Users

```bash
npm install break-glb three @react-three/fiber @react-three/drei
```

## Troubleshooting

### "Package name already exists"

Choose a different name in `package.json`:
```json
{
  "name": "@your-username/break-glb"
}
```

### "Permission denied"

Make sure you're logged in:
```bash
npm whoami
```

### "402 Payment Required"

Scoped packages require a paid account unless published as public:
```bash
npm publish --access public
```

## Maintenance

### Regular Updates

- Update dependencies monthly
- Respond to issues quickly
- Accept good pull requests
- Keep CHANGELOG updated
- Maintain backward compatibility

### Deprecating Old Versions

```bash
npm deprecate break-glb@1.0.0 "Please upgrade to 1.1.0"
```

### Unpublishing (Last Resort)

⚠️ Only for serious issues within 72 hours of publish:
```bash
npm unpublish break-glb@1.0.0
```

## Success Metrics

Track these on https://npmjs.com/package/break-glb:
- Weekly downloads
- GitHub stars
- Issue resolution time
- Community contributions

## Marketing Tips

1. **Create Demo Videos**
   - Screen recordings of features
   - Quick tutorials
   - Before/after comparisons

2. **Write Blog Posts**
   - "Introducing break-glb"
   - "How to create exploded views in React"
   - "Behind the scenes: Building break-glb"

3. **Engage with Community**
   - Answer questions on Stack Overflow
   - Join Three.js Discord
   - Participate in r/reactjs discussions

4. **Cross-Platform Sharing**
   - dev.to article
   - Medium post
   - YouTube tutorial
   - Twitter thread

## Next Steps

After v1.0.0 is published:

1. Monitor for issues
2. Gather user feedback
3. Plan v1.1.0 features
4. Update documentation
5. Create video tutorials

Good luck! 🚀
