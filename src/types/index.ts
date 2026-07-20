export type InventoryCategory = 'Mobiles' | 'Accessories' | 'Spare Parts' | 'Used Phones';

export interface MobileItem {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  color?: string;
  imei?: string;
  batteryNo?: string;
  cost: number;
  sell: number;
  qty: number;
  supplierId?: string;
  supplierName?: string;
  condition?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: string; // e.g. Tempered Glass, Charger, Case, Skin
  brandType?: string; // e.g. Branded, Non-Branded
  hsn?: string;
  cost: number;
  sell: number;
  qty: number;
  supplierId?: string;
  supplierName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface SparePartItem {
  id: string;
  partName: string;
  compatibleModel: string;
  hsn?: string;
  cost: number;
  sell: number;
  qty: number;
  supplierId?: string;
  supplierName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface UsedPhoneItem {
  id: string;
  brand: string;
  model: string;
  imei?: string;
  condition: string;
  batteryHealth?: string;
  cost: number;
  sell: number;
  qty: number;
  supplierId?: string;
  supplierName?: string;
  tradeInBillId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Supplier {
  id: string;
  supplierName: string;
  contactPerson?: string;
  mobile: string;
  gstin?: string;
  email?: string;
  address?: string;
  outstandingBalance: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface PurchaseItem {
  invCategory: InventoryCategory;
  itemId?: string;
  name: string;
  qty: number;
  cost: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  category: InventoryCategory;
  invoiceNo?: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  createdAt?: number;
}

export interface BillItem {
  invCategory?: InventoryCategory;
  itemId?: string;
  model: string;
  imei1?: string;
  imei2?: string;
  battery?: string;
  hsn?: string;
  qty: number;
  rate: number;
  cost: number;
  taxable: number;
  cgstA: number;
  sgstA: number;
  igstA: number;
  amount: number;
  lineTotal: number;
}

export interface TradeIn {
  enabled?: boolean;
  model: string;
  imei?: string;
  condition: string;
  value: number;
  addToStock: boolean;
  invId?: string;
}

export interface Bill {
  id: string;
  billNo: string;
  type: 'cash' | 'nontax' | 'tax';
  saleType: 'mobile' | 'accessory' | 'service';
  date: string;
  customer: {
    name: string;
    mobile: string;
    address?: string;
    gstin?: string;
    state?: string;
    stateCode?: string;
  };
  transport?: {
    mode?: string;
    vehicle?: string;
    dateOfSupply?: string;
    placeOfSupply?: string;
  };
  items: BillItem[];
  rate: number;
  interstate: boolean;
  inclusive: boolean;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;
  grand: number;
  tradeIn?: TradeIn;
  netPayable: number;
  costTotal: number;
  costKnown: boolean;
  profit: number;
  paid: number;
  payMode: string;
  balance: number;
  warrantyMonths: number;
  void: boolean;
  voidReason?: string;
  serviceId?: string;
  words?: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  billId: string;
  billNo: string;
  customerName?: string;
  customerMobile?: string;
  amount: number;
  mode: string;
  date: string;
  createdAt: number;
}

export interface ServiceJob {
  id: string;
  ticketNo: string;
  customer: {
    name: string;
    mobile: string;
  };
  device: string;
  issue: string;
  charge: number;
  partCost: number;
  vendor?: string;
  notes?: string;
  status: 'Received' | 'In Progress' | 'Ready' | 'Delivered';
  date: string;
  billId?: string;
  billNo?: string;
  billedAt?: number;
  createdAt: number;
}

export interface OutsourceItem {
  id: string;
  item: string;
  vendor: string;
  cost: number;
  sell: number;
  profit?: number;
  createdAt?: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendor?: string;
  notes?: string;
  createdAt: number;
}

export interface Quote {
  id: string;
  quoteNo: string;
  date: string;
  customer: {
    name: string;
    mobile: string;
  };
  saleType: string;
  items: {
    desc: string;
    qty: number;
    rate: number;
  }[];
  notes?: string;
  validDays: number;
  status: 'Open' | 'Converted';
  createdAt: number;
}

export interface Challan {
  id: string;
  challanNo: string;
  date: string;
  customer: {
    name: string;
    address?: string;
    mobile?: string;
  };
  purpose: string;
  items: {
    desc: string;
    qty: number;
    invCategory?: InventoryCategory;
    invId?: string;
  }[];
  notes?: string;
  createdAt: number;
}

export interface ShopSettings {
  shopName: string;
  gstin: string;
  addrCash: string;
  addrTax: string;
  cell: string;
  state: string;
  stateCode: string;
  bankName: string;
  bankAcc: string;
  ifsc: string;
  gstRate: number;
  warrantyMonths: number;
  upiId: string;
  nextCashNo: number;
  nextTaxNo: number;
  nextNonTaxNo: number;
  nextServiceNo: number;
  nextQuoteNo: number;
  nextChallanNo: number;
}

export interface AuditLog {
  id: string;
  action: string;
  detail: string;
  ts: number;
}
