document.addEventListener('alpine:init', () => {
    Alpine.data('invoiceApp', function () {
        return {
            loading: false,
            validationMessage: '',
            searchDTO: {
                distributionManagers: [],
                startGeneratedDate: '',
                endGeneratedDate: ''
            },
            distributionManagers: [],
            results: [],
            totalRevenue: 0,
            getSelectedDistributionManagerIds: null,
            startDatePicker: null,
            endDatePicker: null,
            sortField: null,
            sortDirection: 'asc',
            searchQuery: '',

            async init() {
                this.setDefaultDates();
                await this.fetchDistributionManagers();
                this.initializeDistributionManagerMultiSelect();
            },

            setDefaultDates() {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                this.searchDTO.startGeneratedDate = this.formatDate(firstDay);
                this.searchDTO.endGeneratedDate = this.formatDate(yesterday);
            },

            initializeDatePickers() {
                const dateConfig = {
                    dateFormat: "d M Y",
                    allowInput: true,
                    clickOpens: true,
                    parseDate: (dateStr) => this.parseDateString(dateStr)
                };

                this.startDatePicker = flatpickr(this.$refs.startDate, {
                    ...dateConfig,
                    defaultDate: this.searchDTO.startGeneratedDate,
                    onChange: (selectedDates) => {
                        if (selectedDates.length > 0) {
                            this.searchDTO.startGeneratedDate = this.formatDate(selectedDates[0]);
                        }
                    }
                });

                this.endDatePicker = flatpickr(this.$refs.endDate, {
                    ...dateConfig,
                    defaultDate: this.searchDTO.endGeneratedDate,
                    onChange: (selectedDates) => {
                        if (selectedDates.length > 0) {
                            this.searchDTO.endGeneratedDate = this.formatDate(selectedDates[0]);
                        }
                    }
                });
            },

            async fetchDistributionManagers() {
                this.loading = true;
                try {
                   this.distributionManagers = await CultDataReportLib.fetchDistributionManagers();
                } catch (error) {
                   console.error('Error:', error);
                   this.validationMessage = error.message;
                } finally {
                   this.loading = false;
                }
            },

            initializeDistributionManagerMultiSelect() {
                this.$nextTick(() => {
                 setTimeout(() => {
                   if (typeof MultiSelectLib !== 'undefined' && MultiSelectLib.initMultiSelect) {
                       const dmData = [
                           { value: "all", label: "All Distribution Managers", isAll: true },
                           ...this.distributionManagers.map(dm => ({
                               value: dm.id.toString(),
                               label: dm.name
                           }))
                       ];

                       this.getSelectedDistributionManagerIds = MultiSelectLib.initMultiSelect({
                           data: dmData,
                           containerId: "selectBoxDistributionManager"
                       });

                       this.searchDTO.distributionManagers = this.distributionManagers.map(dm => dm.id.toString());
                   }
                   }, 100);
                });
            },



            get filteredResults() {
                if (!this.searchQuery) return this.results || [];

                const fuse = new Fuse(this.results, {
                    keys: [
                        'client.id',
                        'client.name',
                        'client.distributionManagerName',
                        'invoiceName',
                        'totalNet',
                        'amountInEur'
                    ],
                    threshold: 0.3,
                    includeMatches: true
                });

                return fuse.search(this.searchQuery).map(result => result.item);
            },

            sort(field) {
                this.sortField = field;
                this.sortDirection = this.sortField === field && this.sortDirection === 'asc'
                    ? 'desc'
                    : 'asc';
            },

            get sortedResults() {
            const resultsToSort = this.searchQuery
                ? this.filteredResults
                : this.results;

            if (!resultsToSort || !this.sortField) return resultsToSort || [];

            return _.orderBy(
                resultsToSort,
                [
                    this.sortField === 'invoice.client.id' ? 'client.id' :
                    this.sortField === 'invoice.client.name' ? 'client.name' :
                    this.sortField === 'invoice.client.distributionManagerName' ? 'client.distributionManagerName' :
                    this.sortField === 'invoice.invoiceName' ? 'invoiceName' :
                    this.sortField === 'invoice.totalNet' ? 'totalNet' :
                    this.sortField === 'invoice.amountInEur' ? 'amountInEur' :
                    'generatedDate'
                ],
                [this.sortDirection]
            );
            },

            clearForm() {
                this.searchDTO = {
                    distributionManagers: [],
                    startGeneratedDate: this.formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
                    endGeneratedDate: this.formatDate(new Date())
                };
                this.results = [];
                this.totalRevenue = 0;
                this.validationMessage = '';

                if (this.getSelectedDistributionManagerIds) {
                    this.initializeDistributionManagerMultiSelect();
                }
                if (this.startDatePicker) {
                    this.startDatePicker.setDate(this.searchDTO.startGeneratedDate);
                }
                if (this.endDatePicker) {
                    this.endDatePicker.setDate(this.searchDTO.endGeneratedDate);
                }
            },

            async searchInvoices() {
                if (this.getSelectedDistributionManagerIds) {
                  const selectedLabels = this.getSelectedDistributionManagerIds();
                  const selectedIds = this.distributionManagers
                      .filter(dm => selectedLabels.includes(dm.name))
                      .map(dm => dm.id.toString());
                  this.searchDTO.distributionManagers = selectedIds;
                }


                const startDate = this.parseDateString(this.searchDTO.startGeneratedDate);
                const endDate = this.parseDateString(this.searchDTO.endGeneratedDate);

                if (this.searchDTO.distributionManagers.length === 0) {
                   this.validationMessage = 'Please select at least one Distribution Manager';
                   return;
                }

                if (!startDate || !endDate) {
                   this.validationMessage = 'Please enter valid dates in either "DD MMM YYYY" or "DD.MM.YYYY" format';
                   return;
                }

                if (startDate > endDate) {
                   this.validationMessage = 'Start date cannot be after end date';
                   return;
                }

                this.validationMessage = '';
                this.loading = true;

                try {
                    const dmIds = this.searchDTO.distributionManagers.map(id => parseInt(id));
                    const response = await fetch('/invoice/api/invoice-result', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            distributionManagers: dmIds,
                            startGeneratedDate: this.formatDate(startDate),
                            endGeneratedDate: this.formatDate(endDate)
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Network response was not ok');
                    }

                    const data = await response.json();
                    this.results = data.invoices || [];
                    this.totalRevenue = data.totalRevenue || 0;
                } catch (error) {
                    console.error('Error searching invoices:', error);
                    this.validationMessage = error.message || 'An error occurred during the search';
                } finally {
                    this.loading = false;
                }
            },

            async exportToExcel() {
                if (this.getSelectedDistributionManagerIds) {
                  const selectedLabels = this.getSelectedDistributionManagerIds();
                  const selectedIds = this.distributionManagers
                      .filter(dm => selectedLabels.includes(dm.name))
                      .map(dm => dm.id.toString());
                  this.searchDTO.distributionManagers = selectedIds;
                }

                const startDate = this.parseDateString(this.searchDTO.startGeneratedDate);
                const endDate = this.parseDateString(this.searchDTO.endGeneratedDate);

                if (this.searchDTO.distributionManagers.length === 0) {
                    this.validationMessage = 'Please select at least one Distribution Manager';
                    return;
                }

                if (!startDate || !endDate) {
                    this.validationMessage = 'Please enter valid dates in either "DD MMM YYYY" or "DD.MM.YYYY" format';
                    return;
                }

                if (startDate > endDate) {
                    this.validationMessage = 'Start date cannot be after end date';
                    return;
                }

                this.validationMessage = '';
                this.loading = true;

                try {
                    const response = await fetch('/invoice/api/export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            distributionManagers: this.searchDTO.distributionManagers,
                            startGeneratedDate: this.formatDate(startDate),
                            endGeneratedDate: this.formatDate(endDate)
                        })
                    });

                    if (!response.ok) throw new Error('Network response was not ok');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Monthly_invoice_list.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error exporting invoices:', error);
                    this.validationMessage = 'An error occurred during export';
                } finally {
                    this.loading = false;
                }
            },

            parseDateString(dateStr) {
                if (!dateStr) return null;

                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const parts1 = dateStr.split(' ');
                if (parts1.length === 3 && months.includes(parts1[1])) {
                    const day = parseInt(parts1[0]);
                    const month = months.indexOf(parts1[1]);
                    const year = parseInt(parts1[2]);
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        return new Date(year, month, day);
                    }
                }

                const parts2 = dateStr.split('.');
                if (parts2.length === 3) {
                    const day = parseInt(parts2[0]);
                    const month = parseInt(parts2[1]) - 1;
                    const year = parseInt(parts2[2]);
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        return new Date(year, month, day);
                    }
                }

                return null;
            },

            // Formats Date object or date string → "DD MMM YYYY" (e.g., "2023-01-01" or new Date() → "01 Jan 2023")
            // Handle both Date objects and date strings
            formatDate(input) {

                const date = input instanceof Date ? input : new Date(input);
                if (!date || isNaN(date.getTime())) return '';

                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const day = String(date.getDate()).padStart(2, '0');
                const month = monthNames[date.getMonth()];
                const year = date.getFullYear();
                return `${day} ${month} ${year}`;
            },

            formatEuropeanCurrency(amount) {
                return amount?.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) || '0,00';
            }

        };
    });
});
