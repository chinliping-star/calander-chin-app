# How Changes Reach the Live Site

This is the path every change takes, from code to the live website.
Nothing goes live until you approve it.

```
branch  ->  pull request  ->  your review  ->  merge  ->  automatic deploy
```

---

## 1. Work happens on a branch

`main` is the branch that runs the live site. It is never edited directly.

Every change starts on its own branch instead, for example:

```
fix/upload-cloudinary-diagnostics
test/deploy-demo
```

A branch is a safe copy. Pushing to a branch changes nothing on the live site.

## 2. A pull request opens

A pull request (PR) is a request to move one branch into `main`.

The PR page shows you:

- every file that changed
- the exact lines added (green) and removed (red)
- a plain-English description of what the change does and why

Open it here:
**GitHub → Pull requests → the open PR**

## 3. You review

On the PR page you can:

- read the diff, file by file
- leave a comment on any line to ask a question
- request changes if something looks wrong

Nothing is live yet at this point. Take as long as you need.

## 4. You merge

When you are happy, click **Merge pull request** on the PR page.

That copies the branch into `main`. This is the moment you approve the change.

## 5. Deploy happens automatically

Merging into `main` starts a deploy on its own. No extra step.

| Part | Host | What it runs |
|---|---|---|
| Website (what users see) | Vercel | The `Frontend` folder |
| API and database | Railway | The `Backend` folder |

Both watch the `main` branch. When `main` changes, both rebuild and go live.
It takes about 2 to 3 minutes.

You can watch progress in the Vercel and Railway dashboards. Each shows a
build log and marks the deploy **Ready** / **Active** when the site is live.

## 6. If something goes wrong

Two ways back, both quick:

- **Vercel / Railway** → Deployments → pick the previous working deploy →
  **Rollback**. The site returns to the earlier version in seconds.
- **GitHub** → open the merged PR → **Revert**. That creates a new PR that
  undoes the change, which you merge like any other.

---

## Checking the API is healthy

The backend answers two URLs you can open in a browser at any time:

| URL | Good answer |
|---|---|
| `/api/health` | `{"ok":true}` |
| `/api/health/cloudinary` | `{"ok":true,"cloudName":"..."}` |

The second one checks that image uploads (profile photos and covers) are
configured correctly. If it does not say `"ok":true`, uploads will fail and
the answer explains why.

---

## One thing that needs your account

Vercel blocks a deploy when the person who wrote the commit is not a member of
the Vercel project. On the Hobby plan, private repositories cannot have extra
members, so this happens on every change.

The message reads:

> The deployment was blocked because the commit author did not have
> contributing access to the project on Vercel.

You can clear it in one of three ways:

1. **Redeploy it yourself** (free) — Vercel → Deployments → the blocked one →
   **⋯** → **Redeploy**. Do this each time.
2. **Make the repository public** (free) — the block disappears for good.
3. **Upgrade Vercel to Pro** ($20/month) — then a developer can be added to
   the project and deploys run on their own.

Option 1 costs nothing and works right now.

---

## Quick reference

| You want to | Where to go |
|---|---|
| See what changed | GitHub → Pull requests |
| Approve a change | The PR page → **Merge pull request** |
| Watch the deploy | Vercel / Railway → Deployments |
| Undo a change | Deployments → **Rollback**, or PR → **Revert** |
| Check the API is up | Open `/api/health` in a browser |
