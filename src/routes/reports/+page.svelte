<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';
  import * as XLSX from 'xlsx';

  let salesData = {
    totalSales: 0,
    productSales: [],
    branchSales: [],
    lowStockItems: []
  };
  let loading = false;
  let error = '';
  let dateRange = '30'; // Default to last 30 days
  let reportType = 'monthly'; // New: report type selector
  let selectedMonth = new Date().toISOString().slice(0, 7); // New: month selector (YYYY-MM)

  onMount(async () => {
    await loadReportData();
  });

  async function loadReportData() {
    try {
      loading = true;
      error = '';

      let startDate, endDate;
      
      if (reportType === 'monthly') {
        // For monthly reports, use the selected month
        startDate = new Date(selectedMonth + '-01');
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      } else {
        // For date range reports, calculate based on selected range
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
      }

      let query = supabase
        .from('sales')
        .select(`
          quantity,
          sale_date,
          products (
            id,
            product_code,
            name_en,
            name_ar
          ),
          branches (
            id,
            name
          )
        `)
        .gte('sale_date', startDate.toISOString().split('T')[0])
        .lte('sale_date', endDate.toISOString().split('T')[0]);

      // If branch manager, only show their branch data
      if ($profile?.role === 'branch_manager' && $profile?.branch_id) {
        query = query.eq('branch_id', $profile.branch_id);
      }

      const { data: salesRecords, error: salesError } = await query;

      if (salesError) throw salesError;

      // Process sales data
      const productSalesMap = new Map();
      const branchSalesMap = new Map();
      const dailySalesMap = new Map();
      let total = 0;

      salesRecords?.forEach(sale => {
        total += sale.quantity;

        // Product sales
        const productKey = sale.products.id;
        const currentProductSales = productSalesMap.get(productKey) || {
          product_code: sale.products.product_code,
          name_en: sale.products.name_en,
          name_ar: sale.products.name_ar,
          total_quantity: 0
        };
        currentProductSales.total_quantity += sale.quantity;
        productSalesMap.set(productKey, currentProductSales);

        // Branch sales
        const branchKey = sale.branches.id;
        const currentBranchSales = branchSalesMap.get(branchKey) || {
          name: sale.branches.name,
          total_quantity: 0
        };
        currentBranchSales.total_quantity += sale.quantity;
        branchSalesMap.set(branchKey, currentBranchSales);

        // Daily sales
        const dateKey = sale.sale_date;
        const currentDailySales = dailySalesMap.get(dateKey) || {
          date: dateKey,
          total_quantity: 0
        };
        currentDailySales.total_quantity += sale.quantity;
        dailySalesMap.set(dateKey, currentDailySales);
      });

      // Get low stock items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('branch_inventory')
        .select(`
          quantity,
          min_stock_level,
          products (
            product_code,
            name_en,
            name_ar
          ),
          branches (
            name
          )
        `)
        .lt('quantity', supabase.raw('min_stock_level'));

      if (inventoryError) throw inventoryError;

      salesData = {
        totalSales: total,
        productSales: Array.from(productSalesMap.values()),
        branchSales: Array.from(branchSalesMap.values()),
        lowStockItems: inventoryData || [],
        dailySales: Array.from(dailySalesMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      };
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function exportToExcel() {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [{
        'Total Sales': salesData.totalSales,
        'Report Period': reportType === 'monthly' 
          ? new Date(selectedMonth).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
          : `Last ${dateRange} days`,
        'Generated On': new Date().toLocaleDateString()
      }];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

      // Daily Sales Sheet
      const dailySalesWS = XLSX.utils.json_to_sheet(salesData.dailySales.map(day => ({
        'Date': day.date,
        'Units Sold': day.total_quantity
      })));
      XLSX.utils.book_append_sheet(workbook, dailySalesWS, 'Daily Sales');

      // Product Sales Sheet
      const productSalesWS = XLSX.utils.json_to_sheet(salesData.productSales.map(product => ({
        'Product Code': product.product_code,
        'Product Name (EN)': product.name_en,
        'Product Name (AR)': product.name_ar,
        'Units Sold': product.total_quantity
      })));
      XLSX.utils.book_append_sheet(workbook, productSalesWS, 'Product Sales');

      // Branch Sales Sheet
      const branchSalesWS = XLSX.utils.json_to_sheet(salesData.branchSales.map(branch => ({
        'Branch Name': branch.name,
        'Units Sold': branch.total_quantity
      })));
      XLSX.utils.book_append_sheet(workbook, branchSalesWS, 'Branch Sales');

      // Low Stock Items Sheet
      const lowStockWS = XLSX.utils.json_to_sheet(salesData.lowStockItems.map(item => ({
        'Product Code': item.products.product_code,
        'Product Name (EN)': item.products.name_en,
        'Product Name (AR)': item.products.name_ar,
        'Branch': item.branches.name,
        'Current Stock': item.quantity,
        'Minimum Stock Level': item.min_stock_level
      })));
      XLSX.utils.book_append_sheet(workbook, lowStockWS, 'Low Stock Items');

      // Generate the file
      const dateStr = reportType === 'monthly' ? selectedMonth : new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `sales-report-${dateStr}.xlsx`);
    } catch (e) {
      error = 'Failed to export report: ' + e.message;
    }
  }

  $: {
    if (dateRange || selectedMonth || reportType) {
      loadReportData();
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Sales Reports</h1>
    <div class="flex items-center space-x-4">
      <select
        bind:value={reportType}
        class="input"
      >
        <option value="range">Date Range</option>
        <option value="monthly">Monthly</option>
      </select>

      {#if reportType === 'monthly'}
        <input
          type="month"
          bind:value={selectedMonth}
          class="input"
        />
      {:else}
        <select
          bind:value={dateRange}
          class="input"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      {/if}

      <button 
        class="btn btn-secondary"
        on:click={exportToExcel}
        disabled={loading}
      >
        Export to Excel
      </button>
    </div>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if loading}
    <div class="text-center">
      <div class="text-gray-600">Loading report data...</div>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Total Sales Summary -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="text-lg font-medium text-gray-900">Total Sales</h2>
        <p class="mt-2 text-3xl font-bold text-primary-600">
          {salesData.totalSales} units
        </p>
        <p class="mt-1 text-sm text-gray-500">
          {#if reportType === 'monthly'}
            {new Date(selectedMonth).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
          {:else}
            Last {dateRange} days
          {/if}
        </p>
      </div>

      <!-- Low Stock Alert -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
        <div class="mt-2">
          {#if salesData.lowStockItems.length === 0}
            <p class="text-sm text-gray-500">No items are currently low in stock.</p>
          {:else}
            <ul class="space-y-2">
              {#each salesData.lowStockItems as item}
                <li class="text-sm">
                  <span class="font-medium">{item.products.name_en}</span>
                  <span class="text-red-600"> ({item.quantity} units remaining)</span>
                  <br>
                  <span class="text-gray-500">at {item.branches.name}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <!-- Daily Sales Chart -->
      <div class="col-span-2 rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Daily Sales Trend</h2>
        <div class="h-64">
          <div class="flex h-full items-end space-x-2">
            {#each salesData.dailySales || [] as day}
              {@const height = (day.total_quantity / Math.max(...salesData.dailySales.map(d => d.total_quantity))) * 100}
              <div class="group flex flex-1 flex-col items-center">
                <div class="relative w-full">
                  <div
                    class="absolute bottom-0 w-full rounded-t bg-primary-500 transition-all hover:bg-primary-600"
                    style="height: {height}%"
                  >
                    <div class="invisible absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:visible">
                      {day.total_quantity} units
                    </div>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Product Sales -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Sales by Product</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">Units Sold</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each salesData.productSales as product}
                <tr>
                  <td class="whitespace-nowrap px-4 py-2 text-sm">
                    <div>{product.name_en}</div>
                    <div class="text-xs text-gray-500">{product.product_code}</div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-2 text-right text-sm">
                    {product.total_quantity}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Branch Sales -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Sales by Branch</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Branch</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">Units Sold</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each salesData.branchSales as branch}
                <tr>
                  <td class="whitespace-nowrap px-4 py-2 text-sm">{branch.name}</td>
                  <td class="whitespace-nowrap px-4 py-2 text-right text-sm">
                    {branch.total_quantity}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>