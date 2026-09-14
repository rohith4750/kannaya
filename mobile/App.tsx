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
  StatusBar,
  FlatList,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const shopLogo = require('./assets/logo.jpg');

import {
  getDashboardMetrics,
  getProducts,
  getCustomers,
  submitPOSBill,
  getInvoices,
  getShopSettings,
  updateShopSettings,
  pinLogin,
  updatePinCode,
  logoutUser,
  createProduct,
  updateProduct,
  deleteProduct,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  recordCustomerPayment,
  deleteInvoice,
  getCategories,
} from './src/api';

type Role = 'ADMIN' | 'STAFF';
type TabType = 'dashboard' | 'pos' | 'inventory' | 'invoices' | 'customers' | 'settings';

export default function App() {
  const { width, height } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallScreen = width < 360;
  const isTablet = width >= 600;

  // Auth & PIN Lock State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [role, setRole] = useState<Role>('ADMIN');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard State
  const [metrics, setMetrics] = useState<any>(null);
  const [period, setPeriod] = useState('this_month');

  // POS & Category State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submittingPOS, setSubmittingPOS] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);


  // Inventory Management State
  const [inventorySearch, setInventorySearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Invoices & Customers Search Filters
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL'); // ALL or UDHAR
  const [invoiceDetailsModal, setInvoiceDetailsModal] = useState<any>(null);

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
  const [newPinInput, setNewPinInput] = useState('');
  const [updatingPin, setUpdatingPin] = useState(false);

  // Product CRUD States
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [savingProd, setSavingProd] = useState(false);

  const [editProdModal, setEditProdModal] = useState<any>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [updatingProd, setUpdatingProd] = useState(false);

  // Customer CRUD States
  const [addCustModalVisible, setAddCustModalVisible] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [savingCust, setSavingCust] = useState(false);

  const [editCustModal, setEditCustModal] = useState<any>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [updatingCust, setUpdatingCust] = useState(false);

  const [payCustModal, setPayCustModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTabContent();
    }
  }, [isAuthenticated, activeTab, period, role]);

  const handleKeyPress = (num: string) => {
    if (verifyingPin) return;
    setPinError('');
    if (pinInput.length < 4) {
      const updated = pinInput + num;
      setPinInput(updated);
      if (updated.length === 4) {
        verifyPinCode(updated);
      }
    }
  };

  const handleBackspace = () => {
    if (verifyingPin) return;
    setPinError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (verifyingPin) return;
    setPinError('');
    setPinInput('');
  };

  const verifyPinCode = async (codeToVerify: string) => {
    setVerifyingPin(true);
    setPinError('');
    console.log(`[PIN Lock UI] Verifying 4-digit code: ${codeToVerify}...`);
    try {
      const res = await pinLogin(codeToVerify);
      console.log('[PIN Lock UI Success] Response received:', res);
      if (res.user) {
        setCurrentUser(res.user);
        const userRole = (res.user.role || 'STAFF') as Role;
        setRole(userRole);
        setIsAuthenticated(true);
        setPinInput('');
        if (userRole === 'STAFF') {
          setActiveTab('pos');
        }
      }
    } catch (e: any) {
      console.error('[PIN Lock UI Error] Exception thrown during authentication:', e);
      setPinError(e.message || 'Invalid Security PIN code');
      setPinInput('');
    } finally {
      setVerifyingPin(false);
    }
  };

  const lockApp = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.log('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setPinInput('');
      setPinError('');
      setCart([]);
    }
  };

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await getDashboardMetrics(period);
        setMetrics(data.metrics);
      } else if (activeTab === 'pos') {
        const [prods, custs, cats] = await Promise.all([
          getProducts(posSearchQuery),
          getCustomers(),
          getCategories(),
        ]);
        setProducts(prods);
        setCustomers(custs);
        setCategories(cats);
      } else if (activeTab === 'inventory') {
        const [prods, cats] = await Promise.all([
          getProducts(inventorySearch),
          getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
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


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTabContent();
    setRefreshing(false);
  };

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find((item) => item.id === productId);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item)));
    }
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

  const handleUpdatePin = async () => {
    if (!newPinInput || newPinInput.trim().length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric PIN.');
      return;
    }
    setUpdatingPin(true);
    try {
      const res = await updatePinCode(currentUser?.id, newPinInput.trim(), role);
      Alert.alert('PIN Updated', res.message || 'Security PIN updated successfully!');
      setNewPinInput('');
    } catch (e: any) {
      Alert.alert('PIN Error', e.message || 'Failed to update PIN code');
    } finally {
      setUpdatingPin(false);
    }
  };

  // Product CRUD Functions
  const handleCreateProduct = async () => {
    if (!newProdName.trim() || !newProdPrice) {
      Alert.alert('Missing Details', 'Please provide product name and selling price.');
      return;
    }
    setSavingProd(true);
    try {
      await createProduct({
        name: newProdName,
        sellingPrice: parseFloat(newProdPrice) || 0,
        purchasePrice: parseFloat(newProdPurchasePrice) || 0,
        stockQuantity: parseFloat(newProdStock) || 0,
      });
      Alert.alert('Product Added', `${newProdName} added to inventory!`);
      setAddProductModalVisible(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdPurchasePrice('');
      setNewProdStock('');
      loadTabContent();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add product');
    } finally {
      setSavingProd(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editProdModal) return;
    setUpdatingProd(true);
    try {
      await updateProduct({
        id: editProdModal.id,
        name: editProdName || editProdModal.name,
        sellingPrice: parseFloat(editProdPrice),
        stockQuantity: parseFloat(editProdStock),
      });
      Alert.alert('Product Updated', `${editProdModal.name} updated!`);
      setEditProdModal(null);
      loadTabContent();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update product');
    } finally {
      setUpdatingProd(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${name} from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
              Alert.alert('Deleted', `${name} deleted successfully.`);
              loadTabContent();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  // Customer CRUD Functions
  const handleCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      Alert.alert('Missing Details', 'Please provide customer name and phone number.');
      return;
    }
    setSavingCust(true);
    try {
      await createCustomer({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress,
      });
      Alert.alert('Customer Profile Created', `${newCustName} added successfully!`);
      setAddCustModalVisible(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      loadTabContent();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create customer');
    } finally {
      setSavingCust(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editCustModal || !editCustName.trim() || !editCustPhone.trim()) {
      Alert.alert('Missing Details', 'Customer name and phone number are required.');
      return;
    }
    setUpdatingCust(true);
    try {
      await updateCustomer({
        id: editCustModal.id,
        name: editCustName.trim(),
        phone: editCustPhone.trim(),
        address: editCustAddress.trim(),
      });
      Alert.alert('Customer Updated', `${editCustName} profile updated!`);
      setEditCustModal(null);
      loadTabContent();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update customer profile');
    } finally {
      setUpdatingCust(false);
    }
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    Alert.alert(
      'Delete Customer Profile',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Profile',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(id);
              Alert.alert('Deleted', `${name} customer profile removed.`);
              loadTabContent();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const handleRecordPayment = async () => {
    if (!payCustModal || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid payment amount.');
      return;
    }
    setRecordingPay(true);
    try {
      await recordCustomerPayment(payCustModal.id, amt, 'CASH');
      Alert.alert('Payment Collected', `₹${amt} recorded for ${payCustModal.name}!`);
      setPayCustModal(null);
      setPayAmount('');
      loadTabContent();
    } catch (e: any) {
      Alert.alert('Payment Error', e.message || 'Failed to record payment');
    } finally {
      setRecordingPay(false);
    }
  };

  // Invoice Delete / Void Function
  const handleDeleteInvoice = (id: string, invoiceNo: string) => {
    Alert.alert(
      'Void Bill',
      `Are you sure you want to cancel and delete Bill #${invoiceNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void Bill',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice(id);
              Alert.alert('Bill Voided', `Invoice #${invoiceNo} has been deleted.`);
              loadTabContent();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to void bill');
            }
          },
        },
      ]
    );
  };

  const handleCallCustomer = (phone: string) => {
    if (!phone || phone === 'N/A') return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer on this device.');
    });
  };

  const handleGeneratePDF = async (invoice: any) => {
    if (!invoice) return;
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
              .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; }
              .shop-name { font-size: 22px; font-weight: bold; color: #059669; text-transform: uppercase; }
              .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
              .inv-meta { margin-top: 18px; font-size: 12px; display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th { background-color: #f1f5f9; padding: 8px; font-size: 11px; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
              td { padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
              .total-box { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; color: #059669; }
              .footer { margin-top: 36px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="shop-name">${settings?.shopName || 'VENKATA LAKSHMI ELECTRONICS'}</div>
              <div class="subtitle">Proprietor: Konala Kannaya Reddy • GSTIN: ${settings?.gstin || '36ABCDE1234F1Z5'}</div>
              <div class="subtitle">Phone: ${settings?.phone || '+91 98765 43210'} | ${settings?.address || 'Main Market Road'}</div>
            </div>


            <div class="inv-meta">
              <div>
                <strong>Bill No:</strong> #${invoice.invoiceNo}<br/>
                <strong>Customer:</strong> ${invoice.customerName || 'Walk-in Customer'}
              </div>
              <div style="text-align: right;">
                <strong>Date:</strong> ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}<br/>
                <strong>Payment Mode:</strong> ${invoice.paymentMethod || 'CASH'}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price (₹)</th>
                  <th style="text-align: right;">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items && invoice.items.length > 0 ? invoice.items : [{ productName: 'POS Items', quantity: 1, price: invoice.totalAmount, total: invoice.totalAmount }]).map((item: any) => `
                  <tr>
                    <td>${item.productName || item.name || 'Item'}</td>
                    <td style="text-align: center;">${item.quantity || 1}</td>
                    <td style="text-align: right;">₹${(item.price || item.sellingPrice || invoice.totalAmount).toLocaleString('en-IN')}</td>
                    <td style="text-align: right;">₹${(item.total || ((item.price || item.sellingPrice || invoice.totalAmount) * (item.quantity || 1))).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-box">
              Grand Total: ₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}
            </div>

            <div class="footer">
              Thank you for your business! • Kannaya Digital ERP Receipt
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        try {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Bill #${invoice.invoiceNo}` });
          } else {
            await Print.printAsync({ html });
          }
        } catch (shareErr) {
          console.warn('[PDF Fallback] Opening native Print & Save PDF dialog:', shareErr);
          await Print.printAsync({ html });
        }
      }
    } catch (err: any) {
      console.error('PDF Generation error:', err);
      Alert.alert('PDF Error', err.message || 'Could not generate PDF bill');
    }
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  // Filtered lists for UI reactivity
  const filteredPOSProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(posSearchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category?.name === selectedCategory ||
      p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredInventory = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category?.name === selectedCategory ||
      p.categoryId === selectedCategory;
    if (showLowStockOnly) {
      return matchesSearch && matchesCategory && p.stockQuantity <= (p.minStockAlert || 5);
    }
    return matchesSearch && matchesCategory;
  });


  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase());
    if (invoiceFilter !== 'ALL') {
      return matchesSearch && inv.paymentMethod === invoiceFilter;
    }
    return matchesSearch;
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch);
    if (customerFilter === 'UDHAR') {
      return matchesSearch && (c.outstanding || 0) > 0;
    }
    return matchesSearch;
  });

  // RENDER PIN LOCK SCREEN WHEN UNAUTHENTICATED
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.pinContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={false} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.pinScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pinHeader}>
              <View style={styles.logoBadge}>
                <Image source={shopLogo} style={styles.logoImg} resizeMode="cover" />
              </View>
              <Text style={[styles.pinBrandTitle, isSmallScreen && { fontSize: 16 }]}>
                VENKATA LAKSHMI ELECTRONICS
              </Text>
              <Text style={styles.pinBrandSubtitle}>Proprietor: Konala Kannaya Reddy</Text>
            </View>

            <View style={[styles.pinCard, isSmallScreen && { padding: 16 }]}>
              <Text style={[styles.pinTitle, isSmallScreen && { fontSize: 16 }]}>Enter Security PIN</Text>
              <Text style={styles.pinSubtitle}>Enter 4-digit PIN code to unlock</Text>

              <View style={styles.dotsRow}>
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pinInput.length > index;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        isFilled && styles.dotFilled,
                        pinError ? styles.dotError : null,
                      ]}
                    />
                  );
                })}
              </View>

              {verifyingPin ? (
                <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 8 }} />
              ) : pinError ? (
                <Text style={styles.errorText}>{pinError}</Text>
              ) : null}

              <View style={styles.keypadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keypadBtn}
                    onPress={() => handleKeyPress(digit)}
                    disabled={verifyingPin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keypadDigit}>{digit}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.keypadBtn, styles.actionKeypadBtn]}
                  onPress={handleClear}
                  disabled={verifyingPin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionKeypadText}>CLR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keypadBtn}
                  onPress={() => handleKeyPress('0')}
                  disabled={verifyingPin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keypadDigit}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keypadBtn, styles.actionKeypadBtn]}
                  onPress={handleBackspace}
                  disabled={verifyingPin}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={22} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.pinFooterNote}>Venkata Lakshmi Electronics • Proprietor: Konala Kannaya Reddy</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={false} />

      {/* App Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.headerLogoContainer}>
              <Image source={shopLogo} style={styles.headerLogoImg} resizeMode="cover" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandTitle, isSmallScreen && { fontSize: 12 }]} numberOfLines={1}>
                Venkata Lakshmi Electronics
              </Text>
              <Text style={styles.brandSubtitle} numberOfLines={1}>
                Proprietor: Konala Kannaya Reddy
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.roleBadge}>
            <Ionicons name={role === 'ADMIN' ? 'shield-checkmark' : 'person'} size={12} color="#38bdf8" style={{ marginRight: 4 }} />
            <Text style={styles.roleText}>{role}</Text>
          </View>

          <TouchableOpacity onPress={lockApp} style={styles.lockBtn} activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={12} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.lockBtnText}>Lock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading Store Data...</Text>
          </View>
        ) : (
          <>
            {/* SCREEN 1: EXECUTIVE STORE ANALYTICS & PROFIT DASHBOARD */}
            {activeTab === 'dashboard' && (
              <ScrollView
                style={styles.scrollScreen}
                contentContainerStyle={{ paddingBottom: 30 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
                }
              >
                {/* Period Selector Pills Bar */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {[
                    { id: 'today', label: "Today's Active" },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'this_year', label: 'This Year' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.filterChip,
                        period === item.id && styles.filterChipActive,
                      ]}
                      onPress={() => setPeriod(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          period === item.id && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Hero Active Profit Banner Card */}
                <View style={styles.todayCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="trending-up" size={20} color="#a7f3d0" />
                      <Text style={styles.cardHeaderTitle}>Today's Active Profit Overview</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ color: '#ecfdf5', fontSize: 10, fontWeight: 'bold' }}>
                        Margin: {(metrics?.todayProfitMargin || 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.profitRow, isSmallScreen && { flexDirection: 'column', gap: 8 }]}>
                    <View style={styles.profitBox}>
                      <Text style={styles.profitBoxLabel}>TODAY REVENUE</Text>
                      <Text style={styles.profitBoxVal}>
                        ₹{(metrics?.todaySales || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.profitBox}>
                      <Text style={styles.profitBoxLabel}>COGS COST</Text>
                      <Text style={styles.profitBoxVal}>
                        ₹{(metrics?.todayCost || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.profitBox, { backgroundColor: '#059669' }]}>
                      <Text style={[styles.profitBoxLabel, { color: '#ecfdf5' }]}>GROSS PROFIT</Text>
                      <Text style={[styles.profitBoxVal, { color: '#ffffff', fontSize: 15 }]}>
                        ₹{(metrics?.todayGrossProfit || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick Action Shortcuts Toolbar */}
                <View style={styles.shortcutRow}>
                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => setActiveTab('pos')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.shortcutIconBg, { backgroundColor: '#ecfdf5' }]}>
                      <Ionicons name="cart" size={20} color="#059669" />
                    </View>
                    <Text style={styles.shortcutText}>New Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => {
                      if (role === 'ADMIN') setActiveTab('inventory');
                      else setAddCustModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.shortcutIconBg, { backgroundColor: '#f0f9ff' }]}>
                      <Ionicons name="cube" size={20} color="#0284c7" />
                    </View>
                    <Text style={styles.shortcutText}>Inventory</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => setActiveTab('customers')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.shortcutIconBg, { backgroundColor: '#fffbeb' }]}>
                      <Ionicons name="wallet" size={20} color="#d97706" />
                    </View>
                    <Text style={styles.shortcutText}>Udhar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => setActiveTab('invoices')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.shortcutIconBg, { backgroundColor: '#f3e8ff' }]}>
                      <Ionicons name="receipt" size={20} color="#9333ea" />
                    </View>
                    <Text style={styles.shortcutText}>Bills</Text>
                  </TouchableOpacity>
                </View>

                {/* Period Sales Analytics Card */}
                <View style={styles.sectionCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.sectionTitle}>
                      Period Analytics ({period.replace('_', ' ').toUpperCase()})
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>
                      {metrics?.totalInvoiceCount || 0} Bills Generated
                    </Text>
                  </View>

                  <Text style={styles.bigValText}>
                    ₹{(metrics?.periodSales || 0).toLocaleString('en-IN')}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <Text style={styles.subText}>
                      Gross Profit: ₹{(metrics?.periodGrossProfit || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>
                      Avg Bill: ₹{Math.round(metrics?.avgOrderValue || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* 2x2 Interactive KPI Cards */}
                <View style={[styles.kpiGrid, isSmallScreen && { flexDirection: 'column' }]}>
                  {/* Udhar Balance KPI */}
                  <TouchableOpacity
                    style={styles.kpiCard}
                    onPress={() => setActiveTab('customers')}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="wallet-outline" size={16} color="#d97706" />
                        <Text style={styles.kpiLabel}>Customer Udhar</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#d97706" />
                    </View>
                    <Text style={[styles.kpiVal, { color: '#d97706' }]}>
                      ₹{(metrics?.customerDueTotal || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#b45309', marginTop: 2 }}>Tap to collect payments ›</Text>
                  </TouchableOpacity>

                  {/* Low Stock Alerts KPI */}
                  <TouchableOpacity
                    style={[styles.kpiCard, (metrics?.lowStockCount || 0) > 0 && { borderColor: '#fca5a5', backgroundColor: '#fff5f5' }]}
                    onPress={() => {
                      if (role === 'ADMIN') {
                        setShowLowStockOnly(true);
                        setActiveTab('inventory');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                        <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
                      </View>
                      {(metrics?.lowStockCount || 0) > 0 && (
                        <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 'bold' }}>Alert</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.kpiVal, { color: '#dc2626' }]}>
                      {metrics?.lowStockCount || 0} Items
                    </Text>
                    <Text style={{ fontSize: 10, color: '#991b1b', marginTop: 2 }}>
                      {(metrics?.lowStockCount || 0) > 0 ? 'Tap to view low stock ›' : 'All stock levels healthy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Stock Valuation & POS Payment Breakdown Row */}
                <View style={[styles.kpiGrid, { marginTop: 10 }, isSmallScreen && { flexDirection: 'column' }]}>
                  {/* Stock Valuation */}
                  <View style={styles.kpiCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cube-outline" size={16} color="#4f46e5" />
                      <Text style={styles.kpiLabel}>Inventory Valuation</Text>
                    </View>
                    <Text style={[styles.kpiVal, { color: '#4f46e5' }]}>
                      ₹{(metrics?.totalInventoryCostValue || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      Retail Value: ₹{(metrics?.totalInventoryRetailValue || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* POS Payment Methods Split */}
                  <View style={styles.kpiCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="card-outline" size={16} color="#059669" />
                      <Text style={styles.kpiLabel}>Payment Methods Split</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <View>
                        <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>CASH</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                          ₹{(metrics?.cashSales || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>UPI</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0284c7' }}>
                          ₹{(metrics?.upiSales || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 'bold' }}>CREDIT</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#d97706' }}>
                          ₹{(metrics?.creditSales || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}


            {/* SCREEN 2: POS BILLING */}
            {activeTab === 'pos' && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flexScreen}
              >
                {/* Search Bar */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={styles.searchBarWrapper}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.searchInputFlex}
                      placeholder="Search product name or barcode..."
                      placeholderTextColor="#94a3b8"
                      value={posSearchQuery}
                      onChangeText={(txt) => {
                        setPosSearchQuery(txt);
                        getProducts(txt).then(setProducts).catch(console.log);
                      }}
                    />
                    {posSearchQuery ? (
                      <TouchableOpacity onPress={() => { setPosSearchQuery(''); getProducts('').then(setProducts); }}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Horizontal Category Chips Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedCategory === 'ALL' && styles.filterChipActive]}
                    onPress={() => setSelectedCategory('ALL')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, selectedCategory === 'ALL' && styles.filterChipTextActive]}>
                      All Categories ({products.length})
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipActive]}
                      onPress={() => setSelectedCategory(selectedCategory === cat.name ? 'ALL' : cat.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, selectedCategory === cat.name && styles.filterChipTextActive]}>
                        {cat.name} ({cat._count?.products || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Products List */}
                <FlatList
                  key={isTablet ? 'grid-2' : 'grid-1'}
                  numColumns={isTablet ? 2 : 1}
                  data={filteredPOSProducts}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: cart.length > 0 ? 140 : 20 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="basket-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No products found in this category.</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    return (
                      <View style={[styles.productCard, isTablet && { flex: 0.5, margin: 4 }]}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.productSub}>
                            {item.category?.name || 'General'} • Stock: {item.stockQuantity} {item.unit || 'pcs'}
                          </Text>
                          <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
                        </View>

                        <View style={styles.cartActionRow}>
                          {inCart ? (
                            <View style={styles.qtyContainer}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => removeFromCart(item.id)}
                              >
                                <Ionicons name="remove" size={16} color="#0f172a" />
                              </TouchableOpacity>
                              <Text style={styles.qtyNum}>{inCart.quantity}</Text>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => addToCart(item)}
                              >
                                <Ionicons name="add" size={16} color="#0f172a" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.addCartBtn}
                              onPress={() => addToCart(item)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 2 }} />
                              <Text style={styles.addCartBtnText}>Add</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  }}
                />

                {/* Sticky Cart Summary Bar */}
                {cart.length > 0 && (
                  <View style={styles.cartFooter}>
                    <View style={styles.cartSummaryRow}>
                      <View>
                        <Text style={styles.cartCountText}>
                          {cart.reduce((s, i) => s + i.quantity, 0)} Items in Cart
                        </Text>
                        <Text style={styles.cartTotalText}>
                          Total: ₹{totalCartAmount.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.payMethodGroup}>
                        {['CASH', 'UPI', 'CREDIT'].map((method) => (
                          <TouchableOpacity
                            key={method}
                            style={[
                              styles.payChip,
                              paymentMethod === method && styles.payChipActive,
                            ]}
                            onPress={() => setPaymentMethod(method)}
                          >
                            <Text
                              style={[
                                styles.payChipText,
                                paymentMethod === method && styles.payChipTextActive,
                              ]}
                            >
                              {method}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.checkoutBtn}
                      onPress={handleCheckoutPOS}
                      disabled={submittingPOS}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.checkoutBtnText}>
                        {submittingPOS ? 'Generating Bill...' : 'Complete POS Bill'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </KeyboardAvoidingView>
            )}

            {/* SCREEN 3: INVENTORY CATALOG (Admin & Staff Access) */}
            {activeTab === 'inventory' && (
              <View style={styles.flexScreen}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={styles.searchBarWrapper}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.searchInputFlex}
                      placeholder="Search product stock..."
                      placeholderTextColor="#94a3b8"
                      value={inventorySearch}
                      onChangeText={(txt) => {
                        setInventorySearch(txt);
                        getProducts(txt).then(setProducts).catch(console.log);
                      }}
                    />
                  </View>

                  {role === 'ADMIN' && (
                    <TouchableOpacity
                      style={styles.addPrimaryBtn}
                      onPress={() => setAddProductModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 2 }} />
                      <Text style={styles.addPrimaryBtnText}>Product</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Horizontal Category Chips Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 36 }}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedCategory === 'ALL' && styles.filterChipActive]}
                    onPress={() => setSelectedCategory('ALL')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, selectedCategory === 'ALL' && styles.filterChipTextActive]}>
                      All Categories ({products.length})
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipActive]}
                      onPress={() => setSelectedCategory(selectedCategory === cat.name ? 'ALL' : cat.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, selectedCategory === cat.name && styles.filterChipTextActive]}>
                        {cat.name} ({cat._count?.products || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Filter Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.filterPill, !showLowStockOnly && styles.filterPillActive]}
                    onPress={() => setShowLowStockOnly(false)}
                  >
                    <Text style={[styles.filterPillText, !showLowStockOnly && styles.filterPillTextActive]}>
                      All Items ({products.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterPill, showLowStockOnly && styles.filterPillAlertActive]}
                    onPress={() => setShowLowStockOnly(true)}
                  >
                    <Ionicons name="warning-outline" size={12} color={showLowStockOnly ? '#ffffff' : '#d97706'} style={{ marginRight: 4 }} />
                    <Text style={[styles.filterPillText, showLowStockOnly ? { color: '#ffffff' } : { color: '#d97706' }]}>
                      Low Stock Alerts ({products.filter((p) => p.stockQuantity <= (p.minStockAlert || 5)).length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Inventory Item List */}
                <FlatList
                  data={filteredInventory}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No products found in this category.</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const isLowStock = item.stockQuantity <= (item.minStockAlert || 5);
                    return (
                      <View style={styles.inventoryCard}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.productName}>{item.name}</Text>
                            {isLowStock && (
                              <View style={styles.lowStockBadge}>
                                <Text style={styles.lowStockBadgeText}>Low Stock</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.productSub}>
                            {item.category?.name || 'General'} • Stock: {item.stockQuantity} {item.unit || 'pcs'}
                            {item.rack ? ` • Rack: ${item.rack.rackName || ''} ${item.rack.shelfCode || ''}` : ''}
                          </Text>
                          <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
                        </View>

                        {role === 'ADMIN' ? (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.outlineEditBtn}
                              onPress={() => {
                                setEditProdModal(item);
                                setEditProdName(item.name);
                                setEditProdPrice(String(item.sellingPrice));
                                setEditProdStock(String(item.stockQuantity));
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="create-outline" size={14} color="#0284c7" style={{ marginRight: 2 }} />
                              <Text style={styles.outlineEditBtnText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.outlineDeleteBtn}
                              onPress={() => handleDeleteProduct(item.id, item.name)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={14} color="#dc2626" style={{ marginRight: 2 }} />
                              <Text style={styles.outlineDeleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, color: '#475569', fontWeight: 'bold' }}>Stock Check</Text>
                          </View>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            )}


            {/* SCREEN 4: INVOICES / BILLS */}
            {activeTab === 'invoices' && (
              <View style={styles.flexScreen}>
                <View style={styles.searchBarWrapper}>
                  <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInputFlex}
                    placeholder="Search bill # or customer name..."
                    placeholderTextColor="#94a3b8"
                    value={invoiceSearch}
                    onChangeText={setInvoiceSearch}
                  />
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8, maxHeight: 36 }}>
                  {['ALL', 'CASH', 'UPI', 'CREDIT'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.filterChip, invoiceFilter === m && styles.filterChipActive]}
                      onPress={() => setInvoiceFilter(m)}
                    >
                      <Text style={[styles.filterChipText, invoiceFilter === m && styles.filterChipTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FlatList
                  data={filteredInvoices}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No bills found.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.invoiceCard}>
                      <View style={styles.invRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invNo}>#{item.invoiceNo}</Text>
                          <Text style={styles.invCust}>{item.customerName || 'Walk-in Customer'}</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                            {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.invAmount}>
                            ₹{item.totalAmount?.toLocaleString('en-IN')}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            <View style={styles.methodBadge}>
                              <Text style={styles.methodBadgeText}>{item.paymentMethod || 'CASH'}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.pdfActionBtn}
                              onPress={() => handleGeneratePDF(item)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="document-text-outline" size={12} color="#059669" style={{ marginRight: 2 }} />
                              <Text style={styles.pdfActionBtnText}>PDF / Share</Text>
                            </TouchableOpacity>

                            {role === 'ADMIN' && (
                              <TouchableOpacity
                                style={styles.outlineDeleteBtn}
                                onPress={() => handleDeleteInvoice(item.id, item.invoiceNo)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={12} color="#dc2626" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}

            {/* SCREEN 5: CUSTOMERS & UDHAR BALANCES */}
            {activeTab === 'customers' && (
              <View style={styles.flexScreen}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <View style={styles.searchBarWrapper}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.searchInputFlex}
                      placeholder="Search customer name or phone..."
                      placeholderTextColor="#94a3b8"
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.addPrimaryBtn}
                    onPress={() => setAddCustModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 2 }} />
                    <Text style={styles.addPrimaryBtnText}>Customer</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.filterPill, customerFilter === 'ALL' && styles.filterPillActive]}
                    onPress={() => setCustomerFilter('ALL')}
                  >
                    <Text style={[styles.filterPillText, customerFilter === 'ALL' && styles.filterPillTextActive]}>
                      All Accounts ({customers.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterPill, customerFilter === 'UDHAR' && styles.filterPillAlertActive]}
                    onPress={() => setCustomerFilter('UDHAR')}
                  >
                    <Ionicons name="wallet-outline" size={12} color={customerFilter === 'UDHAR' ? '#ffffff' : '#d97706'} style={{ marginRight: 4 }} />
                    <Text style={[styles.filterPillText, customerFilter === 'UDHAR' ? { color: '#ffffff' } : { color: '#d97706' }]}>
                      Udhar Due ({customers.filter((c) => (c.outstanding || 0) > 0).length})
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No customer accounts found.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.customerCard}>
                      <View style={styles.invRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invNo}>{item.name}</Text>
                          <TouchableOpacity
                            onPress={() => handleCallCustomer(item.phone)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                          >
                            <Ionicons name="call-outline" size={12} color="#0284c7" />
                            <Text style={[styles.invCust, { color: '#0284c7' }]}>{item.phone || 'N/A'}</Text>
                          </TouchableOpacity>
                          {item.address ? (
                            <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{item.address}</Text>
                          ) : null}
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.invAmount, { color: item.outstanding > 0 ? '#d97706' : '#059669' }]}>
                            Udhar: ₹{(item.outstanding || 0).toLocaleString('en-IN')}
                          </Text>

                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            {item.outstanding > 0 && (
                              <TouchableOpacity
                                style={styles.collectPayBtn}
                                onPress={() => {
                                  setPayCustModal(item);
                                  setPayAmount(String(item.outstanding));
                                }}
                              >
                                <Ionicons name="cash-outline" size={12} color="#ffffff" style={{ marginRight: 2 }} />
                                <Text style={styles.collectPayBtnText}>Collect ₹</Text>
                              </TouchableOpacity>
                            )}

                            {role === 'ADMIN' && (
                              <>
                                <TouchableOpacity
                                  style={styles.outlineEditBtn}
                                  onPress={() => {
                                    setEditCustModal(item);
                                    setEditCustName(item.name);
                                    setEditCustPhone(item.phone || '');
                                    setEditCustAddress(item.address || '');
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="create-outline" size={12} color="#0284c7" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.outlineDeleteBtn}
                                  onPress={() => handleDeleteCustomer(item.id, item.name)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="trash-outline" size={12} color="#dc2626" />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}

            {/* SCREEN 6: STORE SETTINGS (Admin Only) */}
            {activeTab === 'settings' && role === 'ADMIN' && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flexScreen}
              >
                <ScrollView
                  style={styles.scrollScreen}
                  contentContainerStyle={{ paddingBottom: 30 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.sectionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Ionicons name="storefront-outline" size={18} color="#059669" />
                      <Text style={styles.sectionTitle}>Store Profile Settings</Text>
                    </View>

                    <Text style={styles.inputLabel}>Store Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={settings.shopName}
                      onChangeText={(txt) => setSettings({ ...settings, shopName: txt })}
                    />

                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="phone-pad"
                      value={settings.phone}
                      onChangeText={(txt) => setSettings({ ...settings, phone: txt })}
                    />

                    <Text style={styles.inputLabel}>Store Address</Text>
                    <TextInput
                      style={styles.formInput}
                      value={settings.address}
                      onChangeText={(txt) => setSettings({ ...settings, address: txt })}
                    />

                    <Text style={styles.inputLabel}>Default GST Rate (%)</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={String(settings.defaultGstPercent || 18)}
                      onChangeText={(txt) => setSettings({ ...settings, defaultGstPercent: parseFloat(txt) || 0 })}
                    />

                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveSettings}
                      disabled={savingSettings}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="save-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>
                        {savingSettings ? 'Saving Settings...' : 'Save Store Profile'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sectionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Ionicons name="key-outline" size={18} color="#1e293b" />
                      <Text style={styles.sectionTitle}>Security PIN Management</Text>
                    </View>
                    <Text style={styles.inputLabel}>Update {role} 4-Digit Security PIN</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="Enter new 4-digit PIN..."
                      placeholderTextColor="#94a3b8"
                      value={newPinInput}
                      onChangeText={setNewPinInput}
                    />
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#1e293b' }]}
                      onPress={handleUpdatePin}
                      disabled={updatingPin}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>
                        {updatingPin ? 'Updating Security PIN...' : 'Update Security PIN'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            )}
          </>
        )}
      </View>

      {/* Responsive Elevated Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: Platform.OS === 'ios' ? 20 : 28, minHeight: Platform.OS === 'ios' ? 68 : 74 }]}>
        {role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'dashboard' && styles.activeTab]}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.7}
          >
            <View style={[styles.activePillIndicator, activeTab === 'dashboard' && styles.activePillVisible]} />
            <Ionicons
              name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={18}
              color={activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8'}
              style={{ marginBottom: 2 }}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.navText,
                isSmallScreen && { fontSize: 8.5 },
                activeTab === 'dashboard' && styles.activeNavText,
              ]}
            >
              {isSmallScreen ? 'Dash' : 'Dashboard'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'pos' && styles.activeTab]}
          onPress={() => setActiveTab('pos')}
          activeOpacity={0.7}
        >
          <View style={[styles.activePillIndicator, activeTab === 'pos' && styles.activePillVisible]} />
          <Ionicons
            name={activeTab === 'pos' ? 'cart' : 'cart-outline'}
            size={18}
            color={activeTab === 'pos' ? '#38bdf8' : '#94a3b8'}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navText,
              isSmallScreen && { fontSize: 8.5 },
              activeTab === 'pos' && styles.activeNavText,
            ]}
          >
            {isSmallScreen ? 'POS' : 'POS Bill'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
          activeOpacity={0.7}
        >
          <View style={[styles.activePillIndicator, activeTab === 'inventory' && styles.activePillVisible]} />
          <Ionicons
            name={activeTab === 'inventory' ? 'cube' : 'cube-outline'}
            size={18}
            color={activeTab === 'inventory' ? '#38bdf8' : '#94a3b8'}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navText,
              isSmallScreen && { fontSize: 8.5 },
              activeTab === 'inventory' && styles.activeNavText,
            ]}
          >
            Inventory
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.navTab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
          activeOpacity={0.7}
        >
          <View style={[styles.activePillIndicator, activeTab === 'invoices' && styles.activePillVisible]} />
          <Ionicons
            name={activeTab === 'invoices' ? 'receipt' : 'receipt-outline'}
            size={18}
            color={activeTab === 'invoices' ? '#38bdf8' : '#94a3b8'}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navText,
              isSmallScreen && { fontSize: 8.5 },
              activeTab === 'invoices' && styles.activeNavText,
            ]}
          >
            Bills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
          activeOpacity={0.7}
        >
          <View style={[styles.activePillIndicator, activeTab === 'customers' && styles.activePillVisible]} />
          <Ionicons
            name={activeTab === 'customers' ? 'people' : 'people-outline'}
            size={18}
            color={activeTab === 'customers' ? '#38bdf8' : '#94a3b8'}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navText,
              isSmallScreen && { fontSize: 8.5 },
              activeTab === 'customers' && styles.activeNavText,
            ]}
          >
            Udhar
          </Text>
        </TouchableOpacity>

        {role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.activePillIndicator, activeTab === 'settings' && styles.activePillVisible]} />
            <Ionicons
              name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
              size={18}
              color={activeTab === 'settings' ? '#38bdf8' : '#94a3b8'}
              style={{ marginBottom: 2 }}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.navText,
                isSmallScreen && { fontSize: 8.5 },
                activeTab === 'settings' && styles.activeNavText,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Receipt Modal */}
      {receiptModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" style={{ alignSelf: 'center', marginBottom: 8 }} />
              <Text style={styles.modalTitle}>Bill Generated Successfully!</Text>
              <Text style={styles.modalInvNo}>Invoice #{receiptModal.invoiceNo}</Text>
              <Text style={styles.modalTotal}>
                Total Amount: ₹{(receiptModal.totalAmount || 0).toLocaleString('en-IN')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={() => handleGeneratePDF(receiptModal)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.closeBtnText}>PDF / Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#1e293b', flex: 1 }]}
                  onPress={() => setReceiptModal(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Product Modal */}
      {addProductModalVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { color: '#0f172a', textAlign: 'left' }]}>Add New Product</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Product Name (e.g., 2.5sqmm Wire)"
                placeholderTextColor="#94a3b8"
                value={newProdName}
                onChangeText={setNewProdName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Selling Price (₹)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={newProdPrice}
                onChangeText={setNewProdPrice}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Purchase Price (₹, optional)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={newProdPurchasePrice}
                onChangeText={setNewProdPurchasePrice}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Initial Stock Quantity"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={newProdStock}
                onChangeText={setNewProdStock}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#94a3b8', flex: 1 }]}
                  onPress={() => setAddProductModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={handleCreateProduct}
                  disabled={savingProd}
                >
                  <Text style={styles.closeBtnText}>{savingProd ? 'Adding...' : 'Save Product'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {editProdModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { color: '#0f172a', textAlign: 'left' }]}>Edit Product</Text>

              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editProdName}
                onChangeText={setEditProdName}
              />

              <Text style={styles.inputLabel}>Selling Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editProdPrice}
                onChangeText={setEditProdPrice}
              />

              <Text style={styles.inputLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editProdStock}
                onChangeText={setEditProdStock}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#94a3b8', flex: 1 }]}
                  onPress={() => setEditProdModal(null)}
                >
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={handleUpdateProduct}
                  disabled={updatingProd}
                >
                  <Text style={styles.closeBtnText}>{updatingProd ? 'Updating...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Customer Modal */}
      {addCustModalVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { color: '#0f172a', textAlign: 'left' }]}>Add New Customer Profile</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Customer Name"
                placeholderTextColor="#94a3b8"
                value={newCustName}
                onChangeText={setNewCustName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={newCustPhone}
                onChangeText={setNewCustPhone}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Address / Location (optional)"
                placeholderTextColor="#94a3b8"
                value={newCustAddress}
                onChangeText={setNewCustAddress}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#94a3b8', flex: 1 }]}
                  onPress={() => setAddCustModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={handleCreateCustomer}
                  disabled={savingCust}
                >
                  <Text style={styles.closeBtnText}>{savingCust ? 'Saving...' : 'Save Customer'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Customer Modal */}
      {editCustModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { color: '#0f172a', textAlign: 'left' }]}>Edit Customer Profile</Text>

              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editCustName}
                onChangeText={setEditCustName}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="phone-pad"
                value={editCustPhone}
                onChangeText={setEditCustPhone}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.modalInput}
                value={editCustAddress}
                onChangeText={setEditCustAddress}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#94a3b8', flex: 1 }]}
                  onPress={() => setEditCustModal(null)}
                >
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={handleUpdateCustomer}
                  disabled={updatingCust}
                >
                  <Text style={styles.closeBtnText}>{updatingCust ? 'Updating...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Collect Udhar Payment Modal */}
      {payCustModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { color: '#0f172a', textAlign: 'left' }]}>Collect Payment</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginVertical: 4 }}>
                Customer: {payCustModal.name} (Total Udhar: ₹{payCustModal.outstanding})
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Payment Amount (₹)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#94a3b8', flex: 1 }]}
                  onPress={() => setPayCustModal(null)}
                >
                  <Text style={styles.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: '#d97706', flex: 1 }]}
                  onPress={handleRecordPayment}
                  disabled={recordingPay}
                >
                  <Text style={styles.closeBtnText}>{recordingPay ? 'Processing...' : 'Record Payment'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // PIN Security Lock Screen Styles
  pinContainer: { flex: 1, backgroundColor: '#0f172a' },
  pinScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  pinHeader: { alignItems: 'center', marginBottom: 20 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  headerLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#38bdf8',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },

  pinBrandTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  pinBrandSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  pinCard: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  pinTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  pinSubtitle: { color: '#64748b', fontSize: 12, marginTop: 4, marginBottom: 16 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#475569', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#10b981', borderColor: '#34d399' },
  dotError: { borderColor: '#ef4444', backgroundColor: '#991b1b' },
  hintText: { color: '#64748b', fontSize: 11, marginBottom: 16 },
  errorText: { color: '#f87171', fontSize: 11, marginBottom: 16, fontWeight: 'bold', textAlign: 'center' },
  keypadGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  keypadBtn: {
    width: '30%',
    minHeight: 52,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionKeypadBtn: { backgroundColor: '#334155' },
  keypadDigit: { color: '#f8fafc', fontSize: 22, fontWeight: 'bold' },
  actionKeypadText: { color: '#cbd5e1', fontSize: 13, fontWeight: 'bold' },
  pinFooterNote: { color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 20 },

  // App Main Header
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandContainer: { flex: 1, marginRight: 8 },
  brandTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold' },
  brandSubtitle: { color: '#94a3b8', fontSize: 11 },
  roleBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  lockBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  // Screen Layouts
  body: { flex: 1, padding: 12 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 12, color: '#64748b' },
  scrollScreen: { flex: 1 },
  flexScreen: { flex: 1 },
  emptyContainer: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#64748b', fontSize: 13, marginTop: 8 },

  // Dashboard Styles
  todayCard: { backgroundColor: '#064e3b', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardHeaderTitle: { color: '#a7f3d0', fontSize: 13, fontWeight: 'bold' },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  profitBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 8 },
  profitBoxLabel: { color: '#6ee7b7', fontSize: 9, fontWeight: 'bold' },
  profitBoxVal: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  shortcutRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  shortcutBtn: { flex: 1, backgroundColor: '#ffffff', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  shortcutIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  shortcutText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  sectionCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  bigValText: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  subText: { fontSize: 11, color: '#059669', marginTop: 4, fontWeight: 'bold' },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#ffffff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  kpiLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  kpiVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },


  // Search & Filters
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInputFlex: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterPillAlertActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
  filterPillText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  filterPillTextActive: { color: '#ffffff', fontWeight: 'bold' },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#ffffff', fontWeight: 'bold' },

  // Product & Inventory Cards
  productCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  productSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#059669', marginTop: 4 },
  lowStockBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a' },
  lowStockBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#d97706' },

  // Cart Actions
  cartActionRow: { alignItems: 'flex-end' },
  addCartBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  addCartBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyNum: { paddingHorizontal: 8, fontSize: 13, fontWeight: 'bold', color: '#0f172a' },

  // Sticky Cart Footer Bar
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartCountText: { fontSize: 11, color: '#64748b' },
  cartTotalText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  payMethodGroup: { flexDirection: 'row', gap: 4 },
  payChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  payChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  payChipText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  payChipTextActive: { color: '#ffffff' },
  checkoutBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  checkoutBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // Cards (Invoices / Customers)
  invoiceCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  invRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invNo: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  invAmount: { fontSize: 13, fontWeight: '800', color: '#059669' },
  invCust: { fontSize: 11, color: '#64748b' },
  methodBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  methodBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },

  // Form Controls
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginTop: 10 },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
  },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // Elevated Bottom Navigation Bar
  bottomNav: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    minHeight: 62,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  navTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    position: 'relative',
  },
  activeTab: { backgroundColor: 'rgba(30, 41, 59, 0.7)' },
  activePillIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activePillVisible: {
    backgroundColor: '#38bdf8',
  },
  navText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  activeNavText: { color: '#38bdf8', fontWeight: 'bold' },

  // Modal Dialog
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 380, padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#059669', textAlign: 'center', marginBottom: 8 },
  modalInvNo: { fontSize: 13, color: '#475569', marginVertical: 6, textAlign: 'center' },
  modalTotal: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginTop: 8,
    width: '100%',
  },
  closeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // Action Buttons
  addPrimaryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 42,
  },
  addPrimaryBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  collectPayBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectPayBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },

  outlineEditBtn: {
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlineEditBtnText: { color: '#0284c7', fontWeight: 'bold', fontSize: 11 },
  outlineDeleteBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlineDeleteBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 11 },
  pdfActionBtn: {
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfActionBtnText: { color: '#059669', fontWeight: 'bold', fontSize: 10 },
});
