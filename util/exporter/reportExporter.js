const fs = require("fs");
const path = require("path");

/**
 * reportExporter.js
 * Generates Excel-compatible CSV spreadsheets and PDF data streams.
 */
class ReportExporter {
  /**
   * Generates a UTF-8 CSV file from array of JSON documents.
   * @param {Array<Object>} dataList - Records to export.
   * @param {string} reportName - File basename.
   * @returns {Object} { filename, relativeUrl, filepath, totalRows }
   */
  static generateCSV(dataList = [], reportName = "query_export", userPrompt = "") {
    if (!dataList || dataList.length === 0) {
      return { success: false, message: "No data available to export." };
    }

    const timestamp = Date.now();
    const filename = `${reportName}_${timestamp}.csv`;
    const publicDir = path.join(__dirname, "../../public/exports");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filepath = path.join(publicDir, filename);

    const lowerP = (userPrompt || "").toLowerCase();
    const showPhone = lowerP.includes("phone") || lowerP.includes("mobile") || lowerP.includes("contact") || lowerP.includes("number") || lowerP.includes("nuber") || lowerP.includes("call");

    const sample = dataList[0];
    const isInvoice = !!(sample.invoiceInfo || sample.invoiceId || sample.invoiceType);
    const isPayment = !!(sample.april || sample.dueAmount !== undefined || sample.paymentLedgerPage);

    // Build clean, deduplicated column definitions
    const columns = [
      { header: "Student Name", get: r => r.studentName || r.userInfo?.fullName || r.fullName || "" },
      { header: "User ID", get: r => r.userId || r.userInfo?.userId || r.studentId || "" },
      { header: "Class", get: r => r.class || r.userInfo?.class || r.invoiceInfo?.class || "" },
      { header: "Father Name", get: r => r.fatherName || r.userInfo?.fatherName || "" }
    ];

    if (showPhone) {
      columns.push({ header: "Phone Number", get: r => r.phoneNumber || r.userInfo?.phoneNumber1 || r.userInfo?.phoneNumber2 || "" });
    }

    if (isInvoice) {
      columns.push({ header: "Amount (INR)", get: r => r.amount || r.invoiceInfo?.amount || 0 });
      columns.push({ header: "Payment Mode", get: r => r.invoiceInfo?.payment?.payModeId || r.invoiceInfo?.paymentMode || r.invoiceInfo?.paymentType || "" });
      columns.push({ header: "Receipt Number", get: r => r.invoiceInfo?.receiptNumber || r.invoiceId || "" });
      columns.push({ header: "Transaction Type", get: r => r.transactionType || "credit" });
      columns.push({ header: "Submitted Date", get: r => r.invoiceInfo?.submittedDate || r.created || "" });
    } else if (isPayment) {
      if (lowerP.includes("half yearly") || lowerP.includes("halfyearly") || lowerP.includes("september")) {
        columns.push({ header: "Half Yearly Exam Paid Amount (INR)", get: r => { const amt = r.september?.amount ?? r.september?.paidAmount; return amt ? `₹${amt}` : "₹0"; } });
        columns.push({ header: "Paid Date", get: r => r.september?.date || r.september?.paidDate || (r.updatedAt ? String(r.updatedAt).split('T')[0] : "") });
      } else {
        columns.push({ header: "Pending Due Amount (INR)", get: r => r.dueAmount || 0 });
        columns.push({ header: "Excess Amount (INR)", get: r => r.excessAmount || 0 });
        columns.push({ header: "Total Fine Amount (INR)", get: r => r.totalFineAmount || 0 });
      }
      columns.push({ header: "Fee Free Status", get: r => r.feeFree ? "Yes" : "No" });
      columns.push({ header: "Bus Service", get: r => r.busService ? "Yes" : "No" });
      columns.push({ header: "Session", get: r => r.session || "" });
    } else {
      columns.push({ header: "Category", get: r => r.userInfo?.category || "" });
      columns.push({ header: "Aadhar Number", get: r => r.userInfo?.aadharNumber || "" });
      columns.push({ header: "Address", get: r => r.userInfo?.address || "" });
      columns.push({ header: "Session", get: r => r.session || r.userInfo?.session || "" });
    }

    if (lowerP.includes("admit card") || lowerP.includes("admid card") || lowerP.includes("tick") || lowerP.includes("sign") || lowerP.includes("blank column") || lowerP.includes("bank column")) {
      columns.push({ header: "Admit Card Received (Sign / Tick)", get: () => "[   ]" });
    }

    let csvContent = columns.map(c => `"${c.header}"`).join(",") + "\n";

    for (const item of dataList) {
      const rowValues = columns.map(col => {
        let val = col.get(item);
        if (val === null || val === undefined) val = "";
        if (typeof val === "object") val = JSON.stringify(val);
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvContent += rowValues.join(",") + "\n";
    }

    fs.writeFileSync(filepath, csvContent, "utf8");

    return {
      success: true,
      filename,
      relativeUrl: `/exports/${filename}`,
      filepath,
      totalRows: dataList.length
    };
  }
}

module.exports = ReportExporter;
