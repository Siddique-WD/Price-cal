(() => {
  const $ = id => document.getElementById(id);
  const ids = [
    "etsyFeesEnabled", "sellingFeesEnabled", "productName", "currency",
    "price", "targetProfit", "targetMarkup",
    "materials", "packaging", "hours", "hourly", "shippingCost",
    "shippingCharged", "otherCosts", "setupAllocation", "paymentMode",
    "listingFee", "transactionRate", "processingRate", "processingFixed",
    "regulatoryRate", "renewalFee", "offsiteEnabled", "offsiteRate",
    "offsiteCap", "conversionEnabled", "conversionRate", "feeTaxRate",
    "feeTaxEnabled", "etsyAds", "otherTaxes"
  ];

  const resetToZeroIds = [
    "materials", "packaging", "hours", "hourly", "shippingCost",
    "shippingCharged", "otherCosts", "setupAllocation", "price",
    "targetProfit", "targetMarkup"
  ];

  function num(id) {
    const v = Number($(id).value);
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  }

  const currencyLocales = {
    INR: "en-IN",
    USD: "en-US",
    GBP: "en-GB",
    EUR: "de-DE"
  };

  function currencySymbol() {
    const currency = $("currency").value;
    const locale = currencyLocales[currency] || "en-IN";
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 })
        .formatToParts(1)
        .find(part => part.type === "currency")?.value || "₹";
    } catch {
      return currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "₹";
    }
  }

  function updateCurrencyLabels() {
    const symbol = currencySymbol();
    document.querySelectorAll("[data-currency-label]").forEach(el => {
      const label = el.dataset.currencyLabel;
      el.textContent = `${label} (${symbol})`;
    });
  }

  function money(value) {
    const currency = $("currency").value;
    const locale = currencyLocales[currency] || "en-IN";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }).format(Number.isFinite(value) ? value : 0);
    } catch {
      return `${currencySymbol()}${(value || 0).toFixed(2)}`;
    }
  }

  function percent(value) {
    return (Number.isFinite(value) ? value : 0).toFixed(1) + "%";
  }

  function getSettings() {
    const etsyFeesEnabled = $("etsyFeesEnabled").checked;
    const sellingFeesEnabled = etsyFeesEnabled && $("sellingFeesEnabled").checked;
    const domestic = $("paymentMode").value === "domestic";
    return {
      etsyFeesEnabled,
      sellingFeesEnabled,
      materials: num("materials"),
      packaging: num("packaging"),
      labour: num("hours") * num("hourly"),
      shippingCost: num("shippingCost"),
      shippingCharged: num("shippingCharged"),
      otherCosts: num("otherCosts"),
      setup: num("setupAllocation"),
      listing: sellingFeesEnabled ? num("listingFee") + num("renewalFee") : 0,
      transactionRate: sellingFeesEnabled ? num("transactionRate") / 100 : 0,
      processingRate: sellingFeesEnabled
        ? (domestic ? 3 : num("processingRate")) / 100 : 0,
      processingFixed: sellingFeesEnabled
        ? (domestic ? 10 : num("processingFixed")) : 0,
      regulatoryRate: sellingFeesEnabled ? num("regulatoryRate") / 100 : 0,
      offsiteRate: etsyFeesEnabled && $("offsiteEnabled").checked
        ? num("offsiteRate") / 100 : 0,
      offsiteCap: num("offsiteCap"),
      conversionRate: sellingFeesEnabled && $("conversionEnabled").checked
        ? num("conversionRate") / 100 : 0,
      taxRate: etsyFeesEnabled && $("feeTaxEnabled").checked
        ? num("feeTaxRate") / 100 : 0,
      etsyAds: etsyFeesEnabled ? num("etsyAds") : 0,
      otherTaxes: etsyFeesEnabled ? num("otherTaxes") : 0
    };
  }

  function calculate(price, s) {
    // Price is the product price; buyer-paid shipping is separate.
    const order = price + s.shippingCharged;

    const transaction = order * s.transactionRate;
    const processing = order * s.processingRate + s.processingFixed;
    const regulatory = order * s.regulatoryRate;
    const conversion = order * s.conversionRate;

    // Offsite Ads cap is entered in the selected currency.
    const offsite = Math.min(order * s.offsiteRate, s.offsiteCap);

    const baseFees = s.listing + transaction + processing +
      regulatory + conversion + offsite;

    // Tax estimate applies to modeled Etsy seller fees, not Etsy Ads spend.
    const feeTax = baseFees * s.taxRate;

    const fees = baseFees + feeTax + s.etsyAds + s.otherTaxes;

    const costs = s.materials + s.packaging + s.labour +
      s.shippingCost + s.otherCosts + s.setup;

    const totalBuyerPays = order;
    const profit = totalBuyerPays - fees - costs;
    const margin = totalBuyerPays > 0 ? profit / totalBuyerPays * 100 : 0;

    return {
      price, order, transaction, processing, regulatory,
      conversion, offsite, listing: s.listing, feeTax,
      etsyAds: s.etsyAds, otherTaxes: s.otherTaxes,
      baseFees, fees, costs, profit, margin, totalBuyerPays
    };
  }

  // Finds the smallest price that achieves the target profit.
  // Binary search also handles percentage fees and the ad-fee cap.
  function solvePrice(targetProfit, s) {
    let low = 0;
    let high = 100000000;

    if (calculate(high, s).profit < targetProfit) return NaN;

    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      if (calculate(mid, s).profit >= targetProfit) high = mid;
      else low = mid;
    }
    return Math.ceil(high * 100) / 100;
  }

  function row(label, amount, bold = false) {
    return `<tr class="border-b border-slate-100 ${bold ? "font-bold" : ""}">
      <td class="py-3 pr-4">${label}</td>
      <td class="py-3 text-right whitespace-nowrap">${money(amount)}</td>
    </tr>`;
  }

  function render() {
    updateCurrencyLabels();
    const etsyFeesEnabled = $("etsyFeesEnabled").checked;
    const sellingFeesEnabled = etsyFeesEnabled && $("sellingFeesEnabled").checked;
    $("etsySettings").hidden = !etsyFeesEnabled;
    $("etsyAssumptions").hidden = !etsyFeesEnabled;
    $("feeTaxRate").disabled = !etsyFeesEnabled || !$("feeTaxEnabled").checked;
    const s = getSettings();
    const price = num("price");
    const r = calculate(price, s);
    const target = num("targetProfit");
    const recommended = solvePrice(target, s);
    const markupProfitGoal = r.costs * num("targetMarkup") / 100;
    const markupRecommended = solvePrice(markupProfitGoal, s);

    $("resultProduct").textContent = $("productName").value ||
      "Your handmade product";
    $("netProfit").textContent = money(r.profit);
    $("netProfit").className = "text-3xl font-bold mt-2 " +
      (r.profit >= 0 ? "text-emerald-600" : "text-red-600");

    $("totalFees").textContent = money(r.fees);
    $("totalCosts").textContent = money(r.costs);
    $("feesMetricLabel").textContent = etsyFeesEnabled
      ? "Etsy fees and ads" : "Additional fees";
    $("breakdownTitle").textContent = etsyFeesEnabled
      ? "Fee and cost breakdown" : "Cost and profit breakdown";
    $("comparisonFeesHeader").textContent = etsyFeesEnabled
      ? "Fees and ads" : "Additional fees";
    $("recommendedPrice").textContent =
      Number.isFinite(recommended) ? money(recommended) : "Not available";
    $("markupPrice").textContent =
      Number.isFinite(markupRecommended) ? money(markupRecommended) : "Not available";
    $("markupPriceHelp").textContent =
      percent(num("targetMarkup")) + " markup targets " +
      money(markupProfitGoal) + " net profit on entered product costs.";

    $("marginText").textContent = "Profit margin: " + percent(r.margin);
    $("marginLabel").textContent = percent(r.margin);
    $("marginBar").style.width =
      Math.max(0, Math.min(100, r.margin)) + "%";
    $("marginBar").className = "h-full rounded-full " +
      (r.profit >= 0 ? "bg-violet-600" : "bg-red-500");

    let status;
    if (r.profit < 0) {
      status = etsyFeesEnabled
        ? "You are making a loss at this price. Increase your price, reduce costs, or reconsider your advertising spend."
        : "You are making a loss at this price. Increase your price or reduce costs.";
    } else if (r.profit < target) {
      status = "Your current price is profitable, but it is below your " +
        "target profit. Consider the recommended price.";
    } else {
      status = etsyFeesEnabled
        ? "Your current price meets or exceeds your target profit under the fee assumptions entered."
        : "Your current price meets or exceeds your target profit.";
    }
    $("statusMessage").textContent = status;

    $("feeRows").innerHTML =
      row("Product selling price", r.price) +
      row("Shipping paid by buyer", s.shippingCharged) +
      row("Total order amount", r.order, true) +
      (etsyFeesEnabled
        ? (sellingFeesEnabled
            ? row("Listing + renewal fees", r.listing) +
          row("Transaction fee", r.transaction) +
          row("Payment processing / collection", r.processing) +
          row("Regulatory operating fee", r.regulatory) +
          row("Currency conversion", r.conversion)
            : "") +
          row("Offsite Ads", r.offsite) +
          row("Estimated tax on modeled seller fees", r.feeTax) +
          row("Etsy Ads budget per order", r.etsyAds) +
          row("Other taxes / adjustments", r.otherTaxes) +
          row("Total Etsy fees and advertising", r.fees, true)
        : row("Additional fees", r.fees, true)) +
      row("Materials", s.materials) +
      row("Labour", s.labour) +
      row("Packaging", s.packaging) +
      row("Shipping paid by seller", s.shippingCost) +
      row("Other product costs", s.otherCosts) +
      row("Allocated setup fee", s.setup) +
      row("Total product costs", r.costs, true) +
      row("Estimated net profit", r.profit, true);

    const prices = [
      Math.max(0, price * 0.8),
      price,
      price * 1.1,
      price * 1.2,
      Number.isFinite(recommended) ? recommended : price
    ].sort((a, b) => a - b);

    const unique = [...new Set(prices.map(p => Math.round(p * 100) / 100))];

    $("comparisonRows").innerHTML = unique.map(p => {
      const x = calculate(p, s);
      return `<tr class="border-b border-slate-100">
        <td class="py-3">${money(p)}</td>
        <td class="py-3 text-right">${money(x.fees)}</td>
        <td class="py-3 text-right font-semibold ${x.profit >= 0 ?
          "text-emerald-600" : "text-red-600"}">${money(x.profit)}</td>
        <td class="py-3 text-right">${percent(x.margin)}</td>
      </tr>`;
    }).join("");
  }

  $("paymentMode").addEventListener("change", render);

  $("calculateBtn").addEventListener("click", render);

  $("resetBtn").addEventListener("click", () => {
    resetToZeroIds.forEach(id => { $(id).value = 0; });
    render();
  });

  // Recalculate automatically as any input changes.
  ids.forEach(id => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });

  render();
})();
