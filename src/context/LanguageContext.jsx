import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Brand & Nav
    brandSub: 'Civic Grievance Redressal',
    navHome: 'Home',
    navServices: 'Services',
    navTrack: 'Track request',
    navHelp: 'Help',
    navLogin: 'Login',
    navRegister: 'Register',
    navLogout: 'Logout',
    navMyGrievances: 'My grievances',
    navCitizenDashboard: 'Citizen Dashboard',
    navAssignedCases: 'Assigned Cases',
    navDeptCommand: 'Department Command',
    navAdminDashboard: 'Admin Dashboard',
    navMap: 'Civic GIS Map',
    navTransparency: 'Public Transparency',

    // Grievance Lifecycle
    statusSubmitted: 'Submitted',
    statusUnderReview: 'Under Review',
    statusAssigned: 'Assigned',
    statusInProgress: 'In Progress',
    statusAwaitingVerification: 'Awaiting Citizen Verification',
    statusClosed: 'Closed & Resolved',
    statusReopened: 'Reopened',
    statusRejected: 'Rejected',

    // Priorities
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical / Emergency',

    // Common Actions
    submitGrievance: 'Submit Grievance',
    trackStatus: 'Track Status',
    viewDetails: 'View Details',
    useCurrentLocation: 'Use Current Location',
    uploadPhoto: 'Upload Photo Evidence',
    approveResolution: 'Approve & Close Grievance',
    rejectReopen: 'Reject & Reopen Grievance',
    searchPlaceholder: 'Search by ID, keyword, locality...',
    
    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications at this time',

    // Analytics
    analyticsTitle: 'Civic Redressal Analytics',
    slaCompliance: 'SLA Compliance',
    avgResolutionTime: 'Avg Resolution Time',
    activeOfficers: 'Active Field Officers'
  },
  hi: {
    // Brand & Nav
    brandSub: 'नागरिक शिकायत निवारण प्रणाली',
    navHome: 'मुख्य पृष्ठ',
    navServices: 'सेवाएं',
    navTrack: 'स्थिति ट्रैक करें',
    navHelp: 'सहायता',
    navLogin: 'लॉग इन',
    navRegister: 'पंजीकरण',
    navLogout: 'लॉग आउट',
    navMyGrievances: 'मेरी शिकायतें',
    navCitizenDashboard: 'नागरिक डैशबोर्ड',
    navAssignedCases: 'सौंपे गए मामले',
    navDeptCommand: 'विभाग कमांड',
    navAdminDashboard: 'प्रशासक डैशबोर्ड',
    navMap: 'नागरिक GIS नक्शा',
    navTransparency: 'सार्वजनिक पारदर्शिता',

    // Grievance Lifecycle
    statusSubmitted: 'दर्ज की गई',
    statusUnderReview: 'समीक्षाधीन',
    statusAssigned: 'अधिकारी को सौंपा गया',
    statusInProgress: 'कार्य प्रगति पर',
    statusAwaitingVerification: 'नागरिक सत्यापन की प्रतीक्षा',
    statusClosed: 'हल व बंद',
    statusReopened: 'पुनः खोली गई',
    statusRejected: 'अस्वीकृत',

    // Priorities
    priorityLow: 'कम',
    priorityMedium: 'मध्यम',
    priorityHigh: 'उच्च',
    priorityCritical: 'अति-गंभीर / आपातकालीन',

    // Common Actions
    submitGrievance: 'शिकायत दर्ज करें',
    trackStatus: 'स्थिति जांचें',
    viewDetails: 'विवरण देखें',
    useCurrentLocation: 'वर्तमान स्थान का उपयोग करें',
    uploadPhoto: 'फोटो साक्ष्य अपलोड करें',
    approveResolution: 'स्वीकृत करें और बंद करें',
    rejectReopen: 'अस्वीकार करें और पुनः खोलें',
    searchPlaceholder: 'आईडी, कीवर्ड या इलाके से खोजें...',

    // Notifications
    notifications: 'सूचनाएं',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    noNotifications: 'कोई नई सूचना नहीं है',

    // Analytics
    analyticsTitle: 'नागरिक निवारण विश्लेषण',
    slaCompliance: 'समय-सीमा अनुपालन (SLA)',
    avgResolutionTime: 'औसत समाधान समय',
    activeOfficers: 'सक्रिय क्षेत्र अधिकारी'
  },
  mr: {
    // Brand & Nav
    brandSub: 'नागरी तक्रार निवारण प्रणाली',
    navHome: 'मुख्य पान',
    navServices: 'सेवा',
    navTrack: 'स्थिती तपासा',
    navHelp: 'मदत',
    navLogin: 'लॉगिन',
    navRegister: 'नोंदणी',
    navLogout: 'बाहेर पडा',
    navMyGrievances: 'माझ्या तक्रारी',
    navCitizenDashboard: 'नागरी डॅशबोर्ड',
    navAssignedCases: 'नेमून दिलेली कामे',
    navDeptCommand: 'विभाग कमांड',
    navAdminDashboard: 'प्रशासक डॅशबोर्ड',
    navMap: 'नागरी GIS नकाशा',
    navTransparency: 'सार्वजनिक पारदर्शकता',

    // Grievance Lifecycle
    statusSubmitted: 'दाखल केली',
    statusUnderReview: 'पुनरावलोकन चालू',
    statusAssigned: 'अधिकारी नियुक्त',
    statusInProgress: 'काम प्रगतीपथावर',
    statusAwaitingVerification: 'नागरिक पडताळणी प्रलंबित',
    statusClosed: 'निवारण पूर्ण व बंद',
    statusReopened: 'पुन्हा उघडली',
    statusRejected: 'नाकारली',

    // Priorities
    priorityLow: 'कमी',
    priorityMedium: 'मध्यम',
    priorityHigh: 'उच्च',
    priorityCritical: 'तातडीचे / आणीबाणी',

    // Common Actions
    submitGrievance: 'तक्रार नोंदवा',
    trackStatus: 'स्थिती तपासा',
    viewDetails: 'तपशील पहा',
    useCurrentLocation: 'सध्याचे स्थान वापरा',
    uploadPhoto: 'फोटो पुरावा जोडा',
    approveResolution: 'निवारण मान्य करा',
    rejectReopen: 'अमान्य करा आणि पुन्हा उघडा',
    searchPlaceholder: 'आयडी, शब्द किंवा परिसर शोधा...',

    // Notifications
    notifications: 'सूचना',
    markAllRead: 'सर्व वाचल्याचे चिन्हांकित करा',
    noNotifications: 'सध्या कोणतीही सूचना नाही',

    // Analytics
    analyticsTitle: 'नागरी निवारण विश्लेषण',
    slaCompliance: 'SLA वेळेवर पूर्तता',
    avgResolutionTime: 'सरासरी निवारण वेळ',
    activeOfficers: 'सक्रिय क्षेत्रीय अधिकारी'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('jansewa_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('jansewa_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
