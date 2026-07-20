"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { todayISO, generateDateBillNo } from "@/lib/utils";
import { 
  Bill, 
  MobileItem, 
  AccessoryItem, 
  SparePartItem, 
  UsedPhoneItem, 
  Supplier, 
  Purchase, 
  ServiceJob, 
  Expense, 
  Quote, 
  Challan, 
  ShopSettings, 
  Payment, 
  AuditLog,
  OutsourceItem
} from "@/types";

const defaultSettings: ShopSettings = {
  shopName: "Abbas Cell Park",
  gstin: "33ADZPA7749N1ZQ",
  addrCash: "114, Palakkad Main Road, Opp. Bus Stand, Pollachi - 642 001",
  addrTax: "114, Palakkad Pollachi Road, Pollachi, Coimbatore, Tamilnadu - 642 001",
  cell: "99652 25786, 95977 01776",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "HDFC Bank",
  bankAcc: "50200012345678",
  ifsc: "HDFC0001234",
  gstRate: 18,
  warrantyMonths: 12,
  upiId: "abbascellpark@upi",
  nextCashNo: 173,
  nextTaxNo: 31,
  nextNonTaxNo: 1,
  nextServiceNo: 1,
  nextQuoteNo: 1,
  nextChallanNo: 1,
};

interface DataContextType {
  settings: ShopSettings;
  bills: Bill[];
  mobiles: MobileItem[];
  accessories: AccessoryItem[];
  spareParts: SparePartItem[];
  usedPhones: UsedPhoneItem[];
  suppliers: Supplier[];
  purchases: Purchase[];
  services: ServiceJob[];
  outsource: OutsourceItem[];
  expenses: Expense[];
  quotes: Quote[];
  challans: Challan[];
  payments: Payment[];
  auditLogs: AuditLog[];
  loading: boolean;
  
