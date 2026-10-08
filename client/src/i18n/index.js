import bn from './bn.json';
import en from './en.json';
import adminBn from './admin.bn.json';
import adminEn from './admin.en.json';

export const translations = {
  bn: { ...bn, admin: adminBn },
  en: { ...en, admin: adminEn },
};
