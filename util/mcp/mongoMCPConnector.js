const mongoose = require("mongoose");
const { userModel } = require("../../models/user");
const { paymentModel } = require("../../models/payment");
const { invoiceModel } = require("../../models/invoice ");
const { monthlyFeeListModel } = require("../../models/monthlyFeeList");
const { vehicleRouteFareModel } = require("../../models/vehicleRouteFare");
const { payOptionModel } = require("../../models/payOption");

/**
 * mongoMCPConnector.js
 * In-App Read-Only Database Connector for LLM Query Execution.
 * 
 * Note: This is an internal module inside Express (no separate external MCP server process required).
 * Executes sanitized read-only MongoDB queries with strict security guardrails:
 *  - Strips password fields (password: 0, userInfo.password: 0)
 *  - Enforces soft-delete protection (deleted: false)
 *  - Joins student profile info (studentName, fatherName, phoneNumber)
 *  - Filters active student rosters (isActive: true)
 */
class MongoMCPConnector {
  /**
   * Executes a sanitized read-only query on the specified collection.
   * @param {Object} queryIntent - { collection, operation, filter, projection, limit }
   * @returns {Promise<Array<Object>>} Sanitized query results.
   */
  static async executeQuery(queryIntent = {}) {
    const collectionName = (queryIntent.collection || "users").toLowerCase();
    const rawFilter = queryIntent.filter || {};
    const limit = Math.min(queryIntent.limit || 500, 500);

    // Mandate soft-delete protection
    const sanitizedFilter = { ...rawFilter, deleted: false };

    // Mandatory projection: ALWAYS exclude password fields
    const sanitizedProjection = {
      ...(queryIntent.projection || {}),
      "userInfo.password": 0,
      password: 0,
      authToken: 0
    };

    let model = null;
    switch (collectionName) {
      case "payments":
      case "payment":
        model = paymentModel;
        break;
      case "invoices":
      case "invoice":
        model = invoiceModel;
        break;
      case "monthlyfeelist":
      case "monthlyfees":
        model = monthlyFeeListModel;
        break;
      case "vehicleroutefare":
      case "busfares":
        model = vehicleRouteFareModel;
        break;
      case "users":
      case "user":
      default:
        // Enforce student role isolation for user collection queries
        if (!sanitizedFilter["userInfo.roleName"] && !sanitizedFilter.roleName) {
          sanitizedFilter["userInfo.roleName"] = "STUDENT";
        }
        model = userModel;
        break;
    }

    try {
      const operation = (queryIntent.operation || "find").toLowerCase();

      // ── INVOICE PAY OPTIONS RESOLUTION ─────────────────────────────────────
      let payOptionMap = {};
      let configuredOptionLabels = [];
      if (collectionName === "invoices" || collectionName === "invoice") {
        try {
          const payOptions = await payOptionModel.find({ deleted: false }).lean();
          payOptions.forEach(po => {
            const poId = po._id ? po._id.toString() : "";
            const bankName = po.payOptionInfo?.bankName;
            const upiType = po.payOptionInfo?.upiType;
            const label = bankName || upiType || po.payMethod || "Online";
            if (poId) payOptionMap[poId] = label;
            if (label && !configuredOptionLabels.includes(label)) {
              configuredOptionLabels.push(label);
            }
          });
        } catch (e) {
          console.warn("[MongoMCPConnector] Error fetching payOptions:", e.message);
        }
      }

      // ── COUNT OPERATION ────────────────────────────────────────────────────
      if (operation === "count") {
        if (queryIntent.genderBreakdown) {
          // Gender breakdown: count males and females separately
          const maleFilter = { ...sanitizedFilter, "userInfo.gender": { $regex: "^male$", $options: "i" } };
          const femaleFilter = { ...sanitizedFilter, "userInfo.gender": { $regex: "female", $options: "i" } };
          const [maleCount, femaleCount] = await Promise.all([
            model.countDocuments(maleFilter),
            model.countDocuments(femaleFilter)
          ]);
          return [{ _countResult: true, genderBreakdown: true, maleCount, femaleCount, total: maleCount + femaleCount }];
        } else {
          // Simple total count
          const count = await model.countDocuments(sanitizedFilter);
          return [{ _countResult: true, count }];
        }
      }
      // ── FIND OPERATION ─────────────────────────────────────────────────────

      let query = model
        .find(sanitizedFilter, sanitizedProjection)
        .limit(limit);

      // Apply sort if provided (e.g. { dueAmount: -1 } for highest dues first)
      if (queryIntent.sort && typeof queryIntent.sort === "object") {
        query = query.sort(queryIntent.sort);
      }

      const results = await query.lean();

      // Enrich payment & invoice results with student profile information and filter active status
      if ((collectionName === "payments" || collectionName === "payment" || collectionName === "invoices" || collectionName === "invoice") && results.length > 0) {

        const rawUserIds = results.map(r => r.userId || (r.invoiceInfo && r.invoiceInfo.userId) || r.studentId).filter(Boolean);
        const stringUserIds = rawUserIds.map(id => String(id));
        const queryUserIds = Array.from(new Set([...rawUserIds, ...stringUserIds]));

        if (queryUserIds.length > 0) {
          const students = await userModel.find(
            { $or: [{ "userInfo.userId": { $in: queryUserIds } }, { userId: { $in: queryUserIds } }] },
            { "userInfo.password": 0, password: 0 }
          ).lean();

          const studentMap = {};
          students.forEach(s => {
            if (s.userInfo && s.userInfo.userId) {
              studentMap[String(s.userInfo.userId)] = s;
              studentMap[s.userInfo.userId] = s;
            }
            if (s.userId) {
              studentMap[String(s.userId)] = s;
              studentMap[s.userId] = s;
            }
          });

          const filteredResults = [];
          results.forEach(r => {
            const uid = r.userId || (r.invoiceInfo && r.invoiceInfo.userId) || r.studentId;
            const userObj = uid ? (studentMap[String(uid)] || studentMap[uid]) : null;

            // Resolve payModeId in r.invoiceInfo.payment array
            if (Array.isArray(r.invoiceInfo?.payment)) {
              r.invoiceInfo.payment.forEach(p => {
                const modeIdStr = p.payModeId ? p.payModeId.toString() : "";
                if (modeIdStr.toLowerCase() === "cash") {
                  p.resolvedMode = "Cash";
                } else if (payOptionMap[modeIdStr]) {
                  p.resolvedMode = payOptionMap[modeIdStr];
                } else if (modeIdStr) {
                  p.resolvedMode = modeIdStr;
                } else {
                  p.resolvedMode = "Online";
                }
              });
            }

            // Active student check (must be non-deleted, approved, and active)
            const isUserActive = userObj && userObj.deleted === false && userObj.isActive === true && userObj.isApproved === true;

            if (queryIntent.includeInactive || isUserActive) {
              if (userObj && userObj.userInfo) {
                const u = userObj.userInfo;
                r.studentName = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim();
                r.fatherName = u.fatherName || '';
                r.phoneNumber = u.phoneNumber1 || u.phoneNumber || '';
                r.userInfo = u;
              }
              filteredResults.push(r);
            }
          });

          filteredResults._configuredPayOptions = configuredOptionLabels;
          return filteredResults;
        }
      }

      return results;
    } catch (err) {
      console.error("[MongoMCPConnector Error]:", err.message);
      throw new Error(`MCP execution error on collection '${collectionName}': ${err.message}`);
    }
  }
}

module.exports = MongoMCPConnector;