  // Real-time Firestore Actions
  saveSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  addBill: (bill: Bill) => Promise<void>;
  voidBill: (id: string, reason: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  saveMobile: (item: MobileItem) => Promise<void>;
  deleteMobile: (id: string) => Promise<void>;
  
  saveAccessory: (item: AccessoryItem) => Promise<void>;
  deleteAccessory: (id: string) => Promise<void>;
  
  saveSparePart: (item: SparePartItem) => Promise<void>;
  deleteSparePart: (id: string) => Promise<void>;
  
  saveUsedPhone: (item: UsedPhoneItem) => Promise<void>;
  deleteUsedPhone: (id: string) => Promise<void>;
  
  saveSupplier: (item: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  addPurchase: (purchase: Purchase) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  saveService: (job: ServiceJob) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  saveOutsource: (item: OutsourceItem) => Promise<void>;
  deleteOutsource: (id: string) => Promise<void>;

  saveExpense: (exp: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  saveQuote: (q: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  
  saveChallan: (c: Challan) => Promise<void>;
  deleteChallan: (id: string) => Promise<void>;
  
  recordPayment: (payment: Payment) => Promise<void>;
  logAudit: (action: string, detail: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [bills, setBills] = useState<Bill[]>([]);
  const [mobiles, setMobiles] = useState<MobileItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([]);
  const [usedPhones, setUsedPhones] = useState<UsedPhoneItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [services, setServices] = useState<ServiceJob[]>([]);
  const [outsource, setOutsource] = useState<OutsourceItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore Real-time Listeners with Local Fallback Storage
  useEffect(() => {
    const localStoreKey = "abbas_cell_park_firestore_cache_v2";
    let cachedData: any = null;
    try {
      const raw = localStorage.getItem(localStoreKey);
      if (raw) cachedData = JSON.parse(raw);
    } catch (e) {}

    if (cachedData) {
      if (cachedData.settings) setSettings((prev) => ({ ...prev, ...cachedData.settings }));
      if (cachedData.bills) setBills(cachedData.bills);
      if (cachedData.mobiles) setMobiles(cachedData.mobiles);
      if (cachedData.accessories) setAccessories(cachedData.accessories);
      if (cachedData.spareParts) setSpareParts(cachedData.spareParts);
      if (cachedData.usedPhones) setUsedPhones(cachedData.usedPhones);
      if (cachedData.suppliers) setSuppliers(cachedData.suppliers);
      if (cachedData.purchases) setPurchases(cachedData.purchases);
      if (cachedData.services) setServices(cachedData.services);
      if (cachedData.outsource) setOutsource(cachedData.outsource);
      if (cachedData.expenses) setExpenses(cachedData.expenses);
      if (cachedData.quotes) setQuotes(cachedData.quotes);
      if (cachedData.challans) setChallans(cachedData.challans);
      if (cachedData.payments) setPayments(cachedData.payments);
      if (cachedData.auditLogs) setAuditLogs(cachedData.auditLogs);
    }

    try {
      const unsubSettings = onSnapshot(doc(db, "settings", "shopDetails"), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as ShopSettings);
        }
      });

      const unsubBills = onSnapshot(collection(db, "bills"), (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bill));

        // Auto-migrate old non-date-coded bill numbers (e.g. "173") to YYYYMMDD-001 format
        const needsMigrate = list.some((b) => !String(b.billNo).includes("-"));
        if (needsMigrate) {
          const byDate: { [date: string]: Bill[] } = {};
          list.forEach((b) => {
            const d = b.date || todayISO();
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(b);
          });

          list = list.map((b) => {
            if (!String(b.billNo).includes("-")) {
              const d = b.date || todayISO();
              const sameDateList = (byDate[d] || []).sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0));
              const idx = sameDateList.findIndex((x) => x.id === b.id);
              const dateKey = String(d).replace(/\D/g, "");
              const seqStr = String((idx >= 0 ? idx : 0) + 1).padStart(3, "0");
              const prefix = b.type === "nontax" ? "NT-" : b.type === "tax" ? "TX-" : "";
              const newBillNo = `${prefix}${dateKey}-${seqStr}`;

              try {
                updateDoc(doc(db, "bills", b.id), { billNo: newBillNo });
              } catch (e) {}

              return { ...b, billNo: newBillNo };
            }
            return b;
          });
        }

        setBills(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      });

      const unsubMobiles = onSnapshot(collection(db, "mobiles"), (snap) => {
        setMobiles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MobileItem)));
      });

      const unsubAcc = onSnapshot(collection(db, "accessories"), (snap) => {
        setAccessories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessoryItem)));
      });

      const unsubSpares = onSnapshot(collection(db, "spareParts"), (snap) => {
        setSpareParts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SparePartItem)));
      });

      const unsubUsed = onSnapshot(collection(db, "usedPhones"), (snap) => {
        setUsedPhones(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UsedPhoneItem)));
      });

      const unsubSuppliers = onSnapshot(collection(db, "suppliers"), (snap) => {
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier)));
      });

      const unsubPurchases = onSnapshot(collection(db, "purchases"), (snap) => {
        setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase)));
      });

      const unsubServices = onSnapshot(collection(db, "repairs"), (snap) => {
        setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceJob)));
      });

      const unsubOutsource = onSnapshot(collection(db, "outsource"), (snap) => {
        setOutsource(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OutsourceItem)));
      });

      const unsubExpenses = onSnapshot(collection(db, "expenses"), (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
      });

      const unsubQuotes = onSnapshot(collection(db, "quotes"), (snap) => {
        setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote)));
      });

      const unsubChallans = onSnapshot(collection(db, "challans"), (snap) => {
        setChallans(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challan)));
      });

      const unsubPayments = onSnapshot(collection(db, "payments"), (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
      });

      const unsubAudit = onSnapshot(collection(db, "auditLogs"), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
        setAuditLogs(list.sort((a, b) => b.ts - a.ts));
      });

      setLoading(false);

      return () => {
        unsubSettings();
        unsubBills();
        unsubMobiles();
        unsubAcc();
        unsubSpares();
        unsubUsed();
        unsubSuppliers();
        unsubPurchases();
        unsubServices();
        unsubOutsource();
        unsubExpenses();
        unsubQuotes();
        unsubChallans();
        unsubPayments();
        unsubAudit();
      };
    } catch (err) {
      console.warn("Firestore listener warning (running in offline/cached mode):", err);
      setLoading(false);
    }
  }, []);

  const updateCache = (key: string, val: any) => {
    try {
      const localStoreKey = "abbas_cell_park_firestore_cache_v2";
      const raw = localStorage.getItem(localStoreKey);
      const cur = raw ? JSON.parse(raw) : {};
      cur[key] = val;
      localStorage.setItem(localStoreKey, JSON.stringify(cur));
    } catch (e) {}
  };

  const saveSettings = async (newSettings: Partial<ShopSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    updateCache("settings", updated);
    try {
      await setDoc(doc(db, "settings", "shopDetails"), updated, { merge: true });
    } catch (e) {}
  };

  const addBill = async (bill: Bill) => {
    // Enforce YYYYMMDD-001 date-coded bill number if not set
    if (!String(bill.billNo).includes("-")) {
      bill.billNo = generateDateBillNo(bill.type, bill.date || todayISO(), bills);
    }

    const nextList = [bill, ...bills];
    setBills(nextList);
    updateCache("bills", nextList);

    try {
      await setDoc(doc(db, "bills", bill.id), bill);
    } catch (e) {}
  };

  const voidBill = async (id: string, reason: string) => {
    const nextList = bills.map((b) => (b.id === id ? { ...b, void: true, voidReason: reason } : b));
    setBills(nextList);
    updateCache("bills", nextList);
    try {
      await updateDoc(doc(db, "bills", id), { void: true, voidReason: reason });
    } catch (e) {}
  };

  const deleteBill = async (id: string) => {
    const nextList = bills.filter((b) => b.id !== id);
    setBills(nextList);
    updateCache("bills", nextList);
    try {
      await deleteDoc(doc(db, "bills", id));
    } catch (e) {}
  };

  const saveMobile = async (item: MobileItem) => {
    const idx = mobiles.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? mobiles.map((m) => (m.id === item.id ? item : m)) : [item, ...mobiles];
    setMobiles(nextList);
    updateCache("mobiles", nextList);
    try {
      await setDoc(doc(db, "mobiles", item.id), item);
    } catch (e) {}
  };

  const deleteMobile = async (id: string) => {
    const nextList = mobiles.filter((m) => m.id !== id);
    setMobiles(nextList);
    updateCache("mobiles", nextList);
    try {
      await deleteDoc(doc(db, "mobiles", id));
    } catch (e) {}
  };

  const saveAccessory = async (item: AccessoryItem) => {
    const idx = accessories.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? accessories.map((m) => (m.id === item.id ? item : m)) : [item, ...accessories];
    setAccessories(nextList);
    updateCache("accessories", nextList);
    try {
      await setDoc(doc(db, "accessories", item.id), item);
    } catch (e) {}
  };

  const deleteAccessory = async (id: string) => {
    const nextList = accessories.filter((m) => m.id !== id);
    setAccessories(nextList);
    updateCache("accessories", nextList);
    try {
      await deleteDoc(doc(db, "accessories", id));
    } catch (e) {}
  };

  const saveSparePart = async (item: SparePartItem) => {
    const idx = spareParts.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? spareParts.map((m) => (m.id === item.id ? item : m)) : [item, ...spareParts];
    setSpareParts(nextList);
    updateCache("spareParts", nextList);
    try {
      await setDoc(doc(db, "spareParts", item.id), item);
    } catch (e) {}
  };

  const deleteSparePart = async (id: string) => {
    const nextList = spareParts.filter((m) => m.id !== id);
    setSpareParts(nextList);
    updateCache("spareParts", nextList);
    try {
      await deleteDoc(doc(db, "spareParts", id));
    } catch (e) {}
  };

  const saveUsedPhone = async (item: UsedPhoneItem) => {
    const idx = usedPhones.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? usedPhones.map((m) => (m.id === item.id ? item : m)) : [item, ...usedPhones];
    setUsedPhones(nextList);
    updateCache("usedPhones", nextList);
    try {
      await setDoc(doc(db, "usedPhones", item.id), item);
    } catch (e) {}
  };

  const deleteUsedPhone = async (id: string) => {
    const nextList = usedPhones.filter((m) => m.id !== id);
    setUsedPhones(nextList);
    updateCache("usedPhones", nextList);
    try {
      await deleteDoc(doc(db, "usedPhones", id));
    } catch (e) {}
  };

  const saveSupplier = async (item: Supplier) => {
    const idx = suppliers.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? suppliers.map((m) => (m.id === item.id ? item : m)) : [item, ...suppliers];
    setSuppliers(nextList);
    updateCache("suppliers", nextList);
    try {
      await setDoc(doc(db, "suppliers", item.id), item);
    } catch (e) {}
  };

  const deleteSupplier = async (id: string) => {
    const nextList = suppliers.filter((m) => m.id !== id);
    setSuppliers(nextList);
    updateCache("suppliers", nextList);
    try {
      await deleteDoc(doc(db, "suppliers", id));
    } catch (e) {}
  };

  const addPurchase = async (purchase: Purchase) => {
    const nextList = [purchase, ...purchases];
    setPurchases(nextList);
    updateCache("purchases", nextList);
    try {
      await setDoc(doc(db, "purchases", purchase.id), purchase);
    } catch (e) {}
  };

  const deletePurchase = async (id: string) => {
    const nextList = purchases.filter((m) => m.id !== id);
    setPurchases(nextList);
    updateCache("purchases", nextList);
    try {
      await deleteDoc(doc(db, "purchases", id));
    } catch (e) {}
  };

  const saveService = async (job: ServiceJob) => {
    const idx = services.findIndex((m) => m.id === job.id);
    const nextList = idx >= 0 ? services.map((m) => (m.id === job.id ? job : m)) : [job, ...services];
    setServices(nextList);
    updateCache("services", nextList);
    try {
      await setDoc(doc(db, "repairs", job.id), job);
    } catch (e) {}
  };

  const deleteService = async (id: string) => {
    const nextList = services.filter((m) => m.id !== id);
    setServices(nextList);
    updateCache("services", nextList);
    try {
      await deleteDoc(doc(db, "repairs", id));
    } catch (e) {}
  };

  const saveOutsource = async (item: OutsourceItem) => {
    const idx = outsource.findIndex((m) => m.id === item.id);
    const nextList = idx >= 0 ? outsource.map((m) => (m.id === item.id ? item : m)) : [item, ...outsource];
    setOutsource(nextList);
    updateCache("outsource", nextList);
    try {
      await setDoc(doc(db, "outsource", item.id), item);
    } catch (e) {}
  };

  const deleteOutsource = async (id: string) => {
    const nextList = outsource.filter((m) => m.id !== id);
    setOutsource(nextList);
    updateCache("outsource", nextList);
    try {
      await deleteDoc(doc(db, "outsource", id));
    } catch (e) {}
  };

  const saveExpense = async (exp: Expense) => {
    const idx = expenses.findIndex((m) => m.id === exp.id);
    const nextList = idx >= 0 ? expenses.map((m) => (m.id === exp.id ? exp : m)) : [exp, ...expenses];
    setExpenses(nextList);
    updateCache("expenses", nextList);
    try {
      await setDoc(doc(db, "expenses", exp.id), exp);
    } catch (e) {}
  };

  const deleteExpense = async (id: string) => {
    const nextList = expenses.filter((m) => m.id !== id);
    setExpenses(nextList);
    updateCache("expenses", nextList);
    try {
      await deleteDoc(doc(db, "expenses", id));
    } catch (e) {}
  };

  const saveQuote = async (q: Quote) => {
    const idx = quotes.findIndex((m) => m.id === q.id);
    const nextList = idx >= 0 ? quotes.map((m) => (m.id === q.id ? q : m)) : [q, ...quotes];
    setQuotes(nextList);
    updateCache("quotes", nextList);
    try {
      await setDoc(doc(db, "quotes", q.id), q);
    } catch (e) {}
  };

  const deleteQuote = async (id: string) => {
    const nextList = quotes.filter((m) => m.id !== id);
    setQuotes(nextList);
    updateCache("quotes", nextList);
    try {
      await deleteDoc(doc(db, "quotes", id));
    } catch (e) {}
  };

  const saveChallan = async (c: Challan) => {
    const idx = challans.findIndex((m) => m.id === c.id);
    const nextList = idx >= 0 ? challans.map((m) => (m.id === c.id ? c : m)) : [c, ...challans];
    setChallans(nextList);
    updateCache("challans", nextList);
    try {
      await setDoc(doc(db, "challans", c.id), c);
    } catch (e) {}
  };

  const deleteChallan = async (id: string) => {
    const nextList = challans.filter((m) => m.id !== id);
    setChallans(nextList);
    updateCache("challans", nextList);
    try {
      await deleteDoc(doc(db, "challans", id));
    } catch (e) {}
  };

  const recordPayment = async (payment: Payment) => {
    const nextList = [payment, ...payments];
    setPayments(nextList);
    updateCache("payments", nextList);
    try {
      await setDoc(doc(db, "payments", payment.id), payment);
    } catch (e) {}
  };

  const logAudit = async (action: string, detail: string) => {
    const log: AuditLog = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      action,
      detail,
      ts: Date.now(),
    };
    const nextList = [log, ...auditLogs].slice(0, 500);
    setAuditLogs(nextList);
    updateCache("auditLogs", nextList);
    try {
      await setDoc(doc(db, "auditLogs", log.id), log);
    } catch (e) {}
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        bills,
        mobiles,
        accessories,
        spareParts,
        usedPhones,
        suppliers,
        purchases,
        services,
        outsource,
        expenses,
        quotes,
        challans,
        payments,
        auditLogs,
        loading,
        saveSettings,
        addBill,
        voidBill,
        deleteBill,
        saveMobile,
        deleteMobile,
        saveAccessory,
        deleteAccessory,
        saveSparePart,
        deleteSparePart,
        saveUsedPhone,
        deleteUsedPhone,
        saveSupplier,
        deleteSupplier,
        addPurchase,
        deletePurchase,
        saveService,
        deleteService,
        saveOutsource,
        deleteOutsource,
        saveExpense,
        deleteExpense,
        saveQuote,
        deleteQuote,
        saveChallan,
        deleteChallan,
        recordPayment,
        logAudit,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
