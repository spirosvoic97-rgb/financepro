/* Translations (EL / EN). Use FP.t('key', {var}) */
window.FP = window.FP || {};
FP.STR = {
  el: {
    appTagline: 'Τα οικονομικά σου, καθαρά.',
    welcomeTitle: 'Καλώς ήρθες',
    welcomeLead: 'Κατέγραψε έσοδα και έξοδα σε δευτερόλεπτα και δες πού πάνε τα χρήματά σου.',
    email: 'Email', password: 'Κωδικός', name: 'Όνομα',
    signIn: 'Σύνδεση', signUp: 'Δημιουργία λογαριασμού', google: 'Συνέχεια με Google',
    or: 'ή', noAccount: 'Δεν έχεις λογαριασμό;', haveAccount: 'Έχεις ήδη λογαριασμό;',
    forgot: 'Ξέχασες τον κωδικό;', resetSend: 'Αποστολή συνδέσμου', resetSent: 'Σου στείλαμε email για νέο κωδικό.',
    tryDemo: 'Δοκίμασε το demo', back: 'Πίσω',
    checkEmail: 'Έλεγξε το email σου για επιβεβαίωση του λογαριασμού.',
    fillAll: 'Συμπλήρωσε όλα τα πεδία.', pwShort: 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.',

    navHome: 'Αρχική', navTx: 'Κινήσεις', navInsights: 'Ανάλυση', navAI: 'Βοηθός', add: 'Προσθήκη',
    personal: 'Προσωπικά', shared: 'Κοινό',
    hello: 'Γεια σου', goodMorning: 'Καλημέρα', goodEvening: 'Καλησπέρα',
    leftThisMonth: 'Υπόλοιπο {month}', sharedSpent: 'Κοινά έξοδα {month}',
    income: 'Έσοδα', expenses: 'Έξοδα', balance: 'Ταμείο', total: 'Σύνολο',
    pace: 'Ρυθμός εξόδων', vsLast: 'vs {month}',
    paceLess: 'Μέχρι σήμερα ξόδεψες <b>{pct}% λιγότερα</b> από τον {month}.',
    paceMore: 'Μέχρι σήμερα ξόδεψες <b>{pct}% περισσότερα</b> από τον {month}.',
    paceSame: 'Ξοδεύεις περίπου <b>όσο και τον {month}</b>.',
    thisMonth: 'Αυτός ο μήνας', lastMonth: 'Προηγούμενος',
    safeDaily: 'Άνετα ανά ημέρα', safeSub: 'για {days} ημέρες ακόμα',
    safeNone: 'Πρόσεξε τα έξοδα',
    goal: 'Στόχος αποταμίευσης', goalOf: 'από {goal}', noGoal: 'Όρισε στόχο',
    bills: 'Πάγιοι λογαριασμοί', billsEmpty: 'Δεν έχεις προσθέσει πάγιους λογαριασμούς.',
    due: 'λήγει {day}', dueToday: 'λήγει σήμερα', overdue: 'έληξε {day}', pay: 'Πληρωμή', paid: 'Πληρώθηκε',
    quickAdd: 'Γρήγορη καταχώρηση', edit: 'Επεξεργασία',
    recent: 'Πρόσφατες κινήσεις', seeAll: 'Όλες',
    noTx: 'Δεν υπάρχουν κινήσεις ακόμα.', noTxHint: 'Πάτα + για την πρώτη σου καταχώρηση.',
    today: 'Σήμερα', yesterday: 'Χθες',
    saved: 'Αποθηκεύτηκε', deleted: 'Διαγράφηκε', undo: 'Αναίρεση', added: '{amount} · {cat}',

    expense: 'Έξοδο', incomeOne: 'Έσοδο',
    newTx: 'Νέα κίνηση', editTx: 'Επεξεργασία κίνησης',
    category: 'Κατηγορία', note: 'Σημείωση', notePh: 'π.χ. Lidl, βενζίνη…', date: 'Ημερομηνία',
    save: 'Αποθήκευση', delete: 'Διαγραφή', cancel: 'Άκυρο', confirmDelete: 'Σίγουρα διαγραφή;',
    scan: 'Σάρωση απόδειξης', scanning: 'Διαβάζω την απόδειξη…', scanDone: 'Συμπλήρωσα τα στοιχεία — έλεγξέ τα.',
    scanFail: 'Δεν μπόρεσα να διαβάσω την απόδειξη.',
    toShared: 'Στο κοινό ταμείο', toPersonal: 'Προσωπικό',
    paidBy: 'Πλήρωσε: {name}', you: 'Εσύ',

    search: 'Αναζήτηση', all: 'Όλες', filterIncome: 'Έσοδα', filterExpense: 'Έξοδα',
    resultsCount: '{n} κινήσεις', noResults: 'Δεν βρέθηκαν κινήσεις.',

    insights: 'Ανάλυση', byCategory: 'Ανά κατηγορία', sixMonths: 'Τελευταίοι 6 μήνες',
    savingsRate: 'Ποσοστό αποταμίευσης', avgDaily: 'Μέσο έξοδο / ημέρα', biggest: 'Μεγαλύτερο έξοδο',
    noData: 'Δεν υπάρχουν έξοδα αυτόν τον μήνα.', vsPrev: 'vs προηγ.',

    aiTitle: 'Οικονομικός βοηθός', aiLead: 'Ρώτα με οτιδήποτε για τα έξοδά σου. Βλέπω τις κινήσεις των τελευταίων μηνών.',
    aiAsk: 'Ρώτα κάτι…', aiS1: 'Πώς πάει ο μήνας μου;', aiS2: 'Πού ξοδεύω τα περισσότερα;',
    aiS3: 'Πώς μπορώ να αποταμιεύσω περισσότερα;', aiS4: 'Σύγκρινε με τον προηγούμενο μήνα',
    aiDemo: 'Demo: οι απαντήσεις υπολογίζονται τοπικά. Με σύνδεση απαντά το AI (OpenAI / Gemini).',
    aiError: 'Κάτι πήγε στραβά με τον βοηθό. Δοκίμασε ξανά.', clearChat: 'Καθαρισμός',

    sharedHub: 'Κοινό ταμείο', owesYou: '{name} σου χρωστάει', youOwe: 'Οφειλή σου προς {name}',
    settled: 'Είστε πατσί', settleUp: 'Εξόφληση', settleTitle: 'Εξόφληση οφειλής',
    settleConfirm: 'Καταγραφή πληρωμής {amount} από {from} προς {to};', settledToast: 'Η εξόφληση καταγράφηκε',
    split: 'Αναλογία', paidYou: 'Εσύ', paidThem: '{name}',
    noPartner: 'Μοιράσου έξοδα με σύντροφο ή συγκάτοικο', noPartnerSub: 'Στείλε κωδικό πρόσκλησης και κρατάτε κοινό ταμείο, με αυτόματο «ποιος χρωστάει σε ποιον».',
    invite: 'Πρόσκληση', inviteCode: 'Κωδικός πρόσκλησης', inviteShare: 'Στείλε αυτόν τον κωδικό στον/στην σύντροφό σου. Ισχύει 48 ώρες.',
    joinCode: 'Έχω κωδικό', join: 'Σύνδεση', joinPh: 'π.χ. K7Q-2MX',
    leaveVault: 'Αποχώρηση από κοινό ταμείο', leaveConfirm: 'Θα αποχωρήσεις από το κοινό ταμείο. Οι κοινές κινήσεις μένουν στο ταμείο.',
    copied: 'Αντιγράφηκε',

    settings: 'Ρυθμίσεις', profile: 'Προφίλ', appearance: 'Εμφάνιση', theme: 'Θέμα',
    themeAuto: 'Αυτόματο', themeLight: 'Φωτεινό', themeDark: 'Σκούρο',
    language: 'Γλώσσα', currency: 'Νόμισμα', money: 'Χρήματα & στόχοι',
    monthlyGoal: 'Μηνιαίος στόχος αποταμίευσης', startBalance: 'Αρχικό ταμείο',
    quickButtons: 'Γρήγορα κουμπιά', categories: 'Κατηγορίες', data: 'Δεδομένα',
    exportCsv: 'Εξαγωγή σε CSV', signOut: 'Αποσύνδεση', account: 'Λογαριασμός',
    demoMode: 'Λειτουργία demo', demoReset: 'Επαναφορά δεδομένων demo',
    addBill: 'Νέος πάγιος', billName: 'Όνομα', billDay: 'Ημέρα του μήνα', amount: 'Ποσό',
    addQuick: 'Νέο γρήγορο κουμπί', label: 'Ετικέτα',
    addCat: 'Νέα κατηγορία', emoji: 'Emoji', catName: 'Όνομα κατηγορίας', type: 'Τύπος',
    items: '{n}', none: 'Κανένα',
    version: 'FinancePRO 2.0',
    offline: 'Είσαι εκτός σύνδεσης — βλέπεις τα τελευταία αποθηκευμένα δεδομένα.',
    errGeneric: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.'
  },
  en: {
    appTagline: 'Your money, made clear.',
    welcomeTitle: 'Welcome',
    welcomeLead: 'Log income and expenses in seconds and see where your money goes.',
    email: 'Email', password: 'Password', name: 'Name',
    signIn: 'Sign in', signUp: 'Create account', google: 'Continue with Google',
    or: 'or', noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
    forgot: 'Forgot password?', resetSend: 'Send reset link', resetSent: 'We sent you a password reset email.',
    tryDemo: 'Try the demo', back: 'Back',
    checkEmail: 'Check your email to confirm your account.',
    fillAll: 'Please fill in all fields.', pwShort: 'Password needs at least 8 characters.',

    navHome: 'Home', navTx: 'Activity', navInsights: 'Insights', navAI: 'Assistant', add: 'Add',
    personal: 'Personal', shared: 'Shared',
    hello: 'Hello', goodMorning: 'Good morning', goodEvening: 'Good evening',
    leftThisMonth: 'Left in {month}', sharedSpent: 'Shared spending in {month}',
    income: 'Income', expenses: 'Expenses', balance: 'Balance', total: 'Total',
    pace: 'Spending pace', vsLast: 'vs {month}',
    paceLess: "So far you've spent <b>{pct}% less</b> than in {month}.",
    paceMore: "So far you've spent <b>{pct}% more</b> than in {month}.",
    paceSame: "You're spending <b>about the same</b> as in {month}.",
    thisMonth: 'This month', lastMonth: 'Last month',
    safeDaily: 'Safe to spend / day', safeSub: 'for {days} more days',
    safeNone: 'Watch your spending',
    goal: 'Savings goal', goalOf: 'of {goal}', noGoal: 'Set a goal',
    bills: 'Recurring bills', billsEmpty: "You haven't added any recurring bills.",
    due: 'due {day}', dueToday: 'due today', overdue: 'was due {day}', pay: 'Pay', paid: 'Paid',
    quickAdd: 'Quick add', edit: 'Edit',
    recent: 'Recent activity', seeAll: 'See all',
    noTx: 'No transactions yet.', noTxHint: 'Tap + to add your first one.',
    today: 'Today', yesterday: 'Yesterday',
    saved: 'Saved', deleted: 'Deleted', undo: 'Undo', added: '{amount} · {cat}',

    expense: 'Expense', incomeOne: 'Income',
    newTx: 'New transaction', editTx: 'Edit transaction',
    category: 'Category', note: 'Note', notePh: 'e.g. groceries, fuel…', date: 'Date',
    save: 'Save', delete: 'Delete', cancel: 'Cancel', confirmDelete: 'Delete this?',
    scan: 'Scan receipt', scanning: 'Reading the receipt…', scanDone: 'Filled in the details — please check them.',
    scanFail: "Couldn't read the receipt.",
    toShared: 'Shared vault', toPersonal: 'Personal',
    paidBy: 'Paid by {name}', you: 'You',

    search: 'Search', all: 'All', filterIncome: 'Income', filterExpense: 'Expenses',
    resultsCount: '{n} transactions', noResults: 'No transactions found.',

    insights: 'Insights', byCategory: 'By category', sixMonths: 'Last 6 months',
    savingsRate: 'Savings rate', avgDaily: 'Avg. spend / day', biggest: 'Biggest expense',
    noData: 'No expenses this month.', vsPrev: 'vs prev.',

    aiTitle: 'Money assistant', aiLead: 'Ask me anything about your spending. I can see your last few months of activity.',
    aiAsk: 'Ask something…', aiS1: 'How is my month going?', aiS2: 'Where do I spend the most?',
    aiS3: 'How can I save more?', aiS4: 'Compare with last month',
    aiDemo: 'Demo: answers are computed locally. When signed in, the AI (OpenAI / Gemini) answers.',
    aiError: 'Something went wrong with the assistant. Try again.', clearChat: 'Clear',

    sharedHub: 'Shared vault', owesYou: '{name} owes you', youOwe: 'You owe {name}',
    settled: "You're all square", settleUp: 'Settle up', settleTitle: 'Settle up',
    settleConfirm: 'Record a payment of {amount} from {from} to {to}?', settledToast: 'Settlement recorded',
    split: 'Split', paidYou: 'You', paidThem: '{name}',
    noPartner: 'Share expenses with a partner or flatmate', noPartnerSub: 'Send an invite code and keep a shared vault that works out who owes whom.',
    invite: 'Invite', inviteCode: 'Invite code', inviteShare: 'Send this code to your partner. Valid for 48 hours.',
    joinCode: 'I have a code', join: 'Join', joinPh: 'e.g. K7Q-2MX',
    leaveVault: 'Leave shared vault', leaveConfirm: 'You will leave the shared vault. Shared transactions stay in the vault.',
    copied: 'Copied',

    settings: 'Settings', profile: 'Profile', appearance: 'Appearance', theme: 'Theme',
    themeAuto: 'Automatic', themeLight: 'Light', themeDark: 'Dark',
    language: 'Language', currency: 'Currency', money: 'Money & goals',
    monthlyGoal: 'Monthly savings goal', startBalance: 'Starting balance',
    quickButtons: 'Quick buttons', categories: 'Categories', data: 'Data',
    exportCsv: 'Export to CSV', signOut: 'Sign out', account: 'Account',
    demoMode: 'Demo mode', demoReset: 'Reset demo data',
    addBill: 'New bill', billName: 'Name', billDay: 'Day of month', amount: 'Amount',
    addQuick: 'New quick button', label: 'Label',
    addCat: 'New category', emoji: 'Emoji', catName: 'Category name', type: 'Type',
    items: '{n}', none: 'None',
    version: 'FinancePRO 2.0',
    offline: "You're offline — showing your last saved data.",
    errGeneric: 'Something went wrong. Please try again.'
  }
};

FP.lang = 'el';
FP.t = function (key, vars) {
  let s = (FP.STR[FP.lang] && FP.STR[FP.lang][key]) || FP.STR.el[key] || key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
};

FP.MONTHS = {
  el: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'],
  elGen: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'],
  elAcc: ['Ιανουάριο', 'Φεβρουάριο', 'Μάρτιο', 'Απρίλιο', 'Μάιο', 'Ιούνιο', 'Ιούλιο', 'Αύγουστο', 'Σεπτέμβριο', 'Οκτώβριο', 'Νοέμβριο', 'Δεκέμβριο'],
  elShort: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  enShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
FP.monthName = (m, form) => {
  if (FP.lang === 'el') return form === 'gen' ? FP.MONTHS.elGen[m] : form === 'acc' ? FP.MONTHS.elAcc[m] : form === 'short' ? FP.MONTHS.elShort[m] : FP.MONTHS.el[m];
  return form === 'short' ? FP.MONTHS.enShort[m] : FP.MONTHS.en[m];
};
