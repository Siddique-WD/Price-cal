# Handmade Pricing Calculator

A single-page calculator for estimating product costs, selling prices, and profit. Etsy fees and advertising are optional and can be enabled when needed.

## Features

- Estimate profit, profit margin, and a recommended price for a target net profit.
- Calculate a separate recommended price based on a markup percentage of entered product costs.
- Include or exclude Etsy selling fees, advertising, and fee taxes.
- Compare estimated fees, profit, and margin at several selling prices.
- Support INR, USD, GBP, and EUR display formats.
- Reset production-cost and pricing amounts without clearing Etsy settings, product name, or currency.

## Run locally

Open `index.html` in a browser, or start a local server from this folder:

```powershell
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy with GitHub Pages

This project is a static site and does not require a build step.

1. Push `index.html` and this `README.md` to the root of a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the branch containing the site (commonly `main`) and the `/ (root)` folder, then save.
5. After GitHub Pages finishes its first deployment, open the published URL shown in the Pages settings.

The page loads Tailwind CSS from its CDN, so an internet connection is required for its styling.

## Fee and currency notes

This is an estimate, not an official Etsy payout, tax calculation, or accounting statement. Enter fee rates and costs that apply to your situation and verify fee terms with Etsy. The selected currency changes labels and number formatting; it does not convert the entered amounts. Consult an appropriate tax professional for tax obligations.
