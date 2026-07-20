"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, rs2, numWords, calcBill, todayISO, generateDateBillNo } from "@/lib/utils";
import { Bill, BillItem, TradeIn } from "@/types";
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  RotateCcw, 
  Search, 
  Package, 
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function NewBillPage() {
  const router = useRouter();
  const { 
    settings, bills, addBill, 
    mobiles, accessories, spareParts, usedPhones,
    saveMobile, saveAccessory, saveSparePart, saveUsedPhone,
    saveUsedPhone: addTradeInPhone,
    logAudit
  } = useData();
  const { toast } = useToast();

  const [billType, setBillType] = useState<"cash" | "nontax" | "tax">("cash");
  const [saleType, setSaleType] = useState<"mobile" | "accessory" | "service">("mobile");
  const [billDate, setBillDate] = useState(todayISO());

  // Customer
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custGstin, setCustGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Pollachi");
  const [state, setState] = useState(settings.state || "Tamil Nadu");
  const [stateCode, setStateCode] = useState(settings.stateCode || "33");

  // Items
  const [items, setItems] = useState<Partial<BillItem>[]>([
    { model: "", imei1: "", imei2: "", battery: "", hsn: "", qty: 1, rate: 0, cost: 0 },
  ]);

  // Tax Setup
  const [gstRate, setGstRate] = useState(settings.gstRate || 18);
  const [inclusive, setInclusive] = useState(true);
  const [interstate, setInterstate] = useState(false);

  // Payment & Warranty
  const [paid, setPaid] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [warrantyMonths, setWarrantyMonths] = useState(settings.warrantyMonths || 12);

  // Trade-In Exchange
  const [tradeInEnabled, setTradeInEnabled] = useState(false);
  const [tradeInModel, setTradeInModel] = useState("");
  const [tradeInImei, setTradeInImei] = useState("");
  const [tradeInCondition, setTradeInCondition] = useState("Working");
  const [tradeInValue, setTradeInValue] = useState("");
  const [tradeInAddToStock, setTradeInAddToStock] = useState(true);

  // Stock Picker Modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const allInventory = [
    ...mobiles.map((m) => ({ ...m, categoryName: "Mobiles", title: `${m.brand} ${m.model}`, price: m.sell })),
    ...accessories.map((a) => ({ ...a, categoryName: "Accessories", title: a.name, price: a.sell })),
    ...spareParts.map((s) => ({ ...s, categoryName: "Spare Parts", title: `${s.partName} (${s.compatibleModel})`, price: s.sell })),
    ...usedPhones.map((u) => ({ ...u, categoryName: "Used Phones", title: `${u.brand} ${u.model}`, price: u.sell })),
  ].filter((i) => Number(i.qty) > 0);

  const filteredPicker = allInventory.filter((i: any) =>
    (i.title + i.categoryName + (i.imei || "")).toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const addItemRow = () => {
    setItems((prev) => [...prev, { model: "", imei1: "", imei2: "", battery: "", hsn: "", qty: 1, rate: 0, cost: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const addFromPicker = (invItem: any) => {
    const newLine: Partial<BillItem> = {
      itemId: invItem.id,
      invCategory: invItem.categoryName,
      model: invItem.title,
      hsn: invItem.hsn || "",
      qty: 1,
      rate: invItem.price || 0,
      cost: invItem.cost || 0,
      imei1: invItem.imei || "",
    };

    const emptyIdx = items.findIndex((it) => !it.model?.trim());
    if (emptyIdx >= 0) {
      setItems((prev) => prev.map((it, idx) => (idx === emptyIdx ? newLine : it)));
    } else {
      setItems((prev) => [...prev, newLine]);
    }
    setPickerOpen(false);
    toast(`Added "${invItem.title}" to bill`, "success");
  };

  // Calculations
  const calculated = calcBill(
    items.map((i) => ({ qty: i.qty || 1, rate: i.rate || 0, ...i })),
    gstRate,
    interstate,
    inclusive,
    billType === "nontax"
  );

  const tradeInValNum = tradeInEnabled ? Number(tradeInValue) || 0 : 0;
  const netPayable = Math.max(0, calculated.grand - tradeInValNum);
  const paidNum = paid === "" ? netPayable : Number(paid) || 0;
  const balance = Math.max(0, netPayable - paidNum);

  const handleSaveBill = async (shouldPrint: boolean) => {
    if (!custName.trim()) {
      toast("Please enter Customer Name", "error");
      return;
    }

    const validItems = items.filter((it) => it.model?.trim() && Number(it.rate) > 0);
    if (!validItems.length) {
      toast("Please add at least one item with a valid rate", "error");
      return;
    }

    if (tradeInEnabled) {
      if (!tradeInModel.trim()) {
        toast("Please enter Trade-in Device Model", "error");
        return;
      }
      if (tradeInValNum <= 0) {
        toast("Please enter agreed Trade-in Value", "error");
        return;
      }
    }

    // Generate Date-Coded Bill No (e.g. 20260720-001)
    const billNo = generateDateBillNo(billType, billDate, bills);

    // Process cost snapshot
    let costTotal = 0;
    let costKnown = false;
    calculated.lines.forEach((l: any) => {
      const c = Number(l.cost) || 0;
      if (c > 0) costKnown = true;
      costTotal += c * (Number(l.qty) || 1);
    });

    const profit = costKnown ? calculated.taxable - costTotal : 0;

    let tradeInObject: TradeIn | undefined = undefined;
    let tradeInInvId = "";

    if (tradeInEnabled) {
      if (tradeInAddToStock) {
        tradeInInvId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await addTradeInPhone({
          id: tradeInInvId,
          brand: tradeInModel.split(" ")[0] || "Refurbished",
          model: tradeInModel,
          imei: tradeInImei,
          condition: tradeInCondition,
          cost: tradeInValNum,
          sell: Math.round(tradeInValNum * 1.2),
          qty: 1,
          supplierName: `Trade-in from ${custName}`,
        });
      }

      tradeInObject = {
        enabled: true,
        model: tradeInModel,
        imei: tradeInImei,
        condition: tradeInCondition,
        value: tradeInValNum,
        addToStock: tradeInAddToStock,
        invId: tradeInInvId,
      };
    }

    const billRecord: Bill = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      billNo,
      type: billType,
      saleType,
      date: billDate,
      customer: {
        name: custName,
        mobile: custMobile,
        address: custAddress,
        gstin: custGstin,
        state,
        stateCode,
      },
      transport: {
        placeOfSupply,
      },
      items: calculated.lines,
      rate: calculated.rate,
      interstate,
      inclusive,
      taxable: calculated.taxable,
      cgst: calculated.cgst,
      sgst: calculated.sgst,
      igst: calculated.igst,
      gst: calculated.gst,
      grand: calculated.grand,
      tradeIn: tradeInObject,
      netPayable,
      costTotal,
      costKnown,
      profit,
      paid: paidNum,
      payMode,
      balance,
      warrantyMonths: Number(warrantyMonths) || 0,
      void: false,
      words: numWords(calculated.grand),
      createdAt: Date.now(),
    };

    try {
      await addBill(billRecord);

      // Decrement Inventory Qty for line items linked to inventory
      for (const line of calculated.lines) {
        if (line.itemId) {
          if (line.invCategory === "Mobiles") {
            const m = mobiles.find((x) => x.id === line.itemId);
            if (m) await saveMobile({ ...m, qty: Math.max(0, m.qty - line.qty) });
          } else if (line.invCategory === "Accessories") {
            const a = accessories.find((x) => x.id === line.itemId);
            if (a) await saveAccessory({ ...a, qty: Math.max(0, a.qty - line.qty) });
          } else if (line.invCategory === "Spare Parts") {
            const s = spareParts.find((x) => x.id === line.itemId);
            if (s) await saveSparePart({ ...s, qty: Math.max(0, s.qty - line.qty) });
          } else if (line.invCategory === "Used Phones") {
            const u = usedPhones.find((x) => x.id === line.itemId);
            if (u) await saveUsedPhone({ ...u, qty: Math.max(0, u.qty - line.qty) });
          }
        }
      }

      await logAudit(
        "Invoice Raised",
        `${billType.toUpperCase()} ${billNo} · ${rs(calculated.grand)} · ${custName}`
      );

      toast(`Bill ${billNo} saved successfully!`, "success");

      if (shouldPrint) {
        router.push(`/bills?print=${billRecord.id}`);
      } else {
        router.push("/bills");
      }
    } catch (e) {
      toast("Failed to save bill", "error");
    }
  };

  return (
    <AppLayout title="New Bill / Invoice Builder" subtitle="Create Cash Bills, GST Tax Invoices, Non-Tax Invoices & Trade-in Exchanges">
      <div className="space-y-6">
        {/* Bill Type Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setBillType("cash")}
            className={`glass-card p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              billType === "cash"
                ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-900/20"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cash Bill</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Simple retail receipt showing tax breakdown</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setBillType("tax")}
            className={`glass-card p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              billType === "tax"
                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-900/20"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Tax Invoice (GST)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Formal B2B / B2C invoice with HSN & Buyer GSTIN</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setBillType("nontax")}
            className={`glass-card p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              billType === "nontax"
                ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-900/20"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Non-Tax Invoice</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Formal invoice without GST charge</p>
            </div>
          </button>
        </div>

        {/* Builder Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details Card */}
            <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-bold text-white font-heading text-sm flex items-center justify-between">
                <span>Customer Details</span>
                <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {billType.toUpperCase()}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Mrs. Rahila N"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="D.No, Street, Area, City"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {billType === "tax" && (
                  <>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Buyer GSTIN</label>
                      <input
                        type="text"
                        value={custGstin}
                        onChange={(e) => setCustGstin(e.target.value)}
                        placeholder="33AAAAA0000A1Z5"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Place of Supply</label>
                      <input
                        type="text"
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        placeholder="Pollachi"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Line Items Card */}
            <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-white font-heading text-sm">Line Items</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl glass-card hover:bg-white/10 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>Pick from Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl glass-card border border-white/10 relative space-y-3"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                      <span>Item #{idx + 1} {item.invCategory ? `(${item.invCategory})` : ""}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">Model / Product Description *</label>
                        <input
                          type="text"
                          value={item.model}
                          onChange={(e) => updateItem(idx, "model", e.target.value)}
                          placeholder="e.g. Apple iPhone 15 Pro Max 256GB"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">HSN / SAC Code</label>
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => updateItem(idx, "hsn", e.target.value)}
                          placeholder="8517"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">IMEI 1 / Serial</label>
                        <input
                          type="text"
                          value={item.imei1}
                          onChange={(e) => updateItem(idx, "imei1", e.target.value)}
                          placeholder="15-digit IMEI"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">IMEI 2</label>
                        <input
                          type="text"
                          value={item.imei2}
                          onChange={(e) => updateItem(idx, "imei2", e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Battery Number</label>
                        <input
                          type="text"
                          value={item.battery}
                          onChange={(e) => updateItem(idx, "battery", e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Rate (₹) *</label>
                        <input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Unit Cost (for profit)</label>
                        <input
                          type="number"
                          value={item.cost || ""}
                          onChange={(e) => updateItem(idx, "cost", Number(e.target.value))}
                          placeholder="Cost"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-slate-400 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade-In / Exchange Section */}
            <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white font-heading text-sm">Device Trade-in / Exchange</h3>
                <label className="flex items-center gap-2 text-xs font-bold text-rose-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tradeInEnabled}
                    onChange={(e) => setTradeInEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Customer is trading in a device</span>
                </label>
              </div>

              {tradeInEnabled && (
                <div className="space-y-4 text-xs pt-2 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Trade-in Device Model *</label>
                      <input
                        type="text"
                        value={tradeInModel}
                        onChange={(e) => setTradeInModel(e.target.value)}
                        placeholder="iPhone 11 64GB"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">IMEI (Optional)</label>
                      <input
                        type="text"
                        value={tradeInImei}
                        onChange={(e) => setTradeInImei(e.target.value)}
                        placeholder="IMEI"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Agreed Trade-in Value (₹) *</label>
                      <input
                        type="number"
                        value={tradeInValue}
                        onChange={(e) => setTradeInValue(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Device Condition</label>
                      <select
                        value={tradeInCondition}
                        onChange={(e) => setTradeInCondition(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white"
                      >
                        <option>Working</option>
                        <option>Minor Issue</option>
                        <option>Damaged</option>
                        <option>Not Working</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={tradeInAddToStock}
                      onChange={(e) => setTradeInAddToStock(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                    <span>Add this device automatically to Used Phones Inventory for resale</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Billing Summary Panel */}
          <div className="space-y-6 sticky top-24">
            <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-bold text-white font-heading text-base pb-3 border-b border-white/10">
                Invoice Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{billType === "tax" ? "Taxable Value" : "Subtotal"}</span>
                  <span className="font-mono text-white">{rs2(calculated.taxable)}</span>
                </div>

                {billType === "tax" && (
                  <>
                    {interstate ? (
                      <div className="flex justify-between text-slate-400">
                        <span>IGST ({calculated.rate}%)</span>
                        <span className="font-mono text-white">{rs2(calculated.igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>CGST ({calculated.rate / 2}%)</span>
                          <span className="font-mono text-white">{rs2(calculated.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>SGST ({calculated.rate / 2}%)</span>
                          <span className="font-mono text-white">{rs2(calculated.sgst)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="flex justify-between text-base font-extrabold text-white pt-3 border-t border-white/10">
                  <span>Gross Total</span>
                  <span className="font-mono text-rose-400">{rs(calculated.grand)}</span>
                </div>

                {tradeInValNum > 0 && (
                  <>
                    <div className="flex justify-between text-blue-400 text-xs font-semibold">
                      <span>Less: Trade-in Device</span>
                      <span className="font-mono">-{rs2(tradeInValNum)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Net Payable</span>
                      <span className="font-mono">{rs2(netPayable)}</span>
                    </div>
                  </>
                )}

                <p className="text-[11px] text-slate-400 italic pt-2 border-t border-white/5">
                  {numWords(calculated.grand)}
                </p>
              </div>

              {/* Payment & Warranty Setup */}
              <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    placeholder={`Full (${rs2(netPayable)})`}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white"
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Warranty (Months)</label>
                    <input
                      type="number"
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white"
                    />
                  </div>
                </div>

                {balance > 0.5 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex justify-between text-rose-300 font-semibold text-xs">
                    <span>Balance Due:</span>
                    <span className="font-mono font-bold">{rs(balance)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleSaveBill(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBill(false)}
                  className="w-full py-2.5 px-4 rounded-xl glass-card hover:bg-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Picker Modal */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick Product from Stock">
        <div className="space-y-4 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search in stock by model, name, category, IMEI..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredPicker.length ? (
              filteredPicker.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => addFromPicker(inv)}
                  className="w-full p-3 rounded-xl glass-card hover:border-rose-500/50 hover:bg-white/[0.04] transition-all flex items-center justify-between text-left group"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-rose-300">{inv.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {inv.categoryName} · <span className="font-mono text-emerald-400 font-semibold">{inv.qty} in stock</span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white text-sm">{rs(inv.price)}</div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500">No matching items found in stock.</div>
            )}
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
