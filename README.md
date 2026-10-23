# CR Tracking System

A web app for running software change requests (CRs) from request to payment. The admin logs each change request, the developer estimates and delivers it, the client approves the estimate, and the admin invoices the work, deducts TDS and records payments, with each party seeing only their own view.

**Live app:** https://anayak06.github.io/cr-tracking-system (sign-in required)

## How a change request moves

```
Estimation Pending -> Approval Pending -> Approved - In Development -> In Progress
  -> Under UAT -> In Production -> Ready for Billing -> Billed -> Closed
                                       (or Rejected)
```

## Roles and screens

| Role | What they can do |
|---|---|
| **Client** | Follow their CRs, approve or reject estimates, see the total estimated cost and hours |
| **Developer** | See assigned CRs, enter estimated hours, update progress, follow earnings, invoices, payments and advances |
| **Admin** | Log CRs and assign developers; manage clients and developers; generate invoices as PDF with the amount in words; record payments and advances; configure TDS rates; reports on outstanding balances |

Every signed-in user can change their password. Routes are protected by role (`ProtectedRoute`).

## Architecture

```
React (this repo, GitHub Pages)  --POST JSON-->  Google Apps Script web app  -->  Google Sheets
```

- **Front end:** React 19, React Router, Tailwind CSS. Auth state lives in `AuthContext`; all API calls go through one function in `src/api/apiService.js`, which attaches the session token and shows errors as toasts.
- **Back end:** a Google Apps Script web app that stores CRs, invoices, payments and users in Google Sheets.
- **Invoices:** generated in the browser as PDF with jsPDF and html2canvas; amounts in words in Indian English (`to-words`).
- **Shared helpers:** `src/utils/helpers.js` (currency, dates, overdue checks, totals, validation), covered by unit tests.

## Running locally

```bash
npm install
npm start          # http://localhost:3000
```

## Tests

```bash
npm test
```

They run on every push and pull request through GitHub Actions.

## Deploying

```bash
npm run deploy     # builds and publishes to GitHub Pages
```

## Tech stack

React 19 · React Router · Tailwind CSS · jsPDF · html2canvas · date-fns · Google Apps Script · Google Sheets · Jest · GitHub Actions · GitHub Pages
