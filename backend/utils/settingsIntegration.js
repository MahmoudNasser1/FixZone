/**
 * Settings Integration Utility
 * Provides helper functions to integrate settings with other modules
 */

const settingsService = require('../services/settings/settingsService');
const settingsCacheService = require('../services/settings/settingsCacheService');

class SettingsIntegration {
  /**
   * Get formatted currency value
   * @param {number} amount - Amount to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  static async formatCurrency(amount, options = {}) {
    try {
      const currencySettings = await this.getCurrencySettings();
      const {
        code = currencySettings.code || 'EGP',
        symbol = currencySettings.symbol || 'ج.م',
        locale = currencySettings.locale || 'ar-EG',
        minimumFractionDigits = currencySettings.minimumFractionDigits || 2,
        position = currencySettings.position || 'after'
      } = options;

      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits
      }).format(amount || 0);

      // Handle custom position
      if (position === 'before') {
        return `${symbol} ${amount.toFixed(minimumFractionDigits)}`;
      }

      return formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${amount || 0} EGP`;
    }
  }

  /**
   * Get currency settings
   * @returns {Promise<object>} Currency settings
   */
  static async getCurrencySettings() {
    try {
      const cached = settingsCacheService.get('currency');
      if (cached) {
        return cached;
      }

      const settings = await settingsService.getSettingsByCategory('currency');
      const currencySettings = {
        code: settings['currency.code']?.value || 'EGP',
        symbol: settings['currency.symbol']?.value || 'ج.م',
        name: settings['currency.name']?.value || 'الجنيه المصري',
        locale: settings['currency.locale']?.value || 'ar-EG',
        minimumFractionDigits: parseInt(settings['currency.minimumFractionDigits']?.value || '2'),
        position: settings['currency.position']?.value || 'after'
      };

      settingsCacheService.set('currency', currencySettings, 3600); // Cache for 1 hour
      return currencySettings;
    } catch (error) {
      console.error('Error getting currency settings:', error);
      return {
        code: 'EGP',
        symbol: 'ج.م',
        name: 'الجنيه المصري',
        locale: 'ar-EG',
        minimumFractionDigits: 2,
        position: 'after'
      };
    }
  }

  /**
   * Get company settings
   * @returns {Promise<object>} Company settings
   */
  static async getCompanySettings() {
    try {
      const cached = settingsCacheService.get('company');
      if (cached) {
        return cached;
      }

      const settings = await settingsService.getSettingsByCategory('general');
      const companySettings = {
        name: settings['company.name']?.value || 'FixZone',
        address: settings['company.address']?.value || '',
        city: settings['company.city']?.value || '',
        country: settings['company.country']?.value || '',
        phone: settings['company.phone']?.value || '',
        website: settings['company.website']?.value || '',
        logoUrl: settings['company.logoUrl']?.value || '/logo.png'
      };

      settingsCacheService.set('company', companySettings, 3600);
      return companySettings;
    } catch (error) {
      console.error('Error getting company settings:', error);
      return {
        name: 'FixZone',
        address: '',
        city: '',
        country: '',
        phone: '',
        website: '',
        logoUrl: '/logo.png'
      };
    }
  }

  /**
   * Get locale settings
   * @returns {Promise<object>} Locale settings
   */
  static async getLocaleSettings() {
    try {
      const cached = settingsCacheService.get('locale');
      if (cached) {
        return cached;
      }

      const settings = await settingsService.getSettingsByCategory('locale');
      const localeSettings = {
        rtl: settings['locale.rtl']?.value === 'true' || settings['locale.rtl']?.value === true,
        dateFormat: settings['locale.dateFormat']?.value || 'yyyy/MM/dd',
        timeFormat: settings['locale.timeFormat']?.value || 'HH:mm',
        locale: settings['locale.locale']?.value || 'ar-EG'
      };

      settingsCacheService.set('locale', localeSettings, 3600);
      return localeSettings;
    } catch (error) {
      console.error('Error getting locale settings:', error);
      return {
        rtl: true,
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        locale: 'ar-EG'
      };
    }
  }

  /**
   * Get print settings
   * @returns {Promise<object>} Print settings
   */
  static async getPrintSettings() {
    try {
      const cached = settingsCacheService.get('printing');
      if (cached) {
        return cached;
      }

      const settings = await settingsService.getSettingsByCategory('printing');
      const printSettings = {
        paperSize: settings['printing.paperSize']?.value || 'A4',
        showWatermark: settings['printing.showWatermark']?.value === 'true' || settings['printing.showWatermark']?.value === true,
        showSerialBarcode: settings['printing.showSerialBarcode']?.value === 'true' || settings['printing.showSerialBarcode']?.value === true,
        defaultCopy: settings['printing.defaultCopy']?.value || 'customer'
      };

      settingsCacheService.set('printing', printSettings, 3600);
      return printSettings;
    } catch (error) {
      console.error('Error getting print settings:', error);
      return {
        paperSize: 'A4',
        showWatermark: true,
        showSerialBarcode: true,
        defaultCopy: 'customer'
      };
    }
  }

  /**
   * Format date according to locale settings
   * @param {Date|string} date - Date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted date string
   */
  static async formatDate(date, options = {}) {
    try {
      const localeSettings = await this.getLocaleSettings();
      const {
        locale = localeSettings.locale || 'ar-EG',
        dateFormat = localeSettings.dateFormat || 'yyyy/MM/dd',
        timeFormat = localeSettings.timeFormat || 'HH:mm'
      } = options;

      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (options.includeTime) {
        return dateObj.toLocaleString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date(date).toLocaleDateString('ar-EG');
    }
  }

  /**
   * Get all settings for a module
   * @param {string} moduleName - Module name (invoices, inventory, customers, etc.)
   * @returns {Promise<object>} All relevant settings for the module
   */
  static async getModuleSettings(moduleName) {
    try {
      const [currency, company, locale, printing] = await Promise.all([
        this.getCurrencySettings(),
        this.getCompanySettings(),
        this.getLocaleSettings(),
        this.getPrintSettings()
      ]);

      return {
        currency,
        company,
        locale,
        printing,
        module: moduleName
      };
    } catch (error) {
      console.error(`Error getting settings for module ${moduleName}:`, error);
      return {
        currency: await this.getCurrencySettings(),
        company: await this.getCompanySettings(),
        locale: await this.getLocaleSettings(),
        printing: await this.getPrintSettings(),
        module: moduleName
      };
    }
  }
}

module.exports = SettingsIntegration;

