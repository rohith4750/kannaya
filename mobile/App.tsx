import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  Modal,
} from 'react-native';
import {
  getDashboardMetrics,
  getProducts,
  getCustomers,
  submitPOSBill,
  getInvoices,
  getShopSettings,
  updateShopSettings,
} from './src/api';

type Role = 'ADMIN' | 'STAFF';
type TabType = 'dashboard' | 'pos' | 'invoices' | 'customers' | 'settings';

export default function App() {
  const [role, setRole] = useState<Role>('ADMIN');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);

  // Dashboard State
  const [metrics, setMetrics] = useState<any>(null);
  const [period, setPeriod] = useState('this_month');

  // POS State
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submittingPOS, setSubmittingPOS] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);

  // Invoices & Customers State
  const [invoices, setInvoices] = useState<any[]>([]);

  // Settings State
  const [settings, setSettings] = useState<any>({
    shopName: '',
    phone: '',
    address: '',
    gstin: '',
    defaultGstPercent: 18,
    defaultHsnCode: '8544',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadTabContent();
  }, [activeTab, period, role]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await getDashboardMetrics(period);
        setMetrics(data.metrics);
      } else if (activeTab === 'pos') {
        const [prods, custs] = await Promise.all([getProducts(searchQuery), getCustomers()]);
        setProducts(prods);
        setCustomers(custs);
      } else if (activeTab === 'invoices') {
        const invs = await getInvoices();
        setInvoices(invs);
      } else if (activeTab === 'customers') {
        const custs = await getCustomers();
        setCustomers(custs);
      } else if (activeTab === 'settings') {
        const s = await getShopSettings();
        setSettings(s);
      }
    } catch (e: any) {
      console.log('Error loading tab:', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add products to cart before completing bill.');
      return;
    }
    setSubmittingPOS(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
      const selCustomer = customers.find((c) => c.id === selectedCustomerId);

      const payload = {
        customerId: selectedCustomerId || null,
        customerName: selCustomer ? selCustomer.name : 'Walk-in Customer',
        customerPhone: selCustomer ? selCustomer.phone : 'N/A',
        items: cart,
        subtotal,
        discount: 0,
        tax: (subtotal * (settings.defaultGstPercent || 18)) / 100,
        totalAmount: subtotal,
        paidAmount: paymentMethod === 'CREDIT' ? 0 : subtotal,
        dueAmount: paymentMethod === 'CREDIT' ? subtotal : 0,
        paymentMethod,
      };

      const res = await submitPOSBill(payload);
      setReceiptModal(res.invoice);
      setCart([]);
    } catch (e: any) {
      Alert.alert('POS Error', e.message || 'Billing failed');
    } finally {
      setSubmittingPOS(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateShopSettings(settings);
      Alert.alert('Settings Updated', 'Store settings saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#383838" />

      {/* App Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Venkata Lakshmi Mobile ERP</Text>
          <Text style={styles.brandSubtitle}>Electrical & Hardware Store</Text>
        </View>

        {/* Role Switcher Pill */}
        <TouchableOpacity
          onPress={() => {
            const nextRole = role === 'ADMIN' ? 'STAFF' : 'ADMIN';
            setRole(nextRole);
            if (nextRole === 'STAFF' && (activeTab === 'dashboard' || activeTab === 'settings')) {
              setActiveTab('pos');
            }
          }}
          style={styles.roleBadge}
        >
          <Text style={styles.roleText}>{role} MODE (Switch)</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#6d8196" />
            <Text style={styles.loadingText}>Connecting to Store Backend...</Text>
          </View>
        ) : (
          <>
            {/* SCREEN 1: DUAL ACTIVE PROFIT DASHBOARD (Admin Only) */}
            {activeTab === 'dashboard' && role === 'ADMIN' && (
              <ScrollView style={styles.scrollScreen}>
                {/* Today's Active Profit Card */}
                <View style={styles.todayCard}>
                  <Text style={styles.cardHeaderTitle}>Today's Active Profit Overview</Text>
                  <View style={styles.profitRow}>
                    <View style={styles.profitBox}>
                      <Text style={styles.profitBoxLabel}>REVENUE</Text>
                      <Text style={styles.profitBoxVal}>₹{(metrics?.todaySales || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.profitBox}>
                      <Text style={styles.profitBoxLabel}>COGS COST</Text>
                      <Text style={styles.profitBoxVal}>₹{(metrics?.todayCost || 0).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.profitBox, { backgroundColor: '#10b981' }]}>
                      <Text style={[styles.profitBoxLabel, { color: '#fff' }]}>GROSS PROFIT</Text>
                      <Text style={[styles.profitBoxVal, { color: '#fff' }]}>
                        ₹{(metrics?.todayGrossProfit || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Period Metrics */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Period Sales ({period.toUpperCase()})</Text>
                  <Text style={styles.bigValText}>₹{(metrics?.periodSales || 0).toLocaleString()}</Text>
                  <Text style={styles.subText}>Net Gross Profit: ₹{(metrics?.periodGrossProfit || 0).toLocaleString()}</Text>
                </View>

                {/* KPI Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Customer Udhar</Text>
                    <Text style={[styles.kpiVal, { color: '#d97706' }]}>
                      ₹{(metrics?.customerDueTotal || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Stock Value</Text>
                    <Text style={[styles.kpiVal, { color: '#7c3aed' }]}>
                      ₹{(metrics?.totalInventoryCostValue || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* SCREEN 2: POS BILLING */}
            {activeTab === 'pos' && (
              <View style={styles.flexScreen}>
                {/* Product Search */}
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search product by name..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={(txt) => {
                    setSearchQuery(txt);
                    getProducts(txt).then(setProducts).catch(console.log);
                  }}
                />

                {/* Products List */}
                <FlatList
                  data={products}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.productRow} onPress={() => addToCart(item)}>
                      <View>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productSub}>{item.category?.name || 'Item'} • Stock: {item.stockQuantity}</Text>
                      </View>
                      <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
                    </TouchableOpacity>
                  )}
                />

                {/* Cart Summary Bar */}
                {cart.length > 0 && (
                  <View style={styles.cartFooter}>
                    <Text style={styles.cartCountText}>{cart.reduce((s, i) => s + i.quantity, 0)} Items in Cart</Text>
                    <Text style={styles.cartTotalText}>Total: ₹{totalCartAmount.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckoutPOS} disabled={submittingPOS}>
                      <Text style={styles.checkoutBtnText}>{submittingPOS ? 'Billing...' : 'Complete POS Bill'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* SCREEN 3: INVOICES */}
            {activeTab === 'invoices' && (
              <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.invoiceCard}>
                    <View style={styles.invRow}>
                      <Text style={styles.invNo}>{item.invoiceNo}</Text>
                      <Text style={styles.invAmount}>₹{item.totalAmount.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.invCust}>{item.customerName} ({item.paymentMethod})</Text>
                  </View>
                )}
              />
            )}

            {/* SCREEN 4: CUSTOMERS */}
            {activeTab === 'customers' && (
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.invoiceCard}>
                    <Text style={styles.invNo}>{item.name}</Text>
                    <Text style={styles.invCust}>Ph: {item.phone}</Text>
                    <Text style={[styles.invAmount, { color: '#d97706', marginTop: 4 }]}>
                      Udhar Balance: ₹{item.outstanding.toLocaleString()}
                    </Text>
                  </View>
                )}
              />
            )}

            {/* SCREEN 5: SETTINGS (Admin Only) */}
            {activeTab === 'settings' && role === 'ADMIN' && (
              <ScrollView style={styles.scrollScreen}>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Store Profile</Text>
                  <Text style={styles.inputLabel}>Store Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={settings.shopName}
                    onChangeText={(txt) => setSettings({ ...settings, shopName: txt })}
                  />

                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={settings.phone}
                    onChangeText={(txt) => setSettings({ ...settings, phone: txt })}
                  />

                  <Text style={styles.inputLabel}>Default GST Rate (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(settings.defaultGstPercent || 18)}
                    onChangeText={(txt) => setSettings({ ...settings, defaultGstPercent: parseFloat(txt) || 0 })}
                  />

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={savingSettings}>
                    <Text style={styles.saveBtnText}>{savingSettings ? 'Saving...' : 'Save Settings'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'dashboard' && styles.activeTab]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>Dashboard</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'pos' && styles.activeTab]}
          onPress={() => setActiveTab('pos')}
        >
          <Text style={[styles.navText, activeTab === 'pos' && styles.activeNavText]}>POS Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.navText, activeTab === 'invoices' && styles.activeNavText]}>Bills</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.navText, activeTab === 'customers' && styles.activeNavText]}>Udhar</Text>
        </TouchableOpacity>

        {role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>Settings</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Receipt Modal */}
      {receiptModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Bill Generated Successfully!</Text>
              <Text style={styles.modalInvNo}>Invoice #{receiptModal.invoiceNo}</Text>
              <Text style={styles.modalTotal}>Total Paid: ₹{receiptModal.totalAmount}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setReceiptModal(null)}>
                <Text style={styles.closeBtnText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#383838',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: { flex: 1 },
  brandTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  brandSubtitle: { color: '#ffffe3', fontSize: 10 },
  roleBadge: { backgroundColor: '#6d8196', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  body: { flex: 1, padding: 12 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 12, color: '#64748b' },
  scrollScreen: { flex: 1 },
  flexScreen: { flex: 1 },
  todayCard: { backgroundColor: '#064e3b', padding: 14, borderRadius: 6, marginBottom: 12 },
  cardHeaderTitle: { color: '#ffffe3', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  profitBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 },
  profitBoxLabel: { color: '#a7f3d0', fontSize: 9, fontWeight: 'bold' },
  profitBoxVal: { color: '#fff', fontSize: 13, fontWeight: 'black', marginTop: 2 },
  sectionCard: { backgroundColor: '#fff', padding: 14, borderRadius: 6, borderWidth: 1, borderColor: '#cbcbcb', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#4a4a4a', marginBottom: 8 },
  bigValText: { fontSize: 20, fontWeight: 'extrabold', color: '#4a4a4a' },
  subText: { fontSize: 11, color: '#059669', marginTop: 4, fontWeight: 'bold' },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#cbcbcb' },
  kpiLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  kpiVal: { fontSize: 16, fontWeight: 'extrabold', marginTop: 4 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbcbcb', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#0f172a', marginBottom: 8 },
  productRow: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#cbcbcb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  productSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: 'extrabold', color: '#059669' },
  cartFooter: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#cbcbcb', padding: 12 },
  cartCountText: { fontSize: 10, color: '#64748b' },
  cartTotalText: { fontSize: 16, fontWeight: 'extrabold', color: '#0f172a', marginVertical: 4 },
  checkoutBtn: { backgroundColor: '#6d8196', paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  invoiceCard: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#cbcbcb', marginBottom: 6 },
  invRow: { flexDirection: 'row', justify: 'space-between' },
  invNo: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  invAmount: { fontSize: 12, fontWeight: 'extrabold', color: '#059669' },
  invCust: { fontSize: 10, color: '#64748b', marginTop: 2 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#4a4a4a', marginTop: 8 },
  formInput: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbcbcb', borderRadius: 5, padding: 8, fontSize: 12, marginTop: 4 },
  saveBtn: { backgroundColor: '#6d8196', paddingVertical: 10, borderRadius: 5, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  bottomNav: { backgroundColor: '#383838', flexDirection: 'row', borderTopWidth: 1, borderColor: '#525252' },
  navTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#6d8196' },
  navText: { color: '#cbcbcb', fontSize: 11, fontWeight: 'medium' },
  activeNavText: { color: '#fff', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 8, alignItems: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  modalInvNo: { fontSize: 12, color: '#0f172a', marginVertical: 6 },
  modalTotal: { fontSize: 16, font: 'bold', color: '#0f172a', marginBottom: 16 },
  closeBtn: { backgroundColor: '#6d8196', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
