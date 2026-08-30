// Viksat Data Solutions - Bill Generator & Payment Ledger Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // SECURITY & LOGIN PASSCODE GATEKEEPER LOGIC
  const DEFAULT_APP_PIN = '9002';
  const loginGateway = document.getElementById('login-gateway');
  const formLoginPasscode = document.getElementById('form-login-passcode');
  const inputLoginPasscode = document.getElementById('input-login-passcode');
  const btnToggleLoginPasscode = document.getElementById('btn-toggle-login-passcode');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnLockApp = document.getElementById('btn-lock-app');

  // Check login state
  function checkLoginState() {
    const isUnlocked = sessionStorage.getItem('viksat_unlocked_v1') === 'true';
    if (isUnlocked) {
      loginGateway.classList.add('hidden');
    } else {
      loginGateway.classList.remove('hidden');
      if (inputLoginPasscode) inputLoginPasscode.focus();
    }
  }

  if (btnToggleLoginPasscode) {
    btnToggleLoginPasscode.addEventListener('click', () => {
      if (inputLoginPasscode.type === 'password') {
        inputLoginPasscode.type = 'text';
        btnToggleLoginPasscode.innerHTML = `<i class="fa-solid fa-eye-slash"></i>`;
      } else {
        inputLoginPasscode.type = 'password';
        btnToggleLoginPasscode.innerHTML = `<i class="fa-solid fa-eye"></i>`;
      }
    });
  }

  if (formLoginPasscode) {
    formLoginPasscode.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = inputLoginPasscode.value.trim();
      const savedPin = localStorage.getItem('viksat_custom_pin') || DEFAULT_APP_PIN;

      if (entered === savedPin) {
        sessionStorage.setItem('viksat_unlocked_v1', 'true');
        loginErrorMsg.classList.add('hidden');
        loginGateway.classList.add('hidden');
        inputLoginPasscode.value = '';
      } else {
        loginErrorMsg.classList.remove('hidden');
        inputLoginPasscode.classList.add('border-red-500');
        setTimeout(() => {
          inputLoginPasscode.classList.remove('border-red-500');
        }, 1500);
      }
    });
  }

  if (btnLockApp) {
    btnLockApp.addEventListener('click', () => {
      sessionStorage.removeItem('viksat_unlocked_v1');
      checkLoginState();
    });
  }

  checkLoginState();

  // Today's Date Helper
  function getTodayFormattedDate() {
    const today = new Date();
    const day = today.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Initial State Management
  let items = [
    { id: 1, description: '', qty: 1, rate: 0 }
  ];

  const defaultNotesText = `Payment due within 15 days of invoice date.
Please make payments directly to the payment details listed above.
Payments are non-refundable.
All Cheques / Drafts shall be made in favour of M/s VIKSAT DATA SOLUTION.
All disputes are subject to Kharar jurisdiction.`;

  // Bank Account Presets
  let bankPresets = [
    { 
      id: 'bank_icici', 
      name: 'VIKSAT DATA SOLUTIONS (ICICI Bank)', 
      accName: 'VIKSAT DATA SOLUTIONS', 
      bankName: 'ICICI Bank', 
      accNo: '079105003448', 
      ifsc: 'ICIC0000791'
    },
    { 
      id: 'bank_axis', 
      name: 'Manpreet Singh (Axis Bank)', 
      accName: 'Manpreet Singh', 
      bankName: 'Axis Bank (Savings A/c)', 
      accNo: '921010050314073', 
      ifsc: 'UTIB0002804'
    }
  ];

  // UPI Presets
  let upiPresets = [
    {
      id: 'upi_icici_official',
      name: 'VIKSAT DATA SOLUTIONS - ICICI UPI (viksatdatasolutions.eazypay@icici)',
      accName: 'VIKSAT DATA SOLUTIONS',
      upiId: 'viksatdatasolutions.eazypay@icici',
      phone: '',
      qrImg: 'icici_viksat_qr.jpg'
    },
    {
      id: 'upi_manpreet_gpay',
      name: 'Manpreet Singh - Google Pay (manu.viksat-1@okaxis)',
      accName: 'Manpreet Singh',
      upiId: 'manu.viksat-1@okaxis',
      phone: '',
      qrImg: 'gpay_manpreet_qr.jpg'
    },
    {
      id: 'upi_axis',
      name: 'Manpreet Singh - Axis UPI (mani.6239774244@axisbank)',
      accName: 'Manpreet Singh',
      upiId: 'mani.6239774244@axisbank',
      phone: '',
      qrImg: 'axis_manpreet_qr.jpg'
    },
    {
      id: 'upi_kuldip_paytm',
      name: 'Kuldip Singh - Paytm UPI (9803059002@ptsbi)',
      accName: 'KULDIP SINGH S/O JAGAN NATH',
      upiId: '9803059002@ptsbi',
      phone: '9803059002',
      qrImg: 'paytm_kuldip_qr.jpg'
    },
    {
      id: 'upi_kuldip_gpay',
      name: 'Kuldeep Singh - Google Pay (reshudeep2k@okicici)',
      accName: 'Kuldeep Singh',
      upiId: 'reshudeep2k@okicici',
      phone: '',
      qrImg: 'gpay_kuldip_qr.jpg'
    }
  ];

  // SAVED CLIENT DIRECTORY PRESETS
  let clientDirectory = JSON.parse(localStorage.getItem('viksat_client_directory_v1')) || [
    {
      id: 'client_dav_kalanaur',
      name: 'JIYA LAL MITTAL DAV PUBLIC SCHOOL',
      address: 'Kalanaur Road, Gurdaspur',
      phone: '9417700374',
      gst: ''
    }
  ];

  let activePaymentMethod = 'bank';
  let currentUpiQrP2 = 'icici_viksat_qr.jpg';
  let currentCalculatedGrandTotal = 0;

  // INTERNAL PAYMENT LEDGER RECORDS (PRIVATE STORED IN LOCALSTORAGE)
  let ledgerRecords = JSON.parse(localStorage.getItem('viksat_payment_ledger_v1')) || [];

  // ==================== PAGE NAVIGATION SWITCHER ====================
  const tabNavGenerator = document.getElementById('tab-nav-generator');
  const tabNavLedger = document.getElementById('tab-nav-ledger');
  const viewGeneratorPage = document.getElementById('view-generator-page');
  const viewLedgerPage = document.getElementById('view-ledger-page');

  tabNavGenerator.addEventListener('click', () => {
    tabNavGenerator.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow';
    tabNavLedger.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700';
    
    viewGeneratorPage.classList.remove('hidden');
    viewLedgerPage.classList.add('hidden');
  });

  tabNavLedger.addEventListener('click', () => {
    tabNavLedger.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-amber-500 text-slate-950 shadow';
    tabNavGenerator.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700';

    viewLedgerPage.classList.remove('hidden');
    viewGeneratorPage.classList.add('hidden');
    renderLedgerPortal();
  });

  // Accordion Expand/Collapse Handlers
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('button')?.id === 'btn-add-item' || e.target.closest('button')?.id === 'btn-save-client-preset') {
        return;
      }

      const targetId = header.dataset.target;
      if (targetId) {
        const container = document.getElementById(targetId);
        const icon = header.querySelector('.fa-chevron-down');

        if (container) {
          container.classList.toggle('hidden');
          if (icon) {
            if (container.classList.contains('hidden')) {
              icon.classList.remove('rotate-180');
            } else {
              icon.classList.add('rotate-180');
            }
          }
        }
      }
    });
  });

  // DOM Elements - Inputs
  const inputDocType = document.getElementById('input-doc-type');
  const inputDocNo = document.getElementById('input-doc-no');
  const inputDocDate = document.getElementById('input-doc-date');
  const inputDocPlace = document.getElementById('input-doc-place');
  const inputCompanyPhone1 = document.getElementById('input-company-phone-1');
  const inputCompanyPhone2 = document.getElementById('input-company-phone-2');
  
  const selectSavedClient = document.getElementById('select-saved-client');
  const inputClientName = document.getElementById('input-client-name');
  const inputClientAddress = document.getElementById('input-client-address');
  const inputClientPhone = document.getElementById('input-client-phone');
  const inputClientGst = document.getElementById('input-client-gst');
  const btnSaveClientPreset = document.getElementById('btn-save-client-preset');

  const inputTaxRate = document.getElementById('input-tax-rate');
  const inputDiscountAmount = document.getElementById('input-discount-amount');

  // New Buttons
  const btnNewInvoice = document.getElementById('btn-new-invoice');
  const btnWhatsapp = document.getElementById('btn-whatsapp');
  const btnQuickLogLedger = document.getElementById('btn-quick-log-ledger');

  // Payment Method Tabs
  const tabPaymentBank = document.getElementById('tab-payment-bank');
  const tabPaymentUpi = document.getElementById('tab-payment-upi');
  const containerBankSettings = document.getElementById('container-bank-settings');
  const containerUpiSettings = document.getElementById('container-upi-settings');

  // Bank Account Elements
  const selectAccountPreset = document.getElementById('select-account-preset');
  const inputBankName = document.getElementById('input-bank-name');
  const inputBankAccName = document.getElementById('input-bank-acc-name');
  const inputBankAccNo = document.getElementById('input-bank-acc-no');
  const inputBankIfsc = document.getElementById('input-bank-ifsc');
  const btnSaveAccountPreset = document.getElementById('btn-save-account-preset');

  // UPI QR Scanner Elements
  const selectUpiPreset = document.getElementById('select-upi-preset');
  const inputUpiAccName = document.getElementById('input-upi-acc-name');
  const inputUpiId = document.getElementById('input-upi-id');
  const inputUpiPhone = document.getElementById('input-upi-phone');
  const inputQrImageP2 = document.getElementById('input-qr-image-p2');
  const btnClearQrP2 = document.getElementById('btn-clear-qr-p2');

  const inputSigName = document.getElementById('input-sig-name');
  const selectSigTitle = document.getElementById('select-sig-title');
  const inputSigTitleCustom = document.getElementById('input-sig-title-custom');
  const inputNotes = document.getElementById('input-notes');

  const btnAddItem = document.getElementById('btn-add-item');
  const itemsFormContainer = document.getElementById('items-form-container');

  // Previews DOM Elements
  const previewCompanyContacts = document.getElementById('preview-company-contacts');

  // Ledger Page DOM Elements
  const btnLedgerExportCsv = document.getElementById('btn-ledger-export-csv');
  const btnLedgerAddManual = document.getElementById('btn-ledger-add-manual');
  const btnLedgerClearAll = document.getElementById('btn-ledger-clear-all');
  const statTotalInvoiced = document.getElementById('stat-total-invoiced');
  const statTotalReceived = document.getElementById('stat-total-received');
  const statTotalBalance = document.getElementById('stat-total-balance');
  const statTotalCount = document.getElementById('stat-total-count');
  const statStatusSummary = document.getElementById('stat-status-summary');
  const badgePendingCount = document.getElementById('badge-pending-count');

  const inputSearchLedger = document.getElementById('input-search-ledger');
  const selectFilterStatus = document.getElementById('select-filter-status');
  const ledgerTableBody = document.getElementById('ledger-table-body');
  const ledgerEmptyState = document.getElementById('ledger-empty-state');

  // Modal Elements
  const modalLedger = document.getElementById('modal-ledger');
  const modalLedgerTitle = document.getElementById('modal-ledger-title');
  const btnCloseModalLedger = document.getElementById('btn-close-modal-ledger');
  const btnCancelModalLedger = document.getElementById('btn-cancel-modal-ledger');
  const formLedgerRecord = document.getElementById('form-ledger-record');

  const modalRecordId = document.getElementById('modal-record-id');
  const modalClientName = document.getElementById('modal-client-name');
  const modalDocNo = document.getElementById('modal-doc-no');
  const modalDocDate = document.getElementById('modal-doc-date');
  const modalTotalAmount = document.getElementById('modal-total-amount');
  const modalAmountReceived = document.getElementById('modal-amount-received');
  const modalNotes = document.getElementById('modal-notes');

  // ==================== DOCUMENT NUMBER MEMORY LOGIC ====================
  function saveCurrentDocNo(docNo) {
    if (docNo && docNo.trim()) {
      localStorage.setItem('viksat_last_used_doc_no_v1', docNo.trim());
    }
  }

  function getStoredDocNo() {
    return localStorage.getItem('viksat_last_used_doc_no_v1') || 'INV-VDS-2026-052';
  }

  // Restore stored document number on initial load
  inputDocNo.value = getStoredDocNo();
  inputDocNo.addEventListener('input', () => saveCurrentDocNo(inputDocNo.value));

  // ==================== FEATURE 1: WHATSAPP SHARE ====================
  btnWhatsapp.addEventListener('click', () => {
    const cName = (inputClientName.value || 'Client').trim();
    const dNo = (inputDocNo.value || getStoredDocNo()).trim();
    const dDate = (inputDocDate.value || getTodayFormattedDate()).trim();
    const gTotal = formatCurrency(currentCalculatedGrandTotal);

    const messageText = `Hello *${cName}*,\n\nPlease find details for ${inputDocType.value} *${dNo}* dated *${dDate}* from *VIKSAT DATA SOLUTIONS*.\n\n*Grand Total:* ₹${gTotal}\n\n*Bank Payment Details:*\nBank: ICICI Bank\nAccount Name: VIKSAT DATA SOLUTIONS\nAccount No: 079105003448\nIFSC Code: ICIC0000791\n\n*UPI Payment ID:* viksatdatasolutions.eazypay@icici\n\nThank you!`;

    let phone = (inputClientPhone.value || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  });

  // ==================== FEATURE 3: SAVED CLIENT DIRECTORY ====================
  function renderClientDirectoryDropdown() {
    selectSavedClient.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'none';
    defaultOpt.textContent = '✏️ Select a Saved Client or type new details...';
    selectSavedClient.appendChild(defaultOpt);

    clientDirectory.forEach(client => {
      const opt = document.createElement('option');
      opt.value = client.id;
      opt.textContent = `${client.name} (${client.address.split(',')[0]})`;
      selectSavedClient.appendChild(opt);
    });
  }

  selectSavedClient.addEventListener('change', () => {
    const selectedId = selectSavedClient.value;
    if (selectedId === 'none') {
      inputClientName.value = '';
      inputClientAddress.value = '';
      inputClientPhone.value = '';
      inputClientGst.value = '';
    } else {
      const found = clientDirectory.find(c => c.id === selectedId);
      if (found) {
        inputClientName.value = found.name || '';
        inputClientAddress.value = found.address || '';
        inputClientPhone.value = found.phone || '';
        inputClientGst.value = found.gst || '';
      }
    }
    updatePreview();
  });

  btnSaveClientPreset.addEventListener('click', () => {
    const name = inputClientName.value.trim();
    if (!name) {
      alert('Please enter a Client Name before saving.');
      return;
    }

    const newId = 'client_' + Date.now();
    const newClient = {
      id: newId,
      name: name,
      address: inputClientAddress.value.trim(),
      phone: inputClientPhone.value.trim(),
      gst: inputClientGst.value.trim()
    };

    clientDirectory.push(newClient);
    localStorage.setItem('viksat_client_directory_v1', JSON.stringify(clientDirectory));

    renderClientDirectoryDropdown();
    selectSavedClient.value = newId;
    alert(`Client "${name}" saved to your directory!`);
  });

  // ==================== FEATURE 4: NEW INVOICE & AUTO-INCREMENT ====================
  btnNewInvoice.addEventListener('click', () => {
    const currentNo = (inputDocNo.value || getStoredDocNo()).trim();
    const match = currentNo.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
      inputDocNo.value = `${prefix}${nextNum}`;
    } else {
      inputDocNo.value = 'INV-VDS-2026-053';
    }

    saveCurrentDocNo(inputDocNo.value);

    inputDocDate.value = getTodayFormattedDate();
    inputClientName.value = '';
    inputClientAddress.value = '';
    inputClientPhone.value = '';
    inputClientGst.value = '';
    selectSavedClient.value = 'none';

    items = [{ id: 1, description: '', qty: 1, rate: 0 }];
    renderItemsForm();
    updatePreview();
    alert(`Created new blank invoice! Ref No auto-incremented to: ${inputDocNo.value}`);
  });

  // Payment Method Tab Switching Logic
  tabPaymentBank.addEventListener('click', () => {
    activePaymentMethod = 'bank';
    
    tabPaymentBank.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 bg-white text-blue-900 shadow-xs border border-slate-300';
    tabPaymentUpi.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';

    containerBankSettings.classList.remove('hidden');
    containerUpiSettings.classList.add('hidden');
    updatePreview();
  });

  tabPaymentUpi.addEventListener('click', () => {
    activePaymentMethod = 'upi';

    tabPaymentUpi.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 bg-white text-emerald-900 shadow-xs border border-slate-300';
    tabPaymentBank.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';

    containerUpiSettings.classList.remove('hidden');
    containerBankSettings.classList.add('hidden');
    updatePreview();
  });

  // Populate Bank Account Presets Dropdown
  function renderBankPresetsDropdown() {
    selectAccountPreset.innerHTML = '';
    bankPresets.forEach(preset => {
      const opt = document.createElement('option');
      opt.value = preset.id;
      const displayLabel = preset.accName ? `${preset.accName} (${preset.bankName || 'Bank'})` : preset.name;
      opt.textContent = displayLabel;
      selectAccountPreset.appendChild(opt);
    });

    const addOpt = document.createElement('option');
    addOpt.value = 'new';
    addOpt.textContent = '✏️ Add New Bank Account...';
    selectAccountPreset.appendChild(addOpt);

    if (bankPresets.length > 0) {
      selectAccountPreset.value = bankPresets[0].id;
      applyPresetDetails(bankPresets[0]);
    }
  }

  function applyPresetDetails(preset) {
    if (preset.bankName) inputBankName.value = preset.bankName;
    if (preset.accName) inputBankAccName.value = preset.accName;
    if (preset.accNo) inputBankAccNo.value = preset.accNo;
    if (preset.ifsc) inputBankIfsc.value = preset.ifsc || 'ICIC0000791';
  }

  // Populate UPI Presets
  function renderUpiPresetsDropdown() {
    selectUpiPreset.innerHTML = '';
    upiPresets.forEach(preset => {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = preset.name;
      selectUpiPreset.appendChild(opt);
    });

    if (upiPresets.length > 0) {
      selectUpiPreset.value = upiPresets[0].id;
      applyUpiPreset(upiPresets[0]);
    }
  }

  function applyUpiPreset(preset) {
    if (preset.accName) inputUpiAccName.value = preset.accName;
    if (preset.upiId) inputUpiId.value = preset.upiId;
    inputUpiPhone.value = preset.phone || '';
    currentUpiQrP2 = preset.qrImg || null;
    if (currentUpiQrP2) btnClearQrP2.classList.remove('hidden');
    else btnClearQrP2.classList.add('hidden');
  }

  selectUpiPreset.addEventListener('change', () => {
    const selectedId = selectUpiPreset.value;
    const found = upiPresets.find(u => u.id === selectedId);
    if (found) applyUpiPreset(found);
    updatePreview();
  });

  // Upload Custom QR Image
  inputQrImageP2.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentUpiQrP2 = event.target.result;
        btnClearQrP2.classList.remove('hidden');
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  btnClearQrP2.addEventListener('click', () => {
    currentUpiQrP2 = null;
    inputQrImageP2.value = '';
    btnClearQrP2.classList.add('hidden');
    updatePreview();
  });

  // Switch Bank Account Preset
  selectAccountPreset.addEventListener('change', () => {
    const selectedId = selectAccountPreset.value;
    if (selectedId === 'new') {
      inputBankName.value = '';
      inputBankAccName.value = 'Manpreet Singh';
      inputBankAccNo.value = '';
      inputBankIfsc.value = 'UTIB0002804';
      inputBankAccName.focus();
    } else {
      const found = bankPresets.find(p => p.id === selectedId);
      if (found) applyPresetDetails(found);
    }
    updatePreview();
  });

  // Save New Bank Account Preset
  btnSaveAccountPreset.addEventListener('click', () => {
    const accName = inputBankAccName.value.trim() || 'VIKSAT DATA SOLUTIONS';
    const bName = inputBankName.value.trim() || 'Bank';
    const accNo = inputBankAccNo.value.trim();

    if (!accNo) {
      alert('Please enter an Account Number before saving.');
      return;
    }

    const name = `${accName} (${bName})`;
    const newId = 'bank_' + Date.now();
    const newPreset = {
      id: newId,
      name: name,
      bankName: bName,
      accName: accName,
      accNo: accNo,
      ifsc: inputBankIfsc.value.trim() || 'ICIC0000791'
    };

    bankPresets.push(newPreset);
    localStorage.setItem('viksat_bank_presets_v4', JSON.stringify(bankPresets));
    
    renderBankPresetsDropdown();
    selectAccountPreset.value = newId;
    alert(`Bank Account "${name}" saved to your list!`);
  });

  // Defaults
  if (!inputDocDate.value) inputDocDate.value = getTodayFormattedDate();
  if (!inputDocNo.value) inputDocNo.value = getStoredDocNo();
  if (!inputDocPlace.value) inputDocPlace.value = 'Mohali (Punjab)';
  if (!inputNotes.value) inputNotes.value = defaultNotesText;

  // Auto-switch Doc No format
  inputDocType.addEventListener('change', () => {
    const val = inputDocType.value;
    const currNo = inputDocNo.value || getStoredDocNo();
    if (val === 'Tax Invoice' && currNo.startsWith('QTN-')) {
      inputDocNo.value = currNo.replace('QTN-', 'INV-');
    } else if (val === 'Quotation' && currNo.startsWith('INV-')) {
      inputDocNo.value = currNo.replace('INV-', 'QTN-');
    }
    saveCurrentDocNo(inputDocNo.value);
    updatePreview();
  });

  // Previews DOM Elements
  const previewDocType = document.getElementById('preview-doc-type');
  const previewDocNo = document.getElementById('preview-doc-no');
  const previewDocDate = document.getElementById('preview-doc-date');
  const previewDocPlace = document.getElementById('preview-doc-place');
  const previewIssueDate = document.getElementById('preview-issue-date');

  const previewClientName = document.getElementById('preview-client-name');
  const previewClientAddress = document.getElementById('preview-client-address');
  const previewClientPhone = document.getElementById('preview-client-phone');
  const previewClientGst = document.getElementById('preview-client-gst');

  const previewItemsBody = document.getElementById('preview-items-body');
  const previewSubtotal = document.getElementById('preview-subtotal');
  const previewDiscount = document.getElementById('preview-discount');
  const previewTax = document.getElementById('preview-tax');
  const previewGrandTotal = document.getElementById('preview-grand-total');
  const previewAmountWords = document.getElementById('preview-amount-words');
  const previewNotes = document.getElementById('preview-notes');

  const previewPaymentHeader = document.getElementById('preview-payment-header');
  const previewPaymentBadge = document.getElementById('preview-payment-badge');
  const paymentDisplayContainer = document.getElementById('payment-display-container');

  const previewSigName = document.getElementById('preview-sig-name');
  const previewSigTitle = document.getElementById('preview-sig-title');
  const previewSigPlace = document.getElementById('preview-sig-place');
  const previewSigDate = document.getElementById('preview-sig-date');
  const previewFooterDoc = document.getElementById('preview-footer-doc');

  const rowDiscount = document.getElementById('row-discount');
  const rowTax = document.getElementById('row-tax');

  // Actions
  const btnSaveDraft = document.getElementById('btn-save-draft');
  const btnLoadDraft = document.getElementById('btn-load-draft');
  const btnPrint = document.getElementById('btn-print');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');

  selectSigTitle.addEventListener('change', () => {
    if (selectSigTitle.value === 'custom') {
      inputSigTitleCustom.classList.remove('hidden');
      inputSigTitleCustom.focus();
    } else {
      inputSigTitleCustom.classList.add('hidden');
    }
    updatePreview();
  });
  inputSigTitleCustom.addEventListener('input', updatePreview);

  function getSignatoryTitle() {
    if (selectSigTitle.value === 'custom') {
      return inputSigTitleCustom.value.trim() || 'Authorized Signatory';
    }
    return selectSigTitle.value;
  }

  function getCustomFileName() {
    const rawClientName = (inputClientName.value || 'Client').trim();
    const firstName = rawClientName.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '') || 'Client';
    const rawDocNo = (inputDocNo.value || 'document').trim();
    const cleanDocNo = rawDocNo.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${firstName}_${cleanDocNo}`;
  }

  // 1. Render Form Item Inputs
  function renderItemsForm() {
    itemsFormContainer.innerHTML = '';
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-2';
      row.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
          <span class="font-bold text-slate-600">Item #${index + 1}</span>
          <div class="flex items-center space-x-3">
            <button type="button" class="btn-duplicate-item text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1" data-id="${item.id}">
              <i class="fa-solid fa-copy"></i> Duplicate
            </button>
            ${items.length > 1 ? `
              <button type="button" class="btn-delete-item text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1" data-id="${item.id}">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
        </div>
        <div>
          <textarea rows="2" class="input-item-desc w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs" placeholder="Enter description of service or product..." data-id="${item.id}">${escapeHtml(item.description)}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-slate-500">Quantity</label>
            <input type="number" min="1" step="1" class="input-item-qty w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono" value="${item.qty}" data-id="${item.id}">
          </div>
          <div>
            <label class="block text-[10px] text-slate-500">Rate (₹)</label>
            <input type="number" min="0" step="10" class="input-item-rate w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono" value="${item.rate}" data-id="${item.id}">
          </div>
        </div>
      `;
      itemsFormContainer.appendChild(row);
    });

    document.querySelectorAll('.input-item-desc').forEach(el => {
      el.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) item.description = e.target.value;
        updatePreview();
      });
    });

    document.querySelectorAll('.input-item-qty').forEach(el => {
      el.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) item.qty = parseFloat(e.target.value) || 0;
        updatePreview();
      });
    });

    document.querySelectorAll('.input-item-rate').forEach(el => {
      el.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) item.rate = parseFloat(e.target.value) || 0;
        updatePreview();
      });
    });

    document.querySelectorAll('.btn-duplicate-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const itemToClone = items.find(i => i.id === id);
        if (itemToClone) {
          const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
          items.push({
            id: newId,
            description: itemToClone.description,
            qty: itemToClone.qty,
            rate: itemToClone.rate
          });
          renderItemsForm();
          updatePreview();
        }
      });
    });

    document.querySelectorAll('.btn-delete-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        items = items.filter(i => i.id !== id);
        renderItemsForm();
        updatePreview();
      });
    });
  }

  // 2. Add Item Row
  btnAddItem.addEventListener('click', () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push({ id: newId, description: '', qty: 1, rate: 0 });
    renderItemsForm();
    updatePreview();
  });

  // 3. Amount to Words
  function numberToWords(num) {
    if (isNaN(num) || num === 0) return 'Rupees Zero Only';
    
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanThousand(n) {
      if (n === 0) return '';
      if (n < 20) return single[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? single[n % 10] + ' ' : '');
      return single[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertLessThanThousand(n % 100) : '');
    }

    let n = Math.floor(Math.abs(num));
    if (n === 0) return 'Rupees Zero Only';

    let crore = Math.floor(n / 10000000);
    n %= 10000000;
    let lakh = Math.floor(n / 100000);
    n %= 100000;
    let thousand = Math.floor(n / 1000);
    n %= 1000;
    let remainder = n;

    let result = 'Rupees ';
    if (crore > 0) result += convertLessThanThousand(crore) + 'Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + 'Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + 'Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim() + ' Only';
  }

  // 4. Update Preview & Calculate Totals
  function updatePreview() {
    const docType = inputDocType.value;
    const docNo = inputDocNo.value || getStoredDocNo();
    const docDate = inputDocDate.value || getTodayFormattedDate();
    const docPlace = inputDocPlace.value || 'Mohali (Punjab)';

    // Company Phone Contacts Dynamic Header rendering
    const pPhone1 = (inputCompanyPhone1.value || '+91-62397-74244').trim();
    const pPhone2 = (inputCompanyPhone2.value || '').trim();

    if (pPhone2) {
      previewCompanyContacts.textContent = `${pPhone1}, ${pPhone2}`;
    } else {
      previewCompanyContacts.textContent = pPhone1;
    }

    document.title = getCustomFileName();

    previewDocType.textContent = docType;
    previewDocNo.textContent = docNo;
    previewDocDate.textContent = docDate;
    previewDocPlace.textContent = docPlace;
    previewIssueDate.textContent = docDate;

    previewClientName.textContent = inputClientName.value || 'Client Name / Organization';
    previewClientAddress.textContent = inputClientAddress.value || 'Address details';
    
    if (inputClientPhone.value) {
      previewClientPhone.textContent = `Phone: ${inputClientPhone.value}`;
      previewClientPhone.classList.remove('hidden');
    } else {
      previewClientPhone.classList.add('hidden');
    }

    if (inputClientGst.value) {
      previewClientGst.textContent = `GSTIN: ${inputClientGst.value}`;
      previewClientGst.classList.remove('hidden');
    } else {
      previewClientGst.classList.add('hidden');
    }

    // Render Preview Items Table WITH WRAPPING (NO TRUNCATION / NO '...')
    previewItemsBody.innerHTML = '';
    let subtotal = 0;

    items.forEach((item, idx) => {
      const lineAmount = (item.qty || 0) * (item.rate || 0);
      subtotal += lineAmount;

      const tr = document.createElement('tr');
      tr.className = 'item-row border-b border-slate-200';
      const descHtml = escapeHtml(item.description || 'Enter item description').replace(/\n/g, '<br>');
      tr.innerHTML = `
        <td class="py-2 px-2 text-center border-r border-slate-200 align-top">${idx + 1}</td>
        <td class="py-2 px-2.5 border-r border-slate-200 font-medium whitespace-normal break-words leading-snug align-top">${descHtml}</td>
        <td class="py-2 px-2 text-center border-r border-slate-200 font-mono align-top">${item.qty}</td>
        <td class="py-2 px-2 text-right border-r border-slate-200 font-mono align-top">₹${formatCurrency(item.rate)}</td>
        <td class="py-2 px-2 text-right font-mono font-medium align-top">₹${formatCurrency(lineAmount)}</td>
      `;
      previewItemsBody.appendChild(tr);
    });

    const taxRate = parseFloat(inputTaxRate.value) || 0;
    const discount = parseFloat(inputDiscountAmount.value) || 0;

    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const grandTotal = Math.max(0, subtotal - discount + taxAmount);
    currentCalculatedGrandTotal = grandTotal;

    previewSubtotal.textContent = `₹${formatCurrency(subtotal)}`;
    
    if (discount > 0) {
      rowDiscount.classList.remove('hidden');
      previewDiscount.textContent = `- ₹${formatCurrency(discount)}`;
    } else {
      rowDiscount.classList.add('hidden');
    }

    if (taxRate > 0) {
      rowTax.classList.remove('hidden');
      previewTax.textContent = `₹${formatCurrency(taxAmount)} (${taxRate}%)`;
    } else {
      rowTax.classList.add('hidden');
    }

    previewGrandTotal.textContent = `₹${formatCurrency(grandTotal)}`;
    previewAmountWords.textContent = numberToWords(grandTotal);

    // UNIFIED PAYMENT DETAILS BOX (DISPLAY BANK DETAILS OR UPI QR IN EXACT SAME SPOT)
    if (activePaymentMethod === 'bank') {
      const bankName = escapeHtml(inputBankName.value || 'ICICI Bank');
      const accName = escapeHtml(inputBankAccName.value || 'VIKSAT DATA SOLUTIONS');
      const accNo = escapeHtml(inputBankAccNo.value || '079105003448');
      const ifsc = escapeHtml(inputBankIfsc.value || 'ICIC0000791');

      previewPaymentHeader.innerHTML = `<i class="fa-solid fa-building-columns text-blue-600"></i> Bank Payment Details`;
      previewPaymentBadge.textContent = bankName;

      paymentDisplayContainer.innerHTML = `
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] pt-1">
          <div>
            <span class="text-slate-500 block text-[9px]">Account Name:</span>
            <strong class="text-slate-900 font-semibold">${accName}</strong>
          </div>
          <div>
            <span class="text-slate-500 block text-[9px]">Account Number:</span>
            <strong class="text-slate-900 font-mono font-bold">${accNo}</strong>
          </div>
          <div>
            <span class="text-slate-500 block text-[9px]">IFSC Code:</span>
            <strong class="text-slate-900 font-mono font-bold">${ifsc}</strong>
          </div>
          <div>
            <span class="text-slate-500 block text-[9px]">Transfer Mode:</span>
            <strong class="text-slate-800">NEFT / RTGS / IMPS</strong>
          </div>
        </div>
      `;
    } else if (activePaymentMethod === 'upi') {
      const payeeName = escapeHtml(inputUpiAccName.value || 'VIKSAT DATA SOLUTIONS');
      const upiId = escapeHtml(inputUpiId.value || 'viksatdatasolutions.eazypay@icici');
      const upiPhone = escapeHtml(inputUpiPhone.value || '');

      previewPaymentHeader.innerHTML = `<i class="fa-solid fa-qrcode text-emerald-600"></i> UPI & QR Payment Details`;
      previewPaymentBadge.textContent = 'Scan & Pay';

      paymentDisplayContainer.innerHTML = `
        <div class="flex items-center justify-between gap-2 pt-1">
          <div class="space-y-1 text-[10px] flex-1">
            <div class="flex items-center gap-3">
              <div>
                <span class="text-slate-500 block text-[8.5px]">Account Payee:</span>
                <strong class="text-slate-900 font-bold text-[10.5px] block truncate">${payeeName}</strong>
              </div>
              ${upiPhone ? `
                <div class="pl-2 border-l border-slate-300">
                  <span class="text-slate-500 block text-[8.5px]">Phone / GPay:</span>
                  <strong class="text-slate-900 font-mono font-bold text-[10px] block truncate">${upiPhone}</strong>
                </div>
              ` : ''}
            </div>
            <div>
              <span class="text-slate-500 block text-[8.5px]">UPI ID / VPA:</span>
              <strong class="text-blue-700 font-mono font-bold text-[10px] inline-block truncate bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">${upiId}</strong>
            </div>
          </div>
          ${currentUpiQrP2 ? `
            <div class="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-300 rounded p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <img src="${currentUpiQrP2}" alt="UPI QR Scanner" class="w-full h-full object-contain">
            </div>
          ` : ''}
        </div>
      `;
    }

    previewSigName.textContent = inputSigName.value || 'Manpreet Singh';
    previewSigTitle.textContent = getSignatoryTitle();
    previewSigPlace.textContent = docPlace;
    previewSigDate.textContent = docDate;

    const rawNotes = inputNotes.value || defaultNotesText;
    const lines = rawNotes.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    previewNotes.innerHTML = lines.map(line => `<li>${escapeHtml(line)}</li>`).join('');

    const docLabel = docType === 'Quotation' ? 'Quotation No.' : 'Invoice No.';
    previewFooterDoc.textContent = `${docLabel} ${docNo}`;

    updatePendingBadge();
  }

  function formatCurrency(val) {
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Input Listeners
  [inputDocType, inputDocNo, inputDocDate, inputDocPlace, inputCompanyPhone1, inputCompanyPhone2, inputClientName, inputClientAddress, inputClientPhone, inputClientGst, inputTaxRate, inputDiscountAmount, inputBankName, inputBankAccName, inputBankAccNo, inputBankIfsc, inputUpiAccName, inputUpiId, inputUpiPhone, inputSigName, inputNotes].forEach(el => {
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });


  // ==================== INTERNAL PAYMENT LEDGER LOGIC & FEATURE 2: EXPORT CSV ====================
  function saveLedgerState() {
    localStorage.setItem('viksat_payment_ledger_v1', JSON.stringify(ledgerRecords));
    updatePendingBadge();
  }

  function updatePendingBadge() {
    const pendingCount = ledgerRecords.filter(r => (r.totalAmount - r.amountReceived) > 0).length;
    if (badgePendingCount) {
      badgePendingCount.textContent = pendingCount;
      if (pendingCount > 0) {
        badgePendingCount.classList.remove('hidden');
      } else {
        badgePendingCount.classList.add('hidden');
      }
    }
  }

  // Export Ledger to CSV
  btnLedgerExportCsv.addEventListener('click', () => {
    if (ledgerRecords.length === 0) {
      alert('No ledger records to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"Client Name","Invoice No","Invoice Date","Total Amount (INR)","Amount Received (INR)","Balance Due (INR)","Status","Notes"\n`;

    ledgerRecords.forEach(r => {
      const bal = (r.totalAmount || 0) - (r.amountReceived || 0);
      const status = bal <= 0 ? 'Paid in Full' : 'Pending Balance';
      const row = [
        `"${r.clientName.replace(/"/g, '""')}"`,
        `"${r.docNo}"`,
        `"${r.docDate}"`,
        r.totalAmount || 0,
        r.amountReceived || 0,
        Math.max(0, bal),
        `"${status}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Viksat_Payment_Ledger_${getTodayFormattedDate().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Quick Log Current Invoice to Ledger
  btnQuickLogLedger.addEventListener('click', () => {
    const clientName = (inputClientName.value || 'Client Name').trim();
    const docNo = (inputDocNo.value || getStoredDocNo()).trim();
    const docDate = (inputDocDate.value || getTodayFormattedDate()).trim();
    const totalAmount = currentCalculatedGrandTotal;

    const existingIndex = ledgerRecords.findIndex(r => r.docNo === docNo);
    if (existingIndex >= 0) {
      openLedgerModal(ledgerRecords[existingIndex]);
    } else {
      openLedgerModal({
        id: 'led_' + Date.now(),
        clientName: clientName,
        docNo: docNo,
        docDate: docDate,
        totalAmount: totalAmount,
        amountReceived: 0,
        notes: 'Imported from Invoice Generator'
      });
    }
  });

  btnLedgerAddManual.addEventListener('click', () => {
    openLedgerModal({
      id: 'led_' + Date.now(),
      clientName: '',
      docNo: getStoredDocNo(),
      docDate: getTodayFormattedDate(),
      totalAmount: 0,
      amountReceived: 0,
      notes: ''
    });
  });

  btnLedgerClearAll.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear ALL payment ledger records? This cannot be undone.')) {
      ledgerRecords = [];
      saveLedgerState();
      renderLedgerPortal();
    }
  });

  function openLedgerModal(record) {
    modalRecordId.value = record.id || ('led_' + Date.now());
    modalClientName.value = record.clientName || '';
    modalDocNo.value = record.docNo || getStoredDocNo();
    modalDocDate.value = record.docDate || getTodayFormattedDate();
    modalTotalAmount.value = record.totalAmount || 0;
    modalAmountReceived.value = record.amountReceived || 0;
    modalNotes.value = record.notes || '';

    if (record.clientName) {
      modalLedgerTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i> Update Ledger Entry (${record.docNo})`;
    } else {
      modalLedgerTitle.innerHTML = `<i class="fa-solid fa-plus-circle text-amber-500"></i> Log New Ledger Entry`;
    }

    modalLedger.classList.remove('hidden');
    modalClientName.focus();
  }

  function closeLedgerModal() {
    modalLedger.classList.add('hidden');
  }

  btnCloseModalLedger.addEventListener('click', closeLedgerModal);
  btnCancelModalLedger.addEventListener('click', closeLedgerModal);

  formLedgerRecord.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = modalRecordId.value;
    const clientName = modalClientName.value.trim() || 'Client';
    const docNo = modalDocNo.value.trim() || getStoredDocNo();
    const docDate = modalDocDate.value.trim() || getTodayFormattedDate();
    const totalAmount = parseFloat(modalTotalAmount.value) || 0;
    const amountReceived = parseFloat(modalAmountReceived.value) || 0;
    const notes = modalNotes.value.trim();

    const existingIdx = ledgerRecords.findIndex(r => r.id === id);
    const newRecord = {
      id: id,
      clientName: clientName,
      docNo: docNo,
      docDate: docDate,
      totalAmount: totalAmount,
      amountReceived: amountReceived,
      notes: notes,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      ledgerRecords[existingIdx] = newRecord;
    } else {
      ledgerRecords.unshift(newRecord);
    }

    saveLedgerState();
    closeLedgerModal();
    renderLedgerPortal();
  });

  inputSearchLedger.addEventListener('input', renderLedgerPortal);
  selectFilterStatus.addEventListener('change', renderLedgerPortal);

  function renderLedgerPortal() {
    let grandInvoiced = 0;
    let grandReceived = 0;
    let grandBalance = 0;
    let paidCount = 0;
    let pendingCount = 0;

    ledgerRecords.forEach(r => {
      grandInvoiced += r.totalAmount || 0;
      grandReceived += r.amountReceived || 0;
      const bal = (r.totalAmount || 0) - (r.amountReceived || 0);
      if (bal > 0) {
        grandBalance += bal;
        pendingCount++;
      } else {
        paidCount++;
      }
    });

    statTotalInvoiced.textContent = `₹${formatCurrency(grandInvoiced)}`;
    statTotalReceived.textContent = `₹${formatCurrency(grandReceived)}`;
    statTotalBalance.textContent = `₹${formatCurrency(grandBalance)}`;
    statTotalCount.textContent = `${ledgerRecords.length} Invoice Record${ledgerRecords.length === 1 ? '' : 's'}`;
    
    statStatusSummary.innerHTML = `
      <span class="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">${paidCount} Paid</span>
      <span class="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">${pendingCount} Pending</span>
    `;

    // Filter Records
    const query = (inputSearchLedger.value || '').toLowerCase().trim();
    const filterStatus = selectFilterStatus.value;

    const filtered = ledgerRecords.filter(r => {
      const matchSearch = r.clientName.toLowerCase().includes(query) || r.docNo.toLowerCase().includes(query) || (r.notes || '').toLowerCase().includes(query);
      const bal = (r.totalAmount || 0) - (r.amountReceived || 0);
      
      if (!matchSearch) return false;
      if (filterStatus === 'pending') return bal > 0;
      if (filterStatus === 'paid') return bal <= 0;
      return true;
    });

    ledgerTableBody.innerHTML = '';

    if (filtered.length === 0) {
      ledgerEmptyState.classList.remove('hidden');
    } else {
      ledgerEmptyState.classList.add('hidden');
      filtered.forEach(r => {
        const bal = (r.totalAmount || 0) - (r.amountReceived || 0);
        const isPaid = bal <= 0;
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-200';
        tr.innerHTML = `
          <td class="py-3 px-4 font-bold text-slate-900">
            ${escapeHtml(r.clientName)}
            ${r.notes ? `<span class="block text-[10px] text-slate-500 font-normal">${escapeHtml(r.notes)}</span>` : ''}
          </td>
          <td class="py-3 px-3">
            <span class="font-mono font-semibold text-slate-800 block text-xs">${escapeHtml(r.docNo)}</span>
            <span class="text-[10px] text-slate-500">${escapeHtml(r.docDate)}</span>
          </td>
          <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">₹${formatCurrency(r.totalAmount)}</td>
          <td class="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹${formatCurrency(r.amountReceived)}</td>
          <td class="py-3 px-3 text-right font-mono font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}">
            ₹${formatCurrency(Math.max(0, bal))}
          </td>
          <td class="py-3 px-3 text-center">
            ${isPaid ? `
              <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <i class="fa-solid fa-check-circle"></i> Paid in Full
              </span>
            ` : `
              <span class="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <i class="fa-solid fa-clock"></i> Pending Balance
              </span>
            `}
          </td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center space-x-2">
              <button type="button" class="btn-edit-ledger px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-xs transition" data-id="${r.id}">
                ✏️ Edit Payment
              </button>
              <button type="button" class="btn-delete-ledger px-2 py-1 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded text-xs transition" data-id="${r.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        `;
        ledgerTableBody.appendChild(tr);
      });

      document.querySelectorAll('.btn-edit-ledger').forEach(el => {
        el.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const found = ledgerRecords.find(r => r.id === id);
          if (found) openLedgerModal(found);
        });
      });

      document.querySelectorAll('.btn-delete-ledger').forEach(el => {
        el.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm('Delete this payment record from your ledger?')) {
            ledgerRecords = ledgerRecords.filter(r => r.id !== id);
            saveLedgerState();
            renderLedgerPortal();
          }
        });
      });
    }
  }


  // ==================== FEATURE 5: KEYBOARD SHORTCUTS (CMD/CTRL + S / P) ====================
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      btnDownloadPdf.click();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      btnPrint.click();
    }
  });


  // ==================== DRAFT SAVE & LOAD ====================
  btnSaveDraft.addEventListener('click', () => {
    const draft = {
      docType: inputDocType.value,
      docNo: inputDocNo.value,
      docDate: inputDocDate.value,
      docPlace: inputDocPlace.value,
      companyPhone1: inputCompanyPhone1.value,
      companyPhone2: inputCompanyPhone2.value,
      clientName: inputClientName.value,
      clientAddress: inputClientAddress.value,
      clientPhone: inputClientPhone.value,
      clientGst: inputClientGst.value,
      savedClientSelect: selectSavedClient.value,
      taxRate: inputTaxRate.value,
      discountAmount: inputDiscountAmount.value,
      paymentMethod: activePaymentMethod,
      accountPreset: selectAccountPreset.value,
      upiPreset: selectUpiPreset.value,
      bankName: inputBankName.value,
      bankAccName: inputBankAccName.value,
      bankAccNo: inputBankAccNo.value,
      bankIfsc: inputBankIfsc.value,
      upiAccName: inputUpiAccName.value,
      upiId: inputUpiId.value,
      upiPhone: inputUpiPhone.value,
      customQrP2: currentUpiQrP2,
      sigName: inputSigName.value,
      sigTitleSelect: selectSigTitle.value,
      sigTitleCustom: inputSigTitleCustom.value,
      notes: inputNotes.value,
      items: items
    };
    localStorage.setItem('viksat_bill_draft', JSON.stringify(draft));
    alert('Draft saved successfully to browser storage!');
  });

  btnLoadDraft.addEventListener('click', () => {
    const saved = localStorage.getItem('viksat_bill_draft');
    if (!saved) {
      alert('No saved draft found.');
      return;
    }
    const draft = JSON.parse(saved);
    inputDocType.value = draft.docType || 'Tax Invoice';
    inputDocNo.value = draft.docNo || getStoredDocNo();
    inputDocDate.value = draft.docDate || getTodayFormattedDate();
    inputDocPlace.value = draft.docPlace || 'Mohali (Punjab)';
    inputCompanyPhone1.value = draft.companyPhone1 || '+91-62397-74244';
    inputCompanyPhone2.value = draft.companyPhone2 || '';
    inputClientName.value = draft.clientName || '';
    inputClientAddress.value = draft.clientAddress || '';
    inputClientPhone.value = draft.clientPhone || '';
    inputClientGst.value = draft.clientGst || '';
    if (draft.savedClientSelect) selectSavedClient.value = draft.savedClientSelect;
    inputTaxRate.value = draft.taxRate || 0;
    inputDiscountAmount.value = draft.discountAmount || 0;
    
    if (draft.paymentMethod === 'upi') {
      tabPaymentUpi.click();
    } else {
      tabPaymentBank.click();
    }
    
    if (draft.accountPreset) selectAccountPreset.value = draft.accountPreset;
    if (draft.upiPreset) selectUpiPreset.value = draft.upiPreset;

    inputBankName.value = draft.bankName || 'ICICI Bank';
    inputBankAccName.value = draft.bankAccName || 'VIKSAT DATA SOLUTIONS';
    inputBankAccNo.value = draft.bankAccNo || '079105003448';
    inputBankIfsc.value = draft.bankIfsc || 'ICIC0000791';

    inputUpiAccName.value = draft.upiAccName || '';
    inputUpiId.value = draft.upiId || '';
    inputUpiPhone.value = draft.upiPhone || '';
    currentUpiQrP2 = draft.customQrP2 || null;

    inputSigName.value = draft.sigName || '';
    
    if (draft.sigTitleSelect) {
      selectSigTitle.value = draft.sigTitleSelect;
      if (draft.sigTitleSelect === 'custom') {
        inputSigTitleCustom.classList.remove('hidden');
        inputSigTitleCustom.value = draft.sigTitleCustom || '';
      } else {
        inputSigTitleCustom.classList.add('hidden');
      }
    }
    
    inputNotes.value = draft.notes || defaultNotesText;
    if (draft.items && draft.items.length) items = draft.items;
    
    renderItemsForm();
    updatePreview();
    alert('Draft loaded successfully!');
  });

  btnPrint.addEventListener('click', () => {
    document.title = getCustomFileName();
    window.print();
  });

  // UNIVERSAL DESKTOP & MOBILE PDF GENERATOR
  btnDownloadPdf.addEventListener('click', async () => {
    const originalText = btnDownloadPdf.innerHTML;
    btnDownloadPdf.disabled = true;
    btnDownloadPdf.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...`;

    try {
      window.scrollTo(0, 0);
      const element = document.getElementById('pdf-paper');
      const filename = `${getCustomFileName()}.pdf`;

      const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, allowTaint: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'avoid-all' }
      };

      if (typeof html2pdf !== 'undefined') {
        await html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF download error:', err);
      window.print();
    } finally {
      btnDownloadPdf.disabled = false;
      btnDownloadPdf.innerHTML = originalText;
    }
  });

  // Initial setup
  renderItemsForm();
  renderBankPresetsDropdown();
  renderUpiPresetsDropdown();
  renderClientDirectoryDropdown();
  updatePreview();
  renderLedgerPortal();
});
