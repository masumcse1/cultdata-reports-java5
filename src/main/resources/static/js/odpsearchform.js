document.addEventListener('alpine:init', () => {
    Alpine.data('odpApp', function () {
        return {
            loading: false,
            validationMessage: '',
            searchDTO: {
                client: null,
                distributionManagers: []
            },
            distributionManagers: [],
            results: [],
            getSelectedDistributionManagerIds: null,
            paginationLoading: false,
            totalRecords: 0,
            totalPages: 0,
            currentPage: 1,
            limit: 10,


            async init() {
                await this.fetchDistributionManagers();
                this.initializeDistributionManagerMultiSelect();

                const clientInput = document.getElementById('client');
                if (clientInput) {
                    clientInput.focus();
                }

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

            gridColumns: [
                    { name: 'Client ID',   width: '120px',  formatter: (cell) => cell || 'N/A' },
                    { name: 'Client Name', width: '120px',  formatter: (cell) => cell || 'N/A' },
                    { name: 'DM ID',       width: '120px',  formatter: (cell) => cell || 'N/A' },
                    { name: 'DM Name',     width: '120px',  formatter: (cell) => cell || 'N/A' },
                    { name: 'Month',       width: '120px',  formatter: (cell) => cell || 'N/A' },
                    { name: 'Report',      width: '120px',
                      formatter: (_, row) => {
                        const pdfUrl = row.cells[5].data;
                        return pdfUrl
                          ? gridjs.html(`<a href="${pdfUrl}" target="_blank" class="btn btn-sm btn-primary">
                                          <i class="fas fa-file-pdf"></i> PDF
                                        </a>`)
                          : 'No PDF';
                      }
                    }
                  ],


            validateSearch() {
                this.validationMessage = '';

                if (!this.searchDTO.client && this.searchDTO.distributionManagers.length === 0) {
                    this.validationMessage = 'Please enter either a Client ID or one Distribution Manager';
                    return false;
                }

                if (this.searchDTO.client && !/^\d*$/.test(this.searchDTO.client)) {
                this.validationMessage = 'Client ID must contain only numbers';
                return false;
            }

            return true;
            },


            searchOdp() {
                    if (!this.validateSearch()) return;

                    if (this.getSelectedDistributionManagerIds) {
                       const selectedLabels = this.getSelectedDistributionManagerIds();
                       const selectedIds = this.distributionManagers
                           .filter(dm => selectedLabels.includes(dm.name))
                           .map(dm => dm.id.toString());

                       this.searchDTO.distributionManagers = selectedIds;
                    }

                    this.validationMessage = '';

                    this.renderGrid();
                    },

    renderGrid() {

            if (this.grid) {
                this.grid.destroy();
            }

            this.loading = true;
            const gridContainer = document.getElementById('results-grid');
            if (!gridContainer) return;

            // Initialize Grid.js
            this.grid = new gridjs.Grid({
                columns: this.gridColumns,
                server: {
                    url: '/odp/api/odp-result-page',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.searchDTO),
                    then: (data) => {
                       this.loading = false;
                       this.paginationLoading = false;

                       const cardBody = document.getElementById("resultdiv");
                       if (data.isDataNotExists) {
                           if (cardBody)  cardBody.style.display = "none"; //Hide
                           return [];
                       } else {
                           if (cardBody)  cardBody.style.display = "block"; //Show
                       }

                        this.results = data.data ?? [];
                        this.totalRecords = data.totalRecords ?? 0;
                        this.totalPages = data.totalPages ?? 1;
                        this.totalClientIdSum = this.calculateTotalClientIdSum(data.data ?? []);
                        if (gridContainer) {
                            const observer = new MutationObserver(() => this.updateSummary());
                            observer.observe(gridContainer, { childList: true, subtree: true });
                            this.updateSummary();
                        }
                        return this.results.map((item) => [
                            item.client?.id || '',
                            item.client?.name || '',
                            item.dmId || '',
                            item.dmName || '',
                            item.month || '',
                            item.pdf || null
                        ]);
                    },
                       total: (data) => data.totalRecords ?? 0
                },
                pagination: {
                    enabled: true,
                    limit: this.limit,
                    server: {
                        url: (prev, page, limit) => `${prev}?limit=${limit}&page=${page + 1}`
                    }
                },
                search: true,
                sort: true,
                fixedHeader: true,
                className: { table: 'table table-striped table-bordered' }
            }).render(gridContainer);

            // Update summary on Grid.js events
            ['ready', 'pageChanged', 'sort', 'search'].forEach((event) =>
                this.grid.on(event, () => this.updateSummary())
            );


    },


            /**
            * Updates the summary footer with current page data
            */
            updateSummary() {
                const tbody = document.querySelector(".gridjs-table tbody");
                if (!tbody) return;

                // Calculate sum of client IDs for visible rows (current page)
                let visibleClientIdSum = 0 ,countdmMountCount =0 ,countDMName = 0;
                const visibleRows = Array.from(tbody.querySelectorAll("tr")).forEach(row => {

                const clientIdCell = row.children[0]?.textContent.trim();


                const clientId = parseInt(clientIdCell) || 0;
                visibleClientIdSum += clientId;

                const dmIdValue = row.children[2]?.textContent?.trim() ;
                if (dmIdValue > 0) countdmMountCount++;


                const dmNameValue = row.children[2]?.textContent?.trim() ;
                                if (dmNameValue > 0) countDMName++;




                });

                const footer = document.getElementById("summary-footer");
                footer.innerHTML = `
                <table class="table table-bordered summary-card">
                            <tbody>
                                <tr>
                                       <td>Grand Total: ${this.totalClientIdSum}</td>
                                       <td>${visibleClientIdSum}</td>
                                       <td>${countdmMountCount}</td>
                                       <td>${countDMName}</td>
                                       <td>z583</td>
                                       <td>z583</td>
                                 </tr>
                            </tbody>
                </table>
                `;
            },

            calculateTotalClientIdSum(data) {
                return data.reduce((sum, item) => {
                    const clientId = parseInt(item.client?.id) || 0;
                    return sum + clientId;
                }, 0);
            },

            clearResults() {
                this.results = [];
                this.totalRecords = 0;
                this.totalPages = 0;
                if (this.grid) {
                    try {
                        this.grid.updateConfig({
                            data: []
                        }).forceRender();
                    } catch (error) {}
                }
                // Clear summary footer
                const footer = document.getElementById('summary-footer');
                if (footer) footer.innerHTML = '';
            },

            clearForm() {
                this.searchDTO = {
                    client: null,
                    distributionManagers: [] // Clear selected managers
                };

                this.results = [];
                this.validationMessage = '';
                if (this.getSelectedDistributionManagerIds) {
                    this.initializeDistributionManagerMultiSelect();
                }

                this.$nextTick(() => {
                    const clientInput = document.getElementById('client');
                    if (clientInput) {
                        clientInput.focus();
                    }
                });
            }
        };
    });
});
